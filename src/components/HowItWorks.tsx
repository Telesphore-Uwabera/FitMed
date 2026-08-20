"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, FileText, Video, Award, ArrowRight, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Request",
    description:
      "Create your account, choose your certificate purpose, and provide your identity details. We make it simple to get started.",
    color: "from-sky-500 to-sky-600",
    accent: "sky",
    details: [
      "Account creation & phone / email verification",
      "Identity & demographic information",
      "Certificate purpose selection",
    ],
  },
  {
    icon: FileText,
    title: "Complete Assessment",
    description:
      "Fill out a smart adaptive health questionnaire personalised to your specific certificate need — takes under 10 minutes.",
    color: "from-teal-500 to-teal-600",
    accent: "teal",
    details: [
      "Adaptive medical history questionnaire",
      "Danger-sign & symptom screening",
      "Vital signs & measurements",
    ],
  },
  {
    icon: Video,
    title: "Consult a Doctor",
    description:
      "Meet a licensed doctor face-to-face through a secure, end-to-end encrypted video call — from wherever you are.",
    color: "from-violet-500 to-violet-600",
    accent: "violet",
    details: [
      "Secure live video consultation",
      "Identity verification workflow",
      "Full virtual clinical assessment",
    ],
  },
  {
    icon: Award,
    title: "Get Certified",
    description:
      "Receive a digitally signed certificate with a unique QR code — valid anywhere, shareable instantly.",
    color: "from-emerald-500 to-emerald-600",
    accent: "emerald",
    details: [
      "Digitally signed certificate",
      "Unique QR verification code",
      "Shareable online certificate link",
    ],
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="relative py-28 section-white">
      <div className="container-wide">

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-5 badge-primary">
            Simple 4-Step Process
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            From account creation to certificate delivery — get medically certified in as little as one day.
          </p>
        </motion.div>

        {/* ── Cards grid ──────────────────────────────────────
          Layout:
            mobile  → 1 column (full width)
            lg      → 2 columns (big, spacious cards)

          Cards are intentionally large: generous icon panel + content area.
        ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 55 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="group card-white rounded-3xl overflow-hidden transition-all duration-300 flex flex-col"
            >
              {/* ── Large visual icon panel ── */}
              <div className="relative h-48 lg:h-56 overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800 flex items-center justify-center">
                <span className="absolute top-5 left-6 text-3xl font-black tracking-wider text-white/90" aria-label={`Step ${i + 1}`}>
                  {i + 1}<sup className="ml-0.5 text-sm align-super tracking-normal">{i === 0 ? "st" : i === 1 ? "nd" : i === 2 ? "rd" : "th"}</sup>
                </span>
                <div className="absolute top-0 right-0 w-56 h-56 bg-[#12B8B0]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative w-28 h-28 rounded-[2rem] bg-white/15 border border-white/30 flex items-center justify-center shadow-2xl backdrop-blur-sm">
                  <s.icon className="w-16 h-16 text-white" strokeWidth={1.35} />
                </div>
              </div>

              {/* ── Content ── */}
              <div className="p-7 flex flex-col flex-1">
                <h3
                  className="text-xl font-extrabold text-slate-900 mb-3"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  {s.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">
                  {s.description}
                </p>
                <ul className="space-y-2.5">
                  {s.details.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="text-center"
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
