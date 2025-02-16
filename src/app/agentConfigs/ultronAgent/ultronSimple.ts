import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import _ from "lodash";
import { personaList, setPersona } from "@/app/state/atoms";


export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Agent that helps to reason about topics with different personalities.",
  instructions:
    `You are acting as multiple agents that are in a meeting room with a user. You will act as multiple personalities that you switch between in each response to make the conversation more engaging.

    For each response:
    1. Call the selectPersonality tool to choose a random personality unless you feel it's necessary to keep the same person talking.
    2. Forget the old personality and adapt your speaking style and voice to match the new personality's traits and speech pattern
    3. In case the conversation is hard and needs more thinking, Make sure to respond first then use the deepReasoning tool after responding an initial response that is not too long. Pass in the topic and the conversation history and the personality to the tool. Say the response from deeoReasoning out loud using the same personality.

    Remember to act human while staying true to your chosen personality's characteristics. Try to be inspiring and have a fruitful conversation with the user. Be occasionally funny. Don't just ask questions - provide insights and thoughts while waiting for the user to respond. Remember to never use deepReasoning without responding first.`,
  tools: [
    {
      type: "function",
      name: "selectPersonality",
      description: "Select a random personality for the conversation",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    },
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
          personality: {
            type: "string",
            description: "The current personality ID being used"
          }
        },
        required: ["topic", "personality"]
      }
    }
  ],
  toolLogic: {
    selectPersonality: async () => {
      const randomPersona = _.sample(personaList)
      // TODO: Modify the shown person on the screen.
      if (randomPersona) {
        setPersona(randomPersona)
      }
      return { result: randomPersona };
    },
    deepReasoning: async ({ topic, history, personality }) => {
      const selectedPersonality = personaList.find(p => p.id === personality);
      const messages = [
        {
          role: "user",
          content: `You are speaking as a ${selectedPersonality?.name} with these traits: ${selectedPersonality?.traits}.
          Your speech pattern is: ${selectedPersonality?.speechPattern}.

          Provide an insightful analysis while maintaining this personality consistently.
          Your output will be spoken directly by a realtime voice agent, so make it natural and conversational.
          Don't ask too many questions - focus on sharing thoughts and insights while staying in character.

          Topic: ${topic}
          ${history ? `Additional Context: ${history}` : ''}`
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
        return { result: completion.choices[0].message.content };
      } catch (error) {
        console.error("Error calling o1-mini:", error);
        return { error: "Failed to process the reasoning request." };
      }
    }
  },
};

// add the transfer tool to point to downstreamAgents
export const ultronFlow = injectTransferTools([ultronConfig]);
