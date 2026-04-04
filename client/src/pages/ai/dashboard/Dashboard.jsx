import { useUser, Protect } from "@clerk/clerk-react";
import StatCard from "./StatCard";
import RecentCreations from "./RecentCreations";
import { Sparkles, Gem, PenLine, Image as ImageIcon, MessageCircle, ArrowRight, Zap, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { user } = useUser();

  const quickActions = [
    { title: "Start AI Chat", desc: "Interact with our smartest model", icon: MessageCircle, path: "/ai/chat", color: "from-violet-600 to-indigo-600", shadow: "shadow-violet-500/20" },
    { title: "Chat with PDF", desc: "Analyze any document instantly", icon: FileText, path: "/ai/pdf", color: "from-amber-600 to-orange-600", shadow: "shadow-amber-500/20" },
    { title: "Image Studio", desc: "Advanced AI canvas editor", icon: ImageIcon, path: "/ai/image", color: "from-fuchsia-600 to-pink-600", shadow: "shadow-fuchsia-500/20" },
    { title: "Article Composer", desc: "Write SEO optimized blogs", icon: PenLine, path: "/ai/article", color: "from-cyan-600 to-blue-600", shadow: "shadow-cyan-500/20" }
  ];

  return (
    <div className="h-full w-full bg-[#030712] text-white flex flex-col relative overflow-hidden">
      
      {/* Intense Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto relative z-10 no-scrollbar">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-6xl mx-auto space-y-8"
        >
          {/* PREMIUM WELCOME BANNER */}
          <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] p-6 md:p-8 shadow-2xl group">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-violet-300 mb-4"
                >
                  <Zap size={10} className="text-violet-400 fill-violet-400" />
                  Workspace Active
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-linear-to-r from-white via-white to-gray-400">
                  Welcome back, {user?.firstName || "Creator"}
                </h1>
                <p className="text-gray-400 text-base max-w-xl">
                  Your AI creative engine is ready. What are we building today?
                </p>
              </div>
              
              <Link to="/ai/chat" className="shrink-0 relative overflow-hidden rounded-full group/btn">
                <div className="absolute inset-0 bg-linear-to-r from-violet-600 to-indigo-600 transition-transform duration-300 group-hover/btn:scale-105" />
                <div className="relative px-6 py-3 flex items-center gap-2 font-medium text-sm">
                  Jump into action
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </motion.div>

          {/* TWO COLUMN OVERVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Quick Actions (Takes 2 columns on wide screens) */}
            <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-widest text-gray-400 uppercase">Quick Tools</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {quickActions.map((action, i) => (
                  <Link 
                    key={i} 
                    to={action.path}
                    className="group relative rounded-2xl overflow-hidden border border-white/5 bg-[#0B101A] p-4 hover:border-white/10 transition-all duration-500 shadow-lg hover:-translate-y-1"
                  >
                    {/* Hover Glow Edge */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
                    
                    <div className="flex flex-col gap-3 relative z-10">
                      <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${action.color} p-[1px] shadow-lg ${action.shadow}`}>
                        <div className="w-full h-full rounded-xl bg-[#0B101A] flex items-center justify-center group-hover:bg-transparent transition-colors duration-500">
                          <action.icon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-200 group-hover:text-white transition-colors text-base">{action.title}</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{action.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Right: Usage / Stats (Takes 1 column) */}
            <motion.div variants={itemVariants} className="space-y-4">
               <h2 className="text-sm font-semibold tracking-widest text-gray-400 uppercase">Workspace Stats</h2>
               <div className="flex flex-col gap-4 h-full">
                  <StatCard
                    title="Total Generations"
                    value="0"
                    icon={<Sparkles className="text-violet-400 w-6 h-6" />}
                    color="bg-violet-600"
                  />
                  <StatCard
                    title="Current Plan"
                    value={<Protect plan="premium" fallback={<span className="text-xl">Free Tier</span>}>Premium</Protect>}
                    icon={<Gem className="text-indigo-400 w-6 h-6" />}
                    color="bg-indigo-600"
                  />
               </div>
            </motion.div>
          </div>

          {/* RECENT CREATIONS */}
          <motion.div variants={itemVariants}>
            <RecentCreations />
          </motion.div>
          
        </motion.div>
      </main>
    </div>
  );
}
