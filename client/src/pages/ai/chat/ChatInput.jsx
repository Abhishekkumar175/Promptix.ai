import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";

export default function ChatInput({ onSend, isTyping, onStop }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || isTyping) return;
    onSend({ role: "user", content: text });
    setText("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    
    // Auto focus back on input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative group w-full">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-violet-600/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative bg-[#0F1523] border border-white/10 rounded-2xl flex items-end p-1.5 sm:p-2 shadow-[0_10px_35px_rgba(0,0,0,0.45)] transition-all duration-300 focus-within:border-violet-500/50 focus-within:shadow-[0_0_20px_rgba(139,92,246,0.15)]">
        
        {/* Main Input Area */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Promptix anything..."
          className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 px-3.5 py-2.5 min-h-[44px] max-h-44 resize-none scrollbar-hide text-[14.5px] leading-relaxed"
          rows={1}
        />

        {/* Send / Stop Action Button */}
        <div className="shrink-0 pb-0.5 pr-0.5">
          {isTyping ? (
            <button
              onClick={onStop}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 transition-all duration-200 hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.25)]"
              title="Stop generating"
            >
              <Square size={13} className="fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                ${
                  !text.trim()
                    ? "bg-white/5 text-gray-600 cursor-not-allowed"
                    : "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:scale-105 cursor-pointer"
                }
              `}
              title="Send message"
            >
              <Send size={15} className={`${text.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} transition-transform duration-300`} />
            </button>
          )}
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="text-center mt-2.5 text-[10px] text-gray-600 font-medium">
        Promptix AI can make mistakes. Consider verifying important information.
      </div>
    </div>
  );
}
