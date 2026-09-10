import type { GdeltArticle, NarrativeBriefing } from "@/types";

interface ThemeMatch {
  theme: string;
  keywords: string[];
}

const THEME_PATTERNS: ThemeMatch[] = [
  {
    theme: "Tech & TSMC Supply Chain",
    keywords: ["semiconductor", "chip", "tsmc", "supply chain", "factory", "manufacturing", "nvidia", "ai", "artificial intelligence"],
  },
  {
    theme: "Strait Defense & Military Exercises",
    keywords: ["military", "defense", "drill", "exercise", "strait", "pla", "missile", "invasion", "deterrence", "troops", "war"],
  },
  {
    theme: "Cross-Strait Diplomatic Tensions",
    keywords: ["diplomat", "diplomacy", "visit", "summit", "ambassador", "bilateral", "one china", "sovereignty", "separatism"],
  },
  {
    theme: "Global Trade & Investment",
    keywords: ["trade", "investment", "tariff", "export", "import", "deal", "billion", "economic", "market", "gdp"],
  },
  {
    theme: "Regional Security Alliances",
    keywords: ["alliance", "nato", "quad", "asean", "partnership", "cooperation", "treaty", "pivot", "indo-pacific"],
  },
  {
    theme: "Cultural & Parliamentary Exchange",
    keywords: ["cultural", "parliament", "delegation", "lawmaker", "exchange", "friendship", "solidarity", "democratic"],
  },
];

function scoreThemes(articles: GdeltArticle[]): Array<{ theme: string; score: number }> {
  const scores = THEME_PATTERNS.map((tp) => {
    let score = 0;
    for (const a of articles) {
      const lower = a.title.toLowerCase();
      for (const kw of tp.keywords) {
        if (lower.includes(kw)) score++;
      }
    }
    return { theme: tp.theme, score };
  });
  return scores.sort((a, b) => b.score - a.score);
}

function analyzeSentimentDivergence(articles: GdeltArticle[]): string {
  const westernCountries = ["United States", "United Kingdom", "Canada", "Australia", "France", "Germany", "Italy", "Spain", "Netherlands"];
  const asianCountries = ["Japan", "South Korea", "China", "Singapore", "Philippines", "Vietnam", "Thailand", "Indonesia", "Malaysia", "Hong Kong"];

  const western = articles.filter((a) => westernCountries.includes(a.sourcecountry));
  const asian = articles.filter((a) => asianCountries.includes(a.sourcecountry));

  const westernMilitary = western.filter((a) => a.frame === "military").length;
  const westernEconomic = western.filter((a) => a.frame === "economic").length;
  const westernDiplomatic = western.filter((a) => a.frame === "diplomatic").length;

  const asianMilitary = asian.filter((a) => a.frame === "military").length;
  const asianEconomic = asian.filter((a) => a.frame === "economic").length;
  const asianDiplomatic = asian.filter((a) => a.frame === "diplomatic").length;

  const westernFocus =
    westernMilitary >= westernEconomic && westernMilitary >= westernDiplomatic
      ? "defense and military deterrence"
      : westernEconomic >= westernDiplomatic
        ? "semiconductor supply chains and tech competition"
        : "diplomatic visits and political signaling";

  const asianFocus =
    asianEconomic >= asianMilitary && asianEconomic >= asianDiplomatic
      ? "semiconductor investments and trade partnerships"
      : asianMilitary >= asianDiplomatic
        ? "regional security and strait stability"
        : "bilateral dialogue and cultural exchange";

  const westernCount = western.length;
  const asianCount = asian.length;

  return `Western media (${westernCount} sources) primarily focuses on ${westernFocus}, while Asian media (${asianCount} sources) emphasizes ${asianFocus}. This divergence reflects differing strategic priorities: Western outlets frame Taiwan through a geopolitical security lens, whereas regional outlets foreground economic interdependence and commercial opportunity.`;
}

function selectEmergingHeadlines(articles: GdeltArticle[], count: number): string[] {
  // Pick diverse headlines from different countries and frames
  const selected: GdeltArticle[] = [];
  const usedCountries = new Set<string>();

  // First pass: one per country for diversity
  for (const a of articles) {
    if (selected.length >= count) break;
    if (!usedCountries.has(a.sourcecountry)) {
      selected.push(a);
      usedCountries.add(a.sourcecountry);
    }
  }

  // Fill remaining slots
  for (const a of articles) {
    if (selected.length >= count) break;
    if (!selected.includes(a)) selected.push(a);
  }

  return selected.slice(0, count).map((a) => a.title);
}

