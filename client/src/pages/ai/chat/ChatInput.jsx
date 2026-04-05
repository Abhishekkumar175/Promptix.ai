import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic } from "lucide-react";

export default function ChatInput({ onSend, isTyping }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!text.trim() || isTyping) return;
    onSend({ role: "user", content: text });
    setText("");
    
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

      <div className="relative bg-[#0F1523] border border-white/10 rounded-2xl flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 focus-within:border-violet-500/50">
        
        {/* Main Input Area */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Promptix anything..."
          className="w-full bg-transparent border-none outline-none text-white placeholder:text-gray-500 px-4 py-4 min-h-[56px] max-h-48 resize-none scrollbar-hide text-[15px] leading-relaxed"
          rows={1}
        />

        {/* Bottom Action Bar inside input */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          {/* Left Actions (Stub) */}
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors" title="Attach file">
              <Paperclip size={18} />
            </button>
            <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors" title="Voice input">
              <Mic size={18} />
            </button>
          </div>

          {/* Right Action (Send) */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || isTyping}
            className={`p-2 rounded-xl flex items-center justify-center transition-all duration-300
              ${
                !text.trim() || isTyping
                  ? "bg-white/5 text-gray-600 cursor-not-allowed"
                  : "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:scale-105"
              }
            `}
          >
            <Send size={16} className={`${text.trim() && !isTyping ? "translate-x-0.5 -translate-y-0.5" : ""} transition-transform duration-300`} />
          </button>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="text-center mt-3 text-[10px] text-gray-600 font-medium">
        Promptix AI can make mistakes. Consider verifying important information.
      </div>
    </div>
  );
}
