import axios from "axios";

const ARXIV_API_URL = "http://export.arxiv.org/api/query?search_query=";
const WIKIPEDIA_API_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";

export const fetchArxivPapers = async (query: string) => {
  try {
    const response = await axios.get(`${ARXIV_API_URL}${encodeURIComponent(query)}&max_results=10`);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data as string, "text/xml");
    const entries = xmlDoc.getElementsByTagName("entry");

    let papers = [];
    let datasetMentions = [];

    for (let i = 0; i < entries.length; i++) {
      let title = entries[i].getElementsByTagName("title")[0].textContent || "";
      let summary = entries[i].getElementsByTagName("summary")[0].textContent || "";
      let link = entries[i].getElementsByTagName("id")[0].textContent || "";
      let authors = Array.from(entries[i].getElementsByTagName("author"))
        .map(author => author.textContent?.trim() || "")
        .join(", ");
      let publishedDate = entries[i].getElementsByTagName("published")[0]?.textContent || "Unknown";
      
      try {
        const paperResponse = await axios.get(link, { responseType: "text" });
        const fullText = paperResponse.data;
        
        papers.push({ title, summary, link, authors, publishedDate, fullText: fullText as string });
      } catch (error) {
        console.warn(`Failed to fetch full text for: ${title}`);
        papers.push({ title, summary, link, authors, publishedDate, fullText: "Unavailable" as string });
      }
    }

    // Check for dataset mentions in the actual paper content
    for (let paper of papers) {
      if (paper.fullText.toLowerCase().includes("table") || paper.fullText.toLowerCase().includes("dataset")) {
        datasetMentions.push({ title: paper.title, link: paper.link });
      }
    }

    return {
      papers,
      datasets: datasetMentions.length > 0 ? datasetMentions : null
    };
  } catch (error) {
    console.error("Error fetching Arxiv papers:", error);
    return { papers: [], datasets: null };
  }
};

interface WikipediaResponse {
  title: string;
  extract: string;
  content_urls: {
    desktop: {
      page: string;
    };
  };
}

export const fetchWikipediaSummary = async (query: string) => {
  try {
    const response = await axios.get<WikipediaResponse>(`${WIKIPEDIA_API_URL}${encodeURIComponent(query)}`);
    if (response.data && response.data.extract) {
      return { 
        title: response.data.title, 
        summary: response.data.extract, 
        link: response.data.content_urls.desktop.page, 
        source: "Wikipedia" 
      };
    } else {
      return { error: "No summary available for this topic." };
    }
  } catch (error) {
    console.error("Error fetching Wikipedia summary:", error);
    return { error: "Failed to retrieve Wikipedia summary." };
  }
};
