import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  Popup,
  useMap,
  ZoomControl,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type {
  CountryGroup,
  ChokePoint,
  GeopoliticalEvent,
  MapLayerKey,
  StraitWeatherConditions,
  EnvironmentalContext,
  BasemapTheme,
} from "@/types";
import {
  FRAME_COLORS,
  FRAME_LABELS,
} from "@/services/gdeltService";
import {
  EVENT_TYPE_COLORS,
  EVENT_TYPE_LABELS,
} from "@/services/worldMonitorService";
import {
  DARK_BASEMAP_URL,
  LIGHT_BASEMAP_URL,
  PRECIPITATION_TILE_URL,
  CLOUD_TILE_URL,
  WIND_TILE_URL,
  getEnvironmentalContext,
} from "@/services/weatherNextService";
import WeatherWidget from "@/components/WeatherWidget";
import { Cloud, Droplets, Wind, Thermometer, Gauge, CloudRain } from "lucide-react";

interface WorldMapProps {
  countryGroups: CountryGroup[];
  selectedCountry: string | null;
  onSelectCountry: (country: string) => void;
  activeLayers: Set<MapLayerKey>;
  onToggleLayer: (key: MapLayerKey) => void;
  chokePoints: ChokePoint[];
  events: GeopoliticalEvent[];
  weatherConditions: StraitWeatherConditions | null;
  basemapTheme: BasemapTheme;
  onBasemapChange: (theme: BasemapTheme) => void;
}

function SmoothWheelZoom() {
  const map = useMap();
  useEffect(() => {
    let timer: number | null = null;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (timer) return;
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      map.zoomIn(delta, { animate: true });
      timer = window.setTimeout(() => {
        timer = null;
      }, 150);
    };
    map.getContainer().addEventListener("wheel", handler, { passive: false });
    return () => {
      map.getContainer().removeEventListener("wheel", handler);
      if (timer) clearTimeout(timer);
    };
  }, [map]);
  return null;
}

function MapController({
  onResetView,
  onCenterTaiwan,
}: {
  onResetView: () => void;
  onCenterTaiwan: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__leafletMap = map;
  }, [map]);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__resetView = onResetView;
    (window as unknown as Record<string, unknown>).__centerTaiwan = onCenterTaiwan;
  }, [onResetView, onCenterTaiwan]);

  return null;
}

function markerRadius(count: number): number {
  return Math.max(6, Math.min(24, 6 + Math.sqrt(count) * 3));
}

const CHOKE_COLORS: Record<string, string> = {
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#64748b",
};

// Environmental Context tab content for popups
function EnvContextSection({ env }: { env: EnvironmentalContext }) {
  return (
    <div className="space-y-1.5 border-t border-[#334155] pt-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#22c55e]">
        <CloudRain size={11} />
        Environmental Context (WeatherNext 3)
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <div className="flex items-center gap-1.5">
          <Thermometer size={10} className="text-[#f59e0b]" />
          <span className="text-[10px] text-[#64748b]">Temp</span>
          <span className="ml-auto text-[10px] font-medium tabular-nums text-[#cbd5e1]">
            {env.temperature}°C
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets size={10} className="text-[#06b6d4]" />
          <span className="text-[10px] text-[#64748b]">Moisture</span>
          <span className="ml-auto text-[10px] font-medium tabular-nums text-[#cbd5e1]">
            {env.surfaceMoisture}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <CloudRain size={10} className="text-[#3b82f6]" />
          <span className="text-[10px] text-[#64748b]">Precip</span>
          <span className="ml-auto text-[10px] font-medium tabular-nums text-[#cbd5e1]">
            {env.precipitationRate} mm/hr
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind size={10} className="text-[#94a3b8]" />
          <span className="text-[10px] text-[#64748b]">Wind</span>
          <span className="ml-auto text-[10px] font-medium tabular-nums text-[#cbd5e1]">
            {env.windSpeed} km/h {env.windDirection}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cloud size={10} className="text-[#94a3b8]" />
          <span className="text-[10px] text-[#64748b]">Cloud</span>
          <span className="ml-auto text-[10px] font-medium tabular-nums text-[#cbd5e1]">
            {env.cloudCover}%
          </span>
        </div>
      </div>
      <div className="pt-0.5 text-[9px] text-[#475569]">
        {env.source} · No verification or scoring applied
      </div>
    </div>
  );
}

