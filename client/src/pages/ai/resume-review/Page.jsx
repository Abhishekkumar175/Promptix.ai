import { useState } from "react";
import { FileText, Loader2, Sparkles, UploadCloud, FileCheck2, Target, Briefcase, CheckCircle2 } from "lucide-react";
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

export default function ResumeReviewPage() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    // Mock delay representing AI analysis
    setTimeout(() => {
      setResult({
        score: Math.floor(Math.random() * (95 - 75 + 1) + 75), // Random score between 75 and 95
        strengths: ["Strong active verbs used in experience.", "Education section is formatted well."],
        weaknesses: ["Missing keywords related to the target role.", "Summary is too generic."],
      });
      setLoading(false);
    }, 4000); // 4 second scanning effect
  };

  return (
    <div className="h-full w-full bg-[#030712] text-white flex flex-col relative overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* Intense Background Glows mapped to teal/emerald for career vibes */}
      <div className="fixed top-[-5%] left-[-10%] w-[500px] h-[500px] bg-teal-600/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <main className="flex-1 p-4 md:p-6 relative z-10 w-full max-w-6xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[calc(100vh-120px)]"
        >
          
          {/* =======================
              LEFT: UPLOAD ENGINE
              ======================= */}
          <motion.div variants={itemVariants} className="lg:col-span-5 h-full flex flex-col">
            <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col h-full shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-teal-600/20 to-emerald-600/20 border border-teal-500/30 flex items-center justify-center shadow-inner">
                  <FileCheck2 className="text-teal-400 w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Resume Scanner</h2>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">ATS Optimization Engine</p>
                </div>
              </div>

              <div className="flex-1 space-y-6 relative z-10">
                
                {/* Upload Zone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-300">
                    Upload your Document
                    <span className="text-red-400">*</span>
                  </label>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all bg-black/40 shadow-inner
                      ${file ? "border-teal-500/50 bg-teal-500/5" : "border-white/10 hover:border-white/30"}`}>
                        {file ? (
                          <>
                            <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center mb-2">
                               <FileText className="text-teal-400" size={20} />
                            </div>
                            <span className="text-sm font-bold text-teal-300 truncate max-w-[80%]">{file.name}</span>
                            <span className="text-[10px] text-teal-500/70 mt-1">Ready for analysis</span>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-2">
                               <UploadCloud className="text-gray-400 group-hover:text-teal-400 transition-colors" size={20} />
                            </div>
                            <span className="text-sm font-semibold text-gray-300">Click or drag file here</span>
                            <span className="text-[10px] text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</span>
                          </>
                        )}
                    </div>
                  </div>
                </div>

                {/* Target Role */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-300">
                    Target Job Role
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full h-11 pl-9 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:bg-black/60 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Experience Level Selector (Stub) */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-[13px] font-semibold text-gray-300">
                    <span>Experience Level</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-teal-500 bg-teal-500/10 px-1.5 py-0.5 rounded-md">Pro</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="h-10 rounded-lg text-xs font-semibold bg-teal-600/10 border border-teal-500/50 text-white transition-all">Entry / Mid</button>
                    <button className="h-10 rounded-lg text-xs font-semibold bg-black/30 border border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20 transition-all">Senior / Exec</button>
                  </div>
                </div>

              </div>

              {/* ANALYZE CTA */}
              <div className="mt-6 relative z-10 w-full">
                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="w-full relative group overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`absolute inset-0 transition-opacity duration-300 bg-linear-to-r from-teal-500 to-emerald-500 ${loading ? "opacity-50" : "opacity-100 group-hover:opacity-90"}`} />
                  <div className={`absolute inset-0 blur-md transition-opacity duration-300 bg-linear-to-r from-teal-500 to-emerald-500 ${loading ? "opacity-0" : "opacity-0 group-hover:opacity-40"}`} />
                  
                  <div className="relative px-5 py-3 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span className="text-[13px] font-bold text-white tracking-wide">Scanning Document...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-white group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-bold text-white tracking-wide shadow-sm">AI Score & Feedback</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* =======================
              RIGHT: RESULTS PANEL
              ======================= */}
          <motion.div variants={itemVariants} className="lg:col-span-7 h-full flex flex-col">
            <div className="bg-[#0B101A]/60 backdrop-blur-lg border border-white/10 rounded-3xl flex flex-col h-full min-h-[500px] shadow-2xl relative overflow-hidden">
              
              {/* Output Header */}
              <div className="h-10 border-b border-white/5 flex items-center justify-between px-5 bg-black/20 shrink-0 relative z-20">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="text-[10px] font-bold tracking-widest text-gray-500 uppercase flex items-center gap-1.5">
                  <Briefcase size={10} /> Analysis Result
                </div>
              </div>

              {/* EDITOR CANVAS */}
              <div className="flex-1 flex flex-col p-4 relative no-scrollbar items-center justify-center">

                {!result && !loading && (
                  <div className="w-full h-full rounded-xl border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-linear-to-br from-teal-600/10 to-emerald-600/10 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(20,184,166,0.1)]">
                      <FileCheck2 size={24} className="text-teal-500/50" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-white mb-2">Awaiting Resume</h3>
                    <p className="text-xs text-gray-500 max-w-[280px]">
                      Upload your PDF on the left and input a target role to get an in-depth AI algorithmic review.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    {/* Scanner Loader */}
                    <div className="relative w-28 h-36 mb-6 rounded-lg border-2 border-teal-500/20 overflow-hidden bg-black/40">
                       <div className="absolute inset-0 flex flex-col p-2 space-y-1">
                          <div className="h-2 bg-white/5 rounded-full w-3/4"></div>
                          <div className="h-2 bg-white/5 rounded-full w-full"></div>
                          <div className="h-2 bg-white/5 rounded-full w-5/6"></div>
                          <div className="h-2 bg-white/5 rounded-full w-full mt-4"></div>
                       </div>
                       {/* Scanning Beam */}
                       <div className="absolute left-0 right-0 h-1 bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,1)] blur-[1px] animate-[bounce_2s_infinite]" />
                    </div>
                    <div className="text-[15px] font-bold text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-emerald-400 animate-pulse mb-1.5">
                       Simulating ATS Software
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
                       Analyzing bullet points against target role...
                    </div>
                  </div>
                )}

                {result && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full h-full flex flex-col items-center justify-center"
                  >
                    <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="54" fill="none" stroke="#ffffff10" strokeWidth="8" />
                        <motion.circle 
                          initial={{ strokeDasharray: "339", strokeDashoffset: "339" }}
                          animate={{ strokeDashoffset: 339 - (339 * result.score) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          cx="64" cy="64" r="54" fill="none" 
                          stroke="url(#gradient)" strokeWidth="8" className="drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]" 
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#14b8a6" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold tracking-tighter text-white">{result.score}</span>
                        <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">ATS Score</span>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {/* Sub-cards */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                        <h4 className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wide">
                          <CheckCircle2 size={12} /> Strengths
                        </h4>
                        <ul className="space-y-1.5">
                          {result.strengths.map((s, i) => (
                            <li key={i} className="text-[11px] text-gray-300 leading-relaxed">• {s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                        <h4 className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2 uppercase tracking-wide">
                          <Target size={12} /> Opportunities
                        </h4>
                        <ul className="space-y-1.5">
                          {result.weaknesses.map((w, i) => (
                            <li key={i} className="text-[11px] text-gray-300 leading-relaxed">• {w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
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
