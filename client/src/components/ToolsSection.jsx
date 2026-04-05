import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageCircle, FileText, Image as ImageIcon, Mic, LayoutTemplate, FileSearch, ArrowUpRight, Zap, Brain, Sparkles } from "lucide-react";

import chatImg from "../assets/chat.png";
import mock_interview from "../assets/mock_interview.png";


/* ====================================================================
   ANIMATED WRAPPER — Slides up on scroll
   ==================================================================== */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ====================================================================
   MAIN TOOLS SECTION — Bento Grid
   ==================================================================== */
export default function ToolsSection() {
  return (
    <section id="tools" className="relative py-28 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Everything you need, one workspace
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Six AI-powered tools designed to supercharge every part of your workflow.
          </p>
        </motion.div>

        {/* ============ BENTO GRID ============ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* -------- ROW 1: Hero card (2col) + Side card (1col) -------- */}
          
          {/* AI Chat — Large hero card with screenshot */}
          <Reveal delay={0} className="md:col-span-2">
            <div className="group relative h-full rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(139,92,246,0.06)]">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-500/30 via-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 blur-[0.5px] transition-opacity duration-500 pointer-events-none z-0" />
              <div className="relative z-10 h-full rounded-2xl border border-white/[0.06] group-hover:border-violet-500/20 bg-[#0d1117] overflow-hidden transition-colors duration-500">
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <MessageCircle size={16} className="text-violet-400" />
                    </div>
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Core Feature</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">AI Chat Assistant</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-lg mb-5">
                    Context-aware conversations powered by GPT-4 Turbo. Generate code, debug, brainstorm, and create — with memory that carries across sessions.
                  </p>
                </div>
                
              </div>
            </div>
          </Reveal>

          {/* Mock Interview — Text only, icon+description */}
          <Reveal delay={0.1} className="md:col-span-1">
            <div className="group relative h-full rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(245,158,11,0.06)]">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-500/30 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 blur-[0.5px] transition-opacity duration-500 pointer-events-none z-0" />
              <div className="relative z-10 h-full rounded-2xl border border-white/[0.06] group-hover:border-amber-500/20 bg-[#0d1117] p-6 flex flex-col transition-colors duration-500">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <Mic size={16} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Mock Interview Bot</h3>
                <p className="text-sm text-gray-400 leading-relaxed flex-1">
                  Simulate high-pressure technical and behavioral interviews with real-time AI feedback and performance analytics.
                </p>
                
                
              </div>
            </div>
          </Reveal>

        

          {/* -------- ROW 2: Three equal compact cards -------- */}

          {/* Image Studio — with screenshot */}
          <Reveal delay={0} className="md:col-span-1">
            <div className="group relative h-full rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(217,70,239,0.06)]">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-fuchsia-500/30 via-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 blur-[0.5px] transition-opacity duration-500 pointer-events-none z-0" />
              <div className="relative z-10 h-full rounded-2xl border border-white/[0.06] group-hover:border-fuchsia-500/20 bg-[#0d1117] overflow-hidden flex flex-col transition-colors duration-500">
                <div className="p-6">
                  <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-4">
                    <ImageIcon size={16} className="text-fuchsia-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Image Studio</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Generate stunning AI visuals. Choose styles, aspect ratios, and quality presets.
                  </p>
                </div>
                
              </div>
            </div>
          </Reveal>

          {/* Document Intelligence — Tall side card with screenshot */}
          <Reveal delay={0.1} className="md:col-span-1">
            <div className="group relative h-full rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(34,211,238,0.06)]">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-cyan-500/30 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 blur-[0.5px] transition-opacity duration-500 pointer-events-none z-0" />
              <div className="relative z-10 h-full rounded-2xl border border-white/[0.06] group-hover:border-cyan-500/20 bg-[#0d1117] overflow-hidden flex flex-col transition-colors duration-500">
                <div className="p-6">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                    <FileText size={16} className="text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Document Intelligence</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Upload any PDF and interrogate it with natural language. RAG-powered cited answers.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Prompt Templates — Text only */}
          <Reveal delay={0.2} className="md:col-span-1">
            <div className="group relative h-full rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(99,102,241,0.06)]">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-indigo-500/30 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 blur-[0.5px] transition-opacity duration-500 pointer-events-none z-0" />
              <div className="relative z-10 h-full rounded-2xl border border-white/[0.06] group-hover:border-indigo-500/20 bg-[#0d1117] p-6 flex flex-col transition-colors duration-500">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <LayoutTemplate size={16} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Prompt Templates</h3>
                <p className="text-sm text-gray-400 leading-relaxed flex-1">
                  A curated library of expert-crafted prompts for academics, marketing, coding, and business workflows.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Marketing", "Academic", "Coding", "Business"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-gray-400 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* -------- ROW 3: Full-width accent card -------- */}
          <Reveal delay={0} className="md:col-span-3">
            <div className="group relative rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(16,185,129,0.06)]">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-emerald-500/30 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 blur-[0.5px] transition-opacity duration-500 pointer-events-none z-0" />
              <div className="relative z-10 rounded-2xl border border-white/[0.06] group-hover:border-emerald-500/20 bg-[#0d1117] overflow-hidden transition-colors duration-500">
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <FileSearch size={20} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-bold text-white mb-1">Resume Review & ATS Optimization</h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                      Upload your resume and get an instant ATS compatibility score, skill gap analysis, formatting suggestions, and actionable improvements — powered by enterprise-grade analysis.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <Sparkles size={14} className="text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">ATS Score</span>
                    </div>
                    <a href="/ai/review" className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-emerald-300 transition-colors">
                      Try it <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
