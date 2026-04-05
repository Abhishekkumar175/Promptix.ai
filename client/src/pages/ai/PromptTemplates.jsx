import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Copy, MessageCircle, Check, Zap, Map, Code, BookOpen, Megaphone, TerminalSquare, Palette } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = ["All", "Marketing", "Coding", "Academic", "Images", "Business"];

const PROMPTS = [
  {
    id: 1,
    title: "Viral Twitter Thread",
    category: "Marketing",
    icon: Megaphone,
    color: "from-blue-500 to-cyan-500",
    uses: "14.2k",
    description: "Generates a highly engaging 5-part hook-driven Twitter thread.",
    template: "Write a 5-part Twitter thread about [TOPIC]. Hook the reader on the first tweet using a controversial statement, outline 3 valuable lessons in the body, and add a call to action at the end.",
  },
  {
    id: 2,
    title: "React Component Boilerplate",
    category: "Coding",
    icon: Code,
    color: "from-gray-600 to-gray-800",
    uses: "8.9k",
    description: "Scaffolds a clean React component with Tailwind and Framer Motion.",
    template: "Create a functional React component named [COMPONENT_NAME]. Use Tailwind CSS for styling and add a basic entrance animation using Framer Motion. Ensure it handles the following props: [PROPS].",
  },
  {
    id: 3,
    title: "Midjourney Cinematic Portrait",
    category: "Images",
    icon: Palette,
    color: "from-pink-500 to-fuchsia-500",
    uses: "32.1k",
    description: "Structured prompt for hyper-realistic cinematic AI portraits.",
    template: "Cinematic portrait of [SUBJECT], dramatic rim lighting, shot on 35mm lens, 8k resolution, highly detailed, sharp focus, --ar 16:9 --v 6.0",
  },
  {
    id: 4,
    title: "Essay Outline Generator",
    category: "Academic",
    icon: BookOpen,
    color: "from-emerald-500 to-teal-500",
    uses: "5.4k",
    description: "Structures a comprehensive university-level essay outline.",
    template: "Act as an expert academic tutor. Create a detailed 5-paragraph essay outline on the topic of [TOPIC]. Include a strong thesis statement, 3 topic sentences for body paragraphs, and a compelling conclusion.",
  },
  {
    id: 5,
    title: "Cold Outreach Email",
    category: "Business",
    icon: Map,
    color: "from-orange-500 to-red-500",
    uses: "11.5k",
    description: "High-converting B2B cold email template using AIDA.",
    template: "Write a cold outreach email to [DECISION_MAKER_NAME] at [COMPANY_NAME] offering [YOUR_SERVICE]. Use the AIDA framework. Keep it under 150 words and include a low-friction call to action.",
  },
  {
    id: 6,
    title: "SQL Query Optimizer",
    category: "Coding",
    icon: TerminalSquare,
    color: "from-gray-600 to-gray-800",
    uses: "3.2k",
    description: "Analyzes and rewrites slow SQL queries for better performance.",
    template: "Analyze the following SQL query for performance issues. Rewrite it to be more efficient, use proper joins, and explain what changes you made and why: \n\n[PASTE_QUERY_HERE]",
  }
];

// Helper to highlight variables [LIKE_THIS]
const renderTemplate = (text) => {
  const parts = text.split(/(\[[A-Z_]+\])/g);
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
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const filteredPrompts = PROMPTS.filter(p => {
    const matchesCategory = activeTab === "All" || p.category === activeTab;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseTemplate = (text) => {
    // Copy to clipboard explicitly
    navigator.clipboard.writeText(text);
    // Redirect to chat
    navigate("/ai/chat");
  };

  return (
    <div className="h-full w-full bg-[#030712] text-white flex flex-col relative overflow-y-auto overflow-x-hidden no-scrollbar pb-20">
      
      {/* Intense Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <main className="flex-1 p-4 md:p-8 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* HERO HEADER */}
        <div className="flex flex-col items-center justify-center text-center mt-6 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Zap size={14} className="fill-violet-400" /> Prompt Library
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">
            What do you want to create?
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-8">
            Access hundreds of highly optimized prompt structures designed by experts. Get better results, faster.
          </p>

          {/* SEARCH BAR */}
          <div className="relative w-full max-w-2xl group">
             <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="relative flex items-center bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl transition-colors group-hover:border-white/20">
               <Search className="text-gray-500 ml-3" size={20} />
               <input 
                 type="text"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search templates (e.g. Code, Twitter, Essay...)"
                 className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-gray-600 text-sm"
               />
             </div>
          </div>
        </div>

        {/* CATEGORY NAV */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all duration-300 border
                ${activeTab === cat 
                  ? "bg-white/10 text-white border-white/20 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]" 
                  : "bg-transparent text-gray-400 border-white/5 hover:border-white/10 hover:bg-white-[0.02]"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* TEMPLATE GRID */}
        {filteredPrompts.length === 0 ? (
           <div className="text-center text-gray-500 py-20">
              <p>No prompt templates found matching your search.</p>
           </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPrompts.map((p) => {
              const Icon = p.icon;
              return (
                <motion.div 
                  key={p.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                  className="bg-[#0B101A]/60 backdrop-blur-md rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-500 flex flex-col group relative overflow-hidden"
                >
                  {/* Hover Edge Glow */}
                  <div className={`absolute top-0 inset-x-0 h-1 bg-linear-to-r ${p.color} opacity-30 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${p.color} p-[1px] shadow-lg`}>
                         <div className="w-full h-full bg-[#0B101A] rounded-[11px] flex items-center justify-center">
                            <Icon size={18} className="text-white" />
                         </div>
                      </div>
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-gray-400">
                        <Zap size={10} className="text-yellow-500 fill-yellow-500" /> {p.uses}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-violet-200 transition-colors">{p.title}</h3>
                    <p className="text-xs text-gray-400 font-medium mb-4 line-clamp-2 leading-relaxed">{p.description}</p>

                    {/* Template Preview */}
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 text-[12px] text-gray-300 font-medium leading-relaxed font-sans shadow-inner">
                      {renderTemplate(p.template)}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 py-4 border-t border-white/5 bg-black/20 flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
                     <button
                       onClick={(e) => handleCopy(e, p.template, p.id)}
                       className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg text-xs font-bold text-gray-300 transition-colors"
                     >
                       {copiedId === p.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                       {copiedId === p.id ? "Copied!" : "Copy"}
                     </button>
                     <button
                       onClick={() => handleUseTemplate(p.template)}
                       className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-400/50 rounded-lg text-xs font-bold text-violet-300 transition-colors"
                     >
                       <MessageCircle size={14} /> Use Template
                     </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
        
      </main>
    </div>
  );
}
