"use client";

import { motion } from "framer-motion";
import { CheckCircle, Shield, ArrowRight, UserPlus, FileText, Video, Award } from "lucide-react";
import Image from "next/image";

// Re-exports to prevent stale browser chunk crashes
export { UserPlus, FileText, Video, Award };

/* ── Steps Data ───────────────────────────────────────────────────────── */
const steps = [
  {
    num: "01",
    title: "Request",
    description:
      "Create your account, choose your certificate purpose, and provide your identity details. We make it simple to get started.",
    image: "/1st.webp",
    color: "#0284c7",
    colorClass: "sky",
    badgeBg: "bg-sky-500",
    ringClass: "ring-sky-400/50",
    borderAccent: "border-sky-200 dark:border-sky-800/60",
    glow: "shadow-sky-500/20",
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
    image: "/2nd.webp",
    color: "#0d9488",
    colorClass: "teal",
    badgeBg: "bg-teal-500",
    ringClass: "ring-teal-400/50",
    borderAccent: "border-teal-200 dark:border-teal-800/60",
    glow: "shadow-teal-500/20",
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
    image: "/3rd.webp",
    color: "#8b5cf6",
    colorClass: "purple",
    badgeBg: "bg-purple-600",
    ringClass: "ring-purple-400/50",
    borderAccent: "border-purple-200 dark:border-purple-800/60",
    glow: "shadow-purple-500/20",
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
    image: "/4th.webp",
    color: "#f59e0b",
    colorClass: "amber",
    badgeBg: "bg-amber-500",
    ringClass: "ring-amber-400/50",
    borderAccent: "border-amber-200 dark:border-amber-800/60",
    glow: "shadow-amber-500/20",
    details: [
      "Digitally signed certificate",
      "Unique QR verification code",
      "Shareable online certificate link",
    ],
  },
];

