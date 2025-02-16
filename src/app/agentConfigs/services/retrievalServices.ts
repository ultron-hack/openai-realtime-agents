import axios from "axios";

const ARXIV_API_URL = "http://export.arxiv.org/api/query?search_query=";
const WIKIPEDIA_API_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";

export const fetchArxivPapers = async (query: string) => {
  try {
    const response = await axios.get(`${ARXIV_API_URL}${encodeURIComponent(query)}&max_results=100000`);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data as string, "text/xml");
    const entries = xmlDoc.getElementsByTagName("entry");

    let papers = [];
    let datasetMentions = [];

    for (let i = 0; i < entries.length; i++) {
      let title = entries[i].getElementsByTagName("title")[0].textContent || "";
      let summary = entries[i].getElementsByTagName("summary")[0].textContent || "";
      let link = entries[i].getElementsByTagName("id")[0].textContent || "";
      
      papers.push({ title, summary, link });
    }

    // Check for dataset mentions in the actual paper content
    for (let paper of papers) {
      try {
        const paperResponse = await axios.get(paper.link);
        const paperText = (paperResponse.data as string).toLowerCase();
        
        if (paperText.includes("table") || paperText.includes("dataset")) {
          datasetMentions.push({ title: paper.title, link: paper.link });
        }
      } catch (error) {
        console.warn(`Failed to fetch full text for: ${paper.title}`);
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
      return { title: response.data.title, summary: response.data.extract, link: response.data.content_urls.desktop.page };
    } else {
      return { error: "No summary available for this topic." };
    }
  } catch (error) {
    console.error("Error fetching Wikipedia summary:", error);
    return { error: "Failed to retrieve Wikipedia summary." };
  }
};
