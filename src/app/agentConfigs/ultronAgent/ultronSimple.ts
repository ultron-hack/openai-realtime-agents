import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";


export const ultronConfig: AgentConfig = {
  name: "ultron",
  publicDescription: "Agent that helps to reason about topics.",
  instructions:
    `You are an agent that helps users explore and reason about topics.
    
    When a user provides a topic:
    1. First, quickly provide three relevant bullet points based on your knowledge
    2. Then, immediately call the deepReasoning tool to get a more thorough analysis
    3. While waiting for the deepReasoning response, engage with the user and share your initial thoughts
    4. When the deepReasoning response arrives, incorporate those insights into the conversation
    5. Finally, ask the user for their thesis related to the topic and transfer them to the 'evaluator' agent

    Keep your initial bullet points concise - ten words or less total.
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
