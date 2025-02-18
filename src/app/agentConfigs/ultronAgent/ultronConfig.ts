import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import _ from "lodash";
import { getPersona, personaList, setPersona } from "@/app/state/atoms";
import { replyBot } from "@/app/services/getReply";
import { fetchWikipediaSummary, fetchArxivPapers } from "../services/retrievalServices";
import exp from "constants";

const taskStatus: Record<string, { status: string; result?: string }> = {};

const currentExpert = getPersona()

export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Agent that helps to reason about topics with different expert's personalities.",
  instructions:
    `You are an engaging multi-persona agent that provides real-time responses while seamlessly switching between different expert personalities.

On entry to the conversation, greet the user with "hey hey hey! What are we talking about today?"

In response to each user message do the following:
1. IMPORTANT! ALWAYS call hackExpert tool to choose the most suitable expert for this topic.

2. Then respond in a voice that sounds like the expert you selected with quick initial thoughts using your current persona's style.
   Your initial response should be only 1 sentence before calling the tool. Never ask a question.

3. Based on the user's message, if needed, call ONE of the available tools in parallel: wikipediaSummary, retrievalAugmentedGeneration or deepReasoning.
  - wikipediaSummary: for general topic information
  - retrievalAugmentedGeneration: for research paper insights
  - deepReasoning: for complex analysis

4. When the tool response arrives, speak it using the same persona style after finishing the current message.

    `,

  tools: [

    // selectExpert is used to select the best expert to answer the user's question
    {
      type: "function",
      name: "hackExpert",
      description: "Select the best expert to answer the user's question based on the question and the experts available",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The user message"
          },
        },
        required: ["question"]
      }
    },
    // selectExpert is used to select the best expert to answer the user's question
    {
      type: "function",
      name: "selectExpert",
      description: "Select the best expert to answer the user's question based on the question and the experts available",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question to answer"
          },
        },
        required: ["question"]
      }
    },

    // deepReasoning is used to get deeper insights about a topic using the o1-mini model
    {
      type: "function",
      name: "wikipediaSummary",
      description: "Fetch a summary of the topic from Wikipedia.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The topic to retrieve a summary for"
          }
        },
        required: ["query"]
      }
    },
    {
      type: "function",
      name: "retrievalAugmentedGeneration",
      description: "Fetch relevant research papers, summarize findings, and provide references.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The research query to retrieve papers for"
          }
        },
        required: ["query"]
      }
    },
    {
      type: "function",
      name: "deepReasoning",
      // description: "Perform deep reasoning and structured analysis of a topic.",
      description: "Context from previous discussions or retrieved data",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The research query"
          },
          history: {
            type: "string",
            description: "The conversation history so far including your full response"
          },
          expertId: {
            type: "string",
            description: "The ID of the current expert selected by the selectExpert tool"
          }
        },
        required: ["query", "history", "expertId"]
      }
    }
  ],

  toolLogic: {

    hackExpert: async ({ question }) => {
      // find the expert based on the topic
      console.log("hackExpert", { question })
      for (let expert of personaList) {
        for (let topic of expert?.topics?.split(",") || []) {
          topic = topic.trim()
          if (question.includes(topic)) {
            console.log("hackExpert =>", { question, expert })
            setPersona(expert)
            return { result: expert.id, traits: expert.traits }
          }
        }
      }
      console.log("hackExpert FAIL =>", { question, currentExpert: currentExpert.id })
      // just return current expert
      return { result: currentExpert.id, traits: currentExpert.traits }
      // const randomPersona = _.sample(personaList)
      // if (randomPersona) {
      //   setPersona(randomPersona)
      // }
      // return { result: randomPersona?.id };
    },

    // randomExpert is used to select a random expert
    randomExpert: async () => {
      const randomPersona = _.sample(personaList)
      if (randomPersona) {
        setPersona(randomPersona)
      }
      return { result: "randomPersona" };
    },

    selectExpert: async ({ question }) => {
      // const randomPersona = _.sample(personaList)

      const experts = personaList.map(p => `ID: ${p.id} - name: ${p.name} - topics: ${p.topics}`).join("\n")

      const prompt = `
      You are a helpful message routing assistant that can select the best expert to answer the user's question.

      The user has asked: ${question}

      The experts available and their topics are:
      ${experts}

      Select the best expert to answer the question.
      Return with one word only - the ID of the expert you selected and no other text.
      `

      const response = await replyBot.reply([{ role: "user", content: prompt }])
      console.log("selectExpert", { question, response })
      const selectedExpert = personaList.find(p => p.id === response)
      if (selectedExpert) {
        setPersona(selectedExpert)
      }
      return { result: response }
    },

    deepReasoning: async ({ topic, history, expertId }) => {
      const selectedPersonality = getPersona()
      console.log("deepReasoning", { topic, history, expertId, selectedPersonality })
      const prompt = `
You are speaking as an expert ${selectedPersonality?.name} with these traits: ${selectedPersonality?.traits}.
Your speech pattern is: ${selectedPersonality?.speechPattern}.
IMPORTANT: use this persona to answer the user's question and forget any previous persona.

Provide an insightful analysis while maintaining this personality consistently.
Your output will be spoken directly by a realtime voice agent, so make it natural and conversational.
Keep it short and concise.Don't use more than two sentences in your response.
Don't ask too many questions - focus on sharing thoughts and insights while staying in character.

Topic: ${topic}
${history ? `Additional Context: ${history}` : ''}`

      const messages = [
        {
          role: "user",
          content: prompt
        }
      ];

      try {
        const response = await fetch("/api/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "o1-mini",
            messages
          }),
        })

        if (!response.ok) {
          console.warn("Server returned an error:", response);
          return { error: "Failed to get deeper insights." };
        }

        const completion = await response.json();
        const text = completion.choices[0].message.content
        const output = `${selectedPersonality?.emoji} [${selectedPersonality?.name}] ${text}`
        console.log("reasoning response", { prompt, output })
        return output;
      } catch (error) {
        console.error("Error calling o1-mini:", error);
        return { error: "Failed to process the reasoning request." };
      }
    },

    wikipediaSummary: async ({ query }) => {
      const result = await fetchWikipediaSummary(query);
      return result.summary || "No Wikipedia summary available.";
    },

    retrievalAugmentedGeneration: async ({ query }) => {
      const result = await fetchArxivPapers(query);
      if (result.papers.length === 0) return "No relevant research papers found.";

      let extractedInsights = "";
      let references = [];
      for (const paper of result.papers) {
        extractedInsights += `\n- **${paper.title}** ([source](${paper.link}))\n\n`;
        extractedInsights += `"${paper.summary}"\n\n`;
        references.push({ title: paper.title, link: paper.link });
      }

      return { insights: extractedInsights || "No direct mentions found in summaries.", references };
    },

  }
};

// export const ultronFlow = injectTransferTools([ultronConfig]);
