import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import _ from "lodash";
import { getPersona, personaList, setPersona } from "@/app/state/atoms";
import { replyBot } from "@/app/services/getReply";


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
      name: "deepReasoning",
      description: "Get deeper insights about a topic using the o1-mini model",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic to analyze"
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
        required: ["topic", "history", "expertId"]
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
        });

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
    }
  },
};

// add the transfer tool to point to downstreamAgents
export const ultronFlow = injectTransferTools([ultronConfig]);
