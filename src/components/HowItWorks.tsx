"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Shield, ArrowRight, UserPlus, FileText, Video, Award, ZoomIn, X } from "lucide-react";
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
    badgeBg: "bg-sky-500",
    ringClass: "ring-sky-400",
    borderAccent: "border-sky-200 dark:border-sky-800/60",
    glowColor: "rgba(56, 189, 248, 0.55)",
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
    badgeBg: "bg-teal-500",
    ringClass: "ring-teal-400",
    borderAccent: "border-teal-200 dark:border-teal-800/60",
    glowColor: "rgba(20, 184, 166, 0.55)",
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
    badgeBg: "bg-purple-600",
    ringClass: "ring-purple-400",
    borderAccent: "border-purple-200 dark:border-purple-800/60",
    glowColor: "rgba(168, 85, 247, 0.55)",
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
    badgeBg: "bg-amber-500",
    ringClass: "ring-amber-400",
    borderAccent: "border-amber-200 dark:border-amber-800/60",
    glowColor: "rgba(245, 158, 11, 0.55)",
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
  isDimmed,
  isHighlighted,
  onZoom,
  className = "",
}: {
  step: (typeof steps)[0];
  isDimmed: boolean;
  isHighlighted: boolean;
  onZoom: () => void;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-[#0c1c33] rounded-2xl p-5 shadow-xl border ${step.borderAccent} transition-all duration-400 ease-out ${
        isDimmed
          ? "filter blur-[4px] opacity-25 scale-[0.96] pointer-events-none"
          : isHighlighted
          ? "ring-2 ring-offset-2 dark:ring-offset-[#071422] ring-[#12B8B0] shadow-2xl scale-[1.03] z-30"
          : "hover:shadow-2xl"
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <h3
          className="text-[#0B2D5C] dark:text-white font-extrabold text-base"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          {step.title}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onZoom}
            className="p-1 rounded-md text-slate-400 hover:text-[#12B8B0] hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors"
            title="Click to zoom full image"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span
            className={`px-2 py-0.5 rounded-full ${step.badgeBg} text-white text-[10px] font-black tracking-wider uppercase shadow-sm`}
          >
            Step {step.num}
          </span>
        </div>
      </div>
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

/* ── Circular Step Node with Image Zoom & Click-to-Modal ───────────────── */
function StepNode({
  step,
  isHovered,
  isDimmed,
  onHover,
  onLeave,
  onZoomClick,
}: {
  step: (typeof steps)[0];
  isHovered: boolean;
  isDimmed: boolean;
  onHover: () => void;
  onLeave: () => void;
  onZoomClick: () => void;
}) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onZoomClick}
      className={`relative flex flex-col items-center cursor-pointer transition-all duration-400 ease-out group ${
        isHovered
          ? "z-50 scale-[1.5]"
          : isDimmed
          ? "z-10 filter blur-[4px] opacity-25 scale-[0.92] pointer-events-none"
          : "z-20 hover:scale-110"
      }`}
      style={{
        filter: isHovered
          ? `drop-shadow(0 0 28px ${step.glowColor})`
          : undefined,
      }}
      title="Click to view full image in full width"
    >
      {/* Number badge pill on top */}
      <div
        className={`absolute -top-3.5 z-30 px-3 py-0.5 rounded-full ${step.badgeBg} text-white text-xs font-black shadow-md tracking-wider flex items-center gap-1 transition-transform duration-300 ${
          isHovered ? "scale-110 -translate-y-1" : ""
        }`}
      >
        <span>{step.num}</span>
        <ZoomIn className="w-3 h-3 text-white animate-pulse" />
      </div>

      {/* Circular node container */}
      <div
        className={`w-32 h-32 rounded-full p-1 bg-white dark:bg-slate-900 shadow-xl ring-4 ${step.ringClass} flex items-center justify-center overflow-hidden relative transition-all duration-300`}
      >
        <div className="w-full h-full rounded-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
          <Image
            src={step.image}
            alt={step.title}
            fill
            className={`object-cover object-top transition-transform duration-500 ease-out ${
              isHovered ? "scale-115" : "scale-100"
            }`}
            sizes="256px"
            priority
          />
          {/* Subtle hover overlay indicating click to zoom */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
            <ZoomIn className="w-6 h-6 drop-shadow-lg" />
            <span className="text-[9px] font-bold uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-full">
              Click Zoom
            </span>
          </div>
        </div>
      </div>

      {/* Floating preview title & zoom pill */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onZoomClick();
          }}
          className="absolute -bottom-9 whitespace-nowrap bg-[#0B2D5C] hover:bg-[#12B8B0] hover:text-[#0B2D5C] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xl border border-white/20 transition-colors animate-fade-in z-40 flex items-center gap-1"
        >
          <ZoomIn className="w-3 h-3" />
          <span>Click to Zoom Full</span>
        </button>
      )}
    </div>
  );
}

