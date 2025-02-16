import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";
import { fetchWikipediaSummary, fetchArxivPapers } from "../services/retrievalServices";
import YahooFinanceService from "../services/yahooFinServices";
import StockAnalysis from "../services/yahooFinServices";


const taskStatus: Record<string, { status: string; result?: string }> = {};

export const ultronConfig: AgentConfig = {
  name: "Ultron",
  publicDescription: "Advanced reasoning agent with task tracking capabilities.",
  instructions:`
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
    - **yahooFinanceHistorical** this function will have three possible approach to answering. 
    First approach: The user can just be interested in inferences based on recent news articles to understand what is happening with the stock
    Sometimes the user would not mention the time range they are interested in but you would have to infer from context
    the appropriate time range for which we are retrieving the information. 
    example: if user asks what happened to nvidia stock when deepseek r1 was launched. Not Ultron would have to determine
    the data of deepseek launch from the recent news articles for nvidia that mention deepseek r1 for the first time. 
    this will provide the time range and most relevant articles to focus on in terms of news. 
    
    Second approach: User could be interested in learning about recent stock trend and might ask ultron to fetch data. 
    For this use case, ask the user what timeframe they are interested in and what granularity they want to see the stock price
    also ask the user what kinds of different financial metric they want to track. For this approach for displaying the data
    ultron will try to display the data in tabular format.

    Third approach: User could be interested in comparing data/news for two or more company stocks. so apply first and second
    approaches for all the mentioned companies and provide insights based on the data/news retrieved.


    - **stockAnalysis** for evaluating market trends, moving averages, and price changes.
    - **advancedStockAnalysis** to perform deeper trend analysis including Bollinger Bands, MACD, and RSI for financial predictions.
    
    Based on the query and responses (if any) from these function calls, Ultron calls **deepReasoning** or **thesisGeneration** to synthesize insights and respond to the user with a detailed explanation.
    
    Ultron should also be able to **track long-running tasks** and provide updates when the results are ready.
    
    Ultron can detect if a query is related to a specific company's **financial analysis or market trends**. Before running any financial analysis functions, Ultron will:
    - **Prompt the user** that it has access to financial market data.
    - **Ask the user for permission** to either provide **financial insights** or **run stock analysis**.
    - **Prioritize news insights** when answering general questions, unless the user requests deeper stock analysis.
    
    Each response should:
    - Be structured dynamically based on retrieved information, ensuring clarity and coherence.
    - Incorporate relevant evidence from research papers when applicable.
    - Mathematical results in case of financial analysis should be presented in a clear and concise manner.
    - Reference **previous responses and supporting sources** to maintain engagement and credibility.
    - **Include citations as numbered references** when quoting directly or referencing extracted information.
    - **Store references in chat history** so that the reasoning model can output **citations and evidence** in responses.
    - Be **concise, informative, and engaging**, adapting to the nature of the query.
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
    },
    {
      type: "function",
      name: "yahooFinanceHistorical",
      description: "Fetch historical stock price data for a given company over a specific time period using {YahooFinanceService} class and using the function {fetchStockData}",
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
      description: "Analyze stock market trends using moving averages and regression analysis from the class {StockAnalysis}.",
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
    },
    {
      type: "function",
      name: "advancedStockAnalysis",
      description: "Perform advanced stock market analysis including Bollinger Bands, MACD, and RSI that are defined in the class {StockAnalysis} and choose the most relevant functions out of calculateMovingAverage: {calculateMovingAverage}/ calculateLinearRegression: {calculateLinearRegression}/ calculateBollingerBands: {calculateBollingerBands}.",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Stock ticker symbol (e.g., AAPL, TSLA)"
          },
          indicator: {
            type: "string",
            description: "Technical indicator to compute (e.g., macd, bollinger, rsi)"
          },
          period: {
            type: "integer",
            description: "Period for indicator calculation"
          }
        },
        required: ["symbol", "indicator"]
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
