const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
// Use NCBI API key if available for higher rate limits (10 req/s vs 3 req/s)
const API_KEY = process.env.NCBI_API_KEY ? `&api_key=${process.env.NCBI_API_KEY}` : "";

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;  // "Last FM, Last FM"
  journal: string;
  year: string;
  abstract: string;
  url: string;
}

export async function searchPubMed(
  query: string,
  maxResults = 5
): Promise<PubMedArticle[]> {
  try {
    // Step 1: search for PMIDs
    const searchUrl = `${EUTILS_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance${API_KEY}`;
    const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } });
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const ids: string[] = searchData?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    // Step 2: fetch summaries for those PMIDs
    const summaryUrl = `${EUTILS_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json${API_KEY}`;
    const summaryRes = await fetch(summaryUrl, { next: { revalidate: 86400 } });
    if (!summaryRes.ok) return [];

    const summaryData = await summaryRes.json();
    const result = summaryData?.result ?? {};

    return ids
      .filter(id => result[id])
      .map(id => {
        const art = result[id];
        const authors = (art.authors ?? [])
          .slice(0, 3)
          .map((a: any) => a.name)
          .join(", ");

        return {
          pmid: id,
          title: art.title ?? "",
          authors: authors + (art.authors?.length > 3 ? " et al." : ""),
          journal: art.fulljournalname ?? art.source ?? "",
          year: art.pubdate?.split(" ")?.[0] ?? "",
          abstract: "", // abstracts require efetch — skip for speed
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        };
      });
  } catch {
    return [];
  }
}

export async function fetchAbstract(pmid: string): Promise<string> {
  try {
    const url = `${EUTILS_BASE}/efetch.fcgi?db=pubmed&id=${pmid}&rettype=abstract&retmode=text${API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return "";
    const text = await res.text();
    // Extract abstract portion (everything after "AB  -" line)
    const match = text.match(/AB\s+-\s+([\s\S]+?)(?=\n[A-Z]{2,4}\s+-|\n\n|$)/);
    return match?.[1]?.replace(/\n\s+/g, " ").trim() ?? "";
  } catch {
    return "";
  }
}
