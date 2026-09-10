import { Search, Globe2, Loader2, RefreshCw, BadgeCheck } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isMonitoring: boolean;
  articleCount: number;
  countryCount: number;
  searchVerified: boolean;
  onAuditClick: () => void;
}

export default function Header({
  query,
  onQueryChange,
  onSearch,
  onRefresh,
  isLoading,
  isMonitoring,
  articleCount,
  countryCount,
  searchVerified,
  onAuditClick,
}: HeaderProps) {
  const [focused, setFocused] = useState(false);

  return (
    <header className="flex items-center gap-4 border-b border-[#334155] bg-[#1e293b] px-4 py-2.5">
      {/* Logo / Title */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ef4444]">
          <Globe2 size={16} className="text-white" />
        </div>
        <div className="hidden flex-col leading-tight md:flex">
          <span className="text-sm font-bold text-[#f8fafc]">TRACE</span>
          <span className="text-[10px] text-[#64748b]">
            Global Intelligence Dashboard
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div
        className={`flex flex-1 items-center gap-2 rounded-lg border bg-[#0f172a] px-3 py-1.5 transition-colors ${
          focused ? "border-[#f59e0b]" : "border-[#334155]"
        }`}
      >
        <Search size={15} className="text-[#64748b]" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder="Search GDELT world news (e.g. Taiwan, TSMC, Strait tensions)..."
          className="flex-1 bg-transparent text-sm text-[#f8fafc] placeholder-[#64748b] outline-none"
        />
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="rounded-md bg-[#ef4444] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#dc2626] disabled:opacity-50"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Search Status Badge */}
      {searchVerified && (
        <button
          onClick={onAuditClick}
          className="flex items-center gap-1.5 rounded-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-2.5 py-1 transition-colors hover:border-[#22c55e]/60 hover:bg-[#22c55e]/15"
          title="View Search Audit Log"
        >
          <BadgeCheck size={13} className="text-[#22c55e]" />
          <span className="text-[11px] font-medium text-[#22c55e]">
            Search Status: Verified
          </span>
        </button>
      )}

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#334155] bg-[#0f172a] text-[#64748b] transition-colors hover:text-[#f8fafc] disabled:opacity-50"
        title="Refresh data"
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <RefreshCw size={15} />
        )}
      </button>

      {/* Stats display */}
      {isMonitoring && (
        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-bold tabular-nums text-[#f8fafc]">
              {articleCount}
            </span>
            <span className="text-[10px] text-[#64748b]">articles</span>
          </div>
          <div className="h-6 w-px bg-[#334155]" />
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-bold tabular-nums text-[#f8fafc]">
              {countryCount}
            </span>
            <span className="text-[10px] text-[#64748b]">countries</span>
          </div>
        </div>
      )}

      {/* Live Status Badge */}
      <div className="flex items-center gap-2 rounded-md border border-[#334155] bg-[#0f172a] px-2.5 py-1">
        <span
          className={`relative flex h-2 w-2 ${
            isMonitoring ? "" : "opacity-40"
          }`}
        >
          {isMonitoring && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef4444] opacity-75" />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              isMonitoring ? "bg-[#ef4444]" : "bg-[#475569]"
            }`}
          />
        </span>
        <span className="text-[11px] font-medium text-[#cbd5e1]">
          {isLoading ? "Querying..." : isMonitoring ? "Monitoring Active" : "Standby"}
        </span>
      </div>
    </header>
  );
}
