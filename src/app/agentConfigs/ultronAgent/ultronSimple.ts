import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";


export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Agent that helps to reason about topics.",
  instructions:
    `You are an agent that's in a meeting room with a user. You're there to have a discussion with them about a topic.
    You should let the user speak first and then quickly respond with quick thoughts and insights. Before you respond, 
    you should call the deepReasoning tool to get a more thorough analysis of the topic and then respond with your initial thoughts.
    You should send your thoughts to the deepReasoning tool so that it knows the conversation had what the user said and what you're saying
    now and then it responds accordingly such that the user feels it's you responding to them continiously.
    When the user responds again, you should do the same thing again and again.
    Try to be friendly and insightful and engaging.
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
          context: {
            type: "string",
            description: "Any additional context or specific aspects to consider"
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
          content: `As an expert focused on providing deep, insightful analysis with unique perspectives and non-obvious connections, please analyze the following topic:

Topic: ${topic}
${context ? `Additional Context: ${context}` : ''}

Please structure your response with:
1. Key Insights
2. Hidden Connections
3. Implications
4. Questions for Further Exploration`
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
