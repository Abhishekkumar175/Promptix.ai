import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useApi } from "../hooks/useApi";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const api = useApi();

  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // ── Load threads on mount ──
  const loadThreads = useCallback(async () => {
    try {
      setIsLoadingThreads(true);
      const { threads: data } = await api.get("/api/chat/threads");
      setThreads(data || []);
      // Auto-select first thread if none active
      if (data && data.length > 0 && !activeThreadId) {
        selectThread(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [api, activeThreadId]);

  useEffect(() => {
    loadThreads();
  }, []);

  // ── Select a thread and load its messages ──
  const selectThread = useCallback(async (threadId) => {
    if (threadId === activeThreadId) return;
    setActiveThreadId(threadId);
    setMessages([]);
    try {
      setIsLoadingMessages(true);
      const { messages: data } = await api.get(`/api/chat/threads/${threadId}/messages`);
      setMessages((data || []).map(m => ({
        ...m,
        role: m.role === "model" ? "assistant" : m.role,
      })));
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeThreadId, api]);

  // ── Create new chat ──
  const createNewChat = useCallback(async () => {
    try {
      const { thread } = await api.post("/api/chat/threads", { title: "New Chat" });
      setThreads(prev => [thread, ...prev]);
      setActiveThreadId(thread.id);
      setMessages([]);
      return thread;
    } catch (err) {
      console.error("Failed to create thread:", err);
    }
  }, [api]);

  // ── Delete a thread ──
  const deleteThread = useCallback(async (id) => {
    try {
      await api.del(`/api/chat/threads/${id}`);
      setThreads(prev => {
        const remaining = prev.filter(t => t.id !== id);
        if (activeThreadId === id) {
          if (remaining.length > 0) {
            selectThread(remaining[0].id);
          } else {
            setActiveThreadId(null);
            setMessages([]);
          }
        }
        return remaining;
      });
    } catch (err) {
      console.error("Failed to delete thread:", err);
    }
  }, [activeThreadId, api, selectThread]);

  // ── Send message and stream AI response ──
  const sendMessage = useCallback(async ({ content }) => {
    if (!content.trim() || isStreaming) return;

    let threadId = activeThreadId;
    if (!threadId) {
      try {
        const { thread } = await api.post("/api/chat/threads", { title: content.slice(0, 60) });
        setThreads(prev => [thread, ...prev]);
        setActiveThreadId(thread.id);
        threadId = thread.id;
      } catch (err) {
        console.error("Failed to create thread on send:", err);
        return;
      }
    }

    // Optimistic user message
    const userMsg = { role: "user", content, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);

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
                  m.id === assistantMsgId ? { ...m, content: m.content + data.content } : m
                )
              );
            } else if (data.type === "done") {
              setMessages(prev =>
                prev.map(m => (m.id === assistantMsgId ? { ...m, streaming: false } : m))
              );
              // Refresh thread title (backend auto-titles on first message)
              loadThreads();
            } else if (data.type === "error") {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: data.message || "⚠️ Sorry, something went wrong. Please try again.",
                        streaming: false,
                      }
                    : m
                )
              );
            }
          } catch {
            /* skip malformed line */
          }
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
  }, [activeThreadId, api, isStreaming, loadThreads]);

  return (
    <ChatContext.Provider
      value={{
        threads,
        activeThreadId,
        setActiveThreadId,
        messages,
        setMessages,
        isStreaming,
        isLoadingThreads,
        isLoadingMessages,
        loadThreads,
        selectThread,
        createNewChat,
        deleteThread,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

