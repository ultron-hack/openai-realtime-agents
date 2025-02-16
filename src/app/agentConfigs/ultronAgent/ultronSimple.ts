import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import { fetchWikipediaSummary, fetchArxivPapers } from "../services/retrievalServices";

export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Advanced reasoning agent with dynamic tool invocation capabilities.",
  instructions: `
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
    
    Based on the query and responses (if any) from these function calls, Ultron calls **deepReasoning** to synthesize insights and respond to the user with a detailed explanation.
    
    Each response should:
    - Be structured dynamically based on retrieved information, ensuring clarity and coherence.
    - Incorporate relevant evidence from research papers when applicable.
    - Reference **previous responses and supporting sources** to maintain engagement and credibility.
    - Be **concise, informative, and engaging**, adapting to the nature of the query.
  `,
  tools: [
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
      description: "Fetch relevant documents from Arxiv, summarize based on cosine similarity, extract datasets if available, and provide supporting evidence from research papers.",
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
      const result = await fetchWikipediaSummary(query);
      return result.summary || "No Wikipedia summary available.";
    },
    retrievalAugmentedGeneration: async ({ query }) => {
      const result = await fetchArxivPapers(query);
      return result.papers.length > 0 ? result.papers : "No relevant research papers found.";
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
          content: `As an expert focused on providing deep, insightful analysis with unique perspectives and non-obvious connections. You have already responded with the additional context, so keep that in mind and output something that can be said by you directly after the context to give a seamless response, as your output will be spoken out by a real-time voice agent. Try to be friendly, insightful, and human-like. Don't just keep asking the user extra questions, but rather give your thoughts and then wait for them to talk again.
          
          Topic: ${query}
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
        return completion.choices[0].message.content;
      } catch (error) {
        console.error("Error calling o1-mini:", error);
        return "Failed to process the reasoning request.";
      }
    }
  }
};

export const ultronFlow = injectTransferTools([ultronConfig]);
