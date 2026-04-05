import { useState } from "react";
import { Sparkles, PenLine, Loader2, Settings2, Globe, Type, Copy, Download, RefreshCcw } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function WriteArticle() {
  const { getToken } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [length, setLength] = useState("medium");
  const [tone, setTone] = useState("Professional");
  const [article, setArticle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a topic to begin.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setArticle("");

      const token = await getToken();

      const res = await fetch("http://localhost:3000/api/ai/generate-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, length }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Something went wrong");

      // Give a slight visual pause even if APi is fast to show off the loader
      setTimeout(() => {
        setArticle(data.article);
        setLoading(false);
      }, 500);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#030712] text-white flex flex-col relative overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* Intense Background Glows */}
      <div className="fixed top-0 left-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <main className="flex-1 p-4 md:p-6 relative z-10 w-full max-w-6xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[calc(100vh-120px)]"
        >
          {/* =======================
              LEFT: CONFIGURATION ENGINE
              ======================= */}
          <motion.div variants={itemVariants} className="lg:col-span-5 h-full flex flex-col">
            <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col h-full shadow-2xl relative overflow-hidden group">
              {/* Subtle hover edge glow */}
              <div className="absolute inset-0 bg-linear-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center shadow-inner">
                  <PenLine className="text-violet-400 w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Article Composer</h2>
                  <p className="text-xs text-gray-500 font-medium">AI Writing Engine v2.0</p>
                </div>
              </div>

              <div className="flex-1 space-y-6 relative z-10">
                {/* Core Topic */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-300">
                    What is the core topic?
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., The evolution of quantum computing in the next decade..."
                    className="w-full h-24 rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-black/60 focus:ring-4 focus:ring-violet-500/10 transition-all resize-none shadow-inner"
                  />
                  {error && <p className="text-red-400 text-xs font-medium pl-1 animate-pulse">{error}</p>}
                </div>

                {/* Article Length */}
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-gray-300">
                    Content Depth & Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "short", label: "Short", words: "~500W" },
                      { key: "medium", label: "Medium", words: "~1000W" },
                      { key: "long", label: "Long", words: "1500W+" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setLength(item.key)}
                        className={`relative flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-300 overflow-hidden group/btn
                          ${length === item.key 
                            ? "bg-violet-600/10 border-violet-500/50 shadow-[inset_0_0_20px_rgba(139,92,246,0.15)]" 
                            : "bg-black/30 border-white/5 hover:border-white/10 hover:bg-white-[0.02]"
                          }`}
                      >
                        {length === item.key && (
                          <div className="absolute top-0 inset-x-0 h-[1px] bg-linear-to-r from-transparent via-violet-400 to-transparent opacity-80" />
                        )}
                        <span className={`text-xs font-bold ${length === item.key ? "text-white" : "text-gray-400 group-hover/btn:text-gray-300"}`}>
                          {item.label}
                        </span>
                        <span className="text-[9px] text-gray-600 font-medium mt-0.5">{item.words}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Tools (Stubs) */}
                <div className="space-y-2 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between cursor-pointer group/adv">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 group-hover/adv:text-gray-300 transition-colors">
                      <Settings2 size={14} />
                      Advanced Settings
                    </label>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded-md">Pro</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/30 border border-white/5 rounded-lg p-2.5 flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                         <Globe size={14} className="text-gray-500" />
                         <span className="text-xs text-gray-400 font-medium">SEO Optimized</span>
                      </div>
                      <div className="w-8 h-4 bg-violet-500 rounded-full relative shadow-[0_0_10px_rgba(139,92,246,0.4)]">
                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-black/30 border border-white/5 rounded-xl p-3 flex items-center gap-2 hover:border-white/10 transition-colors cursor-pointer">
                      <Type size={14} className="text-gray-500 shrink-0" />
                      <div className="text-xs text-gray-400 font-medium flex-1 truncate">Tone: {tone}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GENERATE CTA */}
              <div className="mt-6 relative z-10 w-full">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl"
                >
                  <div className={`absolute inset-0 transition-opacity duration-300 bg-linear-to-r from-violet-600 to-indigo-600 ${loading ? "opacity-50" : "opacity-100 group-hover:opacity-90"}`} />
                  <div className={`absolute inset-0 blur-md transition-opacity duration-300 bg-linear-to-r from-violet-600 to-indigo-600 ${loading ? "opacity-0" : "opacity-0 group-hover:opacity-40"}`} />
                  
                  <div className="relative px-5 py-3 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span className="text-[13px] font-bold text-white tracking-wide">Synthesizing Content...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-white group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-bold text-white tracking-wide shadow-sm">Generate Full Article</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* =======================
              RIGHT: EDITOR/OUTPUT
              ======================= */}
          <motion.div variants={itemVariants} className="lg:col-span-7 h-full flex flex-col">
            <div className="bg-[#0B101A]/60 backdrop-blur-lg border border-white/10 rounded-3xl flex flex-col h-full min-h-[500px] shadow-2xl relative overflow-hidden">
              
              {/* Toolbar */}
              <div className="h-10 border-b border-white/5 flex items-center justify-between px-5 bg-black/20 shrink-0 relative z-20">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  <span className="ml-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">Editor Output</span>
                </div>
                
                {article && !loading && (
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors title='Copy'" onClick={() => navigator.clipboard.writeText(article)}>
                      <Copy size={16} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors title='Download'" >
                      <Download size={16} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors title='Regenerate'" onClick={handleGenerate}>
                      <RefreshCcw size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* EDITOR CANVAS */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 relative no-scrollbar">

                {!article && !loading && (
                  <div className="absolute inset-6 rounded-xl border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-linear-to-br from-violet-600/10 to-indigo-600/10 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                      <Sparkles size={24} className="text-violet-500/50" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-white mb-2">Awaiting Instructions</h3>
                    <p className="text-xs text-gray-500 max-w-[250px]">
                      Provide a core topic on the left and hit generate to watch the AI write a full article.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="absolute inset-8 flex flex-col items-center justify-center text-center h-full">
                    {/* Pulsing Core */}
                    <div className="relative w-16 h-16 mb-5">
                       <div className="absolute inset-0 bg-violet-600 rounded-full blur-2xl opacity-50 animate-pulse" />
                       <div className="absolute inset-0 border-2 border-violet-400 border-dashed rounded-full animate-[spin_4s_linear_infinite]" />
                       <div className="absolute inset-1.5 border-[1.5px] border-indigo-400 border-t-transparent rounded-full animate-[spin_3s_linear_infinite_reverse]" />
                       <div className="absolute inset-0 flex items-center justify-center">
                         <Sparkles className="text-white animate-pulse" size={20} />
                       </div>
                    </div>
                    <div className="text-[15px] font-bold text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-indigo-400 animate-pulse mb-1.5">
                       Synthesizing Knowledge Base
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
                       Applying SEO parameters...
                    </div>
                  </div>
                )}

                {article && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert prose-violet max-w-none 
                      prose-headings:font-bold prose-headings:tracking-tight 
                      prose-a:text-violet-400 hover:prose-a:text-violet-300
                      prose-p:leading-relaxed prose-p:text-gray-300 prose-p:text-[15px]" 
                  >
                    <div className="whitespace-pre-wrap">{article}</div>
                  </motion.div>
                )}

              </div>
            </div>
          </motion.div>
          
        </motion.div>
      </main>
    </div>
  );
}
