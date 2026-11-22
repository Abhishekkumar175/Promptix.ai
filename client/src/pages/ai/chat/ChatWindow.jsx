import { useEffect, useRef } from "react";
import { Sparkles, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto w-full no-scrollbar px-4 md:px-6">

      {messages.length === 0 ? (
        // ── EMPTY STATE ──
        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
            <Bot size={32} className="text-violet-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
            How can I help you today?
          </h2>
          <p className="text-gray-400 max-w-md mb-8">
            I am Promptix AI — Ask me to write code, compose text, debug, brainstorm, or anything else.
          </p>
          {/* Quick suggestion chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Explain React hooks",
              "Write a cold email",
              "Debug my Python code",
              "Summarize a topic",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSendPrompt({ content: suggestion })}
                className="px-4 py-2 text-sm rounded-xl border border-white/[0.08] text-gray-400 hover:text-white hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // ── MESSAGE LIST ──
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" ? (
                <div className="flex gap-3 sm:gap-4 max-w-[92%] sm:max-w-[85%]">
                  <div className="w-8 h-8 shrink-0 rounded-[8px] bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="pt-1 min-w-0 flex-1">
                    <h5 className="text-[12px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Promptix AI</h5>
                    {/* Markdown renderer */}
                    <div className="text-gray-200 leading-relaxed text-[14px] sm:text-[15px] prose prose-invert prose-sm max-w-none break-words
                      prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-violet-300
                      prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-white/[0.06] prose-pre:rounded-xl prose-pre:overflow-x-auto
                      prose-headings:text-white prose-strong:text-white prose-a:text-violet-400">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      {/* Streaming cursor */}
                      {msg.streaming && (
                        <span className="inline-block w-2 h-4 bg-violet-400 rounded-sm ml-0.5 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // USER MESSAGE
                <div className="bg-[#1e2434] border border-white/5 text-gray-100 rounded-2xl rounded-tr-sm px-4 sm:px-5 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[75%] shadow-md whitespace-pre-wrap leading-relaxed text-[14px] sm:text-[15px] break-words">
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {/* Streaming dots (before first token arrives) */}
          {isStreaming && messages.at(-1)?.role !== "assistant" && (
            <div className="flex gap-4 max-w-[85%] justify-start">
              <div className="w-8 h-8 shrink-0 rounded-[8px] bg-gradient-to-br from-violet-600/50 to-indigo-600/50 flex items-center justify-center">
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
