import { useState, useRef, useEffect } from "react";
import { Mic, Briefcase, Target, Play, Square, Loader2, Send, Volume2, Activity, Wifi, Clock, Eye, ShieldCheck, Code, Users, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const INTERVIEW_TYPES = [
  { id: "tech", label: "Technical", icon: Code },
  { id: "behavioral", label: "Behavioral", icon: Users },
  { id: "system", label: "System Design", icon: Box }
];

const DIFFICULTIES = ["Junior", "Mid-Level", "Senior", "Executive"];

export default function MockInterview() {
  const [role, setRole] = useState("");
  const [type, setType] = useState("tech");
  const [difficulty, setDifficulty] = useState("Mid-Level");

  const [sessionState, setSessionState] = useState("idle"); // idle | starting | active
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  // Telemetry 
  const [elapsedTime, setElapsedTime] = useState(0);

  const chatEndRef = useRef(null);

  // Auto scroll logic for chat module
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  // Timer logic for active session
  useEffect(() => {
    let interval = null;
    if (sessionState === "active") {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [sessionState]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStart = () => {
    if (!role.trim()) return;
    setSessionState("starting");

    // Simulating hardware check and initialization
    setTimeout(() => {
      setSessionState("active");
      setMessages([
        { role: "ai", text: `Hello! I'm your AI recruiter today. We'll be doing a ${difficulty} ${type} interview for the ${role} position. Let's start with an easy one: Could you briefly walk me through your background?` }
      ]);
    }, 3500);
  };

  const handleSendMessage = () => {
    if (!inputVal.trim() || sessionState !== "active") return;

    // Add user message
    const newMsgs = [...messages, { role: "user", text: inputVal }];
    setMessages(newMsgs);
    setInputVal("");
    setIsAiTyping(true);

    // Mock AI response
    setTimeout(() => {
      setIsAiTyping(false);
      setMessages([
        ...newMsgs,
        { role: "ai", text: "That sounds like a great trajectory. Given that context, could you tell me about a time you faced a difficult technical hurdle and how you communicated the constraints to stakeholders?" }
      ]);
    }, 3500);
  };

  return (
    // Fixed layout heights to prevent global scrolling. Overflow happens inside specific panels.
    <div className="h-full w-full bg-[#030712] text-white flex flex-col relative overflow-hidden">
      
      {/* Intense Background Glows mapped to amber/orange for focus & human interaction */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-amber-600/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <main className="flex-1 p-4 md:p-6 relative z-10 w-full max-w-[1400px] mx-auto overflow-hidden">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0"
        >
          
          {/* =======================
              LEFT: CONFIG ENGINE (FIXED)
              ======================= */}
          <motion.div variants={itemVariants} className="lg:col-span-4 h-full flex flex-col no-scrollbar overflow-y-auto pb-4">
            <div className={`bg-[#0B101A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col shrink-0 shadow-2xl relative overflow-hidden transition-all duration-500 ${sessionState === 'active' ? "opacity-40 pointer-events-none grayscale-[30%]" : "group"}`}>
              <div className="absolute inset-0 bg-linear-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center shadow-inner">
                  <Mic className="text-amber-400 w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Setup Engine</h2>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">AI Voice & Text Simulator</p>
                </div>
              </div>

              <div className="flex-1 space-y-5 relative z-10">
                
                {/* Target Role */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-300">
                    Target Job Role
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full h-11 pl-9 rounded-xl bg-black/40 border border-white/10 px-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-black/60 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Interview Type Selector */}
                <div className="space-y-3">
                  <label className="block text-[12px] font-semibold text-gray-300">
                    Interview Focus
                  </label>
                  <div className="flex flex-col gap-2">
                    {INTERVIEW_TYPES.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setType(t.id)}
                          className={`flex items-center gap-3 w-full p-2.5 rounded-xl border transition-all duration-300
                            ${type === t.id 
                              ? "bg-amber-600/10 border-amber-500/50 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]" 
                              : "bg-black/30 border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                            }`}
                        >
                          <div className={`p-1.5 rounded-lg ${type === t.id ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-400'}`}>
                            <Icon size={14} />
                          </div>
                          <span className={`text-[13px] font-semibold ${type === t.id ? "text-white" : "text-gray-400"}`}>
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-300">
                       Difficulty Level
                     </label>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {DIFFICULTIES.map((d) => (
                       <button
                         key={d}
                         onClick={() => setDifficulty(d)}
                         className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-300 border
                           ${difficulty === d 
                             ? "bg-amber-600/20 text-amber-200 border-amber-500/40" 
                             : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-gray-200"
                           }`}
                       >
                         {d}
                       </button>
                     ))}
                   </div>
                </div>

              </div>

              {/* ACTION CTA */}
              <div className="mt-6 relative z-10 w-full shrink-0">
                {sessionState === "active" ? (
                  <button
                    onClick={() => setSessionState("idle")}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 hover:border-red-500/50 text-red-500 text-[13px] font-bold transition-all"
                  >
                    <Square size={14} fill="currentColor" /> End Interview Session
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={sessionState !== "idle" || !role}
                    className="w-full relative group overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className={`absolute inset-0 transition-opacity duration-300 bg-linear-to-r from-amber-500 to-orange-600 ${sessionState !== "idle" ? "opacity-50" : "opacity-100 group-hover:opacity-90"}`} />
                    <div className={`absolute inset-0 blur-md transition-opacity duration-300 bg-linear-to-r from-amber-500 to-orange-600 ${sessionState !== "idle" ? "opacity-0" : "opacity-0 group-hover:opacity-40"}`} />
                    
                    <div className="relative px-5 py-3 flex items-center justify-center gap-2">
                      {sessionState === "starting" ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white" />
                          <span className="text-[13px] font-bold text-white tracking-wide">Connecting Audio...</span>
                        </>
                      ) : (
                        <>
                          <Play size={16} className="text-white fill-white group-hover:scale-110 transition-transform" />
                          <span className="text-[13px] font-bold text-white tracking-wide shadow-sm">Initialize Interface</span>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* =======================
              RIGHT: INTERVIEW UI
              ======================= */}
          <motion.div variants={itemVariants} className="lg:col-span-8 h-full flex flex-col relative pb-4">
            <div className="bg-[#0B101A]/60 backdrop-blur-lg border border-white/10 rounded-3xl flex flex-col h-full shadow-2xl relative overflow-hidden">
              
              {/* Premium Telemetry Header */}
              <div className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-black/40 shrink-0 relative z-20">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <div className="w-px h-6 bg-white/10 mx-2"></div>
                  
                  {/* Status Indicator */}
                  {sessionState === "active" ? (
                     <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400">Connected</span>
                     </div>
                  ) : (
                     <div className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/20 px-2 py-1 rounded-md">
                        <ShieldCheck size={10} className="text-gray-400" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Offline</span>
                     </div>
                  )}
                </div>

                {/* Telemetry Stats Display */}
                <div className="hidden sm:flex items-center justify-end gap-5">
                   <div className="flex items-center gap-1.5">
                     <Wifi size={12} className="text-gray-500" />
                     <span className="text-[11px] font-mono font-medium text-gray-400">24ms</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <Activity size={12} className={sessionState === 'active' ? "text-amber-500" : "text-gray-500"} />
                     <span className="text-[11px] font-mono font-medium text-gray-400">{isAiTyping ? "Synthesizing" : "Standby"}</span>
                   </div>
                   <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-md border border-white/5">
                     <Clock size={12} className="text-white" />
                     <span className="text-[12px] font-mono font-bold text-white">{formatTime(elapsedTime)}</span>
                   </div>
                </div>
              </div>

              {/* Main Scrolling Content Area */}
              <div className="flex-1 flex flex-col relative no-scrollbar bg-linear-to-b from-transparent to-black/20">

                {/* EMPTY STATE */}
                {sessionState === "idle" && (
                  <div className="absolute inset-6 rounded-2xl border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-linear-to-br from-amber-600/10 to-orange-600/10 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                      <Eye size={24} className="text-amber-500/50" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-white mb-2">Simulated Interview Platform</h3>
                    <p className="text-xs text-gray-500 max-w-[280px]">
                      Select your parameters on the left and initialize the interface to begin an HD connection.
                    </p>
                  </div>
                )}

                {/* STARTING LOAD STATE */}
                {sessionState === "starting" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-[#0B101A]">
                    <div className="relative w-24 h-24 mb-6">
                       <div className="absolute inset-0 bg-amber-600 rounded-full blur-2xl opacity-30 animate-pulse" />
                       <div className="absolute inset-0 border-[3px] border-amber-500/20 border-dashed rounded-full animate-[spin_4s_linear_infinite]" />
                       <div className="absolute inset-2 border-[2px] border-amber-400 border-t-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                       <div className="absolute inset-0 flex items-center justify-center">
                         <Volume2 className="text-white animate-pulse" size={28} />
                       </div>
                    </div>
                    <div className="text-[15px] font-bold text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-orange-400 mb-1.5 tracking-wide">
                       Establishing Video Link
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium tracking-widest uppercase mt-4 bg-white/5 px-3 py-1 rounded-full">
                       <Loader2 size={12} className="animate-spin" /> Hardware Check OK
                    </div>
                  </div>
                )}

                {/* ACTIVE SESSION STATE */}
                {sessionState === "active" && (
                  <div className="flex flex-col h-full w-full relative">
                     
                     {/* Floating AI Virtual Camera Module */}
                     <div className="absolute top-4 right-4 w-40 h-32 bg-[#050812]/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-20 group">
                        {/* Status bar */}
                        <div className="absolute top-0 inset-x-0 h-6 bg-black/60 flex items-center px-2 z-10 justify-between">
                           <div className="flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[8px] font-bold uppercase text-gray-300">Recruiter_AI</span>
                           </div>
                           <Mic size={10} className="text-gray-400" />
                        </div>
                        {/* Synthetic Visualizer */}
                        <div className="absolute inset-0 flex items-center justify-center pt-4">
                           <div className="relative w-16 h-16">
                              <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-20" />
                              <div className={`w-full h-full rounded-full border border-amber-500/30 flex items-center justify-center ${!isAiTyping ? 'animate-pulse' : ''}`}>
                                  {!isAiTyping ? (
                                    <div className="bg-amber-500/20 p-2 rounded-full">
                                      <Volume2 size={24} className="text-amber-400" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1 h-6">
                                      {[...Array(5)].map((_, i) => (
                                        <motion.div 
                                          key={i}
                                          animate={{ height: ["4px", "16px", "4px"] }}
                                          transition={{ repeat: Infinity, duration: 0.5 + Math.random(), delay: Math.random() }}
                                          className="w-1 rounded-full bg-amber-400"
                                        />
                                      ))}
                                   </div>
                                  )}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Chat Messages */}
                     <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar pt-6 pb-20">
                        <AnimatePresence>
                          {messages.map((m, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, y: 15, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start w-[85%] md:w-[70%]'}`}
                            >
                               <div className={`relative rounded-2xl p-4 text-[14px] leading-relaxed
                                 ${m.role === 'user' 
                                   ? 'bg-linear-to-br from-amber-600 to-orange-600 text-white rounded-br-[4px] shadow-[0_5px_20px_rgba(245,158,11,0.2)] max-w-[85%]' 
                                   : 'bg-[#121826] border border-white/5 text-gray-200 rounded-tl-[4px] shadow-lg'
                                 }`}>
                                 {m.role === 'ai' && (
                                    <span className="absolute -top-3 left-3 bg-[#0B101A] border border-white/5 text-[9px] uppercase font-bold text-amber-500 px-2 py-0.5 rounded-full z-10">
                                      Interviewer
                                    </span>
                                 )}
                                 {m.text}
                               </div>
                            </motion.div>
                          ))}
                          
                          {isAiTyping && (
                            <motion.div 
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex justify-start pt-2"
                            >
                               <div className="bg-[#121826] border border-white/5 rounded-2xl p-4 rounded-tl-[4px] flex items-center gap-1.5 w-16 shadow-lg shadow-black/20">
                                 <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                 <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                 <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div ref={chatEndRef} />
                     </div>

                     {/* Pro Input Console */}
                     <div className="shrink-0 px-4 pb-4 pt-2 bg-linear-to-t from-[#0B101A] to-transparent shrink-0">
                        <div className="flex flex-col bg-[#050812]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 group focus-within:border-amber-500/40 transition-colors shadow-2xl relative">
                           {/* Glow effect on input focus */}
                           <div className="absolute inset-[-1px] rounded-2xl bg-linear-to-r from-amber-500/20 to-orange-500/20 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none -z-10" />
                           
                           <div className="flex items-end gap-2">
                             <button className="shrink-0 p-2.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors rounded-xl mb-0.5 relative">
                               <Mic size={18} />
                               {/* Mock tooltip */}
                               <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold text-white opacity-0 group-hover/mic:opacity-100 pointer-events-none transition-opacity">Voice</span>
                             </button>
                             
                             <textarea 
                               value={inputVal}
                               onChange={(e) => setInputVal(e.target.value)}
                               onKeyDown={(e) => {
                                 if(e.key === 'Enter' && !e.shiftKey) {
                                   e.preventDefault();
                                   handleSendMessage();
                                 }
                               }}
                               placeholder="Draft your response... Use shift+Enter for new line."
                               className="flex-1 bg-transparent border-none text-[14px] text-gray-200 focus:outline-none resize-none py-3 min-h-[44px] max-h-[140px] leading-relaxed"
                               rows={1}
                             />
                             
                             <button 
                               onClick={handleSendMessage}
                               disabled={!inputVal.trim() || isAiTyping}
                               className="shrink-0 p-2.5 bg-amber-600 rounded-xl text-white hover:bg-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                             >
                               <Send size={18} className="translate-x-[1px]" />
                             </button>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
                
              </div>
            </div>
          </motion.div>
          
        </motion.div>
      </main>
    </div>
  );
}
