export default function StatCard({ title, value, icon, color }) {
  return (
    <div className="relative group overflow-hidden rounded-2xl bg-[#111827]/80 backdrop-blur-xl border border-white/5 hover:border-violet-500/30 transition-all duration-300 p-6 flex items-center gap-6 shadow-lg">
      
      {/* Background Subtle Gradient */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition duration-500 ${color}`}></div>

      {/* Icon Area */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner relative z-10 ${color.replace('text-', 'bg-').replace('500', '500/20').replace('400', '500/20')}`}>
        <div className={`absolute inset-0 rounded-2xl blur-sm opacity-50 ${color.replace('text-', 'bg-').replace('500', '500/20')}`}></div>
        <div className="relative z-20">
          {icon}
        </div>
      </div>

      {/* Text Area */}
      <div className="relative z-10">
        <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
        <p className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
          {value}
        </p>
      </div>

    </div>
  );
}
