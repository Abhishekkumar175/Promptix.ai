import { useState, useRef, useEffect } from "react";
import { 
  FileText, UploadCloud, Search, Zap, CheckCircle2,
  Database, ScrollText, Send, Loader2, Sparkles, Files, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "../../hooks/useApi";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const MODES = [
  { id: "fast", label: "Fast Read", icon: Zap },
  { id: "deep", label: "Deep Context", icon: Database }
];

export default function ChatWithPDF() {
  const api = useApi();
  const [file, setFile] = useState(null);
  const [activeFileId, setActiveFileId] = useState(null);
  const [mode, setMode] = useState("deep");
  
  const [sessionState, setSessionState] = useState("idle"); // idle | analyzing | active
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [fileStats, setFileStats] = useState({ pages: 0, chunks: 0 });

  const chatEndRef = useRef(null);

  // Auto scroll logic for chat module
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  // Polling for file status
  useEffect(() => {
    let pollInterval;
    if (sessionState === "analyzing" && activeFileId) {
      pollInterval = setInterval(async () => {
        try {
          const { file } = await api.get(`/api/pdf/files/${activeFileId}/status`);
          if (file.status === "ready") {
            setFileStats({ pages: file.page_count, chunks: file.chunk_count });
            setSessionState("active");
            setMessages([
              { 
                role: "ai", 
                text: `Document matched and tokenized successfully. I've processed ${file.page_count} pages into ${file.chunk_count} high-dimensional semantic chunks. Ask me anything about this document.` 
              }
            ]);
            clearInterval(pollInterval);
          } else if (file.status === "failed") {
            setSessionState("idle");
            alert("Analysis failed. Please try a different PDF.");
            clearInterval(pollInterval);
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [sessionState, activeFileId]);

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setSessionState("analyzing");
      const formData = new FormData();
      formData.append("file", file);

      const data = await api.authFetch("/api/pdf/upload", {
        method: "POST",
        body: formData,
      });

      if (data.success) {
        setActiveFileId(data.file.id);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setSessionState("idle");
      alert(err.message || "Failed to upload document");
    }
  };

  const handleSendMessage = async () => {
    if (!inputVal.trim() || sessionState !== "active" || !activeFileId) return;

    const userText = inputVal;
    setInputVal("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setIsAiTyping(true);

    const assistantMsgId = Date.now();
    setMessages(prev => [...prev, { role: "ai", text: "", id: assistantMsgId, streaming: true }]);

    try {
      const reader = await api.stream("/api/pdf/query", {
        fileId: activeFileId,
        question: userText
      });
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
                    ? { ...m, text: m.text + data.content }
                    : m
                )
              );
            } else if (data.type === "done") {
              setMessages(prev =>
                prev.map(m => m.id === assistantMsgId ? { ...m, streaming: false, citations: data.citations } : m)
              );
              setIsAiTyping(false);
            } else if (data.type === "error") {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, text: data.message, streaming: false }
                    : m
                )
              );
              setIsAiTyping(false);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      console.error("Query error:", err);
      setMessages(prev =>
        prev.map(m => m.id === assistantMsgId ? { ...m, text: "⚠️ Connection lost. Try again.", streaming: false } : m)
      );
      setIsAiTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-[#030712] text-white flex flex-col relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <main className="flex-1 p-4 md:p-6 relative z-10 w-full max-w-[1400px] mx-auto overflow-hidden">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0"
        >
          
          {/* LEFT: DOCUMENT HUB */}
          <motion.div variants={itemVariants} className="lg:col-span-4 h-full flex flex-col no-scrollbar overflow-y-auto pb-4">
            <div className={`bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col shrink-0 shadow-2xl relative overflow-hidden transition-all duration-500 ${sessionState === 'active' ? "opacity-60 grayscale-[20%]" : "group"}`}>
              <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center shadow-inner">
                  <ScrollText className="text-cyan-400 w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Data Intelligence</h2>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Semantic Analysis Engine</p>
                </div>
              </div>

              <div className="flex-1 space-y-6 relative z-10">
                
                {/* Upload Zone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-300 mb-2">
                    Source Document
                    <span className="text-cyan-400">*</span>
                  </label>
                  
                  {sessionState === "active" ? (
                    <div className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 flex items-center gap-3 shadow-inner">
                       <FileText className="text-cyan-400" size={20} />
                       <div className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-cyan-300 truncate">{file?.name}</span>
                          <span className="block text-[10px] text-cyan-500/80">Active in context</span>
                       </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input 
                         type="file" 
                         accept=".pdf,.txt,.docx"
                         onChange={(e) => setFile(e.target.files[0])}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`w-full h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all shadow-inner
                        ${file ? "border-cyan-500/50 bg-cyan-500/5" : "border-white/10 bg-black/40 hover:border-white/30"}`}>
                          {file ? (
                            <>
                              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center mb-2">
                                 <FileText className="text-cyan-400" size={20} />
                              </div>
                              <span className="text-sm font-bold text-cyan-300 truncate max-w-[80%]">{file.name}</span>
                              <span className="text-[10px] text-cyan-500/70 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </>
                          ) : (
                            <>
                              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-2">
                                 <UploadCloud className="text-gray-400 group-hover:text-cyan-400 transition-colors" size={20} />
                              </div>
                              <span className="text-sm font-semibold text-gray-300">Click or drag PDF here</span>
                              <span className="text-[10px] text-gray-500 mt-1">PDF or DOCX (Max 10MB)</span>
                            </>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Analysis Mode */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-[12px] font-semibold text-gray-300">
                    <span>Analysis Mode</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20">Gemini 1.5 Flash</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MODES.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          disabled={sessionState === "active"}
                          onClick={() => setMode(m.id)}
                          className={`flex flex-col items-center justify-center gap-1.5 h-[70px] rounded-xl border transition-all duration-300 disabled:opacity-80
                            ${mode === m.id 
                              ? "bg-cyan-600/10 border-cyan-500/50 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]" 
                              : "bg-black/30 border-white/5 hover:border-white/10"
                            }`}
                        >
                          <Icon size={16} className={mode === m.id ? "text-cyan-400" : "text-gray-500"} />
                          <span className={`text-[11px] font-bold ${mode === m.id ? "text-white" : "text-gray-400"}`}>
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* ACTION CTA */}
              <div className="mt-6 relative z-10 w-full shrink-0">
                {sessionState === "active" ? (
                  <button
                    onClick={() => {
                       setSessionState("idle");
                       setFile(null);
                       setActiveFileId(null);
                       setMessages([]);
                       setFileStats({ pages: 0, chunks: 0 });
                    }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[13px] font-bold transition-all"
                  >
                    Clear Memory Context
                  </button>
                ) : (
                  <button
                    onClick={handleUpload}
                    disabled={sessionState !== "idle" || !file}
                    className="w-full relative group overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className={`absolute inset-0 transition-opacity duration-300 bg-linear-to-r from-cyan-600 to-blue-600 ${sessionState !== "idle" ? "opacity-50" : "opacity-100 group-hover:opacity-90"}`} />
                    
                    <div className="relative px-5 py-3 flex items-center justify-center gap-2">
                      {sessionState === "analyzing" ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span className="text-[13px] font-bold text-white tracking-wide">Building Vector Index...</span>
                        </>
                      ) : (
                        <>
                          <Database size={16} className="text-white group-hover:scale-110 transition-transform" />
                          <span className="text-[13px] font-bold text-white tracking-wide shadow-sm">Analyze Document</span>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* RIGHT: INTELLIGENCE UI */}
          <motion.div variants={itemVariants} className="lg:col-span-8 h-full flex flex-col relative pb-4">
            <div className="bg-[#0B101A]/60 backdrop-blur-lg border border-white/10 rounded-3xl flex flex-col h-full shadow-2xl relative overflow-hidden">
              
              {/* Telemetry Header */}
              <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-black/40 shrink-0 relative z-20">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <div className="w-px h-6 bg-white/10 mx-2"></div>
                  
                  {sessionState === "active" ? (
                     <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-md">
                        <CheckCircle2 size={12} className="text-cyan-400" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-400">Context Loaded</span>
                     </div>
                  ) : (
                     <div className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/20 px-2 py-1 rounded-md">
                        <Info size={10} className="text-gray-400" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Memory Empty</span>
                     </div>
                  )}
                </div>

                {sessionState === "active" && (
                  <div className="hidden sm:flex items-center justify-end gap-5">
                    <div className="flex items-center gap-1.5">
                      <Files size={12} className="text-gray-400" />
                      <span className="text-[11px] font-mono font-medium text-gray-400">Pages: {fileStats.pages}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-md border border-white/5">
                      <Database size={12} className="text-cyan-400" />
                      <span className="text-[12px] font-mono font-bold text-white">Chunks: {fileStats.chunks}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Scrolling Content Area */}
              <div className="flex-1 flex flex-col relative no-scrollbar bg-linear-to-b from-transparent to-black/20">

                {sessionState === "idle" && (
                  <div className="absolute inset-6 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-linear-to-br from-cyan-600/10 to-blue-600/10 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                      <Search size={24} className="text-cyan-500/50" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-white mb-2">Knowledge Base Uninitialized</h3>
                    <p className="text-xs text-gray-500 max-w-[280px]">
                      Upload a PDF on the left panel to begin extracting knowledge and querying the semantic database.
                    </p>
                  </div>
                )}

                {sessionState === "analyzing" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-[#0B101A]">
                    <div className="relative w-[300px] h-32 mb-6 rounded-xl border border-white/5 bg-black/40 overflow-hidden pt-4 px-4">
                       <div className="space-y-3 opacity-30">
                          <div className="h-2 bg-gray-500 rounded-full w-3/4" />
                          <div className="h-2 bg-gray-400 rounded-full w-full" />
                          <div className="h-2 bg-gray-500 rounded-full w-5/6" />
                          <div className="h-2 bg-gray-600 rounded-full w-1/2" />
                       </div>
                       <motion.div 
                         animate={{ y: [0, 80, 0] }}
                         transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                         className="absolute top-0 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)]"
                       />
                    </div>
                    
                    <div className="text-[15px] font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-400 mb-1.5 tracking-wide">
                       Tokenizing Document Layout
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium tracking-widest uppercase mt-4 bg-white/5 px-3 py-1 rounded-full">
                       <Loader2 size={12} className="animate-spin text-cyan-500" /> Generating Embeddings
                    </div>
                  </div>
                )}

                {sessionState === "active" && (
                  <div className="flex flex-col h-full w-full relative">
                     <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar pb-20">
                        <AnimatePresence>
                          {messages.map((m, i) => (
                            <motion.div 
                              key={m.id || i}
                              initial={{ opacity: 0, y: 15, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start w-[90%] md:w-[85%]'}`}
                            >
                               <div className={`relative rounded-2xl p-4 text-[14px] leading-relaxed
                                 ${m.role === 'user' 
                                   ? 'bg-linear-to-br from-cyan-600 to-blue-600 text-white rounded-br-[4px] shadow-[0_5px_20px_rgba(6,182,212,0.2)] max-w-[85%]' 
                                   : 'bg-[#121826] border border-white/5 text-gray-200 rounded-tl-[4px] shadow-lg'
                                 }`}>
                                 {m.role === 'ai' && (
                                    <div className="absolute -top-3 left-3 bg-[#0B101A] border border-white/5 text-[9px] uppercase font-bold text-cyan-500 px-2 py-0.5 rounded-full z-10 flex items-center gap-1">
                                      <Sparkles size={8} className="fill-cyan-500" /> Document Intel
                                    </div>
                                 )}
                                 
                                 <div>{m.text} {m.streaming && <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1" />}</div>
                                 
                                 {m.role === 'ai' && m.citations && m.citations.length > 0 && (
                                   <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                                     {m.citations.map((cite, idx) => (
                                       <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-md">
                                         <Files size={10} /> {cite}
                                       </span>
                                     ))}
                                   </div>
                                 )}
                               </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                     </div>

                     {/* Pro Input Console */}
                     <div className="shrink-0 px-4 pb-4 pt-2 bg-linear-to-t from-[#0B101A] to-transparent shrink-0">
                        <div className="flex flex-col bg-[#050812]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 group focus-within:border-cyan-500/40 transition-colors shadow-2xl relative">
                           <div className="absolute inset-[-1px] rounded-2xl bg-linear-to-r from-cyan-500/20 to-blue-500/20 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10" />
                           
                           <div className="flex items-end gap-2">
                             <button className="shrink-0 p-2.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors rounded-xl mb-0.5 relative group/attach">
                               <Database size={18} />
                             </button>
                             
                             <textarea 
                               value={inputVal}
                               onChange={(e) => setInputVal(e.target.value)}
                               onKeyDown={(e) => {
                                 if(e.key === 'Enter' && !e.shiftKey) {
                                   e.preventDefault();
                                   handleSendMessage();
                                 }
                               }}
                               placeholder="Ask a question about your document..."
                               className="flex-1 bg-transparent border-none text-[14px] text-gray-200 focus:outline-none resize-none py-3 min-h-[44px] max-h-[140px] leading-relaxed"
                               rows={1}
                             />
                             
                             <button 
                               onClick={handleSendMessage}
                               disabled={!inputVal.trim() || isAiTyping}
                               className="shrink-0 p-2.5 bg-cyan-600 rounded-xl text-white hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                             >
                               <Send size={18} className="translate-x-[1px]" />
                             </button>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
                
              </div>
            </div>
          </motion.div>
          
        </motion.div>
      </main>
    </div>
  );
}
