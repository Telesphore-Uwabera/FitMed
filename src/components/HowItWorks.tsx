"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  CheckCircle, UserPlus, FileText, Video, Award, Shield, ArrowRight,
} from "lucide-react";

// Re-export to prevent stale browser chunk crashes
export { UserPlus, FileText, Video, Award };

/* ── Step data ─────────────────────────────────────────────────────── */
const steps = [
  {
    num: "01",
    title: "Request",
    description:
      "Create your account, choose your certificate purpose, and provide your identity details. We make it simple to get started.",
    gradient: "from-sky-400 to-cyan-500",
    glow: "shadow-sky-400/40",
    check: "text-sky-500",
    Icon: UserPlus,
    details: [
      "Account creation & phone / email verification",
      "Identity & demographic information",
      "Certificate purpose selection",
    ],
  },
  {
    num: "02",
    title: "Complete Assessment",
    description:
      "Fill out a smart adaptive health questionnaire personalised to your specific certificate need — takes under 10 minutes.",
    gradient: "from-teal-400 to-emerald-500",
    glow: "shadow-teal-400/40",
    check: "text-teal-500",
    Icon: FileText,
    details: [
      "Adaptive medical history questionnaire",
      "Danger-sign & symptom screening",
      "Vital signs & measurements",
    ],
  },
  {
    num: "03",
    title: "Consult a Doctor",
    description:
      "Meet a licensed doctor face-to-face through a secure, end-to-end encrypted video call — from wherever you are.",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-400/40",
    check: "text-violet-500",
    Icon: Video,
    details: [
      "Secure live video consultation",
      "Identity verification workflow",
      "Full virtual clinical assessment",
    ],
  },
  {
    num: "04",
    title: "Get Certified",
    description:
      "Receive a digitally signed certificate with a unique QR code — valid anywhere, shareable instantly.",
    gradient: "from-amber-400 to-orange-500",
    glow: "shadow-amber-400/40",
    check: "text-amber-500",
    Icon: Award,
    details: [
      "Digitally signed certificate",
      "Unique QR verification code",
      "Shareable online certificate link",
    ],
  },
];

/* ── Node bubble ─────────────────────────────────────────────────────── */
function Node({ step, delay, isInView }: { step: (typeof steps)[0]; delay: number; isInView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className={`w-[84px] h-[84px] rounded-full bg-gradient-to-br ${step.gradient} shadow-xl ${step.glow} flex flex-col items-center justify-center ring-4 ring-white dark:ring-slate-900 relative z-20`}
    >
      <span className="text-white text-[11px] font-black tracking-widest opacity-80 leading-none">
        {step.num}
      </span>
      <step.Icon className="w-6 h-6 text-white mt-1" strokeWidth={1.8} />
    </motion.div>
  );
}

