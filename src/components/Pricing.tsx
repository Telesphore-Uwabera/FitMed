"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle, Zap, Building2, ArrowRight, Star } from "lucide-react";

/* ─── All plans share the same canonical 7-item feature list ─────
   Blank strings render as greyed-out "—" to keep card heights equal.
──────────────────────────────────────────────────────────────── */
const plans = [
  {
    name: "Individual",
    icon: Zap,
    price: "RWF 15,000",
    period: "per assessment",
    desc: "Perfect for individuals who need a one-time or occasional medical fitness certificate.",
    color: "from-sky-500 to-sky-600",
    border: "border-slate-200 hover:border-sky-300",
    ring: "",
    popular: false,
    cta: "Request Certificate",
    href: "#request",
    features: [
      "Adaptive health questionnaire",
      "Video consultation with licensed doctor",
      "Digitally signed certificate",
      "QR verification code",
      "Certificate valid 12 months",
      "Download & share certificate",
      "", // placeholder — keeps height equal with Enterprise
    ],
  },
  {
    name: "Professional",
    icon: Star,
    price: "RWF 12,500",
    period: "per assessment",
    desc: "For recurring needs and professionals requiring frequent medical fitness certifications.",
    color: "from-teal-500 to-teal-600",
    border: "border-teal-400",
    ring: "ring-2 ring-teal-400",
    popular: true,
    cta: "Get Started",
    href: "#request",
    features: [
      "Everything in Individual",
      "Priority doctor assignment",
      "Expedited review (< 4 hours)",
      "Multiple certificate purposes",
      "Certificate history & archive",
      "Dedicated support",
      "", // placeholder
    ],
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    period: "per organisation",
    desc: "For organisations managing employee medical fitness at scale with custom requirements.",
    color: "from-violet-500 to-violet-600",
    border: "border-slate-200 hover:border-violet-300",
    ring: "",
    popular: false,
    cta: "Contact Sales",
    href: "mailto:hello@fitmed.rw",
    features: [
      "Everything in Professional",
      "Employer portal access",
      "Bulk assessment credits",
      "Custom certificate branding",
      "API access & integrations",
      "Dedicated account manager",
      "SLA & compliance reporting",
    ],
  },
];

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="relative py-28 section-gray overflow-hidden">

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-5 badge-teal">
            Simple, Transparent Pricing
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Pricing that{" "}
            <span className="gradient-text">Works for Everyone</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
            Whether you&apos;re an individual needing one certificate or an organisation
            managing hundreds — we have a plan for you.
          </p>
        </motion.div>

        {/*
          items-stretch  → all grid cells stretch to the tallest card
          The inner div uses flex-col + h-full so the CTA always pins to the bottom
        */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 45 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.13 }}
              whileHover={{ y: -6, transition: { duration: 0.22 } }}
              className={`relative bg-white rounded-3xl border ${plan.border} ${plan.ring} transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col h-full ${plan.popular ? "shadow-teal-100" : ""}`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-5 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-sky-500 text-xs font-bold text-white shadow-md whitespace-nowrap">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Card body */}
              <div className="p-8 flex flex-col flex-1">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-5 shadow-md flex-shrink-0`}
                >
                  <plan.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>

                {/* Name + description */}
                <h3
                  className="text-xl font-extrabold text-slate-900 mb-1"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed min-h-[3.5rem]">
                  {plan.desc}
                </p>

                {/* Price */}
                <div className="mb-8 flex-shrink-0">
                  <span
                    className="text-3xl font-black text-slate-900"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-400 ml-2">{plan.period}</span>
                </div>

                {/* Feature list — always 7 items */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f, fi) =>
                    f ? (
                      <li key={fi} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ) : (
                      /* Empty slot — keeps spacing but invisible */
                      <li key={fi} className="flex items-center gap-2.5 text-sm opacity-0 select-none" aria-hidden>
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span>–</span>
                      </li>
                    )
                  )}
                </ul>

                {/* CTA — always at the bottom */}
                <motion.a
                  href={plan.href}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 group ${
                    plan.popular
                      ? "btn-primary text-white shadow-md shadow-teal-200"
                      : "btn-outline-primary"
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </motion.a>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-10">
          Pricing reflects clinical service, doctor time, and technology costs.
          Refund available if the assessment cannot be completed.
        </p>
      </div>
    </section>
  );
}
