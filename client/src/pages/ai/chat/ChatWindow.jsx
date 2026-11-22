import { useEffect, useRef, useState } from "react";
import { Sparkles, Bot, Copy, Check } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

function AssistantMessage({ msg }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex gap-3 sm:gap-4 max-w-full w-full">
      <div className="w-8 h-8 shrink-0 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/10 mt-1">
        <Sparkles size={15} className="text-white" />
      </div>

      <div className="pt-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] font-semibold text-gray-300 uppercase tracking-wider">
            Promptix AI
          </span>
          {msg.streaming && (
            <span className="text-[10px] text-violet-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Generating...
            </span>
          )}
        </div>

        {/* Markdown Rendered Content */}
        <MarkdownRenderer content={msg.content} isStreaming={msg.streaming} />

        {/* Message Action Toolbar (shown when not streaming) */}
        {!msg.streaming && msg.content && (
          <div className="mt-3 flex items-center gap-2 pt-1 text-gray-500">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-white/5 hover:text-gray-300 text-xs transition-colors cursor-pointer"
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-400 text-[11px] font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, isStreaming, isLoadingMessages, onSendPrompt }) {
  const scrollContainerRef = useRef(null);

  // Auto-scroll inside ChatWindow container ONLY (never outer page)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: isStreaming ? "auto" : "smooth",
      });
    }
  }, [messages, isStreaming]);

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 min-h-0 overflow-y-auto w-full no-scrollbar px-4 sm:px-6"
    >
      {messages.length === 0 ? (
        // ── EMPTY STATE ──
        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4 py-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
            <Bot size={32} className="text-violet-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            How can I help you today?
          </h2>
          <p className="text-gray-400 max-w-md mb-8 text-sm leading-relaxed">
            I am Promptix AI — Ask me to write code, compose text, analyze problems, brainstorm ideas, or anything else.
          </p>
          {/* Quick suggestion chips */}
          <div className="flex flex-wrap gap-2.5 justify-center max-w-lg">
            {[
              "Explain React hooks with examples",
              "Write a Python web scraper",
              "Create a clean SQL schema",
              "Draft a professional cold email",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSendPrompt({ content: suggestion })}
                className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-white/[0.08] text-gray-300 hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all duration-200 cursor-pointer shadow-xs"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // ── MESSAGE LIST ──
        <div className="max-w-3xl mx-auto py-6 sm:py-8 space-y-6 sm:space-y-8">
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" ? (
                <AssistantMessage msg={msg} />
              ) : (
                // USER MESSAGE BUBBLE
                <div className="bg-[#1e2434] border border-white/10 text-gray-100 rounded-2xl rounded-tr-xs px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[75%] shadow-md whitespace-pre-wrap leading-relaxed text-[14.5px] break-words">
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {/* Streaming dots (before first token arrives) */}
          {isStreaming && messages.at(-1)?.role !== "assistant" && (
            <div className="flex gap-4 max-w-[85%] justify-start">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-violet-600/50 to-indigo-600/50 flex items-center justify-center">
                <Sparkles size={14} className="text-white/50 animate-pulse" />
              </div>
              <div className="pt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
