import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

export default function MarkdownRenderer({ content, isStreaming }) {
  if (!content) return null;

  return (
    <div className="markdown-body text-gray-200 leading-relaxed text-[15px] space-y-3 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code block & Inline code
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children || "").replace(/\n$/, "");
            const isMultiline = codeString.includes("\n");

            // Block code
            if (match || isMultiline) {
              return (
                <CodeBlock
                  language={match ? match[1] : ""}
                  code={codeString}
                />
              );
            }

            // Inline code
            return (
              <code
                className="bg-white/10 text-violet-300 font-mono text-[13px] px-1.5 py-0.5 rounded-md border border-white/5"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Headings
          h1({ children }) {
            return (
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-6 mb-3 pb-2 border-b border-white/10 tracking-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-5 mb-2.5 pb-1 border-b border-white/5 tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-lg sm:text-xl font-semibold text-white mt-4 mb-2 tracking-tight">
                {children}
              </h3>
            );
          },

          // Paragraphs
          p({ children }) {
            return <p className="leading-7 mb-3 text-gray-200 last:mb-0">{children}</p>;
          },

          // Lists
          ul({ children }) {
            return (
              <ul className="list-disc list-outside pl-6 my-3 space-y-1.5 text-gray-200">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-outside pl-6 my-3 space-y-1.5 text-gray-200">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="leading-7 pl-1">{children}</li>;
          },

          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-violet-500 bg-violet-500/10 pl-4 pr-3 py-2 rounded-r-xl italic my-4 text-gray-300">
                {children}
              </blockquote>
            );
          },

          // Horizontal divider
          hr() {
            return <hr className="border-white/10 my-6" />;
          },

          // Tables (GFM)
          table({ children }) {
            return (
              <div className="overflow-x-auto my-5 rounded-xl border border-white/10 shadow-lg bg-[#0d1117]">
                <table className="w-full text-left text-sm text-gray-200 border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-[#161b22] text-white font-semibold border-b border-white/10">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-white/5">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-4 py-3 font-semibold text-white text-xs uppercase tracking-wider">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 text-gray-300 text-sm">{children}</td>;
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 underline underline-offset-4 font-medium transition-colors"
              >
                {children}
              </a>
            );
          },

          // Strong & Em
          strong({ children }) {
            return <strong className="font-semibold text-white">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-gray-200">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Streaming cursor */}
      {isStreaming && (
        <span className="inline-block w-2 h-4.5 bg-violet-400 rounded-xs ml-1 animate-pulse align-middle" />
      )}
    </div>
  );
}