export default function WorldMap({
  countryGroups,
  selectedCountry,
  onSelectCountry,
  activeLayers,
  onToggleLayer,
  chokePoints,
  events,
  weatherConditions,
  basemapTheme,
  onBasemapChange,
}: WorldMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [popupTab, setPopupTab] = useState<"headlines" | "environment">("headlines");

  const handleResetView = () => {
    mapRef.current?.flyTo([20, 0], 2.5, { duration: 0.8 });
  };

  const handleCenterTaiwan = () => {
    mapRef.current?.flyTo([23.7, 121.0], 6, { duration: 0.8 });
  };

  const showNews = activeLayers.has("news");
  const showChokePoints = activeLayers.has("chokePoints");
  const showEvents = activeLayers.has("worldMonitor");
  const showWeather = activeLayers.has("weather");

  const basemapUrl = basemapTheme === "dark" ? DARK_BASEMAP_URL : LIGHT_BASEMAP_URL;
  const isDark = basemapTheme === "dark";

  return (
    <div
      className="relative h-full w-full"
      onDragStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <MapContainer
        center={[20, 0]}
        zoom={2.5}
        minZoom={2}
        maxZoom={10}
        zoomControl={false}
        attributionControl={false}
        worldCopyJump
        preferCanvas
        fadeAnimation
        zoomAnimation
        markerZoomAnimation
        easeLinearity={0.25}
        wheelDebounceTime={150}
        className={`h-full w-full ${isDark ? "bg-[#0f172a]" : "bg-[#e2e8f0]"}`}
        ref={(m) => {
          if (m) mapRef.current = m;
        }}
      >
        <SmoothWheelZoom />
        <MapController onResetView={handleResetView} onCenterTaiwan={handleCenterTaiwan} />
        <ZoomControl position="bottomright" />

        <LayersControl position="topright">
          {/* Base layer switcher */}
          <LayersControl.BaseLayer checked={isDark} name="CARTO Dark (OSINT)">
            <TileLayer
              key="dark-basemap"
              url={DARK_BASEMAP_URL}
              subdomains="abcd"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={!isDark} name="CARTO Light/Voyager">
            <TileLayer
              key="light-basemap"
              url={LIGHT_BASEMAP_URL}
              subdomains="abcd"
            />
          </LayersControl.BaseLayer>

          {/* WeatherNext 3 overlays */}
          <LayersControl.Overlay checked={showWeather} name="WeatherNext 3 - Cloud Cover">
            <TileLayer
              url={CLOUD_TILE_URL}
              subdomains="abc"
              opacity={0.4}
              zIndex={5}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay checked={showWeather} name="WeatherNext 3 - Precipitation">
            <TileLayer
              url={PRECIPITATION_TILE_URL}
              subdomains="abc"
              opacity={0.35}
              zIndex={6}
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay checked={showWeather} name="WeatherNext 3 - Wind Vectors">
            <TileLayer
              url={WIND_TILE_URL}
              subdomains="abc"
              opacity={0.3}
              zIndex={7}
            />
          </LayersControl.Overlay>
        </LayersControl>

        {/* News markers with environmental context in popups */}
        {showNews &&
          countryGroups.map((group) => {
            const isSelected = group.country === selectedCountry;
            const color = FRAME_COLORS[group.dominantFrame];
            const r = markerRadius(group.articleCount);
            const env = isSelected
              ? getEnvironmentalContext(group.lat, group.lng)
              : null;

            return (
              <CircleMarker
                key={`news-${group.country}-${group.lat}-${group.lng}`}
                center={[group.lat, group.lng]}
                radius={r}
                pathOptions={{
                  color: isSelected ? (isDark ? "#f8fafc" : "#0f172a") : color,
                  weight: isSelected ? 3 : 1.5,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.7 : 0.45,
                }}
                eventHandlers={{
                  click: () => {
                    onSelectCountry(group.country);
                    setPopupTab("headlines");
                  },
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  opacity={1}
                  className={isDark ? "osint-tooltip-dark" : "osint-tooltip-light"}
                >
                  <div className="text-xs">
                    <div className="font-semibold">{group.country}</div>
                    <div className="opacity-70">
                      {group.articleCount} article{group.articleCount > 1 ? "s" : ""} ·{" "}
                      {FRAME_LABELS[group.dominantFrame].split(" / ")[0]}
                    </div>
                  </div>
                </Tooltip>

                {isSelected && (
                  <Popup className="osint-popup" maxWidth={340}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-[#334155] pb-1.5">
                        <span className="text-sm font-bold text-[#f8fafc]">
                          {group.country}
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: `${color}30`, color }}
                        >
                          {group.articleCount} articles
                        </span>
                      </div>

                      {/* Tab switcher */}
                      <div className="flex gap-1 border-b border-[#334155] pb-1.5">
                        <button
                          onClick={() => setPopupTab("headlines")}
                          className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                            popupTab === "headlines"
                              ? "bg-[#334155] text-[#f8fafc]"
                              : "text-[#64748b] hover:text-[#cbd5e1]"
                          }`}
                        >
                          Headlines
                        </button>
                        <button
                          onClick={() => setPopupTab("environment")}
                          className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                            popupTab === "environment"
                              ? "bg-[#334155] text-[#f8fafc]"
                              : "text-[#64748b] hover:text-[#cbd5e1]"
                          }`}
                        >
                          <CloudRain size={9} />
                          Env Context
                        </button>
                      </div>

                      {popupTab === "headlines" && (
                        <div className="max-h-[200px] space-y-1.5 overflow-y-auto pr-1">
                          {group.articles.slice(0, 8).map((a, i) => (
                            <a
                              key={i}
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded px-1.5 py-1 text-xs text-[#cbd5e1] transition-colors hover:bg-[#334155]"
                            >
                              <div className="font-medium leading-snug">{a.title}</div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#64748b]">
                                <span>{a.domain}</span>
                                <span>·</span>
                                <span
                                  className="font-medium"
                                  style={{ color: FRAME_COLORS[a.frame] }}
                                >
                                  {FRAME_LABELS[a.frame].split(" / ")[0]}
                                </span>
                              </div>
                            </a>
                          ))}
                          {group.articles.length > 8 && (
                            <div className="pt-1 text-center text-[10px] text-[#475569]">
                              +{group.articles.length - 8} more
                            </div>
                          )}
                        </div>
                      )}

                      {popupTab === "environment" && env && (
                        <EnvContextSection env={env} />
                      )}
                    </div>
                  </Popup>
                )}
              </CircleMarker>
            );
          })}

        {/* Choke points */}
        {showChokePoints &&
          chokePoints.map((cp) => (
            <CircleMarker
              key={`choke-${cp.id}`}
              center={[cp.lat, cp.lng]}
              radius={8}
              pathOptions={{
                color: CHOKE_COLORS[cp.trafficVolume],
                weight: 2,
                fillColor: CHOKE_COLORS[cp.trafficVolume],
                fillOpacity: 0.3,
                dashArray: "3 4",
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                opacity={1}
                className={isDark ? "osint-tooltip-dark" : "osint-tooltip-light"}
              >
                <div className="text-xs">
                  <div className="font-semibold">{cp.name}</div>
                  <div className="opacity-70 capitalize">
                    {cp.type} · {cp.trafficVolume} traffic
                  </div>
                </div>
              </Tooltip>
              <Popup className="osint-popup" maxWidth={280}>
                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-[#f8fafc]">{cp.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#f59e0b]">
                    {cp.type === "shipping" ? "Shipping Hotspot" : "Aviation Corridor"} · {cp.trafficVolume} volume
                  </div>
                  <p className="text-xs text-[#cbd5e1]">{cp.description}</p>
                  <EnvContextSection env={getEnvironmentalContext(cp.lat, cp.lng)} />
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Geopolitical events */}
        {showEvents &&
          events.map((evt) => {
            const color = EVENT_TYPE_COLORS[evt.eventType];
            return (
              <CircleMarker
                key={`evt-${evt.id}`}
                center={[evt.lat, evt.lng]}
                radius={evt.severity === "high" ? 10 : evt.severity === "medium" ? 7 : 5}
                pathOptions={{
                  color: color,
                  weight: evt.severity === "high" ? 2.5 : 1.5,
                  fillColor: color,
                  fillOpacity: 0.5,
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  opacity={1}
                  className={isDark ? "osint-tooltip-dark" : "osint-tooltip-light"}
                >
                  <div className="text-xs">
                    <div className="font-semibold">{evt.title}</div>
                    <div className="opacity-70">
                      {EVENT_TYPE_LABELS[evt.eventType]} · {evt.severity}
                    </div>
                  </div>
                </Tooltip>
                <Popup className="osint-popup" maxWidth={280}>
                  <div className="space-y-1.5">
                    <div className="text-sm font-bold text-[#f8fafc]">{evt.title}</div>
                    <div
                      className="text-[10px] uppercase tracking-wider font-semibold"
                      style={{ color }}
                    >
                      {EVENT_TYPE_LABELS[evt.eventType]} · {evt.severity} severity
                    </div>
                    <p className="text-xs text-[#cbd5e1]">{evt.description}</p>
                    <div className="text-[10px] text-[#64748b]">
                      Source: {evt.source} ·{" "}
                      {new Date(evt.timestamp).toLocaleString()}
                    </div>
                    <EnvContextSection env={getEnvironmentalContext(evt.lat, evt.lng)} />
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>

      {/* Map Navigation Controls (top-left) */}
      <div
        className="absolute left-3 top-3 z-[1000] flex flex-col gap-1.5"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            const map = (window as unknown as Record<string, unknown>).__leafletMap as L.Map | undefined;
            map?.zoomIn(undefined, { animate: true });
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors shadow-lg ${
            isDark
              ? "border-[#334155] bg-[#1e293b]/90 text-[#cbd5e1] hover:border-[#f59e0b] hover:text-[#f59e0b]"
              : "border-[#cbd5e1] bg-white/90 text-[#475569] hover:border-[#f59e0b] hover:text-[#f59e0b]"
          }`}
          title="Zoom In"
        >
          <span className="text-lg font-light">+</span>
        </button>
        <button
          onClick={() => {
            const map = (window as unknown as Record<string, unknown>).__leafletMap as L.Map | undefined;
            map?.zoomOut(undefined, { animate: true });
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors shadow-lg ${
            isDark
              ? "border-[#334155] bg-[#1e293b]/90 text-[#cbd5e1] hover:border-[#f59e0b] hover:text-[#f59e0b]"
              : "border-[#cbd5e1] bg-white/90 text-[#475569] hover:border-[#f59e0b] hover:text-[#f59e0b]"
          }`}
          title="Zoom Out"
        >
          <span className="text-lg font-light">-</span>
        </button>
        <button
          onClick={() => {
            const fn = (window as unknown as Record<string, unknown>).__resetView as (() => void) | undefined;
            fn?.();
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors shadow-lg ${
            isDark
              ? "border-[#334155] bg-[#1e293b]/90 text-[#cbd5e1] hover:border-[#f59e0b] hover:text-[#f59e0b]"
              : "border-[#cbd5e1] bg-white/90 text-[#475569] hover:border-[#f59e0b] hover:text-[#f59e0b]"
          }`}
          title="Reset World View"
        >
          <span className="text-xs font-bold">G</span>
        </button>
        <button
          onClick={() => {
            const fn = (window as unknown as Record<string, unknown>).__centerTaiwan as (() => void) | undefined;
            fn?.();
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border backdrop-blur-sm transition-colors shadow-lg ${
            isDark
              ? "border-[#334155] bg-[#1e293b]/90 text-[#cbd5e1] hover:border-[#ef4444] hover:text-[#ef4444]"
              : "border-[#cbd5e1] bg-white/90 text-[#475569] hover:border-[#ef4444] hover:text-[#ef4444]"
          }`}
          title="Center on Taiwan"
        >
          <span className="text-xs font-bold">T</span>
        </button>
      </div>

      {/* Basemap Theme Switcher (top area, below nav controls) */}
      <div
        className={`absolute left-3 top-[176px] z-[1000] flex items-center rounded-lg border backdrop-blur-sm shadow-lg ${
          isDark ? "border-[#334155] bg-[#1e293b]/90" : "border-[#cbd5e1] bg-white/90"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onBasemapChange("dark")}
          className={`flex items-center gap-1 rounded-l-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
            basemapTheme === "dark"
              ? "bg-[#f59e0b]/20 text-[#f59e0b]"
              : isDark
                ? "text-[#64748b] hover:text-[#cbd5e1]"
                : "text-[#94a3b8] hover:text-[#475569]"
          }`}
        >
          <span>Dark</span>
        </button>
        <div className={`h-4 w-px ${isDark ? "bg-[#334155]" : "bg-[#cbd5e1]"}`} />
        <button
          onClick={() => onBasemapChange("light")}
          className={`flex items-center gap-1 rounded-r-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
            basemapTheme === "light"
              ? "bg-[#f59e0b]/20 text-[#f59e0b]"
              : isDark
                ? "text-[#64748b] hover:text-[#cbd5e1]"
                : "text-[#94a3b8] hover:text-[#475569]"
          }`}
        >
          <span>Light</span>
        </button>
      </div>

      {/* Layer toggle panel (bottom-left) */}
      <div
        className={`absolute bottom-4 left-4 z-[1000] rounded-lg border backdrop-blur-sm px-3 py-2.5 ${
          isDark
            ? "border-[#334155] bg-[#1e293b]/90"
            : "border-[#cbd5e1] bg-white/90"
        }`}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className={`mb-2 text-[10px] font-semibold uppercase tracking-wider ${
          isDark ? "text-[#64748b]" : "text-[#94a3b8]"
        }`}>
          Intelligence Layers
        </div>
        <div className="space-y-1.5">
          {(
            [
              { key: "news" as MapLayerKey, label: "News Coverage", color: "#3b82f6" },
              { key: "worldMonitor" as MapLayerKey, label: "Geopolitical Events", color: "#ef4444" },
              { key: "chokePoints" as MapLayerKey, label: "Shipping Choke Points", color: "#f59e0b" },
              { key: "weather" as MapLayerKey, label: "WeatherNext 3 Overlay", color: "#22c55e" },
            ]
          ).map((layer) => (
            <button
              key={layer.key}
              onClick={() => onToggleLayer(layer.key)}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <span
                className="h-2.5 w-2.5 rounded-full transition-opacity"
                style={{
                  backgroundColor: layer.color,
                  opacity: activeLayers.has(layer.key) ? 1 : 0.3,
                  boxShadow: activeLayers.has(layer.key) ? `0 0 6px ${layer.color}80` : "none",
                }}
              />
              <span
                className={`text-[11px] transition-colors ${
                  activeLayers.has(layer.key)
                    ? isDark ? "text-[#cbd5e1]" : "text-[#334155]"
                    : isDark ? "text-[#475569]" : "text-[#94a3b8]"
                }`}
              >
                {layer.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Weather widget (bottom area) */}
      {showWeather && weatherConditions && (
        <div
          className="absolute bottom-4 right-16 z-[1000] w-[280px]"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <WeatherWidget conditions={weatherConditions} />
        </div>
      )}
    </div>
  );
}
