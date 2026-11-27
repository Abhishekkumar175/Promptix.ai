import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Mic,
  MicOff,
  Briefcase,
  Target,
  Play,
  Square,
  Loader2,
  Send,
  Volume2,
  VolumeX,
  Activity,
  Wifi,
  Clock,
  Eye,
  ShieldCheck,
  Code,
  Users,
  Box,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  Printer,
  Trash2,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Zap,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "../../hooks/useApi";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const INTERVIEW_TYPES = [
  { id: "tech", label: "Technical", icon: Code },
  { id: "behavioral", label: "Behavioral", icon: Users },
  { id: "system", label: "System Design", icon: Box },
];

const DIFFICULTIES = ["Junior", "Mid-Level", "Senior", "Executive"];

export const PHASES = [
  {
    id: 1,
    name: "Warm Intro & Background",
    short: "1. Warm Intro",
    icon: ShieldCheck,
  },
  { id: 2, name: "Core Technical Drill", short: "2. Core Drill", icon: Code },
  {
    id: 3,
    name: "Pressure & Edge Cases",
    short: "3. Pressure Test",
    icon: Zap,
  },
  { id: 4, name: "Reverse Q&A & Wrap-Up", short: "4. Wrap-Up", icon: Sparkles },
];

export default function MockInterview() {
  const api = useApi();
  const location = useLocation();

  // Resume context passed from /ai/review
  const resumeContext = location.state?.resumeName ? location.state : null;

  // Session configuration state
  const [role, setRole] = useState(location.state?.role || "");
  const [type, setType] = useState("tech");
  const [difficulty, setDifficulty] = useState(
    location.state?.difficulty || "Mid-Level",
  );

  // Active Session state
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionState, setSessionState] = useState("idle"); // idle | starting | active | finishing
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [error, setError] = useState(null);

  // 4-Phase Lifecycle & Progression state
  const [currentPhase, setCurrentPhase] = useState(1);
  const [phaseLabel, setPhaseLabel] = useState("Warm Intro & Background");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalExpectedQuestions, setTotalExpectedQuestions] = useState(6);

  // Hands-Free VAD (Voice Activity Detection) state
  const [handsFreeMode, setHandsFreeMode] = useState(true);
  const [vadCountdown, setVadCountdown] = useState(null);
  const vadTimerRef = useRef(null);
  const vadIntervalRef = useRef(null);

  // Micro-feedback expanded state tracker (mapping message index => boolean)
  const [expandedFeedback, setExpandedFeedback] = useState({});

  // Voice Audio Engine state
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const speechRecognitionRef = useRef(null);
  const speechBaseTextRef = useRef("");

  // Scorecard / Final Report modal state
  const [scorecard, setScorecard] = useState(null);
  const [showScorecardModal, setShowScorecardModal] = useState(false);

  // History modal state
  const [historyList, setHistoryList] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Telemetry duration
  const [elapsedTime, setElapsedTime] = useState(0);
  const chatEndRef = useRef(null);

  // Sync state if coming from resume review navigation
  useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role);
    }
    if (location.state?.difficulty) {
      setDifficulty(location.state.difficulty);
    }
  }, [location.state]);

  // Load past history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get("/api/interview/history");
      if (res.success && Array.isArray(res.sessions)) {
        setHistoryList(res.sessions);
      }
    } catch (err) {
      console.warn("Failed to load interview history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  // Timer logic for active session
  useEffect(() => {
    let interval = null;
    if (sessionState === "active") {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [sessionState]);

  // Format time (mm:ss)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Text-To-Speech (AI Voice)
  const speakAiText = (text) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
      setIsAiSpeaking(false);
    }
  };

  // Helper to cancel ongoing VAD auto-send countdown
  const cancelAutoSend = () => {
    if (vadTimerRef.current) clearTimeout(vadTimerRef.current);
    if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
    setVadCountdown(null);
  };

  // Speech-To-Text (Microphone voice input with Hands-Free VAD)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
      );
      return;
    }

    if (isListening) {
      cancelAutoSend();
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      // Capture any existing typed text as base so we append cleanly without duplicating
      speechBaseTextRef.current = inputVal.trim() ? inputVal.trim() + " " : "";
      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
        cancelAutoSend();
        speechBaseTextRef.current = "";
      };
      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
        cancelAutoSend();
        speechBaseTextRef.current = "";
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const base = speechBaseTextRef.current;
        const combined = base ? `${base}${transcript}`.trim() : transcript.trim();

        if (combined) {
          setInputVal(combined);

          // ── HANDS-FREE VAD: TRIGGER 2-SECOND SILENCE AUTO-SEND ──
          if (
            handsFreeMode &&
            combined.length >= 8 &&
            sessionState === "active" &&
            !isAiTyping
          ) {
            cancelAutoSend();
            setVadCountdown(2);
            let remaining = 2;
            vadIntervalRef.current = setInterval(() => {
              remaining -= 1;
              if (remaining <= 0) {
                clearInterval(vadIntervalRef.current);
              } else {
                setVadCountdown(remaining);
              }
            }, 1000);

            vadTimerRef.current = setTimeout(() => {
              setVadCountdown(null);
              clearInterval(vadIntervalRef.current);
              speechBaseTextRef.current = "";
              handleSendMessage(combined);
            }, 2000);
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  // 1. START REAL INTERVIEW SESSION VIA BACKEND
  const handleStartSession = async () => {
    if (!role.trim()) return;

    cancelAutoSend();
    setError(null);
    setSessionState("starting");
    setElapsedTime(0);
    setMessages([]);
    setCurrentPhase(1);
    setQuestionNumber(1);

    try {
      const res = await api.post("/api/interview/start", {
        role: role.trim(),
        type,
        difficulty,
        resumeContext,
      });

      if (res.success && res.session) {
        setCurrentSession(res.session);
        setSessionState("active");
        if (res.currentPhase) setCurrentPhase(res.currentPhase);
        if (res.phaseLabel) setPhaseLabel(res.phaseLabel);
        if (res.questionNumber) setQuestionNumber(res.questionNumber);
        if (res.totalExpectedQuestions)
          setTotalExpectedQuestions(res.totalExpectedQuestions);

        const initialMsg = {
          role: "ai",
          text: res.openingMessage.content,
          id: res.openingMessage.id,
        };
        setMessages([initialMsg]);

        // Speak opening question
        speakAiText(res.openingMessage.content);
        fetchHistory();
      } else {
        throw new Error(res.message || "Failed to initialize interview.");
      }
    } catch (err) {
      console.error("Start session error:", err);
      setError(err.message || "Could not connect to AI recruiter service.");
      setSessionState("idle");
    }
  };

  // 2. SEND CANDIDATE'S ANSWER & RECEIVE ADAPTIVE QUESTION + FEEDBACK
  const handleSendMessage = async (textOverride = null) => {
    cancelAutoSend();
    speechBaseTextRef.current = "";
    const candidateAnswer = (
      typeof textOverride === "string" ? textOverride : inputVal
    ).trim();
    if (
      !candidateAnswer ||
      sessionState !== "active" ||
      isAiTyping ||
      !currentSession
    )
      return;

    // Stop microphone if currently listening
    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
    }

    setInputVal("");

    // Add candidate's message to UI optimistically
    const userMsgIndex = messages.length;
    const optimisticUserMsg = { role: "user", text: candidateAnswer };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsAiTyping(true);

    try {
      const res = await api.post(
        `/api/interview/${currentSession.id}/message`,
        {
          message: candidateAnswer,
          elapsedTime,
        },
      );

      if (res.success) {
        if (res.currentPhase) setCurrentPhase(res.currentPhase);
        if (res.phaseLabel) setPhaseLabel(res.phaseLabel);
        if (res.questionNumber) setQuestionNumber(res.questionNumber);
        if (res.totalExpectedQuestions)
          setTotalExpectedQuestions(res.totalExpectedQuestions);

        // Update user message with micro-feedback
        setMessages((prev) => {
          const updated = [...prev];
          if (updated[userMsgIndex]) {
            updated[userMsgIndex] = {
              ...updated[userMsgIndex],
              microFeedback: res.microFeedback,
            };
          }
          // Append AI question
          return [
            ...updated,
            {
              role: "ai",
              text: res.aiMessage.content,
              id: res.aiMessage.id,
            },
          ];
        });

        // Automatically speak next AI question
        speakAiText(res.aiMessage.content);
      } else {
        throw new Error(res.message || "Error processing answer.");
      }
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "I noted that point. Let's explore further: Could you discuss how you handle system resilience, performance bottlenecks, or concurrency in this scenario?",
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // 3. FINISH INTERVIEW SESSION & GENERATE DIAGNOSTIC PERFORMANCE SCORECARD
  const handleFinishSession = async () => {
    if (!currentSession) {
      setSessionState("idle");
      return;
    }

    // Stop speech synthesis & recognition
    window.speechSynthesis?.cancel();
    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
    }

    setSessionState("finishing");

    try {
      const res = await api.post(`/api/interview/${currentSession.id}/finish`, {
        durationSeconds: elapsedTime,
      });

      if (res.success && res.scorecard) {
        setScorecard(res.scorecard);
        setShowScorecardModal(true);
        fetchHistory();
      } else {
        throw new Error(res.message || "Failed to finalize scorecard.");
      }
    } catch (err) {
      console.error("Finish session error:", err);
      alert(err.message || "Could not generate final scorecard.");
    } finally {
      setSessionState("idle");
    }
  };

  // Open past interview report from history
  const handleOpenPastReport = async (pastSession) => {
    try {
      const res = await api.get(`/api/interview/${pastSession.id}`);
      if (res.success && res.session?.scorecard) {
        setScorecard(res.session.scorecard);
        setShowScorecardModal(true);
        setShowHistoryModal(false);
      } else {
        alert("This past interview does not have a generated scorecard.");
      }
    } catch (err) {
      console.error("Failed to load past session details:", err);
    }
  };

  // Delete past interview from history
  const handleDeletePastSession = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Remove this interview session from history?")) return;
    try {
      await api.del(`/api/interview/${id}`);
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete interview error:", err);
    }
  };

  // Toggle micro-feedback accordion
  const toggleFeedback = (idx) => {
    setExpandedFeedback((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="h-full w-full bg-[#050812] text-white flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-violet-600/12 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* FIXED TOP HEADER */}
      <header className="shrink-0 px-4 md:px-6 lg:px-8 py-3.5 border-b border-[#1e2434] bg-[#050812]/95 backdrop-blur-xl z-20">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} /> AI Recruiter Simulation
              </span>
              <span className="text-gray-500 text-xs">•</span>
              <span className="text-xs text-gray-400 font-mono">
                Adaptive Turn-by-Turn Audio & Text
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Mock Interview Bot
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Audio Voice Toggle */}
            <button
              onClick={() => {
                const nextVal = !voiceEnabled;
                setVoiceEnabled(nextVal);
                if (!nextVal) window.speechSynthesis?.cancel();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm
                ${voiceEnabled ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "bg-white/5 border-white/10 text-gray-400"}`}
              title={
                voiceEnabled
                  ? "AI voice enabled (Click to mute)"
                  : "AI voice muted (Click to unmute)"
              }
            >
              {voiceEnabled ? (
                <Volume2 size={14} className="text-violet-400" />
              ) : (
                <VolumeX size={14} />
              )}
              <span className="hidden sm:inline">
                {voiceEnabled ? "Voice On" : "Voice Off"}
              </span>
            </button>

            {/* Past Sessions History */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="View past interview sessions and scorecards"
            >
              <History size={14} className="text-violet-400" />
              <span>Past Rounds</span>
              {historyList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono">
                  {historyList.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN DUAL WORKSPACE */}
      <main className="flex-1 p-4 md:p-6 relative z-10 w-full max-w-[1400px] mx-auto overflow-hidden">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0"
        >
          {/* ========================================================
              LEFT COLUMN: SETUP CONFIG & TELEMETRY
              ======================================================== */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-4 h-full flex flex-col no-scrollbar overflow-y-auto pb-4"
          >
            <div
              className={`bg-[#0B101A]/90 backdrop-blur-xl border border-[#1e2434] rounded-3xl p-5 flex flex-col shrink-0 shadow-2xl relative overflow-hidden transition-all duration-500
              ${sessionState === "active" ? "opacity-90 border-violet-500/30" : "group"}`}
            >
              <div className="absolute inset-0 bg-linear-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center shadow-inner">
                  <Mic className="text-violet-400 w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Interview Setup
                  </h2>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                    Fortune 500 Recruiter Simulator
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-4 relative z-10">
                {/* Resume Bridge Context Banner */}
                {resumeContext && (
                  <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/25 space-y-1.5 shadow-md animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-violet-300 uppercase tracking-wider">
                        <Sparkles size={13} className="text-violet-400" />{" "}
                        Resume Linked
                      </span>
                      <span className="px-2 py-0.2 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-bold font-mono border border-violet-500/30">
                        ATS {resumeContext.atsScore}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-tight">
                      Interview customized to{" "}
                      <strong className="text-white">
                        {resumeContext.resumeName}
                      </strong>
                    </p>
                    {resumeContext.keySkills &&
                      resumeContext.keySkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {resumeContext.keySkills.map((sk, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.2 rounded bg-white/5 border border-white/5 text-[9px] text-violet-200"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* Target Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                    <span>Target Job Role *</span>
                  </label>
                  <div className="relative">
                    <Briefcase
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                      size={14}
                    />
                    <input
                      type="text"
                      disabled={sessionState === "active"}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="e.g. Senior Full-Stack Engineer"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-[#1e2434] text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500/50 disabled:opacity-50 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Interview Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Round Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {INTERVIEW_TYPES.map((t) => {
                      const IconComponent = t.icon;
                      const isSelected = type === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={sessionState === "active"}
                          onClick={() => setType(t.id)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer disabled:opacity-50
                            ${
                              isSelected
                                ? "bg-violet-500/15 border-violet-500/40 text-violet-300 shadow-sm"
                                : "bg-black/30 border-white/5 text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                          <IconComponent
                            size={16}
                            className={`mb-1 ${isSelected ? "text-violet-400" : "text-gray-500"}`}
                          />
                          <span className="text-[11px] font-semibold">
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty Seniority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">
                    Target Seniority Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        type="button"
                        disabled={sessionState === "active"}
                        onClick={() => setDifficulty(d)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer disabled:opacity-50
                          ${
                            difficulty === d
                              ? "bg-violet-500/20 border-violet-500/40 text-violet-300 shadow-sm"
                              : "bg-black/30 border-white/5 text-gray-400 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* ACTION BUTTON */}
              <div className="mt-5 relative z-10 w-full shrink-0">
                {sessionState === "active" ? (
                  <button
                    onClick={handleFinishSession}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 hover:border-rose-500/60 text-rose-300 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-500/10"
                  >
                    <Square size={13} fill="currentColor" />
                    <span>Conclude & Generate Scorecard</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartSession}
                    disabled={sessionState !== "idle" || !role.trim()}
                    className="w-full py-3 px-5 rounded-xl font-bold text-xs text-white bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {sessionState === "starting" ? (
                      <>
                        <Loader2
                          size={15}
                          className="animate-spin text-white"
                        />
                        <span>Connecting to AI Interviewer...</span>
                      </>
                    ) : sessionState === "finishing" ? (
                      <>
                        <Loader2
                          size={15}
                          className="animate-spin text-white"
                        />
                        <span>Compiling Diagnostic Scorecard...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" />
                        <span>Start Mock Interview</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ========================================================
              RIGHT COLUMN: LIVE INTERVIEW INTERFACE & TELEMETRY
              ======================================================== */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-8 h-full flex flex-col relative pb-4"
          >
            <div className="bg-[#0B101A]/90 backdrop-blur-xl border border-[#1e2434] rounded-3xl flex flex-col h-full shadow-2xl relative overflow-hidden">
              {/* Telemetry Header */}
              <div className="h-13 border-b border-[#1e2434] flex items-center justify-between px-5 bg-black/40 shrink-0 relative z-20">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        sessionState === "active"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-gray-600"
                      }`}
                    />
                    <span className="text-xs font-bold text-gray-300">
                      {sessionState === "active"
                        ? "Session Active"
                        : "Interviewer Ready"}
                    </span>
                  </div>

                  {currentSession && (
                    <span className="px-2 py-0.2 rounded-md bg-white/5 border border-white/5 text-[10px] text-violet-400 font-mono">
                      {currentSession.role} • {currentSession.difficulty}
                    </span>
                  )}
                </div>

                {/* Telemetry Right Badges */}
                <div className="flex items-center gap-4 text-xs">
                  {/* Speaking indicator */}
                  {isAiSpeaking && (
                    <div className="flex items-center gap-1.5 text-violet-400 font-mono text-[11px] animate-pulse">
                      <Volume2 size={13} />
                      <span>Speaking</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-lg border border-white/5 text-gray-300 font-mono">
                    <Clock size={12} className="text-violet-400" />
                    <span>{formatTime(elapsedTime)}</span>
                  </div>

                  {sessionState === "active" && (
                    <button
                      onClick={handleFinishSession}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 text-[11px] text-gray-300 transition-all cursor-pointer"
                    >
                      Finish
                    </button>
                  )}
                </div>
              </div>

              {/* ── 4-PHASE RECRUITER LIFECYCLE STEPPER BAR ── */}
              {sessionState === "active" && (
                <div className="px-4 md:px-5 py-2.5 bg-black/50 border-b border-[#1e2434] flex flex-wrap items-center justify-between gap-3 shrink-0 relative z-10">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {PHASES.map((p) => {
                      const isCurrent = currentPhase === p.id;
                      const isCompleted = currentPhase > p.id;
                      const PhaseIcon = p.icon;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-1 sm:gap-2"
                        >
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                            ${
                              isCurrent
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/20"
                                : isCompleted
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-white/[0.02] text-gray-500 border border-white/5"
                            }`}
                          >
                            <PhaseIcon
                              size={12}
                              className={
                                isCurrent
                                  ? "text-violet-400"
                                  : isCompleted
                                    ? "text-emerald-400"
                                    : "text-gray-500"
                              }
                            />
                            <span className="hidden md:inline">{p.name}</span>
                            <span className="md:hidden">{p.short}</span>
                          </div>
                          {p.id < 4 && (
                            <span className="text-gray-600 text-xs">➔</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Question Progress Counter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-violet-300 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-violet-400" />
                      <span>
                        Question {questionNumber} / {totalExpectedQuestions}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Main Scrolling Body */}
              <div className="flex-1 flex flex-col relative overflow-hidden bg-linear-to-b from-transparent to-black/20">
                {/* 1. IDLE / EMPTY STATE */}
                {sessionState === "idle" && (
                  <div className="h-full p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 text-violet-400 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                      <Eye size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Simulated Recruiter Chamber
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed mb-6">
                      Configure your target role and interview type on the left.
                      Once initialized, the AI recruiter will ask adaptive
                      technical, behavioral, or architectural questions and
                      evaluate your answers turn-by-turn.
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full text-left">
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-violet-400 text-xs font-bold block mb-1">
                          🎤 Voice & Mic Input
                        </span>
                        <p className="text-[11px] text-gray-400">
                          Speak naturally using speech-to-text or type answers.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-violet-400 text-xs font-bold block mb-1">
                          📊 Turn Micro-Feedback
                        </span>
                        <p className="text-[11px] text-gray-400">
                          Receive instant advice on what you answered well vs
                          missed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CONNECTING / STARTING LOADER */}
                {sessionState === "starting" && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="relative w-24 h-24 mb-5">
                      <div className="absolute inset-0 bg-violet-600 rounded-full blur-2xl opacity-30 animate-pulse" />
                      <div className="absolute inset-0 border-[3px] border-violet-500/20 border-dashed rounded-full animate-[spin_4s_linear_infinite]" />
                      <div className="absolute inset-2 border-[2px] border-violet-400 border-t-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Volume2
                          className="text-violet-300 animate-pulse"
                          size={26}
                        />
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">
                      Connecting to Senior Interviewer
                    </h4>
                    <p className="text-xs text-gray-400 font-mono">
                      Generating tailored opening question for {role}...
                    </p>
                  </div>
                )}

                {/* 3. ACTIVE CHAT THREAD */}
                {sessionState === "active" && (
                  <div className="flex flex-col h-full w-full relative">
                    {/* Floating Recruiter Video/Voice Avatar Module */}
                    <div className="absolute top-3 right-4 w-44 h-32 bg-[#050812]/90 backdrop-blur-2xl rounded-2xl border border-[#1e2434] shadow-2xl overflow-hidden z-20 group">
                      <div className="absolute top-0 inset-x-0 h-6 bg-black/60 flex items-center px-2.5 z-10 justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-bold uppercase text-gray-300">
                            AI_Recruiter
                          </span>
                        </div>
                        <span className="text-[9px] text-violet-400 font-mono font-bold">
                          {isAiSpeaking ? "Audio ON" : "Listening"}
                        </span>
                      </div>

                      {/* Animated Sound Wave Visualizer */}
                      <div className="absolute inset-0 flex items-center justify-center pt-4">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <div
                            className={`absolute inset-0 bg-violet-500 rounded-full blur-xl transition-opacity ${
                              isAiSpeaking
                                ? "opacity-40 animate-pulse"
                                : "opacity-15"
                            }`}
                          />
                          <div className="w-full h-full rounded-full border border-violet-500/30 flex items-center justify-center bg-black/40">
                            {isAiSpeaking ? (
                              <div className="flex items-center justify-center gap-1 h-6">
                                {[...Array(6)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ height: ["4px", "22px", "4px"] }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 0.4 + i * 0.1,
                                      ease: "easeInOut",
                                    }}
                                    className="w-1 rounded-full bg-violet-400"
                                  />
                                ))}
                              </div>
                            ) : (
                              <Volume2
                                size={22}
                                className="text-violet-400/80"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages Scrolling Pane */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 no-scrollbar pb-24">
                      {messages.map((m, i) => (
                        <div
                          key={i}
                          className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start w-[88%] md:w-[75%]"}`}
                        >
                          {/* Message Bubble */}
                          <div
                            className={`relative rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-lg
                              ${
                                m.role === "user"
                                  ? "bg-linear-to-r from-violet-600 to-indigo-600 text-white rounded-br-none max-w-[85%]"
                                  : "bg-[#0f1424] border border-[#1e2434] text-gray-200 rounded-tl-none"
                              }`}
                          >
                            {m.role === "ai" && (
                              <span className="absolute -top-2.5 left-3 bg-[#050812] border border-[#1e2434] text-[9px] uppercase font-bold text-violet-400 px-2 py-0.5 rounded-full z-10">
                                Recruiter
                              </span>
                            )}
                            {m.text}
                          </div>

                          {/* ── TURN-BY-TURN MICRO-FEEDBACK PILL (FOR CANDIDATE ANSWERS) ── */}
                          {m.role === "user" && m.microFeedback && (
                            <div className="mt-2 w-full max-w-[85%] animate-in fade-in duration-200">
                              <button
                                onClick={() => toggleFeedback(i)}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-violet-300 transition-all cursor-pointer ml-auto"
                              >
                                <Sparkles
                                  size={11}
                                  className="text-violet-400"
                                />
                                <span>
                                  Turn Evaluation: {m.microFeedback.score}/10
                                </span>
                                {m.microFeedback.clarityScore && (
                                  <span className="text-[10px] text-gray-400 font-mono ml-1">
                                    • Clarity {m.microFeedback.clarityScore}%
                                  </span>
                                )}
                                {expandedFeedback[i] ? (
                                  <ChevronUp size={12} />
                                ) : (
                                  <ChevronDown size={12} />
                                )}
                              </button>

                              {expandedFeedback[i] && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="mt-1.5 p-3 rounded-xl bg-black/60 border border-violet-500/20 text-xs space-y-2 shadow-xl text-left"
                                >
                                  {m.microFeedback.positive && (
                                    <div className="text-emerald-300 flex items-start gap-1.5">
                                      <span className="text-emerald-400 font-bold">
                                        ✓
                                      </span>
                                      <span>{m.microFeedback.positive}</span>
                                    </div>
                                  )}
                                  {m.microFeedback.missing && (
                                    <div className="text-violet-300 flex items-start gap-1.5">
                                      <span className="text-violet-400 font-bold">
                                        !
                                      </span>
                                      <span>{m.microFeedback.missing}</span>
                                    </div>
                                  )}
                                  {m.microFeedback.suggestion && (
                                    <div className="text-gray-400 text-[11px] italic pl-3 border-l border-violet-500/30">
                                      💡 {m.microFeedback.suggestion}
                                    </div>
                                  )}

                                  {/* Speech & Filler Telemetry */}
                                  {m.microFeedback.fillerAnalysis &&
                                    m.microFeedback.fillerAnalysis.count >
                                      0 && (
                                      <div className="pt-1.5 border-t border-white/5 flex items-center gap-2 text-[10px] text-amber-300/90 font-mono">
                                        <span>
                                          🗣️{" "}
                                          {m.microFeedback.fillerAnalysis.count}{" "}
                                          filler word(s) detected:
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
                                          {m.microFeedback.fillerAnalysis.detected.join(
                                            ", ",
                                          )}
                                        </span>
                                      </div>
                                    )}
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Recruiter Thinking Indicator */}
                      {isAiTyping && (
                        <div className="flex justify-start pt-1">
                          <div className="bg-[#0f1424] border border-[#1e2434] rounded-2xl p-3.5 rounded-tl-none flex items-center gap-1.5 w-16 shadow-lg">
                            <motion.div
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.4, 1, 0.4],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: 0,
                              }}
                              className="w-1.5 h-1.5 rounded-full bg-violet-400"
                            />
                            <motion.div
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.4, 1, 0.4],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: 0.2,
                              }}
                              className="w-1.5 h-1.5 rounded-full bg-violet-400"
                            />
                            <motion.div
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.4, 1, 0.4],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.8,
                                delay: 0.4,
                              }}
                              className="w-1.5 h-1.5 rounded-full bg-violet-400"
                            />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Bottom Console: Voice STT + Text Input + Hands-Free VAD */}
                    <div className="shrink-0 px-4 pb-4 pt-2 bg-linear-to-t from-[#0B101A] via-[#0B101A]/90 to-transparent">
                      {/* Hands-Free Silence Detection Auto-Send Banner */}
                      {vadCountdown !== null && (
                        <div className="mb-2 px-3.5 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-between text-xs text-violet-200 shadow-lg shadow-violet-500/10 animate-in fade-in slide-in-from-bottom-1 duration-200">
                          <div className="flex items-center gap-2">
                            <Radio
                              size={14}
                              className="text-violet-400 animate-pulse"
                            />
                            <span>
                              Silence detected. Hands-free auto-sending in{" "}
                              <strong className="text-white font-mono text-sm underline">
                                {vadCountdown}s
                              </strong>
                              ...
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={cancelAutoSend}
                            className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col bg-[#050812]/90 backdrop-blur-2xl border border-[#1e2434] rounded-2xl p-2.5 focus-within:border-violet-500/50 transition-colors shadow-2xl relative">
                        {/* Status line & VAD toggle toolbar */}
                        <div className="flex items-center justify-between px-1 pb-1.5 text-[11px]">
                          {isListening ? (
                            <div className="flex items-center gap-2 text-violet-400 font-mono animate-pulse">
                              <Mic size={12} />
                              <span>Listening... speak naturally.</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-[10px]">
                              Ready for your response
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const next = !handsFreeMode;
                              setHandsFreeMode(next);
                              if (!next) cancelAutoSend();
                            }}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border transition-all cursor-pointer
                              ${
                                handsFreeMode
                                  ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
                                  : "bg-white/5 border-white/5 text-gray-500 hover:text-gray-400"
                              }`}
                            title={
                              handsFreeMode
                                ? "Hands-Free Auto-Send is ON (Sends when you stop speaking)"
                                : "Hands-Free Auto-Send is OFF"
                            }
                          >
                            <Radio
                              size={10}
                              className={
                                handsFreeMode
                                  ? "text-violet-400 animate-pulse"
                                  : "text-gray-500"
                              }
                            />
                            <span>
                              VAD Auto-Send: {handsFreeMode ? "ON" : "OFF"}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-end gap-2">
                          {/* Microphone Button (Speech-to-Text) */}
                          <button
                            type="button"
                            onClick={toggleSpeechRecognition}
                            className={`shrink-0 p-2.5 rounded-xl transition-all cursor-pointer mb-0.5
                              ${
                                isListening
                                  ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                  : "text-gray-400 hover:text-white hover:bg-white/10"
                              }`}
                            title={
                              isListening
                                ? "Stop voice listening"
                                : "Click to speak your response (Speech-to-Text)"
                            }
                          >
                            {isListening ? (
                              <MicOff size={18} />
                            ) : (
                              <Mic size={18} />
                            )}
                          </button>

                          <textarea
                            value={inputVal}
                            onChange={(e) => {
                              cancelAutoSend();
                              setInputVal(e.target.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                cancelAutoSend();
                                handleSendMessage();
                              }
                            }}
                            placeholder={
                              isListening
                                ? "Speaking..."
                                : "Type or speak your answer... (Press Enter to send)"
                            }
                            className="flex-1 bg-transparent border-none text-xs md:text-sm text-gray-200 focus:outline-none resize-none py-2.5 min-h-[40px] max-h-[120px] leading-relaxed"
                            rows={1}
                          />

                          <button
                            onClick={() => {
                              cancelAutoSend();
                              handleSendMessage();
                            }}
                            disabled={!inputVal.trim() || isAiTyping}
                            className="shrink-0 p-2.5 bg-linear-to-r from-violet-600 to-indigo-600 rounded-xl text-white hover:from-violet-500 hover:to-indigo-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-0.5 shadow-md shadow-violet-500/20 cursor-pointer"
                            title="Send answer"
                          >
                            <Send size={16} className="translate-x-[0.5px]" />
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

      {/* ========================================================
          DIAGNOSTIC SCORECARD PERFORMANCE REPORT MODAL
          ======================================================== */}
      {showScorecardModal && scorecard && (
        <div
          onClick={() => setShowScorecardModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-[#0B101A] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider flex items-center gap-1.5">
                  <Award size={13} /> Performance Audit Complete
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  Interview Diagnostic Scorecard
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print Scorecard</span>
                </button>
                <button
                  onClick={() => setShowScorecardModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scorecard Hero Banner */}
            <div className="p-5 rounded-2xl bg-linear-to-r from-violet-950/40 via-black/40 to-indigo-950/30 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex flex-col items-center justify-center text-violet-400 shrink-0 shadow-lg">
                  <span className="text-3xl font-black font-mono leading-none">
                    {scorecard.overallScore}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest mt-1">
                    / 100
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                      Readiness Level:
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-bold font-mono">
                      Grade {scorecard.grade || "B+"}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {scorecard.readinessLevel}
                  </h3>
                  <p className="text-xs text-gray-300 italic mt-1 leading-relaxed">
                    "{scorecard.summaryVerdict}"
                  </p>
                </div>
              </div>

              {/* Pillars */}
              {scorecard.pillars && (
                <div className="grid grid-cols-2 gap-2 text-center shrink-0 w-full sm:w-auto">
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">
                      Technical
                    </span>
                    <span className="text-xs font-bold text-violet-400 font-mono">
                      {scorecard.pillars.technicalDepth?.score || 75}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">
                      Clarity
                    </span>
                    <span className="text-xs font-bold text-indigo-400 font-mono">
                      {scorecard.pillars.communicationClarity?.score || 80}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">
                      Problem Solving
                    </span>
                    <span className="text-xs font-bold text-violet-300 font-mono">
                      {scorecard.pillars.problemSolving?.score || 70}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">
                      Culture Fit
                    </span>
                    <span className="text-xs font-bold text-indigo-300 font-mono">
                      {scorecard.pillars.cultureFit?.score || 85}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Speech Delivery & Telemetry */}
            {scorecard.speechDelivery && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-purple-500/10 border border-violet-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                    <Radio
                      size={14}
                      className="text-violet-400 animate-pulse"
                    />
                    Speech Delivery & Articulation Telemetry
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                    STAR Framework:{" "}
                    {scorecard.speechDelivery.starMethodScore ?? 80}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Speaking Pacing
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {scorecard.speechDelivery.pacing || "Optimal (135 WPM)"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      Filler Word Impact
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        scorecard.speechDelivery.fillerWordImpact === "Minimal"
                          ? "text-emerald-400"
                          : scorecard.speechDelivery.fillerWordImpact ===
                              "Moderate"
                            ? "text-amber-400"
                            : "text-rose-400"
                      }`}
                    >
                      {scorecard.speechDelivery.fillerWordImpact || "Minimal"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                      STAR Structure
                    </span>
                    <span className="text-xs font-semibold text-indigo-300">
                      {scorecard.speechDelivery.starMethodScore ?? 80}%
                      Adherence
                    </span>
                  </div>
                </div>
                {scorecard.speechDelivery.deliveryTip && (
                  <p className="text-[11px] text-gray-300 italic bg-white/[0.02] p-2 rounded-lg border border-white/5">
                    <span className="font-bold text-violet-400 not-italic mr-1.5">
                      Recruiter Delivery Tip:
                    </span>
                    "{scorecard.speechDelivery.deliveryTip}"
                  </p>
                )}
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Core Strengths Demonstrated
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {scorecard.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Critical Areas for Polish
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {scorecard.weaknesses?.map((w, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actionable Study Plan */}
            {scorecard.studyPlan && scorecard.studyPlan.length > 0 && (
              <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/15 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                  <BookOpen size={13} /> Recommended Preparation Topics Before
                  Next Round
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {scorecard.studyPlan.map((topic, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-black/40 border border-white/5 text-gray-200 flex items-start gap-2"
                    >
                      <span className="text-violet-400 font-bold font-mono">
                        0{i + 1}.
                      </span>
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question by Question Review */}
            {scorecard.questionReviews &&
              scorecard.questionReviews.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Question-by-Question Diagnostic Review
                  </h4>
                  <div className="space-y-3">
                    {scorecard.questionReviews.map((rev, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-violet-300">
                            Question {idx + 1}
                          </span>
                          <span className="px-2 py-0.2 rounded-md bg-white/5 border border-white/5 text-[10px] font-mono font-bold text-violet-400">
                            Score: {rev.score}/10
                          </span>
                        </div>
                        <p className="text-gray-200 font-medium">
                          "{rev.question}"
                        </p>
                        {rev.candidateAnswer && (
                          <p className="text-gray-400 text-[11px] italic pl-2 border-l border-white/10">
                            Your response: "{rev.candidateAnswer}"
                          </p>
                        )}
                        {rev.idealAnswerFramework && (
                          <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-emerald-200 text-[11px]">
                            <strong>Ideal Answer Framework:</strong>{" "}
                            {rev.idealAnswerFramework}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Modal Bottom CTA */}
            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowScorecardModal(false);
                  setSessionState("idle");
                }}
                className="px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Start Another Interview Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PAST INTERVIEW SESSIONS HISTORY MODAL
          ======================================================== */}
      {showHistoryModal && (
        <div
          onClick={() => setShowHistoryModal(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0B101A] border border-white/10 rounded-3xl p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-violet-400" />
                <h3 className="text-base font-bold text-white">
                  Interview History
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Loading history...
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No past interviews found.
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenPastReport(item)}
                    className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-violet-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-200 group-hover:text-violet-300 truncate">
                        {item.role}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {item.type} • {item.difficulty} •{" "}
                        {formatTime(item.duration_seconds || 0)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.overall_score ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-violet-500/15 border border-violet-500/30 text-violet-300">
                          {item.overall_score}/100
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/5 text-gray-500">
                          {item.status}
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDeletePastSession(item.id, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all"
                        title="Delete session"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
