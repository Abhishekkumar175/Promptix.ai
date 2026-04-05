import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MobileMenu from "./MobileMenu";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { Command, Sparkles } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 inset-x-0 z-50 px-6"
    >
      <div
        className={`max-w-6xl mx-auto flex items-center justify-between px-6 py-3 mt-4 rounded-2xl transition-all duration-500
        ${
          scrolled
            ? "bg-white/[0.06] backdrop-blur-2xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]"
            : "bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
        }`}
      >
        {/* LOGO */}
        <div
          onClick={() => navigate("/")}
          className="cursor-pointer flex items-center gap-2.5 group/logo"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur-md opacity-30 group-hover/logo:opacity-60 transition-opacity duration-500" />
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-b from-white/[0.08] to-[#0e142e] border border-white/[0.12] flex items-center justify-center shadow-lg">
              <Command className="w-4 h-4 text-white/90" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-violet-500 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(139,92,246,0.8)]">
                <Sparkles className="w-1.5 h-1.5 text-white" />
              </div>
            </div>
          </div>
          <div className="flex items-baseline">
            <span className="text-lg font-bold tracking-tight text-white">Promptix</span>
            <span className="text-[15px] font-bold tracking-normal italic text-transparent bg-clip-text bg-linear-to-r from-violet-400 to-indigo-400 ml-0.5">
                .ai
              </span>
          </div>
        </div>

        {/* CENTER NAV */}
        {!user && (
          <div className="hidden md:flex items-center gap-8 text-[14px] text-gray-400">
            {[
              { label: "Home", id: "hero" },
              { label: "Platform", id: "tools" },
              { label: "Use Cases", id: "audience" },
              { label: "Pricing", id: "pricing" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() =>
                  document
                    .getElementById(item.id)
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="hover:text-white transition-colors duration-200"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* RIGHT CTA */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoaded ? null : user ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox:
                    "w-8 h-8 ring-2 ring-violet-500/30 hover:ring-violet-500 transition",
                },
              }}
            />
          ) : (
            <button
              onClick={() =>
                openSignIn({
                  afterSignInUrl: "/ai",
                  afterSignUpUrl: "/ai",
                })
              }
              className="px-5 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-[1.03] transition-all duration-300"
            >
              Get Started
            </button>
          )}
        </div>

        {/* MOBILE */}
        <MobileMenu />
      </div>
    </motion.nav>
  );
}
