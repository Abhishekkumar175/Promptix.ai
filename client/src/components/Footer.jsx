import { motion } from "framer-motion";
import { Github, Mail, Command, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleScroll = (id) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#0a0a0a] pt-20 pb-8 px-6 relative overflow-hidden">
      {/* Divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-white/[0.08] to-[#0e142e] border border-white/[0.12] flex items-center justify-center">
                <Command className="w-3.5 h-3.5 text-white/90" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Promptix<span className="text-[15px] font-bold tracking-normal italic text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-indigo-400 ml-0.5">
                .ai
              </span>
              </span>
            </div>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              An all-in-one AI platform designed to help creators,
              developers, and professionals generate smarter content,
              automate workflows, and move faster.
            </p>
            
            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
                <Github className="w-4 h-4 text-gray-400" />
              </a>
              <a href="#" className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
                <Mail className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[12px] font-semibold tracking-widest text-gray-500 uppercase mb-5">
              Navigation
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {[
                { label: "Home", id: "hero" },
                { label: "Platform", id: "tools" },
                { label: "Pricing", id: "pricing" },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => handleScroll(item.id)}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[12px] font-semibold tracking-widest text-gray-500 uppercase mb-5">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
              <li className="hover:text-white transition-colors cursor-pointer">Terms of Service</li>
              <li className="hover:text-white transition-colors cursor-pointer">Cookie Policy</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Promptix.ai. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed for the future of work.</p>
        </div>
      </div>
    </footer>
  );
}
