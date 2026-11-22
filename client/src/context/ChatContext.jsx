import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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

  // Ref to hold the active AbortController for cancelling in-flight streams
  const abortControllerRef = useRef(null);

  // ── Stop active generation ──
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
    );
  }, []);

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
    // If currently streaming, stop it before switching
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

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
    // If currently streaming, stop it before creating new chat
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

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
  const sendMessage = useCallback(async ({ content, isRegenerate = false }) => {
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

    // Set up AbortController for cancel capability
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isRegenerate) {
      // For regeneration: pop the last assistant message and place a fresh streaming one
      setMessages((prev) => {
        const list = [...prev];
        if (list.length > 0 && list[list.length - 1].role === "assistant") {
          list.pop();
        }
        return [
          ...list,
          { role: "assistant", content: "", id: Date.now(), streaming: true },
        ];
      });
    } else {
      // Normal send: optimistic user message + empty assistant placeholder
      const userMsg = { role: "user", content, id: Date.now() };
      const assistantMsg = { role: "assistant", content: "", id: Date.now() + 1, streaming: true };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    }

    setIsStreaming(true);

    try {
      const reader = await api.stream(
        `/api/chat/threads/${threadId}/stream`,
        { message: content, regenerate: isRegenerate },
        controller.signal
      );
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
              setMessages((prev) => {
                const lastIdx = prev.length - 1;
                if (lastIdx < 0 || prev[lastIdx].role !== "assistant") return prev;
                const updated = [...prev];
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: updated[lastIdx].content + data.content,
                };
                return updated;
              });
            } else if (data.type === "done") {
              setMessages((prev) =>
                prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
              );
              // Refresh thread title in case backend auto-titled it
              loadThreads();
            } else if (data.type === "error") {
              setMessages((prev) => {
                const lastIdx = prev.length - 1;
                if (lastIdx < 0 || prev[lastIdx].role !== "assistant") return prev;
                const updated = [...prev];
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: data.message || "⚠️ Sorry, something went wrong. Please try again.",
                  streaming: false,
                };
                return updated;
              });
            }
          } catch {
            /* skip malformed line */
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // User voluntarily stopped generation — leave content as is, turn off streaming
        return;
      }
      console.error("Stream error:", err);
      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (lastIdx < 0 || prev[lastIdx].role !== "assistant") return prev;
        const updated = [...prev];
        updated[lastIdx] = {
          ...updated[lastIdx],
          content: updated[lastIdx].content || "⚠️ Connection error. Please try again.",
          streaming: false,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [activeThreadId, api, isStreaming, loadThreads]);

  // ── Regenerate response for the last user prompt ──
  const regenerateLastResponse = useCallback(() => {
    if (isStreaming || messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      sendMessage({ content: lastUserMsg.content, isRegenerate: true });
    }
  }, [isStreaming, messages, sendMessage]);

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
        stopGeneration,
        regenerateLastResponse,
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
