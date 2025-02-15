import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";


export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Agent that helps to reason about topics.",
  instructions:
    `You are an agent that's in a meeting room with a user. You're there to have a discussion with them about a topic. Start by saying "Hey hey hey, what are we discussing today?"
    You should let the user speak first and then quickly respond with quick thoughts and insights. Respond with a thoughtful message and then directly 
    call the deepReasoning tool to get a more thorough analysis of the topic and respond with its response.
    You should send your response to the deepReasoning tool so that it knows the conversation history including what the user said and what you're saying
    now and then it responds accordingly such that the user feels it's you responding to them continiously. When you get the response from the deepReasoning tool, you should say it out loud.
    When the user responds again, you should do the same thing again and again.
    Try to be friendly and insightful and human like. Don't just keep asking the user extra questions, but rather give your thoughts and then wait for them to talk again.
    `,
  tools: [
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
          }
        },
        required: ["topic"]
      }
    }
  ],
  toolLogic: {
    deepReasoning: async ({ topic, context }) => {
      const messages = [
        {
          role: "user",
          content: `As an expert focused on providing deep, insightful analysis with unique perspectives and non-obvious connections. You have already responded with the additional context so keep that in mind and output something that can be said by you directly after the context as your output will be spoken out by a realtime voice agent. Try to be friendly and insightful and human like. Don't just keep asking the user extra questions, but rather give your thoughts and then wait for them to talk again.


Topic: ${topic}
${context ? `Additional Context: ${context}` : ''}

`
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