/* ── Info card ───────────────────────────────────────────────────────── */
function Card({
  step, delay, isInView, from, className = "",
}: {
  step: (typeof steps)[0]; delay: number; isInView: boolean;
  from: "top" | "bottom" | "left" | "right"; className?: string;
}) {
  const init = { top: { opacity: 0, y: -14 }, bottom: { opacity: 0, y: 14 }, left: { opacity: 0, x: -14 }, right: { opacity: 0, x: 14 } };
  return (
    <motion.div
      initial={init[from]}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-100 dark:border-slate-700 ${className}`}
    >
      <h3 className="text-[#0B2D5C] dark:text-white font-extrabold text-sm mb-2" style={{ fontFamily: "var(--font-primary)" }}>
        {step.title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-3">{step.description}</p>
      <ul className="space-y-1.5">
        {step.details.map((d) => (
          <li key={d} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <CheckCircle className={`w-3.5 h-3.5 ${step.check} flex-shrink-0 mt-0.5`} />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative py-28 section-white overflow-hidden">
      <div className="container-wide">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-5 badge-primary">
            Simple 4-Step Process
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-[#0B2D5C] dark:text-white mb-5"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            From account creation to certificate delivery — get medically certified in as little as one day.
          </p>
        </motion.div>

        {/* ══ DESKTOP orbital ══════════════════════════════════════════ */}
        <div className="hidden lg:block relative" style={{ height: 720 }}>

          {/* Dashed oval track */}
          <div
            className="absolute rounded-[50%] border-2 border-dashed border-slate-200 dark:border-slate-700 pointer-events-none"
            style={{ width: "56%", height: "64%", top: "18%", left: "22%" }}
          />

          {/* Centre hub */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-10"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#0B2D5C] to-[#12B8B0] flex items-center justify-center shadow-2xl shadow-[#0B2D5C]/30 ring-8 ring-white/10 dark:ring-slate-900/40">
              <Shield className="w-12 h-12 text-white" strokeWidth={1.5} />
            </div>
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-md text-center">
              <p className="text-[#0B2D5C] dark:text-slate-300 text-xs font-semibold">Your Journey to a</p>
              <p className="gradient-text font-black text-sm">Verified Certificate</p>
            </div>
          </motion.div>

          {/* Step 01 — TOP */}
          <div className="absolute" style={{ top: "14%", left: "50%", transform: "translateX(-50%)" }}>
            <Node step={steps[0]} delay={0.25} isInView={isInView} />
            <Card step={steps[0]} delay={0.45} isInView={isInView} from="right"
              className="absolute top-0 left-[calc(100%+1.25rem)] w-[248px]" />
          </div>

          {/* Step 02 — RIGHT */}
          <div className="absolute" style={{ top: "50%", right: "21%", transform: "translateY(-50%)" }}>
            <Node step={steps[1]} delay={0.4} isInView={isInView} />
            <Card step={steps[1]} delay={0.6} isInView={isInView} from="right"
              className="absolute top-1/2 -translate-y-1/2 left-[calc(100%+1.25rem)] w-[240px]" />
          </div>

          {/* Step 03 — BOTTOM */}
          <div className="absolute" style={{ bottom: "14%", left: "50%", transform: "translateX(-50%)" }}>
            <Node step={steps[2]} delay={0.55} isInView={isInView} />
            <Card step={steps[2]} delay={0.75} isInView={isInView} from="left"
              className="absolute bottom-0 right-[calc(100%+1.25rem)] w-[260px]" />
          </div>

          {/* Step 04 — LEFT */}
          <div className="absolute" style={{ top: "50%", left: "21%", transform: "translateY(-50%)" }}>
            <Node step={steps[3]} delay={0.7} isInView={isInView} />
            <Card step={steps[3]} delay={0.9} isInView={isInView} from="left"
              className="absolute top-1/2 -translate-y-1/2 right-[calc(100%+1.25rem)] w-[240px]" />
          </div>
        </div>
        {/* ══ END desktop ══════════════════════════════════════════════ */}

        {/* ══ MOBILE stacked ═══════════════════════════════════════════ */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700"
            >
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${s.gradient} flex flex-col items-center justify-center shadow-lg mb-4`}>
                <span className="text-white text-[10px] font-black tracking-widest opacity-80 leading-none">{s.num}</span>
                <s.Icon className="w-5 h-5 text-white mt-0.5" strokeWidth={1.8} />
              </div>
              <h3 className="text-[#0B2D5C] dark:text-white font-extrabold text-lg mb-2" style={{ fontFamily: "var(--font-primary)" }}>
                {s.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{s.description}</p>
              <ul className="space-y-2">
                {s.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle className={`w-4 h-4 ${s.check} flex-shrink-0 mt-0.5`} />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        {/* ══ END mobile ════════════════════════════════════════════════ */}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.05 }}
          className="text-center mt-4 lg:mt-0"
        >
          <motion.a
            href="/signin"
            whileHover={{ scale: 1.04, boxShadow: "0 16px 40px rgba(14,165,233,.3)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-[#0B2D5C] bg-[#12B8B0] hover:bg-[#1dd9d0] shadow-lg shadow-sky-500/20 text-base transition-colors"
          >
            <span className="text-[#0B2D5C]">Start Your Assessment</span>
            <ArrowRight className="w-5 h-5 text-[#0B2D5C]" />
          </motion.a>
        </motion.div>

      </div>
    </section>
  );
}
