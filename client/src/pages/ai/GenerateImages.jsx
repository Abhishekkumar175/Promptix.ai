import { useState, useEffect } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Download,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  X,
  ExternalLink,
  Wand2,
  Ratio,
  Palette,
  Images,
  Compass,
} from "lucide-react";
import { useApi } from "../../hooks/useApi";

const STYLES = [
  { id: "Cinematic", label: "Cinematic", desc: "Film lighting & bokeh" },
  { id: "Realistic", label: "Realistic", desc: "Hyperrealistic 8k photo" },
  { id: "Anime", label: "Anime", desc: "Makoto Shinkai aesthetic" },
  { id: "3D Render", label: "3D Render", desc: "Octane & Unreal Engine 5" },
  { id: "Cyberpunk", label: "Cyberpunk", desc: "Neon lights & holographic" },
  { id: "Fantasy", label: "Fantasy", desc: "Mythical & magical glow" },
  { id: "Oil Painting", label: "Oil Painting", desc: "Classic canvas impasto" },
  { id: "Minimalist", label: "Minimalist", desc: "Clean lines & negative space" },
];

const RATIOS = [
  { key: "1:1", label: "Square", sub: "1024x1024", desc: "Post / Avatar" },
  { key: "16:9", label: "Landscape", sub: "1280x720", desc: "Desktop / Wallpaper" },
  { key: "9:16", label: "Portrait", sub: "720x1280", desc: "Story / Mobile" },
];

const INSPIRATION_PROMPTS = [
  "A cyberpunk samurai standing on a neon rainy rooftop in Tokyo",
  "A majestic glowing phoenix rising from stardust in deep space",
  "A cozy hobbit cottage surrounded by glowing fairy lights at twilight",
  "A hyperrealistic portrait of an astronaut with earth reflected in the visor",
];

