import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "../../hooks/useApi";
import MarkdownRenderer from "./chat/MarkdownRenderer";
import {
  FileText,
  UploadCloud,
  FolderOpen,
  Plus,
  Trash2,
  X,
  Send,
  Square,
  Sparkles,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  HelpCircle,
  FileSearch,
} from "lucide-react";

const API_BASE = "http://localhost:3000";

const QUICK_PROMPTS = [
  "Summarize this entire document in key takeaways",
  "What are the main methodology and findings?",
  "Extract all key data, numbers, and conclusions",
  "List the strengths, limitations, and future scope",
];

function formatBytes(bytes, decimals = 1) {
  if (!bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function ChatWithPDF() {
  const api = useApi();
  const { getToken } = useAuth();

  // Documents state
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [activeFileBlobUrl, setActiveFileBlobUrl] = useState(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [mobileTab, setMobileTab] = useState("chat"); // 'pdf' | 'chat'

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Load user's documents on mount
  const loadFiles = useCallback(async () => {
    try {
      setIsLoadingFiles(true);
      const res = await api.get("/api/pdf/files");
      if (res.success) {
        setFiles(res.files || []);
        // If no active file, select the most recent ready file
        if (!activeFile && res.files && res.files.length > 0) {
          const firstReady = res.files.find((f) => f.status === "ready") || res.files[0];
          selectDocument(firstReady);
        }
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoadingFiles(false);
    }
  }, [api]);

  useEffect(() => {
    loadFiles();
  }, []);

  // Escape key closes drawer
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Load PDF binary blob for viewing in iframe
  const loadPdfView = async (fileId) => {
    try {
      setIsLoadingPdf(true);
      if (activeFileBlobUrl) {
        URL.revokeObjectURL(activeFileBlobUrl);
      }
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/pdf/files/${fileId}/view`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load document preview");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setActiveFileBlobUrl(url);
    } catch (err) {
      console.error("Failed to fetch PDF preview:", err);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Load chat history for a document
  const loadMessages = async (fileId) => {
    try {
      setIsLoadingMessages(true);
      const res = await api.get(`/api/pdf/files/${fileId}/messages`);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error("Failed to load PDF messages:", err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Switch active document
  const selectDocument = async (file) => {
    if (!file) return;
    setActiveFile(file);
    setIsDrawerOpen(false);
    loadPdfView(file.id);
    loadMessages(file.id);
  };

  // Start new chat (reset active document & return to landing page)
  const handleNewChat = () => {
    setActiveFile(null);
    if (activeFileBlobUrl) {
      URL.revokeObjectURL(activeFileBlobUrl);
      setActiveFileBlobUrl(null);
    }
    setMessages([]);
    setIsDrawerOpen(false);
  };

  // Upload handler
  const handleUpload = async (fileToUpload) => {
    if (!fileToUpload) return;
    try {
      setIsUploading(true);
      setUploadStatusText("Uploading document...");

      const formData = new FormData();
      formData.append("file", fileToUpload);

      const res = await api.authFetch("/api/pdf/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.success) throw new Error(res.message);

      const newFileId = res.file.id;
      setUploadStatusText("Processing with Gemini 1M Context...");

      // Poll until status is 'ready'
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/api/pdf/files/${newFileId}/status`);
          if (statusRes.file?.status === "ready") {
            clearInterval(pollInterval);
            setIsUploading(false);
            setUploadStatusText("");

            // Reload file list & select this new file
            const updated = await api.get("/api/pdf/files");
            if (updated.success) {
              setFiles(updated.files || []);
              const current = updated.files.find((f) => f.id === newFileId);
              if (current) selectDocument(current);
            }
          } else if (statusRes.file?.status === "failed") {
            clearInterval(pollInterval);
            setIsUploading(false);
            alert("Document analysis failed. Please try a different PDF.");
          }
        } catch (e) {
          console.error("Status poll error:", e);
        }
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.message || "Failed to upload document");
      setIsUploading(false);
      setUploadStatusText("");
    }
  };

  // Delete document
  const handleDeleteDocument = async (fileId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document and its conversation history?")) return;
    try {
      await api.del(`/api/pdf/files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (activeFile?.id === fileId) {
        const remaining = files.filter((f) => f.id !== fileId);
        if (remaining.length > 0) {
          selectDocument(remaining[0]);
        } else {
          setActiveFile(null);
          setActiveFileBlobUrl(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete document.");
    }
  };

  // Stop Generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send Question
  const handleSendMessage = async (textToSend) => {
    const question = textToSend || inputVal;
    if (!question.trim() || isStreaming || !activeFile) return;

    setInputVal("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    const userMsgId = "user-" + Date.now();
    const assistantMsgId = "ai-" + Date.now();

    // Optimistically append user message & streaming assistant message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: question },
      { id: assistantMsgId, role: "model", content: "", streaming: true, citations: [] },
    ]);

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const reader = await api.stream(
        "/api/pdf/query",
        {
          fileId: activeFile.id,
          question,
        },
        controller.signal
      );

      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "token") {
              accumulatedText += data.content;
              const displayContent = accumulatedText.split("===FOLLOW_UPS===")[0];
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: displayContent } : m
                )
              );
            } else if (data.type === "done") {
              const finalContent = data.content || accumulatedText.split("===FOLLOW_UPS===")[0].trim();
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        id: data.messageId || assistantMsgId,
                        content: finalContent,
                        streaming: false,
                        citations: data.citations || [],
                        follow_ups: data.followUps || [],
                      }
                    : m
                )
              );
              setIsStreaming(false);
            } else if (data.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: data.message, streaming: false }
                    : m
                )
              );
              setIsStreaming(false);
            }
          } catch {
            // Skip parse errors
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, streaming: false } : m))
        );
      } else {
        console.error("PDF query error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: "⚠️ Connection interrupted. Please try again.", streaming: false }
              : m
          )
        );
      }
      setIsStreaming(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCopy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#030712] overflow-hidden text-white relative">
      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* ── TOP HEADER BAR ── */}
      <header className="h-14 px-4 sm:px-6 border-b border-white/5 bg-[#050812]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* My Documents Drawer Trigger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-white text-xs font-medium transition-all cursor-pointer group shadow-xs"
            title="Open Document Library"
          >
            <FolderOpen size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Documents</span>
            {files.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-600/20 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                {files.length}
              </span>
            )}
          </button>

          <div className="w-[1px] h-4 bg-white/10 shrink-0" />

          {/* Active Document Title & Page Count */}
          {activeFile ? (
            <div className="min-w-0 flex items-center gap-2">
              <FileText size={15} className="text-cyan-400 shrink-0" />
              <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                {activeFile.file_name}
              </h1>
              {activeFile.page_count > 0 && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400">
                  {activeFile.page_count} {activeFile.page_count === 1 ? "Page" : "Pages"}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 font-medium">No document selected</span>
          )}
        </div>

        {/* Right Actions: Mobile Toggle + Upload New Document */}
        <div className="flex items-center gap-2">
          {/* Mobile view toggle (PDF vs Chat) */}
          {activeFile && (
            <div className="flex md:hidden bg-white/5 p-0.5 rounded-lg border border-white/10 text-xs">
              <button
                onClick={() => setMobileTab("pdf")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  mobileTab === "pdf" ? "bg-cyan-600 text-white shadow-xs" : "text-gray-400"
                }`}
              >
                PDF
              </button>
              <button
                onClick={() => setMobileTab("chat")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  mobileTab === "chat" ? "bg-cyan-600 text-white shadow-xs" : "text-gray-400"
                }`}
              >
                Chat
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleUpload(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />

          {activeFile ? (
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl transition-all shadow-md shadow-cyan-600/20 hover:scale-[1.02] cursor-pointer"
              title="Start a new PDF chat"
            >
              <Plus size={14} />
              <span>New PDF Chat</span>
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl transition-all shadow-md shadow-cyan-600/20 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              title="Upload a new PDF"
            >
              {isUploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span className="hidden sm:inline">Processing...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Upload PDF</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 min-h-0 flex relative z-10 overflow-hidden">
        {/* Uploading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <Loader2 size={32} className="animate-spin text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Analyzing Document</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              {uploadStatusText || "Extracting pages, tables, and building Gemini 1M intelligence context..."}
            </p>
          </div>
        )}

        {!activeFile ? (
          // ── EMPTY STATE (No PDF loaded) ──
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
              <BookOpen size={40} className="text-cyan-400" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Chat with Any Document
            </h2>
            <p className="text-gray-400 max-w-md mb-8 text-sm leading-relaxed">
              Upload research papers, contracts, technical manuals, or textbooks. Powered by Google Gemini 1M Context with 100% accurate page citations.
            </p>

            {/* Drag & Drop Upload Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]);
              }}
              className="w-full p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-cyan-500/50 bg-[#0B101A]/60 hover:bg-cyan-500/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center group mb-8 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 group-hover:bg-cyan-500/20 border border-white/10 group-hover:border-cyan-500/40 flex items-center justify-center mb-3 transition-colors">
                <UploadCloud size={24} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">
                Click to browse or drop your file here
              </p>
              <p className="text-xs text-gray-500 font-mono">
                Supports PDF, DOCX, TXT (Up to 50MB)
              </p>
            </div>

            {/* Recent Documents Chips */}
            {files.length > 0 && (
              <div className="w-full text-left">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <Clock size={13} />
                  <span>Or open a recent document</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {files.slice(0, 4).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => selectDocument(f)}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 text-left transition-all flex items-center gap-3 cursor-pointer group"
                    >
                      <FileText size={18} className="text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-gray-200 truncate group-hover:text-white">
                          {f.file_name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {f.page_count} pages • {formatBytes(f.file_size)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── SPLIT SCREEN WORKSPACE ──
          <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden">
            {/* LEFT PANE: HIGH-RES PDF VIEWER */}
            <div
              className={`w-full md:w-1/2 h-full flex flex-col border-r border-white/5 bg-[#070B14] ${
                mobileTab === "pdf" ? "flex" : "hidden md:flex"
              }`}
            >
              {/* PDF Toolbar */}
              <div className="h-10 px-4 border-b border-white/5 bg-[#050812] flex items-center justify-between text-xs text-gray-400 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen size={13} className="text-cyan-400 shrink-0" />
                  <span className="font-semibold text-gray-300 truncate">Document Preview</span>
                </div>
                {activeFileBlobUrl && (
                  <a
                    href={activeFileBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] hover:text-white hover:underline text-gray-500"
                    title="Open in new window"
                  >
                    <ExternalLink size={12} />
                    <span>Expand</span>
                  </a>
                )}
              </div>

              {/* PDF Iframe Viewer */}
              <div className="flex-1 min-h-0 relative bg-[#121622] overflow-hidden">
                {isLoadingPdf ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <Loader2 size={24} className="animate-spin text-cyan-400" />
                    <span className="text-xs">Loading PDF pages...</span>
                  </div>
                ) : activeFileBlobUrl ? (
                  <iframe
                    src={activeFileBlobUrl}
                    className="w-full h-full border-none"
                    title="PDF Viewer"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500">
                    Unable to load preview
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT PANE: AI CHAT ASSISTANT */}
            <div
              className={`w-full md:w-1/2 h-full flex flex-col bg-[#030712] relative ${
                mobileTab === "chat" ? "flex" : "hidden md:flex"
              }`}
            >
              {/* Chat Messages Scrollable Canvas */}
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 sm:px-6 py-4 space-y-6">
                {/* Initial Welcome & Quick Prompts */}
                {messages.length === 0 && !isLoadingMessages && (
                  <div className="py-8 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                      <Sparkles size={22} className="text-cyan-400" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5">
                      {activeFile.file_name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                      This document is fully loaded in Gemini&apos;s 1M context. Ask any specific question or choose a prompt below:
                    </p>

                    <div className="space-y-2 text-left">
                      {QUICK_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleSendMessage(prompt)}
                          className="w-full p-2.5 rounded-xl border border-white/10 hover:border-cyan-500/40 bg-white/[0.02] hover:bg-cyan-500/10 text-xs text-gray-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate pr-2">{prompt}</span>
                          <ArrowRight size={13} className="text-gray-500 group-hover:text-cyan-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages List */}
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "user" ? (
                      // USER BUBBLE
                      <div className="bg-[#1e2434] border border-white/10 text-gray-100 rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-[85%] shadow-md whitespace-pre-wrap leading-relaxed text-[14px]">
                        {msg.content}
                      </div>
                    ) : (
                      // ASSISTANT BUBBLE WITH MARKDOWN
                      <div className="flex gap-3 max-w-[95%] w-full">
                        <div className="w-7 h-7 shrink-0 rounded-lg bg-linear-to-br from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/10 mt-1">
                          <Sparkles size={13} className="text-white" />
                        </div>

                        <div className="pt-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
                              Promptix Document AI
                            </span>
                            {msg.streaming && (
                              <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                Analyzing...
                              </span>
                            )}
                          </div>

                          {/* Markdown Rendered Content */}
                          <MarkdownRenderer content={msg.content} isStreaming={msg.streaming} />

                          {/* Citations Badges */}
                          {msg.citations && msg.citations.length > 0 && !msg.streaming && (
                            <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mr-1">
                                Sources:
                              </span>
                              {msg.citations.map((cite, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-400"
                                >
                                  <FileSearch size={10} />
                                  {cite}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions: Copy */}
                          {!msg.streaming && msg.content && (
                            <div className="mt-2.5 flex items-center gap-2 pt-1 text-gray-500">
                              <button
                                onClick={() => handleCopy(msg.id || idx, msg.content)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-white/5 hover:text-gray-300 text-[11px] transition-colors cursor-pointer"
                                title="Copy answer"
                              >
                                {copiedId === (msg.id || idx) ? (
                                  <>
                                    <Check size={12} className="text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {/* Follow-up Question Chips */}
                          {msg.follow_ups && msg.follow_ups.length > 0 && !msg.streaming && (
                            <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                                <Sparkles size={12} className="text-cyan-400" />
                                <span>Suggested Follow-ups</span>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {msg.follow_ups.map((q, qIdx) => (
                                  <button
                                    key={qIdx}
                                    onClick={() => handleSendMessage(q)}
                                    disabled={isStreaming}
                                    className="text-left text-xs px-3 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/40 text-gray-300 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 group shadow-xs disabled:opacity-50"
                                  >
                                    <span>{q}</span>
                                    <ArrowRight size={12} className="text-gray-500 group-hover:text-cyan-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator before first chunk */}
                {isStreaming && messages.at(-1)?.role !== "model" && (
                  <div className="flex gap-3 items-center text-gray-500 text-xs py-2">
                    <Loader2 size={14} className="animate-spin text-cyan-400" />
                    <span>Searching document context...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Sleek ChatGPT-style Input Bar */}
              <div className="p-3 sm:p-4 w-full max-w-2xl mx-auto shrink-0">
                <div className="relative group w-full">
                  <div className="absolute inset-0 bg-cyan-600/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative bg-[#0F1523] border border-white/10 rounded-2xl flex items-end p-1.5 sm:p-2 shadow-[0_10px_35px_rgba(0,0,0,0.45)] transition-all duration-300 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <textarea
                      ref={inputRef}
                      value={inputVal}
                      onChange={(e) => {
                        setInputVal(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Ask anything about ${activeFile.file_name}...`}
                      className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 px-3.5 py-2.5 min-h-[44px] max-h-36 resize-none scrollbar-hide text-[14px] leading-relaxed"
                      rows={1}
                    />

                    <div className="shrink-0 pb-0.5 pr-0.5">
                      {isStreaming ? (
                        <button
                          onClick={handleStop}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 transition-all duration-200 hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                          title="Stop generating"
                        >
                          <Square size={13} className="fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!inputVal.trim()}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            !inputVal.trim()
                              ? "bg-white/5 text-gray-600 cursor-not-allowed"
                              : "bg-linear-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:scale-105 cursor-pointer"
                          }`}
                          title="Send question"
                        >
                          <Send size={15} className={inputVal.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-center mt-2 text-[10px] text-gray-600 font-medium">
                    Promptix AI can make mistakes. Verify critical facts directly in the PDF preview.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── SLIDE-OVER "MY DOCUMENTS" DRAWER ─── */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-[340px] max-w-[85vw] bg-[#070b16] border-r border-[#1e2434] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#050812]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
              <FolderOpen size={14} className="text-cyan-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Document Library</h2>
            <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
              {files.length}
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

        {/* Action Button: Start New Chat */}
        <div className="p-4 pb-2 shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full relative group overflow-hidden rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 p-[1px] shadow-lg shadow-cyan-600/20 cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2 bg-[#0B101A] group-hover:bg-transparent py-2.5 px-3 rounded-[11px] text-xs font-semibold text-white transition-colors duration-200">
              <Plus size={14} className="text-cyan-400 group-hover:text-white transition-colors" />
              <span>Start New PDF Chat</span>
            </div>
          </button>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            Uploaded Documents
          </span>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
          {isLoadingFiles ? (
            <div className="space-y-2 p-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText size={28} className="mx-auto text-gray-600 mb-2" />
              <p className="text-xs text-gray-500">No documents uploaded yet.</p>
            </div>
          ) : (
            files.map((file) => {
              const isActive = activeFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => selectDocument(file)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-cyan-600/15 border border-cyan-500/30 text-white"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <FileText
                      size={16}
                      className={isActive ? "text-cyan-400 shrink-0" : "text-gray-500 shrink-0 group-hover:text-cyan-400"}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block font-medium truncate">{file.file_name}</span>
                      <span className="block text-[10px] text-gray-500 font-mono">
                        {file.page_count} pages • {formatBytes(file.file_size)}
                      </span>
                    </div>
                  </div>

                  {/* Delete Document Button */}
                  <button
                    onClick={(e) => handleDeleteDocument(file.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
