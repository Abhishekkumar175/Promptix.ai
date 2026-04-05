import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClerk, useUser } from "@clerk/clerk-react";
import { X, Menu, ArrowRight } from "lucide-react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();

  const navItems = [
    { label: "Home", id: "hero" },
    { label: "Platform", id: "tools" },
    { label: "Use Cases", id: "audience" },
    { label: "Pricing", id: "pricing" },
  ];

  const handleNav = (id) => {
    setOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  const handleCTA = () => {
    setOpen(false);
    if (user) {
      window.location.href = "/ai";
    } else {
      openSignIn({ afterSignInUrl: "/ai", afterSignUpUrl: "/ai" });
    }
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
        aria-label="Open menu"
      >
        <Menu size={22} className="text-white" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-down Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 inset-x-0 z-[101] mx-4 mt-4"
            >
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1117] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                  <span className="text-lg font-bold text-white">Menu</span>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                {/* Nav Links */}
                <div className="p-4 space-y-1">
                  {navItems.map((item, i) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                      onClick={() => handleNav(item.id)}
                      className="w-full text-left px-4 py-3 rounded-xl text-[15px] text-gray-300 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                    >
                      {item.label}
                    </motion.button>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="p-4 pt-2 border-t border-white/[0.06]">
                  <button
                    onClick={handleCTA}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300"
                  >
                    {user ? "Go to Dashboard" : "Get Started"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
