import { useState } from "react";
import { Sparkles, Image as ImageIcon, Loader2, Maximize2, Download, Share2, Layers, Settings2 } from "lucide-react";
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

const STYLES = ["Realistic", "Anime", "3D Render", "Cyberpunk", "Cinematic"];
const RATIOS = [
  { key: "1:1", label: "Square", sub: "1024x1024" },
  { key: "16:9", label: "Wide", sub: "1920x1080" },
  { key: "9:16", label: "Portrait", sub: "1080x1920" }
];

export default function GenerateImages() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [ratio, setRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setImageUrl("");

    // Simulate API Call
    setTimeout(() => {
      setImageUrl("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop");
      setLoading(false);
    }, 2500);
  };

  return (
    <div className="h-full w-full bg-[#030712] text-white flex flex-col relative overflow-y-auto overflow-x-hidden no-scrollbar">
      {/* Intense Background Glows */}
      <div className="fixed top-[-5%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

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
              <div className="absolute inset-0 bg-linear-to-b from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-fuchsia-600/20 to-pink-600/20 border border-fuchsia-500/30 flex items-center justify-center shadow-inner">
                  <ImageIcon className="text-fuchsia-400 w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Image Studio</h2>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Midjourney V6 Alternative</p>
                </div>
              </div>

              <div className="flex-1 space-y-6 relative z-10">
                {/* Core Prompt */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-300">
                    What should we create?
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A neon lit futuristic city with flying cars in rain..."
                    className="w-full h-24 rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-fuchsia-500/50 focus:bg-black/60 focus:ring-4 focus:ring-fuchsia-500/10 transition-all resize-none shadow-inner"
                  />
                </div>

                {/* Aspect Ratios */}
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-gray-300">
                    Canvas Ratio
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {RATIOS.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setRatio(item.key)}
                        className={`relative flex flex-col items-center justify-center py-2 rounded-xl border transition-all duration-300 overflow-hidden group/btn
                          ${ratio === item.key 
                            ? "bg-fuchsia-600/10 border-fuchsia-500/50 shadow-[inset_0_0_20px_rgba(217,70,239,0.15)]" 
                            : "bg-black/30 border-white/5 hover:border-white/10 hover:bg-white-[0.02]"
                          }`}
                      >
                        {ratio === item.key && (
                          <div className="absolute top-0 inset-x-0 h-[1px] bg-linear-to-r from-transparent via-fuchsia-400 to-transparent opacity-80" />
                        )}
                        <span className={`text-xs font-bold ${ratio === item.key ? "text-white" : "text-gray-400 group-hover/btn:text-gray-300"}`}>
                          {item.key}
                        </span>
                        <span className="text-[9px] text-gray-600 font-medium mt-0.5">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aesthetics & Style */}
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <label className="flex items-center gap-2 text-[13px] font-semibold text-gray-300">
                       Aesthetics & Style
                     </label>
                     <span className="text-[9px] uppercase font-bold tracking-wider text-fuchsia-500 bg-fuchsia-500/10 px-1.5 py-0.5 rounded-md">Pro Engine</span>
                   </div>
                   
                   <div className="flex flex-wrap gap-2">
                     {STYLES.map((s) => (
                       <button
                         key={s}
                         onClick={() => setStyle(s)}
                         className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border
                           ${style === s 
                             ? "bg-fuchsia-600/20 text-fuchsia-200 border-fuchsia-500/40" 
                             : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-gray-200"
                           }`}
                       >
                         {s}
                       </button>
                     ))}
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
                  <div className={`absolute inset-0 transition-opacity duration-300 bg-linear-to-r from-fuchsia-600 to-pink-500 ${loading ? "opacity-50" : "opacity-100 group-hover:opacity-90"}`} />
                  <div className={`absolute inset-0 blur-md transition-opacity duration-300 bg-linear-to-r from-fuchsia-600 to-pink-500 ${loading ? "opacity-0" : "opacity-0 group-hover:opacity-40"}`} />
                  
                  <div className="relative px-5 py-3 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span className="text-[13px] font-bold text-white tracking-wide">Rendering Canvas...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="text-white group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-bold text-white tracking-wide shadow-sm">Generate Artwork</span>
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
              
              {/* Studio Toolbar (Mac Dots + Studio Tabs + Tools) */}
              <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-black/20 shrink-0 relative z-20">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>

                {imageUrl && !loading ? (
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 text-[11px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-md hover:bg-emerald-400/20 transition-colors">
                      <Download size={14} className="inline mr-1 -mt-0.5" /> Save
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors title='Share'">
                      <Share2 size={14} />
                    </button>
                  </div>
                ) : <div className="w-16"></div>}
              </div>

              {/* EDITOR CANVAS */}
              <div className="flex-1 flex flex-col p-4 relative no-scrollbar items-center justify-center">

                {!imageUrl && !loading && (
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-linear-to-br from-fuchsia-600/10 to-pink-600/10 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(217,70,239,0.1)]">
                      <Layers size={24} className="text-fuchsia-500/50" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-white mb-2">Pristine Canvas</h3>
                    <p className="text-xs text-gray-500 max-w-[250px]">
                      Describe your masterpiece on the left, tweak settings, and generate.
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    {/* Pulsing Core Animation */}
                    <div className="relative w-20 h-20 mb-6">
                       <div className="absolute inset-0 bg-fuchsia-600 rounded-lg blur-2xl opacity-40 animate-pulse" />
                       <div className="absolute inset-0 border-2 border-fuchsia-400 border-dashed rounded-lg animate-[spin_6s_linear_infinite]" />
                       <div className="absolute inset-2 border-[1.5px] border-pink-400 border-t-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]" />
                       <div className="absolute inset-0 flex items-center justify-center">
                         <Sparkles className="text-fuchsia-300 animate-pulse" size={24} />
                       </div>
                    </div>
                    <div className="text-[15px] font-bold text-transparent bg-clip-text bg-linear-to-r from-fuchsia-400 to-pink-400 animate-pulse mb-1.5">
                       Rendering Visuals
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
                       Applying {style} Textures...
                    </div>
                  </div>
                )}

                {imageUrl && !loading && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden group/img bg-black/40 border border-white/5"
                  >
                    <img 
                      src={imageUrl} 
                      alt="Generated AI Art" 
                      className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                    />
                    
                    {/* Hover HUD */}
                    <div className="absolute bottom-4 inset-x-4 flex justify-between items-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-300">
                       <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                          <Settings2 size={12} className="text-gray-400" />
                          <span className="text-[10px] text-white font-medium">{ratio} • {style}</span>
                       </div>
                       
                       <button className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10 hover:bg-white/10 hover:text-fuchsia-400 transition-colors text-white">
                         <Maximize2 size={14} />
                       </button>
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
