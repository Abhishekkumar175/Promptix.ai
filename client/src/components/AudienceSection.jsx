import { motion } from "framer-motion";
import { GraduationCap, Briefcase, Laptop, PenTool, Rocket, ArrowRight } from "lucide-react";

const audiences = [
  { 
    title: "Students", 
    desc: "Research, study aids, and essay assistance powered by AI.", 
    icon: GraduationCap,
    stat: "42%",
    statLabel: "faster research"
  },
  { 
    title: "Job Seekers", 
    desc: "Resume optimization, mock interviews, and career prep.", 
    icon: Briefcase,
    stat: "3.2x",
    statLabel: "more interviews"
  },
  { 
    title: "Developers", 
    desc: "Documentation, debugging, and code generation.", 
    icon: Laptop,
    stat: "67%",
    statLabel: "less boilerplate"
  },
  { 
    title: "Startups", 
    desc: "Marketing copy, pitch decks, and growth strategy.", 
    icon: Rocket,
    stat: "2.8x",
    statLabel: "faster GTM"
  },
];

export default function AudienceSection() {
  return (
    <section id="audience" className="relative py-32 bg-[#0a0a0a] overflow-hidden">
      {/* Divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-white mb-4">
            Built for every workflow
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            One platform, infinite use-cases. See how teams are shipping faster.
          </p>
        </motion.div>

        {/* Cards — Horizontal Scroll on Mobile, Grid on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {audiences.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group relative rounded-2xl border border-white/[0.06] bg-[#0d1117] p-5 hover:border-violet-500/20 transition-all duration-500 cursor-default"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-violet-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <item.icon className="w-7 h-7 text-gray-400 group-hover:text-violet-400 transition-colors duration-300 mb-6 relative z-10" />
              
              <h3 className="text-base font-semibold text-white mb-1 relative z-10">{item.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed relative z-10 mb-5">{item.desc}</p>

              {/* Stat */}
              <div className="relative z-10 mt-auto border-t border-white/[0.04] pt-4">
                <span className="text-xl font-bold text-white">{item.stat}</span>
                <span className="text-[11px] text-gray-500 ml-2">{item.statLabel}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA Row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-white/[0.06] bg-[#0d1117] p-8"
        >
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Ready to accelerate your workflow?</h3>
            <p className="text-sm text-gray-400">Join thousands of professionals already using Promptix.</p>
          </div>
          <button 
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            className="group shrink-0 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.03] transition-all duration-300 flex items-center gap-2"
          >
            View pricing <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
