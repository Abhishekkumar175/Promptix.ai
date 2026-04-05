import { motion } from "framer-motion";
import { Check, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useClerk, useUser } from "@clerk/clerk-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out Promptix and personal projects.",
    icon: Zap,
    features: [
      "5 AI chat messages / day",
      "Basic image generation",
      "1 PDF upload",
      "Community access",
      "Standard response speed",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For power users who need unlimited access to all AI tools.",
    icon: Sparkles,
    features: [
      "Unlimited AI conversations",
      "HD image generation",
      "Unlimited PDF uploads",
      "Mock interview sessions",
      "Priority response speed",
      "Resume review + ATS scoring",
      "Prompt template library",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
];

export default function Pricing() {
  const { openSignIn } = useClerk();
  const { user } = useUser();

  const handleCTA = () => {
    if (user) {
      window.location.href = "/ai";
    } else {
      openSignIn({ afterSignInUrl: "/ai", afterSignUpUrl: "/ai" });
    }
  };

  return (
    <section id="pricing" className="relative py-32 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Simple & transparent pricing
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Start free, scale as you grow. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        {/* Two Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan, i) => {
            const isPopular = plan.popular;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group"
              >
                {/* Glowing border for Pro */}
                {isPopular && (
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-violet-500/50 via-indigo-500/20 to-transparent opacity-60 blur-[0.5px] z-0 pointer-events-none" />
                )}

                <div className={`relative z-10 rounded-2xl border flex flex-col h-full
                  ${isPopular 
                    ? "border-violet-500/30 bg-[#0d1117]" 
                    : "border-white/[0.06] bg-[#0d1117]"
                  }
                  hover:border-violet-500/20 transition-all duration-500
                `}>
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                      Most Popular
                    </div>
                  )}

                  <div className="p-8 flex flex-col flex-1">
                    {/* Plan Header */}
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border
                          ${isPopular 
                            ? "bg-violet-500/10 border-violet-500/20" 
                            : "bg-white/[0.04] border-white/[0.08]"
                          }`}>
                          <plan.icon size={18} className={isPopular ? "text-violet-400" : "text-gray-400"} />
                        </div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      </div>
                      
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
                        {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
                      </div>
                      <p className="text-sm text-gray-400">{plan.description}</p>
                    </div>

                    <div className="h-px bg-white/[0.06] mb-6" />

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm">
                          <Check size={16} className={isPopular ? "text-violet-400 shrink-0 mt-0.5" : "text-gray-500 shrink-0 mt-0.5"} />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <button
                      onClick={handleCTA}
                      className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300
                        ${isPopular 
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] hover:scale-[1.02]" 
                          : "bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] hover:border-white/[0.12]"
                        }
                      `}
                    >
                      {plan.cta}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
