import { useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  Sparkles,
  UploadCloud,
  FileCheck2,
  Target,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  History,
  Copy,
  Check,
  Printer,
  Trash2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Mail,
  Phone,
  Linkedin,
  Github,
  MapPin,
  X,
  RotateCcw,
  ListFilter,
  Layers,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "../../../hooks/useApi";

const SAMPLE_ROLES = [
  { label: "Frontend React", text: "Senior Frontend Engineer proficient in React, Next.js, TypeScript, Tailwind CSS, performance optimization, and testing with Jest." },
  { label: "Full-Stack Dev", text: "Full Stack Developer experienced in Node.js, Express, React, PostgreSQL/MongoDB, REST APIs, Docker, and CI/CD pipelines." },
  { label: "AI/Data Engineer", text: "Data & AI Engineer with expertise in Python, PyTorch, LangChain, vector databases, SQL pipelines, and cloud deployment." },
];

export default function ResumeReviewPage() {
  const api = useApi();
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Active view tab in results: 'overview' | 'bullets' | 'keywords' | 'sections'
  const [activeTab, setActiveTab] = useState("overview");

  // History state
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Copied item state
  const [copiedId, setCopiedId] = useState(null);

  // Fetch scan history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get("/api/resume/history");
      if (res.success && Array.isArray(res.reviews)) {
        setHistory(res.reviews);
      }
    } catch (err) {
      console.warn("Failed to load review history:", err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (role.trim()) {
        formData.append("jobDescription", role.trim());
      }

      const response = await api.authFetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      if (response.success && response.analysis) {
        setResult(response.analysis);
        setActiveTab("overview");
        fetchHistory(); // Refresh history list
      } else {
        throw new Error(response.message || "Failed to analyze resume.");
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.message || "Failed to analyze resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadPastReview = (review) => {
    if (review?.analysis) {
      setResult({
        ...review.analysis,
        fileName: review.file_name,
        created_at: review.created_at,
      });
      setActiveTab("overview");
      setShowHistoryModal(false);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this resume scan from history?")) return;
    try {
      await api.del(`/api/resume/history/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (result?.id === id) {
        setResult(null);
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  const handleCopyText = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper for score badge colors
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 65) return "text-teal-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    if (score >= 65) return "bg-teal-500/10 border-teal-500/20 text-teal-400";
    if (score >= 50) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    return "bg-rose-500/10 border-rose-500/20 text-rose-400";
  };

  return (
    <div className="h-full w-full bg-[#030712] text-white flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-[-5%] left-[-10%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[-10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* FIXED / NON-SCROLLABLE TOP HEADER BAR */}
      <header className="shrink-0 px-4 md:px-6 lg:px-8 py-3.5 border-b border-white/5 bg-[#030712]/95 backdrop-blur-xl z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} /> Enterprise ATS Engine
              </span>
              <span className="text-gray-500 text-xs">•</span>
              <span className="text-xs text-gray-400 font-mono">Google XYZ Formula</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Resume Intelligence & ATS Optimizer
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="View past resume scans"
            >
              <History size={14} className="text-teal-400" />
              <span>Past Scans</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono">
                  {history.length}
                </span>
              )}
            </button>

            {result && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-xs font-semibold text-teal-300 hover:text-teal-200 transition-all cursor-pointer"
                title="Print or save as PDF report"
              >
                <Printer size={13} />
                <span>Print Report</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-10 w-full max-w-7xl mx-auto no-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-8">
          
          {/* ==================== LEFT COLUMN: UPLOAD & CONFIG ==================== */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-teal-600/20 to-emerald-600/20 border border-teal-500/30 flex items-center justify-center shadow-inner">
                  <FileCheck2 className="text-teal-400 w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Upload Resume</h2>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">PDF or DOCX (Max 5MB)</p>
                </div>
              </div>

              <div className="space-y-5 relative z-10">
                {/* Upload Zone */}
                <div>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf,.docx"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`w-full py-6 px-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all bg-black/40 shadow-inner
                      ${file ? "border-teal-500/60 bg-teal-500/10" : "border-white/10 hover:border-teal-500/30 hover:bg-white/[0.02]"}`}>
                      {file ? (
                        <>
                          <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center mb-2 text-teal-400">
                            <FileText size={20} />
                          </div>
                          <span className="text-xs font-bold text-teal-200 truncate max-w-[85%]">{file.name}</span>
                          <span className="text-[10px] text-teal-400/80 mt-0.5">Click or drag another to replace</span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-2 text-gray-400 group-hover:text-teal-400 transition-colors">
                            <UploadCloud size={20} />
                          </div>
                          <span className="text-xs font-semibold text-gray-200">Drop resume here or browse</span>
                          <span className="text-[10px] text-gray-500 mt-1">Accepts standard PDF & Word format</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Role & Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <Target size={13} className="text-teal-400" />
                      <span>Target Job Description</span>
                    </label>
                    {role && (
                      <button
                        onClick={() => setRole("")}
                        className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Sample Role Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_ROLES.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRole(r.text)}
                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-teal-500/15 border border-white/5 hover:border-teal-500/30 text-[10px] text-gray-400 hover:text-teal-300 transition-all cursor-pointer"
                      >
                        + {r.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Paste the job description here for keyword match & tailored ATS scoring..."
                    rows={4}
                    className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-teal-500/50 focus:bg-black/60 transition-all shadow-inner resize-none leading-relaxed"
                  />
                </div>

                {/* Analyze CTA Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !file}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-white" />
                      <span>Benchmarking against ATS...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Run Comprehensive Audit</span>
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Recent Scans list in left column */}
            {history.length > 0 && (
              <div className="bg-[#0B101A]/60 backdrop-blur-md border border-white/10 rounded-3xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <History size={12} className="text-teal-400" /> Recent Scans
                  </span>
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="text-[11px] text-teal-400 hover:underline cursor-pointer"
                  >
                    View All ({history.length})
                  </button>
                </div>

                <div className="space-y-2">
                  {history.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadPastReview(item)}
                      className="group p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-200 group-hover:text-teal-300 truncate transition-colors">
                          {item.file_name}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${getScoreBg(item.ats_score)}`}>
                          {item.ats_score}/100
                        </span>
                        <button
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ==================== RIGHT COLUMN: ANALYSIS REPORT ==================== */}
          <div className="lg:col-span-8">
            <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[580px] flex flex-col">
              
              {/* Report Header Bar */}
              <div className="h-12 border-b border-white/5 px-6 flex items-center justify-between bg-black/40 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Briefcase size={14} className="text-teal-400" />
                  <span className="text-xs font-bold text-gray-300 tracking-wide">
                    {result ? result.fileName : "Audit Results Canvas"}
                  </span>
                </div>

                {result && (
                  <span className="px-2.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-mono font-bold">
                    Grade {result.grade || "B+"}
                  </span>
                )}
              </div>

              {/* Main Canvas Body */}
              <div className="flex-1 p-6 relative">
                
                {/* 1. EMPTY STATE */}
                {!result && !loading && (
                  <div className="h-full py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4 text-teal-400 shadow-[0_0_40px_rgba(20,184,166,0.15)]">
                      <FileCheck2 size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Awaiting Resume Document</h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-6">
                      Upload your resume in PDF or Word format on the left to receive an in-depth ATS compatibility audit, Google XYZ bullet improvements, and keyword gap analysis.
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full text-left">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-teal-400 text-xs font-bold block mb-1">⚡ Bullet Rewrites</span>
                        <p className="text-[11px] text-gray-400">Transform weak duties into quantified business outcomes.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-teal-400 text-xs font-bold block mb-1">🎯 Keyword Gap</span>
                        <p className="text-[11px] text-gray-400">Discover critical technical skills missing from your profile.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LOADING STATE WITH SCANNER ANIMATION */}
                {loading && (
                  <div className="h-full py-20 flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-44 mb-6 rounded-2xl border-2 border-teal-500/30 overflow-hidden bg-black/60 shadow-[0_0_50px_rgba(20,184,166,0.2)]">
                      <div className="p-3 space-y-2">
                        <div className="h-2.5 bg-teal-500/20 rounded-full w-2/3" />
                        <div className="h-2 bg-white/10 rounded-full w-full" />
                        <div className="h-2 bg-white/10 rounded-full w-4/5" />
                        <div className="h-2 bg-white/10 rounded-full w-full mt-3" />
                        <div className="h-2 bg-white/10 rounded-full w-3/4" />
                        <div className="h-2 bg-white/10 rounded-full w-full mt-3" />
                      </div>
                      {/* Laser scanning bar */}
                      <motion.div
                        initial={{ y: -10 }}
                        animate={{ y: 170 }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,1)]"
                      />
                    </div>

                    <h4 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                      <Sparkles size={16} className="text-teal-400 animate-pulse" />
                      Benchmarking Against Fortune 500 ATS
                    </h4>
                    <p className="text-xs text-gray-400 max-w-xs font-mono">
                      Evaluating keyword density, action verbs, and Google XYZ metrics...
                    </p>
                  </div>
                )}

                {/* 3. ACTIVE AUDIT REPORT */}
                {result && !loading && (
                  <div className="space-y-6">
                    
                    {/* Top Score Banner */}
                    <div className="p-5 rounded-2xl bg-linear-to-r from-teal-950/40 via-black/40 to-emerald-950/30 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                      {/* Left: Circular gauge */}
                      <div className="flex items-center gap-5">
                        <div className="relative w-24 h-24 shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" fill="none" stroke="#ffffff10" strokeWidth="7" />
                            <motion.circle
                              initial={{ strokeDasharray: "251", strokeDashoffset: "251" }}
                              animate={{ strokeDashoffset: 251 - (251 * (result.atsScore || 70)) / 100 }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              cx="48" cy="48" r="40" fill="none"
                              stroke="url(#atsGradient)" strokeWidth="7"
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="atsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#14b8a6" />
                                <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white font-mono tracking-tighter">
                              {result.atsScore}
                            </span>
                            <span className="text-[8px] uppercase tracking-widest text-teal-400 font-bold">
                              / 100
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                              Overall ATS Score
                            </span>
                            <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              Grade {result.grade || "B+"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-200 italic max-w-md leading-relaxed">
                            "{result.atsVerdict}"
                          </p>
                        </div>
                      </div>

                      {/* Right: 4 Pillar Mini Badges */}
                      {result.pillars && (
                        <div className="grid grid-cols-2 gap-2 shrink-0 w-full md:w-auto">
                          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Parseability</span>
                            <span className="text-sm font-bold text-teal-400 font-mono">
                              {result.pillars.parseability?.score || 85}%
                            </span>
                          </div>
                          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Impact & Metrics</span>
                            <span className="text-sm font-bold text-emerald-400 font-mono">
                              {result.pillars.quantifiableImpact?.score || 65}%
                            </span>
                          </div>
                          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Keywords</span>
                            <span className="text-sm font-bold text-teal-300 font-mono">
                              {result.pillars.keywordMatch?.score || 72}%
                            </span>
                          </div>
                          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Structure</span>
                            <span className="text-sm font-bold text-emerald-300 font-mono">
                              {result.pillars.structureAndTone?.score || 88}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nav Tabs */}
                    <div className="flex border-b border-white/10 gap-1 overflow-x-auto no-scrollbar">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap
                          ${activeTab === "overview" ? "text-teal-400 border-b-2 border-teal-400 bg-white/[0.04]" : "text-gray-400 hover:text-white"}`}
                      >
                        <ListFilter size={13} />
                        <span>Overview & Contact</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("bullets")}
                        className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap
                          ${activeTab === "bullets" ? "text-teal-400 border-b-2 border-teal-400 bg-white/[0.04]" : "text-gray-400 hover:text-white"}`}
                      >
                        <Sparkles size={13} />
                        <span>Bullet Point Improver ({result.bulletPointFixes?.length || 0})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("keywords")}
                        className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap
                          ${activeTab === "keywords" ? "text-teal-400 border-b-2 border-teal-400 bg-white/[0.04]" : "text-gray-400 hover:text-white"}`}
                      >
                        <Target size={13} />
                        <span>Keyword Match ({result.keywords?.matchRate || 0}%)</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("sections")}
                        className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap
                          ${activeTab === "sections" ? "text-teal-400 border-b-2 border-teal-400 bg-white/[0.04]" : "text-gray-400 hover:text-white"}`}
                      >
                        <Layers size={13} />
                        <span>Section Breakdown</span>
                      </button>
                    </div>

                    {/* ── TAB 1: OVERVIEW & CONTACT AUDIT ── */}
                    {activeTab === "overview" && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        {/* Contact Checklist */}
                        {result.contactAudit && (
                          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                                <ShieldCheck size={14} className="text-teal-400" />
                                <span>Contact Details & Link Verification</span>
                              </h4>
                              {result.contactAudit.feedback && (
                                <span className="text-[11px] text-gray-400 italic">
                                  {result.contactAudit.feedback}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                              <div className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold
                                ${result.contactAudit.email ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                                <Mail size={13} />
                                <span>Email {result.contactAudit.email ? "✓" : "✗"}</span>
                              </div>

                              <div className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold
                                ${result.contactAudit.phone ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                                <Phone size={13} />
                                <span>Phone {result.contactAudit.phone ? "✓" : "✗"}</span>
                              </div>

                              <div className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold
                                ${result.contactAudit.linkedin ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                                <Linkedin size={13} />
                                <span>LinkedIn {result.contactAudit.linkedin ? "✓" : "✗"}</span>
                              </div>

                              <div className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold
                                ${result.contactAudit.githubOrPortfolio ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                                <Github size={13} />
                                <span>Portfolio {result.contactAudit.githubOrPortfolio ? "✓" : "✗"}</span>
                              </div>

                              <div className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold
                                ${result.contactAudit.location ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-gray-500/10 border-white/10 text-gray-400"}`}>
                                <MapPin size={13} />
                                <span>Location {result.contactAudit.location ? "✓" : "✗"}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Strengths & Critical Improvements 2-col */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Key Competitive Strengths
                            </h4>
                            <ul className="space-y-2">
                              {result.strengths?.map((s, i) => (
                                <li key={i} className="text-xs text-gray-200 flex items-start gap-2 leading-relaxed">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                              <AlertTriangle size={14} /> High-Priority Optimizations
                            </h4>
                            <ul className="space-y-2">
                              {result.criticalImprovements?.map((imp, i) => (
                                <li key={i} className="text-xs text-gray-200 flex items-start gap-2 leading-relaxed">
                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Pillars Feedback Overview */}
                        {result.pillars && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">ATS Parseability</span>
                              <p className="text-xs text-gray-300 leading-relaxed">{result.pillars.parseability?.feedback}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                                Quantifiable Impact ({result.pillars.quantifiableImpact?.metricsRatio || "Metrics ratio"})
                              </span>
                              <p className="text-xs text-gray-300 leading-relaxed">{result.pillars.quantifiableImpact?.feedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TAB 2: BULLET POINT IMPROVER (GOOGLE XYZ FORMULA) ── */}
                    {activeTab === "bullets" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 flex items-center justify-between">
                          <span>
                            💡 <strong>Google XYZ Formula:</strong> <em>"Accomplished [X] as measured by [Y], by doing [Z]"</em>. Replace weak duty statements with quantified business outcomes.
                          </span>
                        </div>

                        {result.bulletPointFixes && result.bulletPointFixes.length > 0 ? (
                          <div className="space-y-4">
                            {result.bulletPointFixes.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3 shadow-md hover:border-teal-500/30 transition-all"
                              >
                                {/* Before / Original */}
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.2 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider">
                                      Before (Weak Bullet)
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 line-through decoration-rose-500/50 pl-2 border-l-2 border-rose-500/30 py-0.5">
                                    {item.original}
                                  </p>
                                </div>

                                {/* After / Improved */}
                                <div className="space-y-1 pt-1">
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                                      AI-Optimized (High Impact)
                                    </span>

                                    <button
                                      onClick={() => handleCopyText(item.improved, `bullet-${idx}`)}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 text-[11px] font-semibold transition-all cursor-pointer border border-teal-500/30"
                                      title="Copy to clipboard"
                                    >
                                      {copiedId === `bullet-${idx}` ? (
                                        <>
                                          <Check size={12} className="text-emerald-400" />
                                          <span className="text-emerald-400">Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={12} />
                                          <span>Copy Bullet</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <p className="text-xs text-emerald-200 font-medium pl-2 border-l-2 border-emerald-400 py-1 bg-emerald-500/5 rounded-r-lg leading-relaxed">
                                    {item.improved}
                                  </p>
                                </div>

                                {/* Recruiter reason */}
                                {item.reason && (
                                  <p className="text-[11px] text-gray-400 italic bg-white/[0.02] p-2 rounded-lg border border-white/5">
                                    🎯 <strong>Why this wins:</strong> {item.reason}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-400 text-xs">
                            No weak bullet points detected. Your work experience statements are already well-quantified!
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TAB 3: KEYWORD GAP ANALYZER ── */}
                    {activeTab === "keywords" && (
                      <div className="space-y-5 animate-in fade-in duration-200">
                        {/* Match Bar */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-gray-300">Target Role Skill Coverage</span>
                            <span className="text-teal-400 font-mono font-bold">
                              {result.keywords?.matchRate || 70}% Matched
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${result.keywords?.matchRate || 70}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-linear-to-r from-teal-500 to-emerald-500 rounded-full"
                            />
                          </div>
                        </div>

                        {/* Matched Keywords */}
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Matched Skills & Keywords ({result.keywords?.matched?.length || 0})
                            </h4>
                            <span className="text-[10px] text-emerald-500/80 font-mono">Found in resume</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {result.keywords?.matched?.map((kw, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1"
                              >
                                <span>✓</span>
                                <span>{kw}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing Keywords */}
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                              <AlertTriangle size={14} /> Missing High-Priority Keywords ({result.keywords?.missing?.length || 0})
                            </h4>
                            <span className="text-[10px] text-rose-400/80 font-mono">Add to pass ATS filters</span>
                          </div>
                          <p className="text-[11px] text-gray-400">
                            Weave these critical skills into your bullet points, summary, or skills matrix to dramatically improve automated screening pass rates.
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {result.keywords?.missing?.map((kw, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1"
                              >
                                <span>+</span>
                                <span>{kw}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── TAB 4: SECTION BREAKDOWN ── */}
                    {activeTab === "sections" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {result.sections && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(result.sections).map(([key, sec]) => (
                              <div
                                key={key}
                                className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 hover:border-teal-500/30 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold uppercase tracking-wider text-gray-200 capitalize">
                                    {key} Section
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${getScoreBg((sec.score || 7) * 10)}`}>
                                      {sec.score}/10
                                    </span>
                                  </div>
                                </div>

                                <p className="text-xs text-gray-300 leading-relaxed">
                                  {sec.feedback}
                                </p>

                                {sec.suggestion && (
                                  <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/10 text-[11px] text-teal-300 italic">
                                    💡 <strong>Tip:</strong> {sec.suggestion}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── ALL SCAN HISTORY MODAL ── */}
      {showHistoryModal && (
        <div
          onClick={() => setShowHistoryModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0B101A] border border-white/10 rounded-3xl p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-teal-400" />
                <h3 className="text-base font-bold text-white">Scan History</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No previous resume reviews found.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadPastReview(item)}
                    className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-teal-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-200 group-hover:text-teal-300 truncate">
                        {item.file_name}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {new Date(item.created_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${getScoreBg(item.ats_score)}`}>
                        {item.ats_score}/100
                      </span>
                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                        title="Delete record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
