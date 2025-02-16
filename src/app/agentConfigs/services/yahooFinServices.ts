import axios from "axios";

const YAHOO_FINANCE_HISTORICAL_API = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_FINANCE_NEWS_API = "https://query1.finance.yahoo.com/v1/finance/search";

class YahooFinanceService {
  async fetchStockData(symbol: string, range: string, interval: string) {
    try {
      const response = await axios.get(`${YAHOO_FINANCE_HISTORICAL_API}/${symbol}`, {
        params: { range, interval }
      });

      const data = response.data as { chart: { result: any[] } };
      if (data.chart.result) {
        const result = (response.data as any).chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];

        return timestamps.map((time: number, index: number) => ({
          date: new Date(time * 1000).toISOString().split("T")[0],
          open: quotes.open[index],
          high: quotes.high[index],
          low: quotes.low[index],
          close: quotes.close[index],
          volume: quotes.volume[index]
        }));
      } else {
        return { error: "No historical data found for the given symbol." };
      }
    } catch (error) {
      console.error("Error fetching Yahoo Finance historical data:", error);
      return { error: "Failed to retrieve financial data." };
    }
  }

  async fetchNews(query: string) {
    try {
      const response = await axios.get(YAHOO_FINANCE_NEWS_API, { params: { q: query } });

      const data = response.data as { news: any[] };
      if (data.news) {
        return (response.data as { news: any[] }).news.map((article: any) => ({
          title: article.title,
          link: article.link,
          source: article.source,
          publishedAt: article.published_at,
          summary: article.summary
        }));
      } else {
        return { error: "No news articles found for this query." };
      }
    } catch (error) {
      console.error("Error fetching Yahoo Finance news:", error);
      return { error: "Failed to retrieve financial news." };
    }
  }

  getLatestStockNews(symbol: string) {
    return this.fetchNews(symbol);
  }
}

class StockAnalysis {
  async calculateMovingAverage(data: any[], period: number) {
    if (!data || data.length < period) return { error: "Not enough data for moving average calculation." };
    return data.map((_, i, arr) => {
      if (i < period - 1) return null;
      const subset = arr.slice(i - period + 1, i + 1);
      return { date: arr[i].date, average: subset.reduce((acc, day) => acc + day.close, 0) / period };
    }).filter(Boolean);
  }

  async calculateLinearRegression(data: any[]) {
    if (!data || data.length < 10) return { error: "Not enough data for linear regression analysis." };
    
    const x = data.map((_, i) => i);
    const y = data.map(day => day.close);
    
    const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
    const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
    
    let num = 0, den = 0;
    for (let i = 0; i < x.length; i++) {
      num += (x[i] - meanX) * (y[i] - meanY);
      den += Math.pow(x[i] - meanX, 2);
    }
    const beta1 = num / den;
    const beta0 = meanY - beta1 * meanX;
    
    return { beta0, beta1, predict: (nextX: number) => beta0 + beta1 * nextX };
  }

  async calculateBollingerBands(data: any[], period: number) {
    if (!data || data.length < period) return { error: "Not enough data for Bollinger Bands calculation." };
    return data.map((_, i, arr) => {
      if (i < period - 1) return null;
      const subset = arr.slice(i - period + 1, i + 1);
      const mean = subset.reduce((acc, day) => acc + day.close, 0) / period;
      const stdDev = Math.sqrt(subset.reduce((acc, day) => acc + Math.pow(day.close - mean, 2), 0) / period);
      return { date: arr[i].date, upper: mean + 2 * stdDev, lower: mean - 2 * stdDev, middle: mean };
    }).filter(Boolean);
  }
}

export default { YahooFinanceService: new YahooFinanceService(), StockAnalysis: new StockAnalysis() };
