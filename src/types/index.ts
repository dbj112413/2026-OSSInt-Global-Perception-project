export type NewsFrame = "economic" | "military" | "diplomatic";

export interface GdeltArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string;
  socialimage?: string;
  domain: string;
  language: string;
  sourcecountry: string;
  frame: NewsFrame;
  source: "gdelt" | "rss" | "mock";
}

export interface CountryGroup {
  country: string;
  lat: number;
  lng: number;
  articleCount: number;
  articles: GdeltArticle[];
  dominantFrame: NewsFrame;
}

export interface SearchAuditEntry {
  source: string;
  query: string;
  recordCount: number;
  latencyMs: number;
  timestamp: number;
  status: "success" | "fallback" | "error";
  url: string;
}

export interface GdeltResult {
  query: string;
  totalArticles: number;
  articles: GdeltArticle[];
  countryGroups: CountryGroup[];
  fetchedAt: number;
  audit: SearchAuditEntry[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface NarrativeBriefing {
  themes: string[];
  sentimentDivergence: string;
  emergingHeadlines: string[];
  rawSummary: string;
}

// World Monitor types
export type MonitorEventType = "military" | "diplomatic" | "economic";

export interface ChokePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "shipping" | "aviation";
  description: string;
  trafficVolume: "high" | "medium" | "low";
}

export interface GeopoliticalEvent {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  eventType: MonitorEventType;
  timestamp: number;
  severity: "high" | "medium" | "low";
  source: string;
}

export interface WorldMonitorData {
  chokePoints: ChokePoint[];
  events: GeopoliticalEvent[];
}

// Weather types
export interface StraitWeatherConditions {
  windSpeed: number; // knots
  windDirection: string;
  waveHeight: number; // meters
  cloudCover: number; // percentage 0-100
  visibility: number; // km
  temperature: number; // celsius
  pressure: number; // hPa
  condition: string;
  updatedAt: number;
}

export type MapLayerKey = "news" | "worldMonitor" | "weather" | "chokePoints";

export type BasemapTheme = "dark" | "light";

export interface EnvironmentalContext {
  lat: number;
  lng: number;
  temperature: number; // celsius, 5km grid
  surfaceMoisture: number; // percentage 0-100
  precipitationRate: number; // mm/hr
  windSpeed: number; // km/h
  windDirection: string;
  cloudCover: number; // percentage 0-100
  source: string;
}
