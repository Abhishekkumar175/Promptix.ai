import { motion } from "framer-motion";
import Particles from "./Particles";

const DUMMY_LOGOS = [
  "Acme Corp", "Global Bank", "Nexus Industries", "Nova Startup", "Apex Tech"
];

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center bg-black/50 pt-32 pb-20">

      <div className="absolute inset-0 z-10">
        <Particles />
      </div>

      <div className="relative z-30 text-center px-6 max-w-5xl mx-auto w-full flex-grow flex flex-col items-center justify-center">
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
          <span className="block bg-linear-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
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
          className="mt-4 flex flex-col sm:flex-row justify-center gap-4 relative"
        >
          {/* Glowing CTA effect */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-purple-600 to-indigo-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <button className="relative px-8 py-4 rounded-full bg-linear-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] transition shadow-[0_0_20px_rgba(139,92,246,0.3)] text-white font-medium">
              Get Started Free
            </button>
          </div>
          <button className="px-8 py-4 rounded-full border border-white/20 hover:border-purple-400 hover:bg-white/5 transition text-white font-medium">
            Explore Features
          </button>
        </motion.div>

        {/* Hero Illustration / Dashboard Mockup */}
        <motion.div 
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.8 }}
           className="mt-20 w-full max-w-4xl mx-auto relative hidden md:block"
        >
          <div className="absolute inset-x-10 -top-10 -bottom-10 bg-linear-to-b from-violet-500/20 to-transparent blur-3xl rounded-full z-0 pointer-events-none" />
          
          <div className="relative z-10 rounded-2xl border border-white/10 bg-[#0B0F19]/80 backdrop-blur-xl p-2 md:p-4 shadow-2xl overflow-hidden">
            {/* Fake Window Header */}
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <div className="ml-4 h-4 w-32 bg-white/5 rounded-full"></div>
            </div>

            {/* Fake App Layout */}
            <div className="rounded-xl overflow-hidden border border-white/5 bg-[#05070B] aspect-[16/9] flex w-full relative group">
              
              {/* Fake Sidebar */}
              <div className="w-1/4 border-r border-white/10 bg-white/5 p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-md bg-violet-500/50"></div>
                  <div className="h-4 w-20 bg-white/20 rounded-md"></div>
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`h-8 rounded-md w-full flex items-center px-2 gap-2 ${i === 1 ? 'bg-violet-500/20 text-violet-300' : 'bg-transparent'}`}>
                    <div className={`w-4 h-4 rounded-sm ${i === 1 ? 'bg-violet-400' : 'bg-white/10'}`}></div>
                    <div className={`h-2 rounded-full ${i === 1 ? 'bg-violet-300/50 w-16' : 'bg-white/10 w-12'}`}></div>
                  </div>
                ))}
              </div>

              {/* Fake Main Content */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="h-6 w-48 bg-white/10 rounded-md mb-8"></div>
                  
                  {/* Fake Grid / AI Outputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-linear-to-br from-white/5 to-transparent border border-white/5 rounded-xl p-4 flex flex-col justify-between group-hover:border-violet-500/20 transition duration-500">
                      <div className="h-3 w-1/3 bg-white/20 rounded-full"></div>
                      <div className="h-2 w-full bg-white/5 rounded-full mt-auto"></div>
                      <div className="h-2 w-2/3 bg-white/5 rounded-full mt-2"></div>
                    </div>
                    <div className="h-24 bg-linear-to-br from-white/5 to-transparent border border-white/5 rounded-xl p-4 flex flex-col justify-between group-hover:border-indigo-500/20 transition duration-500 delay-100">
                      <div className="h-3 w-1/4 bg-white/20 rounded-full"></div>
                      <div className="flex gap-2 mt-auto">
                        <div className="w-8 h-8 rounded-md bg-white/5"></div>
                        <div className="w-full h-8 rounded-md bg-white/5"></div>
                      </div>
                    </div>
                  </div>

                  {/* Fake Chart / Stats */}
                  <div className="mt-6 h-32 w-full bg-linear-to-t from-violet-500/10 to-transparent border border-white/5 rounded-xl relative overflow-hidden flex items-end px-4 gap-2">
                     <div className="w-full h-[30%] bg-violet-500/20 rounded-t-sm"></div>
                     <div className="w-full h-[50%] bg-violet-500/30 rounded-t-sm"></div>
                     <div className="w-full h-[80%] bg-violet-500/50 rounded-t-sm"></div>
                     <div className="w-full h-[40%] bg-violet-500/20 rounded-t-sm"></div>
                     <div className="w-full h-[60%] bg-violet-500/40 rounded-t-sm"></div>
                     <div className="w-full h-[90%] bg-violet-500/60 rounded-t-sm shadow-[0_0_15px_rgba(139,92,246,0.5)]"></div>
                     <div className="w-full h-[70%] bg-violet-500/40 rounded-t-sm"></div>
                  </div>
                </div>

                {/* Fake ChatGPT style Input bar */}
                <div className="h-12 w-full bg-white/5 border border-white/10 rounded-xl mt-6 flex items-center px-4 justify-between">
                  <div className="h-3 w-40 bg-white/10 rounded-full"></div>
                  <div className="h-6 w-6 bg-violet-500/50 rounded-md"></div>
                </div>
              </div>
              
              {/* Fake Glowing Orb inside the dashboard */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

            </div>
          </div>
        </motion.div>
        
        {/* Trusted By Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-24 w-full"
        >
          <p className="text-sm font-medium text-gray-500 tracking-wider mb-6 text-center uppercase">
            Trusted by innovative teams worldwide
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-50 grayscale hover:grayscale-0 transition duration-500">
            {DUMMY_LOGOS.map((logo, i) => (
              <div key={i} className="text-xl font-bold font-sans tracking-tighter text-white">
                {logo}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