/* ── Main How It Works Component ──────────────────────────────────────── */
export default function HowItWorks() {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState<(typeof steps)[0] | null>(null);

  /* Lock body scroll when full-screen zoom modal is open */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalStep(null);
    };
    if (modalStep) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [modalStep]);

  return (
    <section id="how-it-works" className="relative py-24 section-white overflow-hidden">
      <div className="container-wide">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
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

        {/* ══ DESKTOP: 4-Corner Orbital Diagram ══════════════════════ */}
        <div className="hidden xl:block relative w-full max-w-[1240px] mx-auto h-[760px]">

          {/* SVG Background: Dashed Concentric Rings & Radial Connecting Lines */}
          <svg
            className={`absolute inset-0 w-full h-full pointer-events-none transition-all duration-400 ${
              hoveredStep ? "filter blur-[3px] opacity-15" : "opacity-100"
            }`}
            viewBox="0 0 1240 760"
            fill="none"
          >
            {/* Center orbit passing through the nodes (r = 210) */}
            <circle
              cx="620"
              cy="380"
              r="210"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="dark:stroke-slate-700"
            />
            {/* Outer subtle decorative dashed orbit */}
            <circle
              cx="620"
              cy="380"
              r="300"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              className="dark:stroke-slate-800"
            />

            {/* Radial Connector Lines from Center Hub (cx=620, cy=380, hub radius = 105) */}
            {/* North arm -> Step 01 (y: 380-105 = 275 to 170) */}
            <line x1="620" y1="275" x2="620" y2="170" stroke="#38bdf8" strokeWidth="2.5" />
            <circle cx="620" cy="275" r="4" fill="#38bdf8" />

            {/* East arm -> Step 02 (x: 620+105 = 725 to 830) */}
            <line x1="725" y1="380" x2="830" y2="380" stroke="#14b8a6" strokeWidth="2.5" />
            <circle cx="725" cy="380" r="4" fill="#14b8a6" />

            {/* South arm -> Step 03 (y: 380+105 = 485 to 590) */}
            <line x1="620" y1="485" x2="620" y2="590" stroke="#a855f7" strokeWidth="2.5" />
            <circle cx="620" cy="485" r="4" fill="#a855f7" />

            {/* West arm -> Step 04 (x: 620-105 = 515 to 410) */}
            <line x1="515" y1="380" x2="410" y2="380" stroke="#f59e0b" strokeWidth="2.5" />
            <circle cx="515" cy="380" r="4" fill="#f59e0b" />
          </svg>

          {/* Center Hub: "Your Journey to a Verified Certificate" */}
          <div
            className={`absolute top-[380px] left-[620px] -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-400 ease-out ${
              hoveredStep ? "filter blur-[4px] opacity-25 scale-95 pointer-events-none" : "opacity-100 scale-100"
            }`}
          >
            <div className="w-52 h-52 rounded-full bg-white dark:bg-[#0c1c33] shadow-2xl shadow-sky-500/15 border-4 border-white dark:border-slate-800 ring-4 ring-sky-100 dark:ring-sky-900/30 flex flex-col items-center justify-center text-center p-4">
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
          </div>

          {/* ── 4 CIRCULAR NODES AT CARDINAL COMPASS POINTS ─────────── */}
          {/* Node 01 (TOP - 12 o'clock) */}
          <div className="absolute top-[170px] left-[620px] -translate-x-1/2 -translate-y-1/2">
            <StepNode
              step={steps[0]}
              isHovered={hoveredStep === steps[0].num}
              isDimmed={hoveredStep !== null && hoveredStep !== steps[0].num}
              onHover={() => setHoveredStep(steps[0].num)}
              onLeave={() => setHoveredStep(null)}
              onZoomClick={() => setModalStep(steps[0])}
            />
          </div>

          {/* Node 02 (RIGHT - 3 o'clock) */}
          <div className="absolute top-[380px] left-[830px] -translate-x-1/2 -translate-y-1/2">
            <StepNode
              step={steps[1]}
              isHovered={hoveredStep === steps[1].num}
              isDimmed={hoveredStep !== null && hoveredStep !== steps[1].num}
              onHover={() => setHoveredStep(steps[1].num)}
              onLeave={() => setHoveredStep(null)}
              onZoomClick={() => setModalStep(steps[1])}
            />
          </div>

          {/* Node 03 (BOTTOM - 6 o'clock) */}
          <div className="absolute top-[590px] left-[620px] -translate-x-1/2 -translate-y-1/2">
            <StepNode
              step={steps[2]}
              isHovered={hoveredStep === steps[2].num}
              isDimmed={hoveredStep !== null && hoveredStep !== steps[2].num}
              onHover={() => setHoveredStep(steps[2].num)}
              onLeave={() => setHoveredStep(null)}
              onZoomClick={() => setModalStep(steps[2])}
            />
          </div>

          {/* Node 04 (LEFT - 9 o'clock) */}
          <div className="absolute top-[380px] left-[410px] -translate-x-1/2 -translate-y-1/2">
            <StepNode
              step={steps[3]}
              isHovered={hoveredStep === steps[3].num}
              isDimmed={hoveredStep !== null && hoveredStep !== steps[3].num}
              onHover={() => setHoveredStep(steps[3].num)}
              onLeave={() => setHoveredStep(null)}
              onZoomClick={() => setModalStep(steps[3])}
            />
          </div>

          {/* ── 4 CARDS FRAMING THE 4 QUADRANTS (MATCHING USER'S RED BOXES) ── */}
          {/* Card 01: TOP-RIGHT QUADRANT */}
          <div className="absolute top-[30px] right-[20px] w-[320px]">
            <StepCard
              step={steps[0]}
              isDimmed={hoveredStep !== null && hoveredStep !== steps[0].num}
              isHighlighted={hoveredStep === steps[0].num}
              onZoom={() => setModalStep(steps[0])}
            />
          </div>

          {/* Card 02: BOTTOM-RIGHT QUADRANT */}
          <div className="absolute bottom-[30px] right-[20px] w-[320px]">
            <StepCard
              step={steps[1]}
              isDimmed={hoveredStep !== null && hoveredStep !== steps[1].num}
              isHighlighted={hoveredStep === steps[1].num}
              onZoom={() => setModalStep(steps[1])}
            />
          </div>

          {/* Card 03: BOTTOM-LEFT QUADRANT */}
          <div className="absolute bottom-[30px] left-[20px] w-[320px]">
            <StepCard
              step={steps[2]}
              isDimmed={hoveredStep !== null && hoveredStep !== steps[2].num}
              isHighlighted={hoveredStep === steps[2].num}
              onZoom={() => setModalStep(steps[2])}
            />
          </div>

          {/* Card 04: TOP-LEFT QUADRANT */}
          <div className="absolute top-[30px] left-[20px] w-[320px]">
            <StepCard
              step={steps[3]}
              isDimmed={hoveredStep !== null && hoveredStep !== steps[3].num}
              isHighlighted={hoveredStep === steps[3].num}
              onZoom={() => setModalStep(steps[3])}
            />
          </div>

        </div>
        {/* ══ END DESKTOP Orbital Diagram ═══════════════════════════ */}

        {/* ══ TABLET & MOBILE: Flowing Cards with Zoom & Interactive Focus ══ */}
        <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {steps.map((step) => {
            const isHovered = hoveredStep === step.num;
            const isDimmed = hoveredStep !== null && hoveredStep !== step.num;

            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                onMouseEnter={() => setHoveredStep(step.num)}
                onMouseLeave={() => setHoveredStep(null)}
                className={`bg-white dark:bg-[#0c1c33] rounded-2xl overflow-hidden shadow-lg border ${
                  step.borderAccent
                } flex flex-col transition-all duration-300 ${
                  isDimmed
                    ? "filter blur-[2px] opacity-40 scale-[0.98]"
                    : isHovered
                    ? "ring-2 ring-[#12B8B0] shadow-2xl scale-[1.02]"
                    : "hover:shadow-xl"
                }`}
              >
                {/* Preview image with click-to-zoom */}
                <div
                  onClick={() => setModalStep(step)}
                  className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer group"
                >
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className={`object-cover object-top transition-transform duration-500 ${
                      isHovered ? "scale-110" : "scale-100"
                    }`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Zoom badge button on mobile */}
                  <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/60 hover:bg-[#12B8B0] text-white hover:text-[#0B2D5C] backdrop-blur-sm text-xs font-bold flex items-center gap-1 shadow transition-colors">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </div>

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
            );
          })}
        </div>
        {/* ══ END Tablet & Mobile ═══════════════════════════════════ */}

        {/* CTA Button — Positioned cleanly beneath the content with ample spacing */}
        <div className="text-center mt-12 md:mt-16 pt-2">
          <motion.a
            href="/signin"
            whileHover={{ scale: 1.04, boxShadow: "0 16px 40px rgba(18,184,176,0.3)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-[#0B2D5C] bg-[#12B8B0] hover:bg-[#1dd9d0] shadow-lg shadow-teal-500/20 text-base transition-colors"
          >
            <span>Start Your Assessment</span>
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </div>

      </div>

      {/* ── FULL-PAGE MODAL LIGHTBOX WITH HEAVY BACKGROUND BLUR ── */}
      <AnimatePresence>
        {modalStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/85 backdrop-blur-2xl"
            onClick={() => setModalStep(null)}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#071422] border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0B2D5C]/75 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full ${modalStep.badgeBg} text-white text-xs font-black tracking-wider shadow`}
                  >
                    Step {modalStep.num}
                  </span>
                  <div>
                    <h3 className="text-white font-extrabold text-base md:text-lg">
                      {modalStep.title}
                    </h3>
                    <p className="text-slate-300 text-xs hidden sm:block">
                      {modalStep.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    ESC to close
                  </span>
                  <button
                    onClick={() => setModalStep(null)}
                    aria-label="Close modal"
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Full Image Display on Whole Width */}
              <div className="relative flex-1 min-h-[50vh] max-h-[72vh] w-full bg-black/50 flex items-center justify-center p-2 sm:p-4 overflow-auto">
                <div className="relative w-full h-full min-h-[440px] max-h-[70vh]">
                  <Image
                    src={modalStep.image}
                    alt={modalStep.title}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>

              {/* Modal Footer with Step Checklist & Navigation */}
              <div className="px-6 py-3.5 bg-[#0B2D5C]/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
                  {modalStep.details.map((d) => (
                    <div key={d} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => {
                      const curIdx = steps.findIndex((s) => s.num === modalStep.num);
                      const prevIdx = (curIdx - 1 + steps.length) % steps.length;
                      setModalStep(steps[prevIdx]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    Previous Step
                  </button>
                  <button
                    onClick={() => {
                      const curIdx = steps.findIndex((s) => s.num === modalStep.num);
                      const nextIdx = (curIdx + 1) % steps.length;
                      setModalStep(steps[nextIdx]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] text-xs font-bold transition-colors"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
