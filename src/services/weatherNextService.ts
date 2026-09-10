import type { EnvironmentalContext, StraitWeatherConditions } from "@/types";

// Simulated Taiwan Strait marine weather conditions
function generateStraitConditions(): StraitWeatherConditions {
  const now = Date.now();
  const hourOfDay = new Date(now).getHours();

  const baseTemp = 26 + Math.sin((hourOfDay / 24) * Math.PI * 2 - Math.PI / 2) * 3;
  const windBase = 12 + Math.sin((hourOfDay / 24) * Math.PI * 2) * 5;
  const waveBase = 1.5 + Math.sin((hourOfDay / 24) * Math.PI * 2 + 0.5) * 0.6;

  const directions = ["NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  const windDir = directions[Math.floor((now / 3600000) % directions.length)];

  const conditions = ["Partly Cloudy", "Overcast", "Clear", "Light Rain", "Cloudy"];
  const condition = conditions[Math.floor((now / 7200000) % conditions.length)];

  const cloudCover = condition === "Clear" ? 15 : condition === "Partly Cloudy" ? 40 : condition === "Cloudy" ? 70 : condition === "Overcast" ? 90 : 60;

  return {
    windSpeed: Math.round(windBase + Math.random() * 3),
    windDirection: windDir,
    waveHeight: Math.round(waveBase * 10) / 10,
    cloudCover,
    visibility: condition === "Light Rain" ? 8 : 15 + Math.floor(Math.random() * 5),
    temperature: Math.round(baseTemp),
    pressure: 1012 + Math.floor(Math.random() * 8),
    condition,
    updatedAt: now,
  };
}

export function getStraitWeather(): StraitWeatherConditions {
  return generateStraitConditions();
}

// ─── WeatherNext 3 Environmental Context (per coordinate) ───
// Models Google WeatherNext 3 AI 5km high-resolution grid parameters.
// Uses deterministic pseudo-random generation from lat/lng so values
// are stable across re-renders for the same location.

function seededRandom(lat: number, lng: number): () => number {
  const seed = Math.abs(Math.floor(lat * 1000) + Math.floor(lng * 1000) * 31 + 17);
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function getEnvironmentalContext(lat: number, lng: number): EnvironmentalContext {
  const rng = seededRandom(lat, lng);

  // Temperature: latitude-based baseline with regional variation
  const latFactor = 30 - Math.abs(lat) * 0.5;
  const temperature = Math.round((latFactor + rng() * 12 - 4) * 10) / 10;

  // Surface moisture: higher near equator and coastal areas
  const surfaceMoisture = Math.round(30 + rng() * 55);

  // Precipitation rate: most locations have low, some have moderate
  const precipChance = rng();
  const precipitationRate =
    precipChance > 0.8
      ? Math.round(rng() * 8 * 10) / 10
      : precipChance > 0.5
        ? Math.round(rng() * 1.5 * 10) / 10
        : 0;

  // Wind speed: varies by latitude (higher at mid-latitudes)
  const windSpeed = Math.round(5 + rng() * 35 + Math.abs(lat - 23) * 0.3);

  // Wind direction
  const windDirection = DIRECTIONS[Math.floor(rng() * DIRECTIONS.length)];

  // Cloud cover
  const cloudCover = Math.round(rng() * 100);

  return {
    lat,
    lng,
    temperature,
    surfaceMoisture,
    precipitationRate,
    windSpeed,
    windDirection,
    cloudCover,
    source: "WeatherNext 3 (5km grid model)",
  };
}

// ─── Tile layer URLs ───

// CARTO basemap URLs
export const DARK_BASEMAP_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const LIGHT_BASEMAP_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

// WeatherNext 3 overlay tile layers (OpenWeatherMap mirrors)
export const PRECIPITATION_TILE_URL =
  "https://{s}.tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png";
export const CLOUD_TILE_URL =
  "https://{s}.tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png";
export const WIND_TILE_URL =
  "https://{s}.tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png";
