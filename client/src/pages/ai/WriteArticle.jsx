import { useState } from "react";
import { Sparkles, PenLine, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

export default function WriteArticle() {
  const { getToken } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [length, setLength] = useState("short");
  const [article, setArticle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a topic");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setArticle("");

      const token = await getToken();

      const res = await fetch(
        "http://localhost:3000/api/ai/generate-article",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt,
            length,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setArticle(data.article);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#020617] min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: CONFIG CARD */}
        <div className="bg-[#0F172A] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-violet-400" size={20} />
            <h2 className="text-lg font-semibold text-white">
              Article Configuration
            </h2>
          </div>

          {/* Topic */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              Article Topic
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="The future of artificial intelligence..."
              className="w-full rounded-lg bg-[#020617] border border-white/10 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>

          {/* Length */}
          <div className="mb-8">
            <label className="block text-sm text-gray-400 mb-3">
              Article Length
            </label>

            <div className="flex flex-wrap gap-3">
              {[
                { key: "short", label: "Short (500–800 words)" },
                { key: "medium", label: "Medium (800–1200 words)" },
                { key: "long", label: "Long (1200+ words)" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setLength(item.key)}
                  className={`px-4 py-2 rounded-full text-sm border transition
                    ${
                      length === item.key
                        ? "bg-violet-600 text-white border-violet-600"
                        : "border-white/10 text-gray-400 hover:bg-white/5"
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg
              bg-linear-to-r from-violet-600 to-indigo-600
              text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <PenLine size={18} />
                Generate Article
              </>
            )}
          </button>
        </div>

        {/* RIGHT: OUTPUT CARD */}
        <div className="bg-[#0F172A] border border-white/10 rounded-xl p-6 overflow-y-auto max-h-[80vh]">

          {!article && !loading && (
            <div className="flex flex-col items-center justify-center text-center h-full">
              <PenLine size={40} className="text-gray-500 mb-4" />
              <h3 className="text-white font-medium mb-1">
                Article Preview
              </h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Enter a topic and click{" "}
                <span className="text-violet-400 font-medium">
                  “Generate article”
                </span>{" "}
                to get started
              </p>
            </div>
          )}

          {article && (
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
              {article}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
