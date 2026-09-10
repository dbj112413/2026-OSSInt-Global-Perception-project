// Publisher domain -> geographic coordinates for geocoding articles lacking sourcecountry
export const PUBLISHER_COORDS: Record<string, { lat: number; lng: number; country: string }> = {
  "reuters.com": { lat: 51.51, lng: -0.13, country: "United Kingdom" },
  "bbc.co.uk": { lat: 51.51, lng: -0.13, country: "United Kingdom" },
  "bbc.com": { lat: 51.51, lng: -0.13, country: "United Kingdom" },
  "theguardian.com": { lat: 51.51, lng: -0.13, country: "United Kingdom" },
  "ft.com": { lat: 51.51, lng: -0.13, country: "United Kingdom" },
  "economist.com": { lat: 51.51, lng: -0.13, country: "United Kingdom" },
  "nytimes.com": { lat: 40.71, lng: -74.01, country: "United States" },
  "washingtonpost.com": { lat: 38.9, lng: -77.04, country: "United States" },
  "bloomberg.com": { lat: 40.71, lng: -74.01, country: "United States" },
  "cnn.com": { lat: 33.75, lng: -84.39, country: "United States" },
  "foxnews.com": { lat: 40.72, lng: -74.01, country: "United States" },
  "apnews.com": { lat: 40.72, lng: -74.01, country: "United States" },
  "aljazeera.com": { lat: 25.29, lng: 51.53, country: "Qatar" },
  "nikkei.com": { lat: 35.68, lng: 139.69, country: "Japan" },
  "asahi.com": { lat: 35.68, lng: 139.69, country: "Japan" },
  "japantimes.co.jp": { lat: 35.68, lng: 139.69, country: "Japan" },
  "koreatimes.co.kr": { lat: 37.57, lng: 126.98, country: "South Korea" },
  "koreaherald.com": { lat: 37.57, lng: 126.98, country: "South Korea" },
  "xinhuanet.com": { lat: 39.9, lng: 116.4, country: "China" },
  "globaltimes.cn": { lat: 39.9, lng: 116.4, country: "China" },
  "chinadaily.com.cn": { lat: 39.9, lng: 116.4, country: "China" },
  "scmp.com": { lat: 22.32, lng: 114.17, country: "Hong Kong" },
  "straitstimes.com": { lat: 1.35, lng: 103.82, country: "Singapore" },
  "channelnewsasia.com": { lat: 1.35, lng: 103.82, country: "Singapore" },
  "abc.net.au": { lat: -33.87, lng: 151.21, country: "Australia" },
  "theaustralian.com.au": { lat: -33.87, lng: 151.21, country: "Australia" },
  "lemonde.fr": { lat: 48.86, lng: 2.35, country: "France" },
  "lefigaro.fr": { lat: 48.86, lng: 2.35, country: "France" },
  "dw.com": { lat: 50.11, lng: 8.68, country: "Germany" },
  "spiegel.de": { lat: 53.55, lng: 9.99, country: "Germany" },
  "repubblica.it": { lat: 41.9, lng: 12.5, country: "Italy" },
  "elpais.com": { lat: 40.42, lng: -3.7, country: "Spain" },
  "hindustantimes.com": { lat: 28.61, lng: 77.21, country: "India" },
  "timesofindia.com": { lat: 19.08, lng: 72.88, country: "India" },
  "tass.ru": { lat: 55.76, lng: 37.62, country: "Russia" },
  "rt.com": { lat: 55.76, lng: 37.62, country: "Russia" },
  "dawn.com": { lat: 33.69, lng: 73.05, country: "Pakistan" },
  "jakartapost.com": { lat: -6.21, lng: 106.85, country: "Indonesia" },
  "bangkokpost.com": { lat: 13.76, lng: 100.5, country: "Thailand" },
  "vnexpress.net": { lat: 21.03, lng: 105.85, country: "Vietnam" },
  "inquirer.net": { lat: 14.6, lng: 120.98, country: "Philippines" },
  "nzherald.co.nz": { lat: -36.85, lng: 174.76, country: "New Zealand" },
  "theglobeandmail.com": { lat: 43.65, lng: -79.38, country: "Canada" },
  "thestar.com": { lat: 43.65, lng: -79.38, country: "Canada" },
};

export function getPublisherCoords(domain: string): { lat: number; lng: number; country: string } | null {
  const clean = domain.replace(/^www\./, "").toLowerCase();
  if (PUBLISHER_COORDS[clean]) return PUBLISHER_COORDS[clean];
  // Try partial match
  const key = Object.keys(PUBLISHER_COORDS).find((k) => clean.includes(k) || k.includes(clean));
  return key ? PUBLISHER_COORDS[key] : null;
}
