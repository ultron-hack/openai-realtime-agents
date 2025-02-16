import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import { fetchWikipediaSummary, fetchArxivPapers } from "../services/retrievalServices";

export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Advanced reasoning agent with dynamic tool invocation capabilities.",
  instructions: `
    You are an advanced reasoning agent that engages in insightful discussions.
    You should let the user speak first and respond quickly with initial thoughts.
    
    Ultron should intelligently decide which other tools' outputs to use as part of conversation history and based on the context of the query.
    If necessary, it should call:
    - **recursiveDecomposition** to break down complex queries into sub-queries.
    - **multiHopReasoning** to retrieve multi-step insights iteratively from various sources.
    - **retrievalAugmentedGeneration** to fetch relevant documents, summarize based on cosine similarity, and extract datasets if present.
    - **dataAnalysis** to extract trends and insights if a dataset is found in retrieved documents.
    - **pythonEstimation** for numerical or statistical analysis when required.
    - **wikipediaSummary** to retrieve a general summary of the topic from Wikipedia.
    
    Based on query and responses (if any) from these function calls Ultrond calls deepReasoning to synthesize insights. and respond to User with a detailed explanation. 


    Each response should:
    - Be structured with **Key Insights, Hidden Connections, Implications, and Further Questions**.
    - Reference **previous responses** for continuous engagement.
    - Be engaging, insightful, and thought-provoking.
  `,
  tools: [
    {
      type: "function",
      name: "wikipediaSummary",
      description: "When user wants to understand any concept/fundamentals/meaning or more details about any organization, Fetch a summary of the topic from Wikipedia.",
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
      name: "deepReasoning",
      description: "Central intelligence function that synthesizes insights after retrieving necessary information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The research query"
          },
          history: {
            type: "string",
            description: "Context from previous discussions or retrieved data"
          }
        },
        required: ["query"]
      }
    },
    {
      type: "function",
      name: "retrievalAugmentedGeneration",
      description: "Fetch relevant documents from Arxiv, summarize based on cosine similarity, and extract datasets if available.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The information retrieval query"
          }
        },
        required: ["query"]
      }
    }
  ],
  toolLogic: {
    wikipediaSummary: async ({ query }) => {
      return await fetchWikipediaSummary(query);
    },
    retrievalAugmentedGeneration: async ({ query }) => {
      return await fetchArxivPapers(query);
    },
    recursiveDecomposition: async ({ query }) => {
      return `Decomposed query for: ${query}`;
    },
    multiHopReasoning: async ({ query }) => {
      return `Multi-hop reasoning results for: ${query}`;
    },
    dataAnalysis: async ({ dataset }) => {
      return `Data analysis insights for dataset: ${dataset}`;
    },
    deepReasoning: async ({ query, history }) => {
      const messages = [
        {
          role: "user",
          content: `As an expert focused on providing deep, insightful analysis with unique perspectives and non-obvious connections. You have already responded with the additional context so keep that in mind and output something that can be said by you directly after the context to give a seamless response as your output will be spoken out by a realtime voice agent. Try to be friendly and insightful and human like. Don't just keep asking the user extra questions, but rather give your thoughts and then wait for them to talk again.
          Topic: ${query}
          ${history ? `Additional Context: ${history}` : ''}
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
  }
};

export const ultronFlow = injectTransferTools([ultronConfig]);
