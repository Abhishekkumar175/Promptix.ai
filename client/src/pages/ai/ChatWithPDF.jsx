import { FileText, Sparkles } from "lucide-react";

export default function ChatWithPDF() {
  return (
    <div className="h-full w-full bg-[#030712] text-white flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg">
        <div className="w-20 h-20 bg-linear-to-br from-violet-600/20 to-indigo-600/20 rounded-3xl border border-violet-500/30 flex items-center justify-center mb-6 shadow-2xl">
          <FileText size={36} className="text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Chat with PDF</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Upload any document or book chapter and our AI will analyze it instantly. Extract summaries, ask specific questions, and master your reading materials.
        </p>
        <span className="flex items-center gap-2 px-5 py-2.5 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-full text-sm font-semibold">
          <Sparkles size={16} /> Coming Soon
        </span>
      </div>
    </div>
  );
}
