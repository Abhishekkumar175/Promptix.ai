import { motion } from "framer-motion";
import { useMousePosition } from "../hooks/useMousePosition";

export default function ToolCard({ tool }) {
  const { pos, update } = useMousePosition();

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      onMouseMove={update}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative rounded-2xl p-px cursor-pointer"
    >
      {/* 🔥 CURSOR FOLLOW GLOW */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"
        style={{
          background: `radial-gradient(
            300px circle at ${pos.x}% ${pos.y}%,
            rgba(139,92,246,0.45),
            transparent 60%
          )`,
        }}
      />

      {/* CARD BODY */}
      <div className="relative h-full rounded-2xl p-6 backdrop-blur-xl bg-white/5 border border-white/10 group-hover:border-violet-500/50 group-hover:bg-white/10 transition-all duration-300 shadow-xl overflow-hidden">
        {/* Subtle inner gradient on hover */}
        <div className="absolute inset-0 bg-linear-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <tool.icon className="w-8 h-8 text-purple-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
        <p className="text-gray-400 text-sm">{tool.desc}</p>
      </div>
    </motion.div>
  );
}
