import { useState, useEffect } from "react";
import { useChat } from "../../../context/ChatContext";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import {
  History,
  Plus,
  X,
  MessageSquare,
  Trash2,
  Sparkles,
  MessagesSquare,
  Clock
} from "lucide-react";

export default function ChatPage() {
  const {
    threads,
    activeThreadId,
    messages,
    isStreaming,
    isLoadingMessages,
    isLoadingThreads,
    sendMessage,
    selectThread,
    createNewChat,
    deleteThread,
    stopGeneration,
    regenerateLastResponse,
  } = useChat();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const activeThread = threads.find((t) => t.id === activeThreadId);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectThread = (threadId) => {
    selectThread(threadId);
    setIsDrawerOpen(false);
  };

  const handleCreateNewChat = () => {
    createNewChat();
    setIsDrawerOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#030712] overflow-hidden text-white relative">
      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* TOP HEADER BAR */}
      <header className="h-14 px-4 sm:px-6 border-b border-white/5 bg-[#050812]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* History Drawer Trigger Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 text-gray-300 hover:text-white text-xs font-medium transition-all shadow-xs cursor-pointer group"
            title="Open Chat History"
          >
            <History size={14} className="text-violet-400 group-hover:rotate-[-25deg] transition-transform duration-300" />
            <span className="font-semibold">History</span>
            {threads.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-violet-600/25 border border-violet-500/30 text-[10px] font-mono text-violet-300">
                {threads.length}
              </span>
            )}
          </button>

          <div className="w-[1px] h-4 bg-white/10 shrink-0" />

          {/* Active Conversation Title */}
          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-xs md:max-w-md">
              {activeThread?.title || "New Chat"}
            </h1>
          </div>
        </div>

        {/* Right Action: New Chat */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-200 hover:text-white bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/30 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Start a new chat"
          >
            <Plus size={14} className="text-violet-400" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* MAIN CHAT CANVAS */}
      <div className="flex-1 min-h-0 flex flex-col relative z-10 overflow-hidden">
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          isLoadingMessages={isLoadingMessages}
          onSendPrompt={sendMessage}
          onRegenerate={regenerateLastResponse}
        />
        <div className="p-3 sm:p-4 md:p-5 w-full max-w-2xl mx-auto shrink-0">
          <ChatInput
            onSend={sendMessage}
            isTyping={isStreaming}
            onStop={stopGeneration}
          />
        </div>
      </div>

      {/* ─── SLIDE-OVER HISTORY DRAWER ─── */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-[320px] max-w-[85vw] bg-[#070b16] border-r border-[#1e2434] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#050812]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <MessagesSquare size={14} className="text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Chat History</h2>
            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
              {threads.length}
            </span>
          </div>

          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* New Chat Action */}
        <div className="p-4 pb-2 shrink-0">
          <button
            onClick={handleCreateNewChat}
            className="w-full relative group overflow-hidden rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 p-[1px] shadow-lg shadow-violet-600/20 cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2 bg-[#0B101A] group-hover:bg-transparent py-2.5 px-3 rounded-[11px] text-xs font-semibold text-white transition-colors duration-200">
              <Plus size={14} className="text-violet-400 group-hover:text-white transition-colors" />
              <span>Start New Chat</span>
            </div>
          </button>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            Recent Conversations
          </span>
        </div>

        {/* Scrollable Threads List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
          {isLoadingThreads ? (
            <div className="space-y-2 p-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare size={28} className="mx-auto text-gray-600 mb-2 opacity-50" />
              <p className="text-xs text-gray-400 font-medium">No previous chats</p>
              <p className="text-[11px] text-gray-600 mt-1">Start a new conversation anytime.</p>
            </div>
          ) : (
            threads.map((chat) => {
              const isActive = activeThreadId === chat.id;
              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectThread(chat.id)}
                  className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-violet-600/20 text-white font-medium border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                      : "text-gray-300 hover:text-white hover:bg-white/[0.05] border border-transparent"
                  }`}
                >
                  <MessageSquare
                    size={15}
                    className={`shrink-0 transition-colors ${
                      isActive ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"
                    }`}
                  />
                  <span className="truncate flex-1 text-xs tracking-wide">{chat.title}</span>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteThread(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                    title="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Tip */}
        <div className="p-3 border-t border-white/5 text-center text-[10px] text-gray-500 bg-[#050812]/50 shrink-0">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400 font-mono">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
