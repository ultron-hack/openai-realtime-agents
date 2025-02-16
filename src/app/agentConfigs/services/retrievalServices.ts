import axios from "axios";

const ARXIV_API_URL = "http://export.arxiv.org/api/query?search_query=";
const WIKIPEDIA_API_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";

export const fetchArxivPapers = async (query: string) => {
  const response = await axios.get(`${ARXIV_API_URL}${encodeURIComponent(query)}&max_results=10`);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(response.data as string, "text/xml");
  const entries = xmlDoc.getElementsByTagName("entry");

  let papers = [];
  let datasetMentions: string[] = [];

  for (let i = 0; i < entries.length; i++) {
    let title = entries[i].getElementsByTagName("title")[0].textContent || "";
    let summary = entries[i].getElementsByTagName("summary")[0].textContent || "";
    let link = entries[i].getElementsByTagName("id")[0].textContent || "";
    let authors = Array.from(entries[i].getElementsByTagName("author"))
      .map(author => author.textContent?.trim() || "")
      .join(", ");
    let publishedDate = entries[i].getElementsByTagName("published")[0]?.textContent || "Unknown";
    
    papers.push({ title, summary, link, authors, publishedDate });
  }

  return {
    papers,
    datasets: datasetMentions.length > 0 ? datasetMentions : null
  };
};

export const fetchWikipediaSummary = async (query: string) => {
  const response = await axios.get<{ title: string; extract: string; content_urls: { desktop: { page: string } } }>(`${WIKIPEDIA_API_URL}${encodeURIComponent(query)}`);
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
};
