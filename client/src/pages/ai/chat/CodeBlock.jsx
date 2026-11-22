import { useState, useMemo } from "react";
import { Check, Copy } from "lucide-react";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

export default function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || "").toLowerCase().trim();

  const highlightedHtml = useMemo(() => {
    if (!code) return "";
    try {
      if (cleanLang && hljs.getLanguage(cleanLang)) {
        return hljs.highlight(code, { language: cleanLang, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return "";
    }
  }, [code, cleanLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const displayLang = cleanLang || "code";

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl text-left">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/10 text-xs text-gray-400 select-none">
        <span className="font-mono text-gray-300 font-medium lowercase tracking-wide">
          {displayLang}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto font-mono text-[13.5px] sm:text-[14px] leading-6">
        {highlightedHtml ? (
          <pre className="!bg-transparent !p-0 !m-0">
            <code
              className={`hljs ${cleanLang ? `language-${cleanLang}` : ""}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        ) : (
          <pre className="!bg-transparent !p-0 !m-0 text-gray-200">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

