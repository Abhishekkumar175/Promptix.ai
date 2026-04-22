import { useState, useEffect, useCallback } from "react";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import ChatHistory from "./ChatHistory";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
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

  // ── Load thread list on mount ──
  useEffect(() => {
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

  return (
    <div className="flex flex-1 w-full bg-[#030712] overflow-hidden text-white relative">

      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* LEFT SIDEBAR: Chat History */}
      <div className={`${isSidebarOpen ? "w-[260px]" : "w-0"} transition-all duration-300 border-r border-[#1e2434] bg-[#050812] shrink-0 z-20 flex flex-col relative shadow-xl overflow-hidden`}>
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
      <div className="flex flex-col flex-1 relative z-10 transition-all duration-300">

        {/* Floating Sidebar Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white bg-[#0B101A] hover:bg-white/5 border border-white/10 rounded-lg transition-all z-30 shadow-md"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          isLoadingMessages={isLoadingMessages}
          onSendPrompt={sendMessage}
        />
        <div className="p-4 md:p-6 w-full max-w-4xl mx-auto">
          <ChatInput onSend={sendMessage} isTyping={isStreaming} />
        </div>
      </div>
    </div>
  );
}
