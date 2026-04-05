import { motion } from "framer-motion";
import { User, Sparkles, Bot, Feather, Code, Lightbulb } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export default function ChatWindow({ messages, isTyping, onSendPrompt }) {
  const { user } = useUser();

  return (
    <div className="flex-1 overflow-y-auto w-full no-scrollbar px-4 md:px-0">
      
      {messages.length === 0 ? (
        // 📭 EMPTY STATE
        <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
            <Bot size={32} className="text-violet-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
            How can I help you today?
          </h2>
          <p className="text-gray-400 max-w-md">
            I am your advanced AI assistant. You can ask me to write code, compose text, or brainstorm ideas.
          </p>
        </div>
      ) : (
        // 💬 MESSAGES LIST
        <div className="max-w-3xl mx-auto py-8 lg:py-12 space-y-8">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* ASSISTANT MESSAGE */}
              {msg.role === "assistant" ? (
                <div className="flex gap-4 max-w-[85%]">
                  <div className="w-8 h-8 shrink-0 rounded-[8px] bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="pt-1">
                    <h5 className="text-[13px] font-semibold text-gray-300 mb-1 uppercase tracking-wider">Promptix</h5>
                    <div className="text-gray-200 leading-relaxed tracking-wide text-[15px] prose prose-invert max-w-none">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ) : (
                // USER MESSAGE
                <div className="bg-[#1e2434] border border-white/5 text-gray-100 rounded-2xl rounded-tr-sm px-5 py-3 max-w-[75%] shadow-md whitespace-pre-wrap leading-relaxed text-[15px]">
                  {msg.content}
                </div>
              )}
            </motion.div>
          ))}

          {/* ⏳ TYPING INDICATOR */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-[85%] justify-start"
            >
              <div className="w-8 h-8 shrink-0 rounded-[8px] bg-linear-to-br from-violet-600/50 to-indigo-600/50 flex items-center justify-center">
                <Sparkles size={14} className="text-white/50 animate-pulse" />
              </div>
              <div className="pt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
