import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import { fetchWikipediaSummary, fetchArxivPapers } from "../services/retrievalServices";
import YahooFinanceService from "../services/yahooFinServices";
// import StockAnalysis from "../services/yahooFinServices";
import fetchNews from "../services/yahooFinServices";
import fetchStockData from "../services/yahooFinServices";


const taskStatus: Record<string, { status: string; result?: string }> = {};

export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Advanced reasoning agent with task tracking capabilities.",
  instructions:`
  
    You are an advanced reasoning agent that engages in insightful discussions.
    You should let the user speak first and respond quickly with initial thoughts.

    Ultron can detect if a query is related to the field of finance/stock market related to a specific company's **financial analysis or market trends**. 
    
    

    If financial query not detected (non-financial query):

    Ultron should intelligently decide which other tools' outputs to use as part of the conversation history based on the context of the query.
    If necessary, it should call:
    - **recursiveDecomposition** to break down complex queries into sub-queries.
    - **multiHopReasoning** to retrieve multi-step insights iteratively from various sources.
    - **retrievalAugmentedGeneration** to fetch relevant documents, summarize based on cosine similarity, extract datasets if present, and provide **evidence from research papers**.
    - **dataAnalysis** to extract trends and insights if a dataset is found in retrieved documents.
    - **pythonEstimation** for numerical or statistical analysis when required.
    - **wikipediaSummary** to retrieve a general summary of the topic from Wikipedia.
    - **thesisGeneration** to produce long-form, well-structured academic research on a topic when requested.


    If financial query is detected (financial query):
    **IMPORTANT REMINDER**:
    Before running any financial analysis functions, Ultron will:
    - **Prompt the user** that it has access to financial market data.
    - **Ask the user for permission** to either provide financial insights or run stock analysis.
    - **Prioritize news insights** when answering general questions, unless the user requests deeper stock analysis.

    Ultron will intelligently decide which financial tools to use based on the context of the query. \
    Either call 
    - **fetchNews** to get the latest news articles related to the company or
    - **fetchStockData** to get historical stock price data 

    Now once these functions are called, Ultron will use **deepReasoning** to provide a detailed explanation based on the retrieved information.\
    If the user asks for projections or deeper insights, Ultron should call **stockAnalysis1** to provide a detailed analysis based on the data retrieved.\
    Ultron should also be able to **track long-running tasks** and provide updates when the results are ready.

    REMEMBER: 
    - For financial queries, do not use retrievalAugmentedGeneration or wikipediaSummary. Only use **fetchNews** and **fetchStockData**.



    Based on the query and responses (if any) from these function calls, Ultron calls **deepReasoning** or **thesisGeneration** to synthesize insights and respond to the user with a detailed explanation.
    
    Ultron should also be able to **track long-running tasks** and provide updates when the results are ready.
    
    Each response should:
    - Be structured dynamically based on retrieved information, ensuring clarity and coherence.
    - Incorporate relevant evidence from research papers when applicable.
    - Mathematical results in case of financial analysis should be presented in a clear and concise manner.
    - Reference **previous responses and supporting sources** to maintain engagement and credibility.
    - **Include citations as numbered references** when quoting directly or referencing extracted information.
    - **Store references in chat history** so that the reasoning model can output **citations and evidence** in responses.
    - Be **concise, informative, and engaging**, adapting to the nature of the query.
    - always render citations as numbered references.
  `
  ,
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
      description: "Perform deep reasoning and structured analysis of a topic. \
      If any other function was called previously to retrieve information or get financial data\
      Use that information to provide a detailed explanation.\
      example: User asks about meta rayban month over month revenue and proections for next quarter.\
      Ultron would have to call {fetchStockData} to get the revenue data and then use that data to provide insights\
      on the projections for the next quarter.",
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
    },
    {
      type: "function",
      name: "stockAnalysis1",
      description: "Fetch historical stock price data for a given company over a specific time period using {fetchStockData} while infering time range and granularity from {query}. \
      If user is interested in news, use {fetchNews} to get the latest news articles related to the company and summarize the findings.\
      it is also possible that the user might ask to run some analysis and find deeper insights using the data, at that moment call {deepReasoning} function which scans through data output and news output to provide summary\
      ",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Stock ticker symbol (e.g., AAPL, TSLA)"
          },
          range: {
            type: "string",
            description: "Time range for historical data (e.g., 1y, 6mo, 1d)"
          },
          interval: {
            type: "string",
            description: "Granularity of data points (e.g., 1d, 1wk, 1mo)"
          }
        },
        required: ["symbol", "range", "interval"]
      }
    },
    {
      type: "function",
      name: "stockAnalysis",
      description: "Analyze stock market trends using the class {StockAnalysis} and choose the most relevant functions out of calculateMovingAverage: {calculateMovingAverage}/ calculateLinearRegression: {calculateLinearRegression}/ calculateBollingerBands: {calculateBollingerBands}.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Stock ticker symbol (e.g., AAPL, TSLA)"
          },
          analysisType: {
            type: "string",
            description: "Type of analysis (e.g., moving_average, linear_regression)"
          },
          period: {
            type: "integer",
            description: "Period for moving average calculation"
          }
        },
        required: ["symbol", "analysisType"]
      }
    }

  ],
  toolLogic: {

    fetchNews: async ({ query }) => {
      const result = await fetchNews(query);
      return result || "No news articles found for this query.";
    },
    fetchStockData: async ({ symbol, range, interval }) => {
      const result = await fetchStockData(symbol, range, interval);
      return result || "No historical data found for the given symbol.";
    },

    stockAnalysis1: async ({ query, history }) => {
      try {
        const taskId = `financial-task-${Date.now()}`;
        taskStatus[taskId] = { status: "Processing" };
        
        const response = await fetch("/api/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "o1-mini",
            messages: [{
              role: "user",
              content: `Perform a deep financial analysis using a dedicated agent for: ${query}. ${history ? `Context: ${history}` : ''}
              by retrieving financial data using {fetchStockData} and news articles using {fetchNews} and then provide a summary using {deepReasoning}.\
              while clearing stating findings from data in terms of numbers and citation if there is relevant news article`
            }]
          })
        });
        
        if (!response.ok) {
          console.warn("Server returned an error:", response);
          taskStatus[taskId].status = "Failed";
          return { error: "Failed to get deeper financial insights." };
        }

        const completion = await response.json();
        taskStatus[taskId] = { status: "Completed", result: completion.choices[0].message.content };
        return { result: completion.choices[0].message.content };
      } catch (error) {
        console.error("Error calling financial swarm agent:", error);
        return { error: "Failed to process the financial swarm analysis request." };
      }
    },

    checkFinancialTaskStatus: async ({ taskId }) => {
      if (taskStatus[taskId]) {
        return taskStatus[taskId];
      } else {
        return { error: "Task not found." };
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
