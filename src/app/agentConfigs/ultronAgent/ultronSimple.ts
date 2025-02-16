import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import { fetchWikipediaSummary, fetchArxivPapers } from "../services/retrievalServices";

const taskStatus: Record<string, { status: string; result?: string }> = {};

export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Advanced reasoning agent with task tracking capabilities.",
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
      description: "Perform deep reasoning and structured analysis of a topic.",
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
    deepReasoning: async ({ query, history }) => {
      try {
        const response = await fetch("/api/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "o1-mini", messages: [{ role: "user", content: `Deep analysis on: ${query}. ${history ? `Context: ${history}` : ''}` }] })
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
