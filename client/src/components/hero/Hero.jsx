import { motion } from "framer-motion";
import { useClerk, useUser } from "@clerk/clerk-react";
import { ArrowRight, Sparkles } from "lucide-react";
import dashboardImg from "../../assets/dashboard.png";

export default function Hero() {
  const { openSignIn } = useClerk();
  const { user } = useUser();

  return (
    <section id="hero" className="relative overflow-hidden bg-[#0a0a0a] pt-36 pb-4">
      
      {/* Background subtle glow */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08)_0%,transparent_60%)] pointer-events-none z-0" />

      {/* ============ HERO TEXT ============ */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-[80px] font-extrabold tracking-[-0.04em] leading-[1.08] text-white mb-6"
        >
          Learn smarter.
          <br />
          Build faster.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="max-w-2xl text-gray-400 text-lg md:text-xl leading-relaxed mb-10"
        >
          One AI workspace for chat, PDF analysis, 
          image generation, mock interviews, and more — everything you need to grow your skills.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20"
        >
          <div className="relative group">
            {/* Persistent pulsing glow behind button */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-violet-600 opacity-60 blur-lg group-hover:opacity-80 animate-[pulse_2s_ease-in-out_infinite]" />
            <button
              onClick={() => {
                if (user) {
                  window.location.href = "/ai";
                } else {
                  openSignIn({ afterSignInUrl: "/ai", afterSignUpUrl: "/ai" });
                }
              }}
              className="relative px-8 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-[15px] hover:shadow-[0_0_50px_rgba(139,92,246,0.4)] hover:scale-[1.03] transition-all duration-300 flex items-center gap-2"
            >
              Start building free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <button
            onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3.5 rounded-full border border-white/[0.12] text-white/80 font-medium text-[15px] hover:bg-white/[0.04] hover:text-white hover:border-white/20 transition-all duration-300"
          >
            Explore the platform
          </button>
        </motion.div>
      </div>

      {/* ============ DASHBOARD MOCKUP — Simple fade+slide animation ============ */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-6xl mx-auto px-6"
      >
        <div className="relative w-full">
          {/* Animated glowing gradient border */}
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-b from-violet-500/60 via-indigo-500/30 to-transparent opacity-70 blur-[1px] z-0 pointer-events-none animate-[pulse_3s_ease-in-out_infinite]" />
          <div className="absolute -inset-[6px] rounded-2xl bg-gradient-to-b from-violet-500/25 via-indigo-500/10 to-transparent opacity-60 blur-xl z-0 pointer-events-none animate-[pulse_3s_ease-in-out_infinite]" />
          
          {/* Massive radial glow behind */}
          <div className="absolute inset-x-[-5%] top-[10%] bottom-[-50%] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.25)_0%,rgba(79,70,229,0.1)_35%,transparent_65%)] blur-2xl pointer-events-none z-0" />

          {/* Chrome Browser Shell */}
          <div className="relative z-10 rounded-2xl border border-white/[0.1] bg-[#0d1117] shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            
            {/* Window Title Bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-[#161b22]/80">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="h-6 w-64 bg-white/[0.06] rounded-lg flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500/60"></div>
                  <span className="text-[11px] text-gray-400 font-mono">promptix.ai/dashboard</span>
                </div>
              </div>
              <div className="w-20"></div>
            </div>

            {/* Real Dashboard Screenshot */}
            <img 
              src={dashboardImg} 
              alt="Promptix AI Dashboard" 
              className="w-full h-auto block"
              loading="eager"
            />
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        </div>
      </motion.div>
    </section>
  );
}
