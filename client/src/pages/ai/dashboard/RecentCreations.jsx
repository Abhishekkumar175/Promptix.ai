import { Compass, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function RecentCreations() {
  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-4">
        Recent Creations
      </h3>

      <div className="relative border border-dashed border-white/20 rounded-3xl bg-[#0B0F1A]/50 p-12 flex flex-col items-center justify-center text-center overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-violet-900/10 pointer-events-none" />

        {/* Empty State Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-[#111827] border border-white/10 rounded-full flex items-center justify-center shadow-lg relative z-10">
            <Compass className="w-10 h-10 text-gray-500" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center shadow-md animate-bounce">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          {/* Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-white/5 rounded-full z-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 border border-white/5 rounded-full z-0" />
        </div>

        <h4 className="text-xl font-semibold text-white mb-2">
          Your Canvas is Empty
        </h4>
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          You haven't created anything yet. Use our AI tools to generate stunning images, write compelling articles, or analyze resumes instantly!
        </p>

        <Link 
          to="/ai/chat" 
          className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          Start Exploring
        </Link>
      </div>
    </div>
  );
}
