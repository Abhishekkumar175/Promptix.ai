import { motion } from "framer-motion";
import Particles from "./Particles";


export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden flex items-center justify-center bg-black/50">

      <div className="absolute inset-0 z-10">
        <Particles />
      </div>

      <div className="relative z-30 text-center px-6 max-w-4xl">
        {/* BADGE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
          bg-white/5 border border-white/10 backdrop-blur-md mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-sm text-gray-300">All-in-one AI Platform</span>
        </motion.div>

        {/* HEADING */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white"
        >
          Build Faster with
          <span className="block bg-linear-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Powerful AI Tools
          </span>
        </motion.h1>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="max-w-2xl mx-auto text-gray-400 text-lg mb-12"
        >
          Chat, generate content, analyze resumes, create images, and automate
          your workflow — all under one intelligent dashboard.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex justify-center gap-4"
        >
          <button className="px-8 py-4 rounded-full bg-linear-to-r from-purple-600 to-indigo-600 hover:scale-105 transition shadow-lg text-white">
            Get Started Free
          </button>
          <button className="px-8 py-4 rounded-full border border-white/20 hover:border-purple-400 transition text-white">
            Explore Features
          </button>
        </motion.div>
      </div>
    </section>
  );
}
