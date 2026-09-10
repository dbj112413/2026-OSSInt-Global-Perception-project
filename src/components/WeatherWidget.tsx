import { Wind, Waves, Cloud, Eye, Thermometer, Gauge } from "lucide-react";
import type { StraitWeatherConditions } from "@/types";

interface WeatherWidgetProps {
  conditions: StraitWeatherConditions | null;
}

export default function WeatherWidget({ conditions }: WeatherWidgetProps) {
  if (!conditions) return null;

  const cloudPct = conditions.cloudCover;

  return (
    <div className="rounded-lg border border-[#334155] bg-[#1e293b]/90 px-3 py-2.5 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
          Taiwan Strait Marine Conditions
        </span>
        <span className="text-[9px] text-[#475569]">
          {new Date(conditions.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <Wind size={11} className="text-[#3b82f6]" />
          <span className="text-[10px] text-[#64748b]">Wind</span>
          <span className="ml-auto text-[11px] font-medium tabular-nums text-[#f8fafc]">
            {conditions.windSpeed} kt {conditions.windDirection}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Waves size={11} className="text-[#06b6d4]" />
          <span className="text-[10px] text-[#64748b]">Waves</span>
          <span className="ml-auto text-[11px] font-medium tabular-nums text-[#f8fafc]">
            {conditions.waveHeight} m
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cloud size={11} className="text-[#94a3b8]" />
          <span className="text-[10px] text-[#64748b]">Cloud</span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1 w-10 overflow-hidden rounded-full bg-[#0f172a]">
              <div
                className="h-full rounded-full bg-[#94a3b8]"
                style={{ width: `${cloudPct}%` }}
              />
            </div>
            <span className="text-[11px] font-medium tabular-nums text-[#f8fafc]">
              {cloudPct}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye size={11} className="text-[#22c55e]" />
          <span className="text-[10px] text-[#64748b]">Visibility</span>
          <span className="ml-auto text-[11px] font-medium tabular-nums text-[#f8fafc]">
            {conditions.visibility} km
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Thermometer size={11} className="text-[#f59e0b]" />
          <span className="text-[10px] text-[#64748b]">Temp</span>
          <span className="ml-auto text-[11px] font-medium tabular-nums text-[#f8fafc]">
            {conditions.temperature}°C
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gauge size={11} className="text-[#a855f7]" />
          <span className="text-[10px] text-[#64748b]">Pressure</span>
          <span className="ml-auto text-[11px] font-medium tabular-nums text-[#f8fafc]">
            {conditions.pressure} hPa
          </span>
        </div>
      </div>
      <div className="mt-2 border-t border-[#334155] pt-1.5 text-[10px] text-[#64748b]">
        Condition: <span className="text-[#cbd5e1]">{conditions.condition}</span>
      </div>
    </div>
  );
}
