import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  PanelRightClose,
  PanelRightOpen,
  TrendingUp,
  Newspaper,
  Globe2,
} from "lucide-react";
import type { ChatMessage, GdeltArticle, NarrativeBriefing } from "@/types";
import { generateBriefing, generateChatResponse } from "@/services/llmService";

interface AIPanelProps {
  articles: GdeltArticle[];
  isOpen: boolean;
  onToggle: () => void;
}

export default function AIPanel({ articles, isOpen, onToggle }: AIPanelProps) {
  const [briefing, setBriefing] = useState<NarrativeBriefing | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, briefing]);

  // Reset when articles change
  useEffect(() => {
    setBriefing(null);
    setMessages([]);
  }, [articles]);

  const handleSummarize = () => {
    if (articles.length === 0) return;
    setIsGenerating(true);
    // Simulate LLM processing delay
    setTimeout(() => {
      const top15 = articles.slice(0, 15);
      const result = generateBriefing(top15);
      setBriefing(result);
      setIsGenerating(false);
    }, 800);
  };

  const handleSendQuestion = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Generate response after a brief delay to simulate processing
    setTimeout(() => {
      const response = generateChatResponse(input, articles, briefing);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          timestamp: Date.now(),
        },
      ]);
    }, 500);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="flex h-full w-10 items-center justify-center border-l border-[#334155] bg-[#1e293b] text-[#64748b] transition-colors hover:text-[#f8fafc]"
        title="Open AI Narrative Briefing"
      >
        <PanelRightOpen size={18} />
      </button>
    );
  }

  return (
    <aside className="flex w-[350px] shrink-0 flex-col border-l border-[#334155] bg-[#1e293b]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#334155] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f59e0b]/20">
            <Sparkles size={14} className="text-[#f59e0b]" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-[#f8fafc]">
              AI Narrative Briefing
            </span>
            <span className="text-[10px] text-[#64748b]">
              Today's Global Attention to Taiwan
            </span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748b] transition-colors hover:bg-[#334155] hover:text-[#f8fafc]"
          title="Collapse panel"
        >
          <PanelRightClose size={16} />
        </button>
      </div>

      {/* Content area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-3"
      >
        {/* Summarize button */}
        <button
          onClick={handleSummarize}
          disabled={articles.length === 0 || isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-3 py-2 text-xs font-semibold text-[#f59e0b] transition-all hover:bg-[#f59e0b]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isGenerating ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#f59e0b] border-t-transparent" />
              Analyzing coverage...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              {briefing ? "Regenerate Summary" : "Summarize Today's Coverage"}
            </>
          )}
        </button>

        {/* Briefing output */}
        {briefing && (
          <div className="space-y-3">
            {/* Core themes */}
            <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#f59e0b]">
                <TrendingUp size={12} />
                Top 3 Core Narrative Themes
              </div>
              <div className="space-y-1.5">
                {briefing.themes.map((theme, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#cbd5e1]"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f59e0b]" />
                    <span className="leading-relaxed">{theme}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment divergence */}
            <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#3b82f6]">
                <Globe2 size={12} />
                Regional Sentiment Divergence
              </div>
              <p className="text-xs leading-relaxed text-[#cbd5e1]">
                {briefing.sentimentDivergence}
              </p>
            </div>

            {/* Emerging headlines */}
            <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#22c55e]">
                <Newspaper size={12} />
                Key Emerging Headlines
              </div>
              <div className="space-y-1.5">
                {briefing.emergingHeadlines.map((headline, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#94a3b8]"
                  >
                    <span className="mt-0.5 text-[10px] text-[#475569]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-relaxed">{headline}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.length > 0 && (
          <div className="space-y-2 border-t border-[#334155] pt-3">
            <div className="text-[10px] uppercase tracking-wider text-[#64748b]">
              Follow-up Q&A
            </div>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#f59e0b]/15 text-[#f8fafc]"
                      : "bg-[#0f172a] text-[#cbd5e1] border border-[#334155]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested questions when no messages yet */}
        {messages.length === 0 && briefing && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-[#64748b]">
              Try asking
            </div>
            {[
              "Why is there a spike in news from Japan?",
              "How does Western vs Asian coverage differ?",
              "What are the military narratives?",
              "Which countries are reporting most?",
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(q);
                  setTimeout(() => {
                    const userMsg: ChatMessage = {
                      role: "user",
                      content: q,
                      timestamp: Date.now(),
                    };
                    setMessages((prev) => [...prev, userMsg]);
                    setInput("");
                    setTimeout(() => {
                      const response = generateChatResponse(q, articles, briefing);
                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content: response,
                          timestamp: Date.now(),
                        },
                      ]);
                    }, 500);
                  }, 0);
                }}
                className="block w-full rounded-md border border-[#334155] bg-[#0f172a] px-2.5 py-1.5 text-left text-[11px] text-[#94a3b8] transition-colors hover:border-[#f59e0b]/40 hover:text-[#cbd5e1]"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="border-t border-[#334155] p-3">
        <div className="flex items-center gap-2 rounded-lg border border-[#334155] bg-[#0f172a] px-2.5 py-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendQuestion();
            }}
            placeholder="Ask about the coverage..."
            className="flex-1 bg-transparent text-xs text-[#f8fafc] placeholder-[#475569] outline-none"
          />
          <button
            onClick={handleSendQuestion}
            disabled={!input.trim()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[#64748b] transition-colors hover:bg-[#334155] hover:text-[#f59e0b] disabled:opacity-30"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
