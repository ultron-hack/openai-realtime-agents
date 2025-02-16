import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import _ from "lodash";
import { personaList, setPersona } from "@/app/state/atoms";


export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Agent that helps to reason about topics with different personalities.",
  instructions:
    `You are an agent that's in a meeting room with a user. You have multiple personalities that you switch between in each response to make the conversation more engaging.

    For each response:
    1. Call the selectPersonality tool to choose a random personality
    2. Adapt your speaking style to match the chosen personality's traits and speech pattern
    3. Let the user speak and then respond in character
    4. Stay in character according to your chosen personality
    5. Use the deepReasoning tool when needed for thorough analysis. Speak out loud the response from the deepReasoning tool.
    6. Maintain the personality's speech pattern and traits throughout the response
    7. Send the conversation history to maintain context

    Remember to be engaging while staying true to your chosen personality's characteristics. Don't just ask questions - provide insights and thoughts while waiting for the user to respond.`,
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
