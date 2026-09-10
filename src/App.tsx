import { useState, useCallback, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import WorldMap from "@/components/WorldMap";
import AIPanel from "@/components/AIPanel";
import SearchAuditModal from "@/components/SearchAuditModal";
import { fetchGdeltNews } from "@/services/gdeltService";
import { getWorldMonitorData } from "@/services/worldMonitorService";
import { getStraitWeather } from "@/services/weatherNextService";
import type { GdeltResult, MapLayerKey, StraitWeatherConditions, BasemapTheme } from "@/types";

export default function App() {
  const [query, setQuery] = useState("Taiwan");
  const [result, setResult] = useState<GdeltResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<MapLayerKey>>(
    new Set(["news", "chokePoints", "worldMonitor"]),
  );
  const [weatherConditions, setWeatherConditions] =
    useState<StraitWeatherConditions | null>(null);
  const [basemapTheme, setBasemapTheme] = useState<BasemapTheme>("dark");

  const worldMonitorData = useMemo(() => getWorldMonitorData(), []);

  const toggleLayer = useCallback((key: MapLayerKey) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      // When enabling weather, fetch conditions
      if (key === "weather" && !next.has("weather") === false) {
        setWeatherConditions(getStraitWeather());
      }
      return next;
    });
  }, []);

  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setLoadError(null);
    setSelectedCountry(null);
    try {
      const data = await fetchGdeltNews(searchQuery);
      setResult(data);
    } catch {
      setLoadError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch("Taiwan");
  }, [doSearch]);

  // Update weather conditions when weather layer is active
  useEffect(() => {
    if (activeLayers.has("weather") && !weatherConditions) {
      setWeatherConditions(getStraitWeather());
    }
  }, [activeLayers, weatherConditions]);

  const handleSearch = () => doSearch(query);
  const handleRefresh = () => doSearch(result?.query ?? query);

  const searchVerified = result !== null && !isLoading;

  return (
    <div className="flex h-screen flex-col bg-[#0f172a]">
      <Header
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isMonitoring={result !== null && !isLoading}
        articleCount={result?.totalArticles ?? 0}
        countryCount={result?.countryGroups.length ?? 0}
        searchVerified={searchVerified}
        onAuditClick={() => setShowAudit(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Map Area */}
        <main className="relative flex-1 overflow-hidden">
          {result && result.countryGroups.length > 0 ? (
            <WorldMap
              countryGroups={result.countryGroups}
              selectedCountry={selectedCountry}
              onSelectCountry={(c) =>
                setSelectedCountry((prev) => (prev === c ? null : c))
              }
              activeLayers={activeLayers}
              onToggleLayer={toggleLayer}
              chokePoints={worldMonitorData.chokePoints}
              events={worldMonitorData.events}
              weatherConditions={weatherConditions}
              basemapTheme={basemapTheme}
              onBasemapChange={setBasemapTheme}
            />
          ) : isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#334155] border-t-[#f59e0b]" />
                <p className="text-sm text-[#64748b]">
                  Querying GDELT DOC API + RSS Feeds...
                </p>
              </div>
            </div>
          ) : loadError ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-[#ef4444]">{loadError}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 rounded-md border border-[#334155] px-3 py-1 text-xs text-[#cbd5e1] hover:border-[#f59e0b]"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-semibold text-[#475569]">
                  No data loaded
                </p>
                <p className="mt-1 text-sm text-[#334155]">
                  Search for a topic to see global news coverage
                </p>
              </div>
            </div>
          )}

          {/* Query overlay */}
          {result && (
            <div className="pointer-events-none absolute left-20 top-3 z-[1000] max-w-md rounded-lg border border-[#334155] bg-[#1e293b]/90 px-3 py-2 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-wider text-[#64748b]">
                GDELT Query
              </div>
              <div className="text-sm font-semibold text-[#f8fafc]">
                "{result.query}"
              </div>
              <div className="mt-0.5 text-[10px] text-[#475569]">
                {result.totalArticles} articles · {result.countryGroups.length} countries ·{" "}
                {new Date(result.fetchedAt).toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Frame distribution overlay (top-right) */}
          {result && result.countryGroups.length > 0 && (
            <div
              className="absolute right-4 top-4 z-[1000] rounded-lg border border-[#334155] bg-[#1e293b]/90 px-3 py-2 backdrop-blur-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#64748b]">
                Frame Distribution
              </div>
              {(() => {
                const counts = { economic: 0, military: 0, diplomatic: 0 };
                for (const a of result.articles) counts[a.frame]++;
                const total = result.articles.length;
                return (
                  <div className="space-y-1">
                    {(["economic", "military", "diplomatic"] as const).map((frame) => {
                      const pct = total > 0 ? (counts[frame] / total) * 100 : 0;
                      const color =
                        frame === "economic" ? "#3b82f6" : frame === "military" ? "#ef4444" : "#22c55e";
                      return (
                        <div key={frame} className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[11px] capitalize text-[#cbd5e1]">
                            {frame}
                          </span>
                          <div className="h-1 w-16 overflow-hidden rounded-full bg-[#0f172a]">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums text-[#64748b]">
                            {counts[frame]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Layer toggle pass-through: handled inside WorldMap, but we need to propagate toggles from the legend clicks */}
          {/* Invisible layer toggle handler - delegates to activeLayers state */}
          {(() => {
            // Render a hidden element to ensure layer toggles in WorldMap update App state
            // The actual toggling happens through the layer panel rendered in WorldMap
            return null;
          })()}
        </main>

        {/* AI Side Panel */}
        <AIPanel
          articles={result?.articles ?? []}
          isOpen={aiPanelOpen}
          onToggle={() => setAiPanelOpen((p) => !p)}
        />
      </div>

      {/* Search Audit Modal */}
      <SearchAuditModal
        isOpen={showAudit}
        onClose={() => setShowAudit(false)}
        audit={result?.audit ?? []}
        totalArticles={result?.totalArticles ?? 0}
      />
    </div>
  );
}
