import type {
  GdeltArticle,
  GdeltResult,
  CountryGroup,
  NewsFrame,
  SearchAuditEntry,
} from "@/types";
import { getCountryCoords } from "@/data/countryCoords";
import { getPublisherCoords } from "@/data/publisherCoords";

const GDELT_API_URL = "https://api.gdeltproject.org/api/v2/doc/doc";
const RSS2JSON_URL = "https://api.rss2json.com/v1/api.json";
const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

const MILITARY_KEYWORDS = [
  "military", "defense", "defence", "war", "invasion", "attack", "missile",
  "drill", "exercise", "strait", "cross-strait", "pla", "navy",
  "air force", "armed", "troops", "pivot", "deterrence", "weapon", "submarine",
  "incursion", "aircraft carrier", "combat", "soldier", "conflict", "tension",
  "threat", "aggression", "blockade", "mobiliz",
];

const ECONOMIC_KEYWORDS = [
  "semiconductor", "chip", "tsmc", "economy", "trade", "supply chain", "export",
  "import", "tariff", "investment", "gdp", "market", "stock", "tech", "technology",
  "factory", "manufacturing", "ai", "artificial intelligence", "nvidia", "apple",
  "supply", "dollar", "billion", "deal", "economic", "finance", "business",
  "industry", "innovation", "startup", "revenue", "profit",
];

const DIPLOMATIC_KEYWORDS = [
  "diplomat", "diplomacy", "visit", "summit", "meeting", "talks", "ambassador",
  "foreign minister", "president", "election", "cultural", "exchange", "treaty",
  "agreement", "cooperation", "partnership", "diplomatic", "bilateral", "official",
  "delegation", "protocol", "embassy", "consulate", "relations", "policy",
];

function classifyFrame(title: string): NewsFrame {
  const lower = title.toLowerCase();
  let mil = 0, econ = 0, diplo = 0;
  for (const kw of MILITARY_KEYWORDS) if (lower.includes(kw)) mil++;
  for (const kw of ECONOMIC_KEYWORDS) if (lower.includes(kw)) econ++;
  for (const kw of DIPLOMATIC_KEYWORDS) if (lower.includes(kw)) diplo++;
  if (mil >= econ && mil >= diplo && mil > 0) return "military";
  if (econ >= diplo && econ > 0) return "economic";
  if (diplo > 0) return "diplomatic";
  return "diplomatic";
}