export default function GenerateImages() {
  const api = useApi();

  // Generator inputs
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Cinematic");
  const [ratio, setRatio] = useState("1:1");

  // Active generation state
  const [loading, setLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  // Gallery & History
  const [activeTab, setActiveTab] = useState("studio"); // 'studio' | 'gallery'
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Zoom modal state
  const [zoomModalImage, setZoomModalImage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Load user's past generations on mount
  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await api.get("/api/image/history");
      if (res.success && res.images) {
        setHistory(res.images);
        if (!activeImage && res.images.length > 0) {
          setActiveImage(res.images[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load image history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Escape key closes zoom modal
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setZoomModalImage(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Magic Prompt Enhance with Gemini
  const handleMagicEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    try {
      setIsEnhancing(true);
      const res = await api.post("/api/image/enhance-prompt", {
        prompt: prompt.trim(),
        style,
      });
      if (res.success && res.enhancedPrompt) {
        setPrompt(res.enhancedPrompt);
      }
    } catch (err) {
      console.error("Prompt enhance error:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Generate Image
  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    try {
      setLoading(true);
      setActiveTab("studio");

      const res = await api.post("/api/image/generate", {
        prompt: prompt.trim(),
        style,
        ratio,
        enhance: false,
      });

      if (res.success && res.image) {
        setActiveImage(res.image);
        setHistory((prev) => [res.image, ...prev]);
      } else {
        throw new Error(res.message || "Failed to render artwork.");
      }
    } catch (err) {
      console.error("Generate error:", err);
      alert(err.message || "Failed to generate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Download image file with watermark cropped out
  const handleDownload = async (imageUrl, promptText = "artwork") => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          // Crop the bottom 28px to eliminate any platform watermark
          const cropHeight = Math.max(img.naturalHeight - 28, 100);
          canvas.width = img.naturalWidth;
          canvas.height = cropHeight;
          ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            cropHeight,
            0,
            0,
            canvas.width,
            canvas.height
          );
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = blobUrl;
                const cleanName = promptText.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_");
                link.download = `Promptix_${cleanName || "art"}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
              } else {
                window.open(imageUrl, "_blank");
              }
            },
            "image/jpeg",
            0.98
          );
        } catch {
          window.open(imageUrl, "_blank");
        }
      };
      img.onerror = () => window.open(imageUrl, "_blank");
      img.src = imageUrl;
    } catch {
      window.open(imageUrl, "_blank");
    }
  };

  // Copy prompt to clipboard
  const handleCopyPrompt = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Delete an image from history
  const handleDeleteImage = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Remove this image from your history?")) return;
    try {
      await api.del(`/api/image/${id}`);
      setHistory((prev) => prev.filter((img) => img.id !== id));
      if (activeImage?.id === id) {
        const remaining = history.filter((img) => img.id !== id);
        setActiveImage(remaining[0] || null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="h-full w-full bg-[#030712] text-white flex flex-col relative overflow-y-auto no-scrollbar">
      {/* Background ambient glows */}
      <div className="fixed top-[-5%] left-[-10%] w-[550px] h-[550px] bg-fuchsia-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* ── TOP HEADER BAR ── */}
      <header className="h-14 px-4 sm:px-6 border-b border-white/5 bg-[#050812]/90 backdrop-blur-md flex items-center justify-between shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-fuchsia-600/20 to-pink-600/20 border border-fuchsia-500/30 flex items-center justify-center shadow-inner">
            <ImageIcon className="text-fuchsia-400 w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Image Studio
              <span className="px-2 py-0.5 rounded-full bg-linear-to-r from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30 text-[10px] font-mono text-fuchsia-300 hidden sm:inline-block">
                FLUX.1 Engine
              </span>
            </h1>
          </div>
        </div>

        {/* Studio / Gallery Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "studio"
                ? "bg-linear-to-r from-fuchsia-600 to-pink-600 text-white shadow-xs"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles size={13} />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === "gallery"
                ? "bg-linear-to-r from-fuchsia-600 to-pink-600 text-white shadow-xs"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Images size={13} />
            <span>My Gallery</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/15 text-[10px] font-mono">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 p-4 md:p-6 relative z-10 w-full max-w-7xl mx-auto">
        {activeTab === "studio" ? (
          // ── STUDIO SPLIT VIEW ──
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-140px)]">
            {/* LEFT: CONFIGURATION CONTROLS */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col shadow-2xl relative overflow-hidden group">
                <div className="space-y-6 relative z-10">
                  {/* Prompt Textarea */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-semibold text-gray-200 flex items-center gap-1.5">
                        <span>Prompt</span>
                        <span className="text-fuchsia-400">*</span>
                      </label>

                      {/* ✨ Magic Enhance Button */}
                      <button
                        onClick={handleMagicEnhance}
                        disabled={!prompt.trim() || isEnhancing || loading}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 hover:text-fuchsia-200 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group/magic"
                        title="Enhance prompt with Gemini 3.5 Flash"
                      >
                        {isEnhancing ? (
                          <>
                            <Loader2 size={11} className="animate-spin text-fuchsia-400" />
                            <span>Enhancing...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 size={11} className="text-fuchsia-400 group-hover/magic:rotate-12 transition-transform" />
                            <span>Magic Enhance</span>
                          </>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., A cyberpunk samurai standing on a neon rainy rooftop in Tokyo..."
                      className="w-full h-28 rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-4 focus:ring-fuchsia-500/10 transition-all resize-none shadow-inner leading-relaxed"
                    />

                    {/* Quick Inspiration Chips */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1">
                        <Compass size={11} />
                        Prompt Ideas
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {INSPIRATION_PROMPTS.map((insp, i) => (
                          <button
                            key={i}
                            onClick={() => setPrompt(insp)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-gray-200 text-left truncate max-w-full transition-all cursor-pointer"
                          >
                            {insp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Canvas Aspect Ratio */}
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-200 flex items-center gap-1.5">
                      <Ratio size={14} className="text-fuchsia-400" />
                      <span>Canvas Ratio</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {RATIOS.map((item) => (
                        <button
                          key={item.key}
                          onClick={() => setRatio(item.key)}
                          className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                            ratio === item.key
                              ? "bg-fuchsia-600/15 border-fuchsia-500/60 shadow-[inset_0_0_20px_rgba(217,70,239,0.15)] text-white"
                              : "bg-black/30 border-white/5 hover:border-white/15 text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          <span className="text-xs font-bold">{item.key}</span>
                          <span className="text-[10px] font-medium opacity-80 mt-0.5">{item.label}</span>
                          <span className="text-[9px] text-gray-500 font-mono mt-0.5">{item.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aesthetics & Style */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-semibold text-gray-200 flex items-center gap-1.5">
                        <Palette size={14} className="text-fuchsia-400" />
                        <span>Aesthetics & Style</span>
                      </label>
                      <span className="text-[10px] text-gray-500 font-mono">{style}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {STYLES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStyle(s.id)}
                          className={`p-2 rounded-xl text-left border transition-all duration-200 cursor-pointer flex flex-col ${
                            style === s.id
                              ? "bg-fuchsia-600/20 text-white border-fuchsia-500/50 shadow-xs"
                              : "bg-white/5 text-gray-400 border-white/5 hover:border-white/15 hover:text-gray-200"
                          }`}
                        >
                          <span className="text-xs font-bold truncate">{s.label}</span>
                          <span className="text-[9px] text-gray-500 truncate mt-0.5">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate CTA Button */}
                <div className="mt-8 pt-4 border-t border-white/5">
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className="w-full relative group overflow-hidden rounded-xl p-[1px] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-fuchsia-600/20 cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-fuchsia-600 via-pink-600 to-fuchsia-600 transition-opacity duration-300" />
                    <div className="relative px-5 py-3 rounded-[11px] bg-[#0B101A] group-hover:bg-transparent transition-colors flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-fuchsia-400" />
                          <span className="text-[13px] font-bold text-white tracking-wide">
                            Synthesizing with FLUX.1...
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} className="text-fuchsia-400 group-hover:text-white transition-colors" />
                          <span className="text-[13px] font-bold text-white tracking-wide">
                            Generate Artwork
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: ACTIVE CANVAS VIEWER */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-[#0B101A]/60 backdrop-blur-lg border border-white/10 rounded-3xl flex flex-col h-full min-h-[520px] shadow-2xl relative overflow-hidden">
                {/* Canvas Toolbar */}
                <div className="h-12 border-b border-white/5 flex items-center justify-between px-5 bg-black/40 shrink-0">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <ImageIcon size={13} className="text-fuchsia-400" />
                    <span>Canvas Preview</span>
                  </div>

                  {activeImage && !loading && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyPrompt(activeImage.id, activeImage.prompt)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors cursor-pointer"
                        title="Copy prompt"
                      >
                        {copiedId === activeImage.id ? (
                          <>
                            <Check size={12} className="text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span className="text-[11px]">Prompt</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDownload(activeImage.image_url, activeImage.prompt)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-linear-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 rounded-lg transition-all shadow-md shadow-fuchsia-600/20 cursor-pointer"
                        title="Download high-res artwork"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Main View Area */}
                <div className="flex-1 flex flex-col p-4 sm:p-6 relative items-center justify-center">
                  {!activeImage && !loading && (
                    <div className="w-full h-full rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center p-6">
                      <div className="w-16 h-16 bg-linear-to-br from-fuchsia-600/10 to-pink-600/10 border border-fuchsia-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(217,70,239,0.1)]">
                        <ImageIcon size={26} className="text-fuchsia-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Pristine Canvas</h3>
                      <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                        Describe what you want to create on the left, pick an aesthetic style, and click Generate Artwork.
                      </p>
                    </div>
                  )}

                  {/* Rendering Loader Animation */}
                  {loading && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 bg-fuchsia-600 rounded-2xl blur-2xl opacity-40 animate-pulse" />
                        <div className="absolute inset-0 border-2 border-fuchsia-400 border-dashed rounded-2xl animate-[spin_8s_linear_infinite]" />
                        <div className="absolute inset-2 border-[1.5px] border-pink-400 border-t-transparent rounded-full animate-[spin_3s_linear_infinite_reverse]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="text-fuchsia-300 animate-pulse" size={28} />
                        </div>
                      </div>
                      <h4 className="text-base font-bold text-white mb-1.5">
                        Rendering Masterpiece
                      </h4>
                      <p className="text-xs text-gray-400 font-mono">
                        FLUX.1 • {style} • {ratio}
                      </p>
                    </div>
                  )}

                  {/* Active Generated Image Display */}
                  {activeImage && !loading && (
                    <div className="relative w-full h-full flex flex-col items-center justify-center group/card">
                      <div
                        onClick={() => setZoomModalImage(activeImage)}
                        className="relative max-w-full max-h-[500px] rounded-2xl overflow-hidden cursor-zoom-in shadow-2xl border border-white/10 group"
                      >
                        <img
                          src={activeImage.image_url}
                          alt={activeImage.prompt}
                          className="max-h-[500px] w-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                        />

                        {/* Hover Overlay Button */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomModalImage(activeImage);
                            }}
                            className="p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all shadow-lg hover:scale-110 cursor-pointer"
                            title="Expand view"
                          >
                            <Maximize2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Prompt Details Bar Below Canvas */}
                      <div className="w-full mt-4 p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-300 font-medium truncate">
                            {activeImage.prompt}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-mono">
                            <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/5 text-fuchsia-400">
                              {activeImage.style || style}
                            </span>
                            <span>•</span>
                            <span>{activeImage.aspect_ratio || ratio}</span>
                          </div>
                        </div>

                        {/* Re-generate / Remix with same prompt */}
                        <button
                          onClick={() => {
                            setPrompt(activeImage.prompt);
                            setStyle(activeImage.style || "Cinematic");
                            setRatio(activeImage.aspect_ratio || "1:1");
                            handleGenerate();
                          }}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                          title="Generate variation"
                        >
                          <RotateCcw size={12} />
                          <span className="hidden sm:inline">Remix</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ── MY GALLERY GRID VIEW ──
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">My Creations</h2>
                <p className="text-xs text-gray-400 mt-1">
                  All artwork generated with your account ({history.length} creations)
                </p>
              </div>

              <button
                onClick={() => setActiveTab("studio")}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 rounded-xl transition-all shadow-md shadow-fuchsia-600/20 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Create New Art</span>
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="py-20 text-center max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-gray-500">
                  <Images size={28} />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">No artwork created yet</h3>
                <p className="text-xs text-gray-400 mb-6">
                  Use the Studio tab to generate your first AI artwork with FLUX.1.
                </p>
                <button
                  onClick={() => setActiveTab("studio")}
                  className="px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-fuchsia-600 to-pink-600 rounded-xl"
                >
                  Go to Studio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveImage(item);
                      setActiveTab("studio");
                    }}
                    className="group relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B101A] shadow-xl transition-all duration-300 hover:border-fuchsia-500/50 hover:shadow-fuchsia-500/10 cursor-pointer flex flex-col"
                  >
                    {/* Image Preview */}
                    <div className="aspect-square w-full overflow-hidden bg-black/40 relative">
                      <img
                        src={item.image_url}
                        alt={item.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Hover Overlay Actions */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomModalImage(item);
                            }}
                            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white text-xs transition-colors"
                            title="Expand"
                          >
                            <Maximize2 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteImage(item.id, e)}
                            className="p-1.5 rounded-lg bg-black/60 hover:bg-red-500/80 text-white text-xs transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-fuchsia-300 bg-fuchsia-600/30 px-2 py-0.5 rounded-md border border-fuchsia-500/40">
                            {item.style || "Cinematic"}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item.image_url, item.prompt);
                            }}
                            className="p-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition-colors"
                            title="Download"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-3 text-left">
                      <p className="text-xs text-gray-300 font-medium line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FULL SCREEN ZOOM MODAL ── */}
      {zoomModalImage && (
        <div
          onClick={() => setZoomModalImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-[#070b16] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Modal Header */}
            <div className="h-12 px-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <span className="text-xs font-semibold text-gray-300 truncate max-w-md">
                {zoomModalImage.prompt}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(zoomModalImage.image_url, zoomModalImage.prompt)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-linear-to-r from-fuchsia-600 to-pink-600 rounded-lg hover:opacity-90"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setZoomModalImage(null)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="p-2 sm:p-4 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={zoomModalImage.image_url}
                alt={zoomModalImage.prompt}
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