export function generateBriefing(articles: GdeltArticle[]): NarrativeBriefing {
  if (articles.length === 0) {
    return {
      themes: [],
      sentimentDivergence: "No articles available for analysis.",
      emergingHeadlines: [],
      rawSummary: "No data to analyze.",
    };
  }

  const themeScores = scoreThemes(articles);
  const topThemes = themeScores.filter((t) => t.score > 0).slice(0, 3);

  const themes = topThemes.length > 0
    ? topThemes.map((t, i) => `${i + 1}. ${t.theme} (${t.score} mentions)`)
    : ["1. General Taiwan Coverage (mixed framing)"];

  const sentimentDivergence = analyzeSentimentDivergence(articles);
  const emergingHeadlines = selectEmergingHeadlines(articles.slice(0, 20), 8);

  const rawSummary = `Analysis of ${articles.length} articles across ${new Set(articles.map((a) => a.sourcecountry)).size} countries. Dominant themes: ${themes.join("; ")}. Regional sentiment divergence detected between Western and Asian media coverage patterns.`;

  return {
    themes,
    sentimentDivergence,
    emergingHeadlines,
    rawSummary,
  };
}

// Mock chat responses for follow-up questions
export function generateChatResponse(
  question: string,
  articles: GdeltArticle[],
  briefing: NarrativeBriefing | null,
): string {
  const lower = question.toLowerCase();

  // Check for country-specific questions
  const countryMentioned = articles
    .map((a) => a.sourcecountry)
    .find((c) => lower.includes(c.toLowerCase()));

  if (countryMentioned) {
    const countryArticles = articles.filter((a) => a.sourcecountry === countryMentioned);
    const frames = countryArticles.map((a) => a.frame);
    const dominantFrame = frames.sort((a, b) =>
      frames.filter((v) => v === a).length - frames.filter((v) => v === b).length,
    ).pop();

    const frameDesc =
      dominantFrame === "military" ? "military and defense developments"
      : dominantFrame === "economic" ? "economic and trade relations"
      : "diplomatic and cultural exchanges";

    return `Based on the current GDELT data, ${countryMentioned} has ${countryArticles.length} article(s) about Taiwan. The coverage predominantly focuses on ${frameDesc}. Notable headlines include: "${countryArticles[0]?.title ?? "N/A"}". This suggests ${countryMentioned}'s media framing aligns with ${frameDesc} as the primary narrative lens for Taiwan-related coverage.`;
  }

  if (lower.includes("japan") || lower.includes("spike")) {
    const japanArticles = articles.filter((a) => a.sourcecountry === "Japan");
    return `Japan shows ${japanArticles.length} article(s) in the current dataset. The coverage centers on semiconductor supply chain cooperation and parliamentary-level diplomatic visits. This reflects Japan's strategic positioning as both a key tech partner and a regional security stakeholder. Recent headlines emphasize bilateral tech investment and defense dialogue, consistent with Japan's broader Indo-Pacific engagement strategy.`;
  }

  if (lower.includes("military") || lower.includes("defense") || lower.includes("war")) {
    const militaryArticles = articles.filter((a) => a.frame === "military");
    const countries = [...new Set(militaryArticles.map((a) => a.sourcecountry))];
    return `Military/defense framing appears in ${militaryArticles.length} of ${articles.length} articles (${Math.round((militaryArticles.length / articles.length) * 100)}%). Key source countries: ${countries.slice(0, 5).join(", ")}. The dominant military narrative revolves around strait deterrence, PLA exercises, and Western defense commitments. This framing is most concentrated in U.S., Chinese, and Australian coverage.`;
  }

  if (lower.includes("economic") || lower.includes("trade") || lower.includes("chip") || lower.includes("tsmc")) {
    const econArticles = articles.filter((a) => a.frame === "economic");
    return `Economic framing appears in ${econArticles.length} of ${articles.length} articles. The core economic narrative centers on TSMC's global expansion (Arizona, Japan, Germany), semiconductor supply chain resilience, and AI-driven chip demand. Coverage from Japan, South Korea, and the Netherlands heavily emphasizes tech partnership and supply chain diversification away from single-point-of-failure dependencies.`;
  }

  if (lower.includes("sentiment") || lower.includes("divergence") || lower.includes("difference")) {
    return briefing?.sentimentDivergence ?? "Sentiment analysis not yet generated. Click 'Summarize Today's Coverage' first.";
  }

  if (lower.includes("theme") || lower.includes("narrative") || lower.includes("summary")) {
    return briefing
      ? `Top narrative themes: ${briefing.themes.join(" | ")}. ${briefing.rawSummary}`
      : "No briefing generated yet. Click 'Summarize Today's Coverage' to analyze themes.";
  }

  if (lower.includes("country") || lower.includes("countries") || lower.includes("where")) {
    const countryCounts = articles.reduce((acc, a) => {
      acc[a.sourcecountry] = (acc[a.sourcecountry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const sorted = Object.entries(countryCounts).sort(([, a], [, b]) => b - a).slice(0, 8);
    return `Coverage spans ${sorted.length} countries. Top sources: ${sorted.map(([c, n]) => `${c} (${n})`).join(", ")}. The geographic distribution shows concentrated attention from the U.S., China, and Japan, with secondary coverage from European and Southeast Asian outlets.`;
  }

  // Default response
  return `I can analyze the current dataset of ${articles.length} GDELT articles about Taiwan. Try asking about:
• Specific countries ("What's the coverage from Japan?")
• Themes ("What are the military narratives?")
• Sentiment ("How does Western vs Asian coverage differ?")
• Economic angles ("Tell me about TSMC coverage")
• Geographic spread ("Which countries are reporting?")`;
}
