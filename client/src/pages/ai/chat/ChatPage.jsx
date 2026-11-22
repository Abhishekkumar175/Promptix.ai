import { useState, useEffect, useCallback } from "react";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import ChatHistory from "./ChatHistory";
import { PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import { useApi } from "../../../hooks/useApi";

export default function ChatPage() {
  const api = useApi();

  // ── State ──
  const [threads, setThreads] = useState([]);          // list of threads from DB
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);         // messages of active thread
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // ── Load thread list on mount & handle responsive initial state ──
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      setIsLoadingThreads(true);
      const { threads: data } = await api.get("/api/chat/threads");
      setThreads(data);
      // Auto-select first thread if any
      if (data.length > 0 && !activeThreadId) {
        selectThread(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  // ── Load messages when switching threads ──
  const selectThread = useCallback(async (threadId) => {
    if (threadId === activeThreadId) return;
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    setActiveThreadId(threadId);
    setMessages([]);
    try {
      setIsLoadingMessages(true);
      const { messages: data } = await api.get(`/api/chat/threads/${threadId}/messages`);
      // Normalize role: DB uses 'model', ChatWindow expects 'assistant'
      setMessages(data.map(m => ({ ...m, role: m.role === "model" ? "assistant" : m.role })));
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeThreadId]);

  // ── Create new thread ──
  const createNewChat = async () => {
    try {
      const { thread } = await api.post("/api/chat/threads", { title: "New Chat" });
      setThreads(prev => [thread, ...prev]);
      setActiveThreadId(thread.id);
      setMessages([]);
    } catch (err) {
      console.error("Failed to create thread:", err);
    }
  };

  // ── Delete thread ──
  const deleteThread = async (id) => {
    try {
      await api.del(`/api/chat/threads/${id}`);
      const remaining = threads.filter(t => t.id !== id);
      setThreads(remaining);
      if (activeThreadId === id) {
        if (remaining.length > 0) {
          selectThread(remaining[0].id);
        } else {
          setActiveThreadId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  };

  // ── Send message + stream response ──
  const sendMessage = async ({ content }) => {
    if (!content.trim() || isStreaming) return;

    // If no thread, create one first
    let threadId = activeThreadId;
    if (!threadId) {
      try {
        const { thread } = await api.post("/api/chat/threads", { title: content.slice(0, 60) });
        setThreads(prev => [thread, ...prev]);
        setActiveThreadId(thread.id);
        threadId = thread.id;
      } catch (err) {
        console.error("Failed to create thread:", err);
        return;
      }
    }

    // Optimistically show user message
    const userMsg = { role: "user", content, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

    // Placeholder for streaming assistant response
    const assistantMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { role: "assistant", content: "", id: assistantMsgId, streaming: true }]);

    try {
      const reader = await api.stream(`/api/chat/threads/${threadId}/stream`, { message: content });
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "token") {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + data.content }
                    : m
                )
              );
            } else if (data.type === "done") {
              // Mark as no longer streaming
              setMessages(prev =>
                prev.map(m => m.id === assistantMsgId ? { ...m, streaming: false } : m)
              );
              // Update thread title in sidebar (backend auto-titles on first msg)
              loadThreads();
            } else if (data.type === "error") {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: data.message || "⚠️ Sorry, something went wrong. Please try again.", streaming: false }
                    : m
                )
              );
            }
          } catch { /* skip malformed line */ }
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: "⚠️ Connection error. Please try again.", streaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="h-full w-full flex bg-[#030712] overflow-hidden text-white relative">

      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* LEFT SIDEBAR: Chat History */}
      <div className={`
        ${isSidebarOpen ? "w-[260px] translate-x-0" : "w-0 -translate-x-full md:translate-x-0"}
        fixed md:relative inset-y-0 left-0 z-40 md:z-20
        transition-all duration-300 ease-in-out
        border-r border-[#1e2434] bg-[#050812] shrink-0 flex flex-col shadow-2xl md:shadow-none overflow-hidden
      `}>
        <div className="w-[260px] h-full flex flex-col shrink-0">
          <ChatHistory
            chats={threads.map(t => ({ id: t.id, title: t.title }))}
            activeChatId={activeThreadId}
            onSelect={selectThread}
            onNewChat={createNewChat}
            onDelete={deleteThread}
            isLoading={isLoadingThreads}
          />
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex flex-col flex-1 h-full min-h-0 relative z-10 overflow-hidden">

        {/* Top Header Bar */}
        <header className="h-14 px-4 border-b border-white/5 bg-[#050812]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
              title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-md">
                {activeThread?.title || "New Chat"}
              </h2>
            </div>
          </div>

          <button
            onClick={createNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all shrink-0"
            title="Start a new chat"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </header>

        {/* Scrollable Conversation */}
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          isLoadingMessages={isLoadingMessages}
          onSendPrompt={sendMessage}
        />

        {/* Input Bar */}
        <div className="p-3 sm:p-4 md:p-5 w-full max-w-3xl mx-auto shrink-0">
          <ChatInput onSend={sendMessage} isTyping={isStreaming} />
        </div>
      </div>
    </div>
  );
}
