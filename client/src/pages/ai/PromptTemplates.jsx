import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Copy, MessageCircle, Check, Zap, Code, BookOpen, Megaphone, TerminalSquare, Palette, Briefcase, User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useApi, publicFetch } from "../../hooks/useApi";

// Map category to icon + color
const CATEGORY_META = {
  Writing:   { icon: Megaphone,        color: "from-blue-500 to-cyan-500" },
  Marketing: { icon: Megaphone,        color: "from-orange-500 to-red-500" },
  Coding:    { icon: Code,             color: "from-gray-500 to-slate-700" },
  Academic:  { icon: BookOpen,         color: "from-emerald-500 to-teal-500" },
  Career:    { icon: User,             color: "from-violet-500 to-purple-600" },
  Business:  { icon: Briefcase,        color: "from-amber-500 to-orange-500" },
  Images:    { icon: Palette,          color: "from-pink-500 to-fuchsia-500" },
};
const DEFAULT_META = { icon: TerminalSquare, color: "from-gray-600 to-gray-800" };

// Highlight [VARIABLES] in template text
const renderTemplate = (text) => {
  const parts = text.split(/(\[[A-Z0-9_\s,]+\])/g);
  return parts.map((part, i) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <span key={i} className="text-violet-400 bg-violet-400/10 px-1 rounded-sm border border-violet-400/20 font-mono text-[11px] font-bold mx-0.5">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

export default function PromptTemplates() {
  const navigate = useNavigate();
  const api = useApi();

  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch templates & categories on mount / filter change
  useEffect(() => {
    fetchTemplates();
  }, [activeTab, search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { categories: data } = await publicFetch("/api/templates/categories");
      setCategories(["All", ...data.map(c => c.category)]);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "All") params.set("category", activeTab);
      if (search.trim()) params.set("q", search.trim());
      const { templates: data } = await publicFetch(`/api/templates?${params}`);
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseTemplate = async (template) => {
    navigator.clipboard.writeText(template.prompt);
    // Track usage (fire and forget)
    api.post(`/api/templates/${template.id}/use`, {}).catch(() => {});
    navigate("/ai/chat");
  };

  return (
    <div className="h-full w-full bg-[#030712] text-white flex flex-col relative overflow-y-auto overflow-x-hidden no-scrollbar pb-20">

      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <main className="flex-1 p-4 md:p-8 relative z-10 w-full max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col items-center justify-center text-center mt-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Zap size={14} className="fill-violet-400" /> Prompt Library
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            What do you want to create?
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-8">
            Expertly crafted prompt templates. Copy, customize, and get better AI results — faster.
          </p>

          {/* SEARCH */}
          <div className="relative w-full max-w-2xl group">
            <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl transition-colors group-hover:border-white/20">
              <Search className="text-gray-500 ml-3" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates (e.g. Code, Blog, Email...)"
                className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-gray-600 text-sm"
              />
            </div>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 border
                ${activeTab === cat
                  ? "bg-white/10 text-white border-white/20 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]"
                  : "bg-transparent text-gray-400 border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* TEMPLATE GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p>No templates found. Try a different search or category.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {templates.map((t) => {
              const meta = CATEGORY_META[t.category] || DEFAULT_META;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={t.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                  className="bg-[#0B101A]/60 backdrop-blur-md rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-500 flex flex-col group relative overflow-hidden"
                >
                  {/* Top gradient bar */}
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${meta.color} opacity-30 group-hover:opacity-100 transition-opacity`} />

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} p-[1px] shadow-lg`}>
                        <div className="w-full h-full bg-[#0B101A] rounded-[11px] flex items-center justify-center">
                          <Icon size={18} className="text-white" />
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-gray-400">
                        <Zap size={10} className="text-yellow-500 fill-yellow-500" />
                        {t.usage_count > 0 ? `${t.usage_count}` : "New"}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-violet-200 transition-colors">{t.title}</h3>
                    <p className="text-xs text-gray-400 font-medium mb-4 line-clamp-2 leading-relaxed">{t.description}</p>

                    {/* Template preview */}
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-[12px] text-gray-300 font-medium leading-relaxed font-sans shadow-inner">
                      {renderTemplate(t.prompt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-4 border-t border-white/5 bg-black/20 flex gap-3">
                    <button
                      onClick={(e) => handleCopy(e, t.prompt, t.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                    >
                      {copiedId === t.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      {copiedId === t.id ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => handleUseTemplate(t)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-400/50 rounded-lg text-xs font-bold text-violet-300 transition-colors"
                    >
                      <MessageCircle size={14} /> Use in Chat
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

      </main>
    </div>
  );
}
