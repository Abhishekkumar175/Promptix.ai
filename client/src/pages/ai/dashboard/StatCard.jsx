export default function StatCard({ title, value, icon, color }) {
  // Extract base color name (e.g. "violet", "emerald", "fuchsia") to construct dynamic Tailwind classes
  const match = color.match(/from-([a-z]+)-/);
  const baseColor = match ? match[1] : "violet";

  // Create explicit static classes since dynamically building tailwind class names at runtime can prevent tailwind compiler from catching them
  const glowClass = `bg-${baseColor}-500/10`;
  const textClass = `text-${baseColor}-400`;
  const borderClass = `border-${baseColor}-500/20`;
  const iconShadow = `shadow-[0_0_15px_rgba(var(--color-${baseColor}-500),0.3)]`;

  return (
    <div className={`relative group overflow-hidden rounded-2xl bg-[#0B101A]/90 backdrop-blur-2xl border border-white/5 hover:border-white/15 transition-all duration-500 p-5 flex flex-col shadow-xl`}>
      
      {/* Background Subtle Gradient Overlay */}
      <div className={`absolute inset-0 bg-linear-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      {/* Abstract Animated Glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-30 group-hover:scale-150 transition-all duration-700 ${color.replace('from-', 'bg-').split(' ')[0]}`} />

      <div className="flex items-start justify-between relative z-10 mb-4">
        {/* Icon Area with Pro styling */}
        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 border bg-black/40 backdrop-blur-md shadow-inner transition-transform group-hover:-translate-y-1 ${textClass} ${borderClass}`}>
           <div className={`absolute inset-0 rounded-[14px] blur-[8px] opacity-40 transition-opacity group-hover:opacity-80 mix-blend-screen bg-linear-to-br ${color}`} />
           <div className="relative z-20">
             {icon}
           </div>
        </div>

        {/* Mock Trend Chart/Chip */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
             <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
             <polyline points="16 7 22 7 22 13"></polyline>
           </svg>
           <span className="text-[10px] font-bold text-gray-300">12%</span>
        </div>
      </div>

      {/* Text Area */}
      <div className="relative z-10 mt-auto">
        <p className="text-[28px] font-bold tracking-tight text-white leading-none mb-1">
          {value}
        </p>
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
        </div>
      </div>

    </div>
  );
}