interface RawGdeltArticle {
  url?: string;
  url_mobile?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

function extractHostname(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function normalizeArticle(
  raw: RawGdeltArticle,
  source: "gdelt" | "rss" | "mock",
): GdeltArticle | null {
  if (!raw.url || !raw.title) return null;
  const domain = raw.domain || extractHostname(raw.url);
  let sourcecountry = raw.sourcecountry ?? "";

  // If no source country, try publisher geocoding
  if (!sourcecountry || sourcecountry === "Unknown") {
    const pubCoords = getPublisherCoords(domain);
    if (pubCoords) sourcecountry = pubCoords.country;
  }

  if (!sourcecountry) sourcecountry = "Unknown";

  return {
    url: raw.url,
    url_mobile: raw.url_mobile,
    title: raw.title,
    seendate: raw.seendate ?? "",
    socialimage: raw.socialimage,
    domain,
    language: raw.language ?? "English",
    sourcecountry,
    frame: classifyFrame(raw.title),
    source,
  };
}

function deduplicateByHostname(articles: GdeltArticle[]): GdeltArticle[] {
  const seen = new Set<string>();
  const result: GdeltArticle[] = [];
  for (const a of articles) {
    const host = extractHostname(a.url);
    if (seen.has(host)) continue;
    seen.add(host);
    result.push(a);
  }
  return result;
}

// ─── Tier 1: GDELT DOC API ───
async function fetchFromGdelt(query: string): Promise<{
  articles: GdeltArticle[];
  audit: SearchAuditEntry;
}> {
  const gdeltQuery = `(${query} OR "Taiwan Strait" OR TSMC OR "Taipei") sourcelang:eng`;
  const url = `${GDELT_API_URL}?query=${encodeURIComponent(gdeltQuery)}&mode=artlist&maxrecords=50&format=json&sort=datedesc`;
  const startTime = performance.now();

  const response = await fetch(url);
  if (!response.ok) throw new Error(`GDELT API returned ${response.status}`);

  const data = await response.json();
  const rawArticles: RawGdeltArticle[] = data.articles ?? [];
  const latency = Math.round(performance.now() - startTime);

  const articles: GdeltArticle[] = [];
  for (const raw of rawArticles) {
    const a = normalizeArticle(raw, "gdelt");
    if (a) articles.push(a);
  }

  return {
    articles,
    audit: {
      source: "GDELT DOC 2.0",
      query: gdeltQuery,
      recordCount: articles.length,
      latencyMs: latency,
      timestamp: Date.now(),
      status: articles.length > 0 ? "success" : "fallback",
      url,
    },
  };
}

// ─── Tier 2: Google News RSS via rss2json ───
async function fetchFromRss(query: string): Promise<{
  articles: GdeltArticle[];
  audit: SearchAuditEntry;
}> {
  const rssUrl = `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const url = `${RSS2JSON_URL}?rss_url=${encodeURIComponent(rssUrl)}&count=50`;
  const startTime = performance.now();

  const response = await fetch(url);
  if (!response.ok) throw new Error(`RSS2JSON returned ${response.status}`);

  const data = await response.json();
  const items: Array<{ link?: string; title?: string; pubDate?: string }> = data.items ?? [];
  const latency = Math.round(performance.now() - startTime);

  const articles: GdeltArticle[] = [];
  for (const item of items) {
    if (!item.link || !item.title) continue;
    const raw: RawGdeltArticle = {
      url: item.link,
      title: item.title,
      seendate: item.pubDate ?? "",
      domain: extractHostname(item.link),
    };
    const a = normalizeArticle(raw, "rss");
    if (a) articles.push(a);
  }

  return {
    articles,
    audit: {
      source: "Google News RSS (via rss2json)",
      query: query,
      recordCount: articles.length,
      latencyMs: latency,
      timestamp: Date.now(),
      status: articles.length > 0 ? "success" : "fallback",
      url,
    },
  };
}

// ─── Tier 3: Mock fallback ───
function generateMockArticles(query: string): GdeltArticle[] {
  const seed = query.length * 37 + 13;
  const rng = (i: number) => {
    const x = Math.sin(seed + i * 17) * 10000;
    return x - Math.floor(x);
  };

  const sources: Array<{ country: string; domain: string; frame: NewsFrame; titleTemplate: string }> = [
    { country: "United States", domain: "reuters.com", frame: "military", titleTemplate: "U.S. pledges continued defense support for Taiwan amid strait tensions" },
    { country: "United States", domain: "bloomberg.com", frame: "economic", titleTemplate: "TSMC Arizona fab accelerates production as chip demand surges" },
    { country: "United States", domain: "nytimes.com", frame: "diplomatic", titleTemplate: "Taiwan president transit through U.S. draws diplomatic reactions from Beijing" },
    { country: "China", domain: "xinhuanet.com", frame: "military", titleTemplate: "PLA conducts joint exercises near Taiwan strait following provocation" },
    { country: "China", domain: "globaltimes.cn", frame: "military", titleTemplate: "Cross-strait military balance shifts as Beijing warns against separatism" },
    { country: "Japan", domain: "nikkei.com", frame: "economic", titleTemplate: "Japan and Taiwan deepen semiconductor supply chain cooperation" },
    { country: "Japan", domain: "asahi.com", frame: "diplomatic", titleTemplate: "Japanese lawmakers visit Taiwan for cultural and economic exchange" },
    { country: "South Korea", domain: "koreatimes.co.kr", frame: "economic", titleTemplate: "South Korea monitors chip war impact as TSMC expands global footprint" },
    { country: "United Kingdom", domain: "bbc.co.uk", frame: "diplomatic", titleTemplate: "UK parliament delegation visits Taiwan, reaffirming bilateral ties" },
    { country: "Australia", domain: "abc.net.au", frame: "military", titleTemplate: "Australia expresses concern over Taiwan strait military activities" },
    { country: "Singapore", domain: "straitstimes.com", frame: "economic", titleTemplate: "Singapore businesses eye Taiwan tech investments amid regional shifts" },
    { country: "Philippines", domain: "inquirer.net", frame: "diplomatic", titleTemplate: "Philippines and Taiwan strengthen maritime cooperation dialogue" },
    { country: "France", domain: "lemonde.fr", frame: "diplomatic", titleTemplate: "French senators visit Taiwan in show of democratic solidarity" },
    { country: "Germany", domain: "dw.com", frame: "economic", titleTemplate: "German semiconductor firms partner with Taiwanese suppliers" },
    { country: "India", domain: "hindustantimes.com", frame: "diplomatic", titleTemplate: "India-Taiwan trade talks advance as New Delhi diversifies tech partnerships" },
    { country: "Canada", domain: "theglobeandmail.com", frame: "diplomatic", titleTemplate: "Canadian foreign minister addresses Indo-Pacific and Taiwan stability" },
    { country: "Vietnam", domain: "vnexpress.net", frame: "economic", titleTemplate: "Vietnam emerges as alternative manufacturing hub alongside Taiwan" },
    { country: "Indonesia", domain: "jakartapost.com", frame: "diplomatic", titleTemplate: "ASEAN members call for peaceful resolution of Taiwan strait issues" },
    { country: "Russia", domain: "tass.ru", frame: "military", titleTemplate: "Russia criticizes Western military involvement in Taiwan region" },
    { country: "Brazil", domain: "estadao.com.br", frame: "diplomatic", titleTemplate: "Brazil seeks balanced trade relations with both China and Taiwan" },
    { country: "Netherlands", domain: "dutchnews.nl", frame: "economic", titleTemplate: "ASML chip equipment exports to Taiwan under renewed scrutiny" },
    { country: "Spain", domain: "elpais.com", frame: "diplomatic", titleTemplate: "Spain reaffirms One China policy while maintaining trade ties with Taiwan" },
    { country: "Thailand", domain: "bangkokpost.com", frame: "economic", titleTemplate: "Thai electronics sector benefits from Taiwan supply chain diversification" },
    { country: "Malaysia", domain: "thestar.com.my", frame: "economic", titleTemplate: "Malaysia positions as semiconductor partner in Taiwan tech ecosystem" },
    { country: "New Zealand", domain: "nzherald.co.nz", frame: "diplomatic", titleTemplate: "New Zealand emphasizes peaceful dialogue across Taiwan strait" },
    { country: "Italy", domain: "repubblica.it", frame: "diplomatic", titleTemplate: "Italy joins G7 statement on Taiwan strait stability" },
    { country: "Saudi Arabia", domain: "arabnews.com", frame: "economic", titleTemplate: "Gulf states explore tech investments in Taiwan semiconductor sector" },
    { country: "Mexico", domain: "elfinanciero.com.mx", frame: "economic", titleTemplate: "Mexican auto industry monitors Taiwan chip supply disruptions" },
    { country: "Turkey", domain: "hurriyet.com.tr", frame: "diplomatic", titleTemplate: "Turkey maintains diplomatic balance on Taiwan question" },
    { country: "Sweden", domain: "svenskadagbladet.se", frame: "economic", titleTemplate: "Swedish tech firms expand presence in Taiwan innovation ecosystem" },
    { country: "Poland", domain: "rp.pl", frame: "diplomatic", titleTemplate: "Poland-Taiwan parliamentary friendship group strengthens ties" },
    { country: "Ukraine", domain: "kyivpost.com", frame: "military", titleTemplate: "Ukraine draws parallels between own defense and Taiwan deterrence" },
    { country: "Pakistan", domain: "dawn.com", frame: "diplomatic", titleTemplate: "Pakistan reiterates support for One China policy on Taiwan" },
    { country: "Switzerland", domain: "swissinfo.ch", frame: "economic", titleTemplate: "Swiss financial institutions track Taiwan market developments" },
    { country: "Ireland", domain: "irishtimes.com", frame: "economic", titleTemplate: "Irish pharma sector reliant on Taiwan electronics supply chain" },
    { country: "Colombia", domain: "eltiempo.com", frame: "diplomatic", titleTemplate: "Colombia reaffirms diplomatic alignment with Beijing on Taiwan" },
    { country: "Egypt", domain: "ahram.org.eg", frame: "diplomatic", titleTemplate: "Egypt supports peaceful resolution of Taiwan strait tensions" },
    { country: "South Africa", domain: "iol.co.za", frame: "diplomatic", titleTemplate: "South Africa balances BRICS commitments with Taiwan trade interests" },
    { country: "Argentina", domain: "lanacion.com.ar", frame: "diplomatic", titleTemplate: "Argentina seeks expanded trade ties with Taiwanese technology firms" },
    { country: "Hong Kong", domain: "scmp.com", frame: "military", titleTemplate: "Hong Kong analysts assess cross-strait military developments" },
  ];

  const count = 30 + Math.floor(rng(0) * 10);
  const articles: GdeltArticle[] = [];
  const indices = sources.map((_, i) => i).sort(() => rng(1) - 0.5);

  for (let i = 0; i < Math.min(count, indices.length); i++) {
    const src = sources[indices[i]];
    const variation = rng(i + 100) > 0.5 ? " — analysis" : rng(i + 200) > 0.5 ? " | report" : "";
    articles.push({
      url: `https://${src.domain}/article/${i}`,
      title: src.titleTemplate + variation,
      seendate: `2026090${Math.floor(rng(i + 10) * 9)}`,
      domain: src.domain,
      language: "English",
      sourcecountry: src.country,
      frame: src.frame,
      source: "mock",
    });
  }

  return articles;
}