/* ── Step Info Card Component ─────────────────────────────────────────── */
function StepCard({
  step,
  className = "",
}: {
  step: (typeof steps)[0];
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-[#0c1c33] rounded-2xl p-5 shadow-xl border ${step.borderAccent} ${className}`}
    >
      <h3
        className="text-[#0B2D5C] dark:text-white font-extrabold text-base mb-1.5"
        style={{ fontFamily: "var(--font-primary)" }}
      >
        {step.title}
      </h3>
      <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-3.5">
        {step.description}
      </p>
      <ul className="space-y-1.5">
        {step.details.map((d) => (
          <li
            key={d}
            className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="leading-tight">{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Circular Step Node with Image ────────────────────────────────────── */
function StepNode({ step }: { step: (typeof steps)[0] }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Number badge pill on top */}
      <div
        className={`absolute -top-3.5 z-20 px-3 py-0.5 rounded-full ${step.badgeBg} text-white text-xs font-black shadow-md tracking-wider`}
      >
        {step.num}
      </div>

      {/* Circular node container */}
      <div
        className={`w-32 h-32 rounded-full p-1 bg-white dark:bg-slate-900 shadow-xl ring-4 ${step.ringClass} flex items-center justify-center transition-transform hover:scale-105 duration-300 cursor-pointer overflow-hidden relative`}
      >
        <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
          <Image
            src={step.image}
            alt={step.title}
            fill
            className="object-cover object-top"
            sizes="128px"
            priority
          />
        </div>
      </div>
    </div>
  );
}

/* ── Main How It Works Component ──────────────────────────────────────── */
export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 section-white overflow-hidden">
      <div className="container-wide">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-4 badge-primary">
            Simple 4-Step Process
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-[#0B2D5C] dark:text-white mb-4"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            From account creation to certificate delivery — get medically certified in as little as one day.
          </p>
        </motion.div>

        {/* ══ DESKTOP: Orbital Diagram (matching reference image) ═══════ */}
        <div className="hidden xl:block relative w-full max-w-[1140px] mx-auto h-[780px]">

          {/* SVG Background: Dashed Concentric Rings & Radial Connecting Lines */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1140 780"
            fill="none"
          >
            {/* Outer dashed orbit */}
            <circle
              cx="570"
              cy="340"
              r="290"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="dark:stroke-slate-700"
            />
            {/* Inner dashed orbit */}
            <circle
              cx="570"
              cy="340"
              r="200"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              className="dark:stroke-slate-800"
            />

            {/* Radial Connector Lines from Center Hub (cx=570, cy=340) */}
            {/* North arm -> Step 01 */}
            <line x1="570" y1="210" x2="570" y2="135" stroke="#38bdf8" strokeWidth="2.5" />
            <circle cx="570" cy="210" r="4" fill="#38bdf8" />

            {/* East arm -> Step 02 */}
            <line x1="700" y1="340" x2="795" y2="340" stroke="#14b8a6" strokeWidth="2.5" />
            <circle cx="700" cy="340" r="4" fill="#14b8a6" />

            {/* South arm -> Step 03 */}
            <line x1="570" y1="470" x2="570" y2="525" stroke="#a855f7" strokeWidth="2.5" />
            <circle cx="570" cy="470" r="4" fill="#a855f7" />

            {/* West arm -> Step 04 */}
            <line x1="440" y1="340" x2="345" y2="340" stroke="#f59e0b" strokeWidth="2.5" />
            <circle cx="440" cy="340" r="4" fill="#f59e0b" />
          </svg>

          {/* Center Hub: "Your Journey to a Verified Certificate" */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="absolute top-[340px] left-[570px] -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="w-56 h-56 rounded-full bg-white dark:bg-[#0c1c33] shadow-2xl shadow-sky-500/15 border-4 border-white dark:border-slate-800 ring-4 ring-sky-100 dark:ring-sky-900/30 flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center shadow-lg shadow-sky-500/30 text-white mb-2">
                <Shield className="w-6 h-6 fill-white" />
              </div>
              <span className="text-[#0B2D5C] dark:text-white font-extrabold text-sm leading-snug">
                Your Journey
              </span>
              <span className="text-[#0284c7] dark:text-[#38bdf8] font-black text-sm leading-snug">
                to a Verified
              </span>
              <span className="text-[#12B8B0] dark:text-[#1dd9d0] font-black text-sm leading-snug">
                Certificate
              </span>
            </div>
          </motion.div>

          {/* ── STEP 01 (TOP) ────────────────────────────────────── */}
          {/* Node */}
          <div className="absolute top-[30px] left-[570px] -translate-x-1/2 z-20">
            <StepNode step={steps[0]} />
          </div>
          {/* Card: to the right of Node 01 */}
          <div className="absolute top-[10px] left-[660px] w-[330px] z-20">
            <StepCard step={steps[0]} />
          </div>

          {/* ── STEP 02 (RIGHT) ──────────────────────────────────── */}
          {/* Node */}
          <div className="absolute top-[340px] left-[845px] -translate-x-1/2 -translate-y-1/2 z-20">
            <StepNode step={steps[1]} />
          </div>
          {/* Card: to the right of Node 02 */}
          <div className="absolute top-[340px] left-[925px] -translate-y-1/2 w-[310px] z-20">
            <StepCard step={steps[1]} />
          </div>

          {/* ── STEP 03 (BOTTOM) ─────────────────────────────────── */}
          {/* Node */}
          <div className="absolute top-[575px] left-[570px] -translate-x-1/2 -translate-y-1/2 z-20">
            <StepNode step={steps[2]} />
          </div>
          {/* Card: below Node 03, centered */}
          <div className="absolute top-[650px] left-[570px] -translate-x-1/2 w-[420px] z-20">
            <StepCard step={steps[2]} />
          </div>

          {/* ── STEP 04 (LEFT) ───────────────────────────────────── */}
          {/* Node */}
          <div className="absolute top-[340px] left-[295px] -translate-x-1/2 -translate-y-1/2 z-20">
            <StepNode step={steps[3]} />
          </div>
          {/* Card: to the left of Node 04 */}
          <div className="absolute top-[340px] right-[860px] -translate-y-1/2 w-[310px] z-20">
            <StepCard step={steps[3]} />
          </div>

        </div>
        {/* ══ END DESKTOP Orbital Diagram ═══════════════════════════ */}

        {/* ══ TABLET & MOBILE: Flowing Cards with Preview Images ═════ */}
        <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {steps.map((step) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`bg-white dark:bg-[#0c1c33] rounded-2xl overflow-hidden shadow-lg border ${step.borderAccent} flex flex-col`}
            >
              {/* Preview image */}
              <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full ${step.badgeBg} text-white text-xs font-black shadow`}
                  >
                    {step.num}
                  </span>
                  <span className="text-white font-bold text-base drop-shadow-md">
                    {step.title}
                  </span>
                </div>
              </div>

              {/* Card details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                  {step.description}
                </p>
                <ul className="space-y-2">
                  {step.details.map((d) => (
                    <li
                      key={d}
                      className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
        {/* ══ END Tablet & Mobile ═══════════════════════════════════ */}

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-10"
        >
          <motion.a
            href="/signin"
            whileHover={{ scale: 1.04, boxShadow: "0 16px 40px rgba(18,184,176,0.3)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-[#0B2D5C] bg-[#12B8B0] hover:bg-[#1dd9d0] shadow-lg shadow-teal-500/20 text-base transition-colors"
          >
            <span>Start Your Assessment</span>
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>

      </div>
    </section>
  );
}
