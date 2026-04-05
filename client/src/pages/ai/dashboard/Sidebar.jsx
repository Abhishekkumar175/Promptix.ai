import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PenLine,
  Image,
  FileText,
  Users,
  LayoutTemplate,
  MessageCircle,
  Mic,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  Command
} from "lucide-react";
import { UserButton, useUser, Protect } from "@clerk/clerk-react";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/ai" },
  { name: "Chat", icon: MessageCircle, path: "/ai/chat" },
  { name: "Chat with PDF", icon: FileText, path: "/ai/pdf" },
  { name: "Image Studio", icon: Image, path: "/ai/image" },
  { name: "Review Resume", icon: FileText, path: "/ai/review" },
  { name: "Mock Interview Bot", icon: Mic, path: "/ai/interview" },
  { name: "Prompt Templates", icon: LayoutTemplate, path: "/ai/templates" },
  { name: "Community", icon: Users, path: "/ai/community" },
];

export default function Sidebar() {
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`relative h-full bg-[#050812] border-r border-[#1e2434] flex flex-col pt-2 shrink-0 z-50 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
      ${isCollapsed ? "w-[72px]" : "w-[210px]"}`}
    >
      {/* Decorative vertical gradient line */}
      <div className="absolute right-0 top-0 w-[1px] h-full bg-linear-to-b from-transparent via-violet-500/20 to-transparent pointer-events-none" />

      {/* 🔴 COLLAPSE TOGGLE */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-8 bg-[#0B101A] border border-white/10 rounded-full p-1 z-50 text-gray-400 hover:text-white hover:bg-violet-600 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] group"
      >
        {isCollapsed ? (
          <PanelLeftOpen size={16} className="group-hover:scale-110 transition-transform" />
        ) : (
          <PanelLeftClose size={16} className="group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* 🔝 LOGO BRANDING */}
      <div className={`flex items-center mx-4 mb-6 shrink-0 transition-all duration-400 ${isCollapsed ? "justify-center py-2" : "gap-3 px-2 py-3"}`}>
        <div className="relative group/logo cursor-pointer shrink-0">
          <div className="absolute inset-0 bg-linear-to-r from-violet-600 to-indigo-600 rounded-[10px] blur-md opacity-40 group-hover/logo:opacity-80 transition-opacity duration-500" />
          <div className="relative w-8 h-8 rounded-[10px] bg-linear-to-b from-white/10 to-[#0e142e] border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-md">
            <Command className="w-4 h-4 text-white/90 transform group-hover/logo:rotate-12 transition-transform duration-500" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-violet-500 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.8)]">
              <Sparkles className="w-1.5 h-1.5 text-white" />
            </div>
          </div>
        </div>
        {!isCollapsed && (
          <div className="flex flex-col whitespace-nowrap overflow-hidden pt-1">
            <div className="flex items-baseline mb-0">
              <span className="text-[19px] font-extrabold tracking-tight text-white drop-shadow-sm">
                Promptix
              </span>
              <span className="text-[15px] font-bold tracking-normal italic text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-indigo-400 ml-0.5">
                .ai
              </span>
            </div>
            <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500 -mt-1">Premium Platform</span>
          </div>
        )}
      </div>

      {/* 🧭 MENU NAV */}
      <nav className={`flex-1 space-y-1 overflow-y-auto no-scrollbar transition-all duration-400 ${isCollapsed ? "px-2" : "px-3"}`}>
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === "/ai"}
            title={isCollapsed ? item.name : ""}
            className={({ isActive }) =>
              `relative flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden group
              ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"}
              ${
                isActive
                  ? "text-white bg-violet-500/10 shadow-[0_4px_20px_-10px_rgba(139,92,246,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-[15%] w-[3px] h-[70%] bg-violet-500 rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                )}
                
                {isActive && !isCollapsed && (
                  <div className="absolute right-0 top-0 w-32 h-full bg-linear-to-l from-violet-500/10 to-transparent pointer-events-none" />
                )}

                <item.icon 
                  size={isCollapsed ? 22 : 18} 
                  className={`shrink-0 transition-colors duration-300 ${isActive ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"}`} 
                />
                
                {!isCollapsed && (
                  <span className="whitespace-nowrap flex-1">{item.name}</span>
                )}
                
                {/* Optional fake "New" or "Beta" badge can be added conditionally later */}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 🔻 BOTTOM USER PROFILE */}
      <div className={`mb-4 mt-2 mx-3 rounded-2xl bg-[#0a0f1c] border border-white/5 flex items-center shrink-0 transition-all duration-400 cursor-pointer relative group/user ${isCollapsed ? "p-1.5 justify-center" : "p-2 gap-2 hover:border-white/10 shadow-lg"}`}>
        
        {/* Glow behind profile */}
        <div className="absolute inset-0 bg-violet-500/5 rounded-2xl blur-md opacity-0 group-hover/user:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative shrink-0 flex items-center justify-center">
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{ 
              elements: { 
                userButtonAvatarBox: `border-2 border-violet-500/50 shadow-md ${isCollapsed ? "w-8 h-8" : "w-10 h-10"}`
              } 
            }} 
          />
        </div>

        {!isCollapsed && (
          <div className="flex-1 leading-tight min-w-0 pr-1 pointer-events-none">
            <p className="text-[12px] text-white font-semibold truncate leading-none mb-1">
              {user?.fullName || "Guest"}
            </p>
            <div className="flex items-center gap-1.5">
              <Zap size={10} className="text-violet-400 fill-violet-400" />
              <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">
                <Protect plan="premium" fallback="Free Tier">Pro Plan</Protect>
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
