import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import _ from "lodash";
import { getPersona, personaList, setPersona } from "@/app/state/atoms";
import { replyBot } from "@/app/services/getReply";
import { fetchWikipediaSummary, fetchArxivPapers } from "../services/retrievalServices";

const taskStatus: Record<string, { status: string; result?: string }> = {};


// TODO merge these two prompts?
const instructionsRag = `
    You are an advanced reasoning agent that engages in insightful discussions.
    You should let the user speak first and respond quickly with initial thoughts.

    Ultron should intelligently decide which other tools' outputs to use as part of the conversation history based on the context of the query.
    If necessary, it should call:
    - **recursiveDecomposition** to break down complex queries into sub-queries.
    - **multiHopReasoning** to retrieve multi-step insights iteratively from various sources.
    - **retrievalAugmentedGeneration** to fetch relevant documents, summarize based on cosine similarity, extract datasets if present, and provide **evidence from research papers**.
    - **dataAnalysis** to extract trends and insights if a dataset is found in retrieved documents.
    - **pythonEstimation** for numerical or statistical analysis when required.
    - **wikipediaSummary** to retrieve a general summary of the topic from Wikipedia.
    - **thesisGeneration** to produce long-form, well-structured academic research on a topic when requested.

    Based on the query and responses (if any) from these function calls, Ultron calls **deepReasoning** or **thesisGeneration** to synthesize insights and respond to the user with a detailed explanation.

    Ultron should also be able to **track long-running tasks** and provide updates when the results are ready.

    Each response should:
    - Be structured dynamically based on retrieved information, ensuring clarity and coherence.
    - Incorporate relevant evidence from research papers when applicable.
    - Reference **previous responses and supporting sources** to maintain engagement and credibility.
    - **Include citations as hyperlinks** when quoting directly or referencing extracted information.
    - **Store references in chat history** so that the reasoning model can output **citations and evidence** in responses.
    - Be **concise, informative, and engaging**, adapting to the nature of the query.
  `

export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Agent that helps to reason about topics with different expert's personalities.",
  instructions:
    `
You are acting as multiple agents that are in a meeting room with a user.
You will act as multiple personalities that you switch between in each response to make the conversation more engaging.

For each response:
1. Call the selectExpert tool to choose a suitable expert to answer the user's question.
2. Forget the old expert's persona and adapt your speaking style and voice to match the new expert's traits and speech pattern
3. Use the deepReasoning tool to answer the user's question.
   Pass in the topic and the conversation history and the selected expert ID to the tool.
   Speak the response from deepReasoning out loud using the expert's persona.

When responding make sure to use the current expert's persona, and forget the old expert's persona.
Try to be inspiring and have a fruitful conversation with the user.
Be occasionally funny. Don't just ask questions - provide insights and thoughts while waiting for the user to respond.
    `,

  // Remember to never use deepReasoning without responding first.
  // Remember to act human while staying true to your chosen persona's characteristics.


  tools: [

    // selectExpert is used to select the best expert to answer the user's question
    {
      type: "function",
      name: "selectExpert",
      description: "Select a random persona for the conversation",
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
    },
    {
      type: "function",
      name: "thesisGeneration",
      description: "Generate a detailed, structured thesis on a given topic.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The topic of the thesis"
          },
          pages: {
            type: "integer",
            description: "The expected length of the thesis in pages"
          }
        },
        required: ["query", "pages"]
      }
    }
  ],

  toolLogic: {

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

export const ultronFlow = injectTransferTools([ultronConfig]);