function groupByCountry(articles: GdeltArticle[]): CountryGroup[] {
  const groups: Map<string, GdeltArticle[]> = new Map();
  for (const a of articles) {
    const country = a.sourcecountry;
    if (!groups.has(country)) groups.set(country, []);
    groups.get(country)!.push(a);
  }

  const result: CountryGroup[] = [];
  for (const [country, arts] of groups) {
    if (country === "Unknown") {
      // Try publisher geocoding as last resort
      for (const a of arts) {
        const pubCoords = getPublisherCoords(a.domain);
        if (pubCoords) {
          a.sourcecountry = pubCoords.country;
        }
      }
      // Re-group the now-geocoded articles
      continue;
    }

    const coords = getCountryCoords(country);
    if (coords.lat === 0 && coords.lng === 0) continue;

    const frameCounts: Record<NewsFrame, number> = { economic: 0, military: 0, diplomatic: 0 };
    for (const a of arts) frameCounts[a.frame]++;
    const dominantFrame = (Object.entries(frameCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "diplomatic") as NewsFrame;

    result.push({
      country,
      lat: coords.lat,
      lng: coords.lng,
      articleCount: arts.length,
      articles: arts.sort((a, b) => b.seendate.localeCompare(a.seendate)),
      dominantFrame,
    });
  }

  return result.sort((a, b) => b.articleCount - a.articleCount);
}

export async function fetchGdeltNews(query: string): Promise<GdeltResult> {
  const searchQuery = query.trim() || "Taiwan";
  const auditLog: SearchAuditEntry[] = [];

  // Tier 1: GDELT
  try {
    const { articles: gdeltArticles, audit } = await fetchFromGdelt(searchQuery);
    auditLog.push(audit);

    if (gdeltArticles.length > 0) {
      const deduped = deduplicateByHostname(gdeltArticles);
      const countryGroups = groupByCountry(deduped);

      // Enrich with RSS if GDELT returned few articles
      if (deduped.length < 15) {
        try {
          const { articles: rssArticles, audit: rssAudit } = await fetchFromRss(searchQuery);
          auditLog.push(rssAudit);
          const combined = deduplicateByHostname([...deduped, ...rssArticles]);
          const combinedGroups = groupByCountry(combined);
          return {
            query: searchQuery,
            totalArticles: combined.length,
            articles: combined,
            countryGroups: combinedGroups,
            fetchedAt: Date.now(),
            audit: auditLog,
          };
        } catch {
          // RSS enrichment failed, continue with GDELT only
        }
      }

      return {
        query: searchQuery,
        totalArticles: deduped.length,
        articles: deduped,
        countryGroups,
        fetchedAt: Date.now(),
        audit: auditLog,
      };
    }
  } catch {
    auditLog.push({
      source: "GDELT DOC 2.0",
      query: searchQuery,
      recordCount: 0,
      latencyMs: 0,
      timestamp: Date.now(),
      status: "error",
      url: `${GDELT_API_URL}?query=${encodeURIComponent(searchQuery)}`,
    });
  }

  // Tier 2: RSS fallback
  try {
    const { articles: rssArticles, audit } = await fetchFromRss(searchQuery);
    auditLog.push(audit);

    if (rssArticles.length > 0) {
      const deduped = deduplicateByHostname(rssArticles);
      const countryGroups = groupByCountry(deduped);
      return {
        query: searchQuery,
        totalArticles: deduped.length,
        articles: deduped,
        countryGroups,
        fetchedAt: Date.now(),
        audit: auditLog,
      };
    }
  } catch {
    auditLog.push({
      source: "Google News RSS (via rss2json)",
      query: searchQuery,
      recordCount: 0,
      latencyMs: 0,
      timestamp: Date.now(),
      status: "error",
      url: `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(searchQuery)}`,
    });
  }

  // Tier 3: Mock fallback
  const mockArticles = generateMockArticles(searchQuery);
  const deduped = deduplicateByHostname(mockArticles);
  const countryGroups = groupByCountry(deduped);
  auditLog.push({
    source: "Built-in Mock Dataset",
    query: searchQuery,
    recordCount: deduped.length,
    latencyMs: 0,
    timestamp: Date.now(),
    status: "fallback",
    url: "internal://mock-dataset",
  });

  return {
    query: searchQuery,
    totalArticles: deduped.length,
    articles: deduped,
    countryGroups,
    fetchedAt: Date.now(),
    audit: auditLog,
  };
}

export const FRAME_COLORS: Record<NewsFrame, string> = {
  economic: "#3b82f6",
  military: "#ef4444",
  diplomatic: "#22c55e",
};

export const FRAME_LABELS: Record<NewsFrame, string> = {
  economic: "Economic / Semiconductor",
  military: "Military / Defense",
  diplomatic: "Diplomatic / Cultural",
};
