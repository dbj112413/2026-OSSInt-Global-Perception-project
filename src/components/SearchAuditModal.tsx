import { X, CheckCircle2, AlertCircle, Database, Clock, Search } from "lucide-react";
import { useEffect } from "react";
import type { SearchAuditEntry } from "@/types";

interface SearchAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: SearchAuditEntry[];
  totalArticles: number;
}

export default function SearchAuditModal({
  isOpen,
  onClose,
  audit,
  totalArticles,
}: SearchAuditModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[520px] max-h-[80vh] overflow-hidden rounded-xl border border-[#334155] bg-[#1e293b] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#334155] px-4 py-3">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[#f59e0b]" />
            <span className="text-sm font-bold text-[#f8fafc]">
              Search Audit Log
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748b] transition-colors hover:bg-[#334155] hover:text-[#f8fafc]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary */}
        <div className="border-b border-[#334155] px-4 py-2.5">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Search size={12} className="text-[#64748b]" />
              <span className="text-[#64748b]">Total Records:</span>
              <span className="font-semibold tabular-nums text-[#f8fafc]">
                {totalArticles}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database size={12} className="text-[#64748b]" />
              <span className="text-[#64748b]">Sources Queried:</span>
              <span className="font-semibold tabular-nums text-[#f8fafc]">
                {audit.length}
              </span>
            </div>
          </div>
        </div>

        {/* Audit entries */}
        <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
          {audit.map((entry, i) => (
            <div
              key={i}
              className="rounded-lg border border-[#334155] bg-[#0f172a] p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {entry.status === "success" ? (
                    <CheckCircle2 size={14} className="text-[#22c55e]" />
                  ) : entry.status === "fallback" ? (
                    <AlertCircle size={14} className="text-[#f59e0b]" />
                  ) : (
                    <AlertCircle size={14} className="text-[#ef4444]" />
                  )}
                  <span className="text-xs font-semibold text-[#f8fafc]">
                    {entry.source}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                      entry.status === "success"
                        ? "bg-[#22c55e]/15 text-[#22c55e]"
                        : entry.status === "fallback"
                          ? "bg-[#f59e0b]/15 text-[#f59e0b]"
                          : "bg-[#ef4444]/15 text-[#ef4444]"
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
                  <Clock size={10} />
                  <span className="tabular-nums">{entry.latencyMs}ms</span>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-[10px] text-[#64748b]">Query String:</div>
                <code className="block rounded bg-[#1e293b] px-2 py-1 text-[10px] text-[#94a3b8]">
                  {entry.query}
                </code>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#64748b]">
                <span>
                  Records: <span className="tabular-nums text-[#cbd5e1]">{entry.recordCount}</span>
                </span>
                <span>
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
