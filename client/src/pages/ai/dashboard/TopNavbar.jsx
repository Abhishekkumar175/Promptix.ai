import { Bell, Search, Hexagon } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function TopNavbar() {
  const location = useLocation();
  
  // Quick dynamic title logic
  let pageTitle = "Dashboard Overview";
  if (location.pathname.includes("chat")) pageTitle = "AI Chat Assistant";
  else if (location.pathname.includes("article")) pageTitle = "Write Article";
  else if (location.pathname.includes("image")) pageTitle = "Image Generator";
  else if (location.pathname.includes("remove-bg")) pageTitle = "Background Remover";

  return (
    <header className="
      h-14
      bg-[#030712]/70
      backdrop-blur-2xl
      border-b border-white/[0.03]
      flex items-center justify-between px-6
      sticky top-0 z-40
      shadow-[0_4px_30px_rgba(0,0,0,0.3)]
    ">
      {/* Decorative top edge highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-linear-to-r from-transparent via-white/10 to-transparent"></div>

      {/* Left side: Breadcrumb & Title */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <Hexagon size={12} className="text-violet-500/70 fill-violet-500/20" />
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            Workspace
          </p>
        </div>
        <div className="flex items-center gap-3 text-white">
          <h2 className="text-lg font-bold tracking-tight text-gray-100">{pageTitle}</h2>
        </div>
      </div>

      {/* Right side: Search & Icons */}
      <div className="flex items-center gap-3">
        
        {/* Advanced Search Input Design */}
        <div className="hidden lg:flex relative group cursor-text">
          <div className="absolute inset-0 bg-violet-500/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center gap-2 bg-[#0B101A] border border-white/10 rounded-full px-3 py-1.5 hover:border-white/20 transition-all duration-300 w-64 focus-within:w-72 focus-within:border-violet-500/50 shadow-inner">
            <Search size={16} className="text-gray-400 group-focus-within:text-violet-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search features, docs..." 
              className="bg-transparent border-none outline-none text-[13px] text-white placeholder:text-gray-600 w-full"
            />
            <div className="flex items-center justify-center px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] font-medium text-gray-400 border border-white/5 shadow-sm">
              ⌘K
            </div>
          </div>
        </div>

        {/* Glossy Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] flex items-center justify-center transition-all shadow-sm group">
            <Bell size={18} className="text-gray-400 group-hover:text-white transition-colors" />
            {/* Pulsing Red Dot */}
            <span className="absolute top-2 right-2.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
            </span>
          </button>
        </div>
        
      </div>
    </header>
  );
}
