"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, CheckCircle, UserPlus, FileText, Video, Award } from "lucide-react";
import Image from "next/image";

// Re-export icons previously referenced by HowItWorks to prevent stale browser chunk crashes
export { UserPlus, FileText, Video, Award };

const steps = [
  {
    title: "Request",
    description:
      "Create your account, choose your certificate purpose, and provide your identity details. We make it simple to get started.",
    // African woman on smartphone — Unsplash free licence
    image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=900&q=85&auto=format&fit=crop",
    imageAlt: "African woman creating her FitMed account on a smartphone",
    position: "object-center",
    accent: "sky",
    details: [
      "Account creation & phone / email verification",
      "Identity & demographic information",
      "Certificate purpose selection",
    ],
  },
  {
    title: "Complete Assessment",
    description:
      "Fill out a smart adaptive health questionnaire personalised to your specific certificate need — takes under 10 minutes.",
    // African professional woman on laptop — health assessment context
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=85&auto=format&fit=crop",
    imageAlt: "African woman completing a health assessment on a laptop",
    position: "object-top",
    accent: "teal",
    details: [
      "Adaptive medical history questionnaire",
      "Danger-sign & symptom screening",
      "Vital signs & measurements",
    ],
  },
  {
    title: "Consult a Doctor",
    description:
      "Meet a licensed doctor face-to-face through a secure, end-to-end encrypted video call — from wherever you are.",
    // Telemedicine / video call consultation — African doctor
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=900&q=85&auto=format&fit=crop",
    imageAlt: "African doctor conducting a telemedicine video consultation",
    position: "object-top",
    accent: "violet",
    details: [
      "Secure live video consultation",
      "Identity verification workflow",
      "Full virtual clinical assessment",
    ],
  },
  {
    title: "Get Certified",
    description:
      "Receive a digitally signed certificate with a unique QR code — valid anywhere, shareable instantly.",
    // African professional with digital device — success moment
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=85&auto=format&fit=crop",
    imageAlt: "African professional celebrating their medical fitness certificate",
    position: "object-center",
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
            className="text-4xl md:text-5xl font-extrabold text-[#0B2D5C] dark:text-white mb-5"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            From account creation to certificate delivery — get medically certified in as little as one day.
          </p>
        </motion.div>

        {/* ── Cards grid ─────────────────────────────────────── */}
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
              {/* ── Photo panel — full image, no cropping ── */}
              <div className="relative h-64 lg:h-72 overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  className={`object-cover ${s.position} group-hover:scale-105 transition-transform duration-700`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading={i < 2 ? "eager" : "lazy"}
                />
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D5C]/65 via-[#0B2D5C]/10 to-transparent" />
                {/* Step number + title badge at bottom-left */}
                <div className="absolute bottom-4 left-5 flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#12B8B0] flex items-center justify-center text-[#0B2D5C] text-sm font-black shadow-lg ring-2 ring-white/30">
                    {i + 1}
                  </span>
                  <span className="text-white text-sm font-extrabold drop-shadow-md tracking-wide">{s.title}</span>
                </div>
                {/* Step connector arrow — desktop only, not on last card */}
                {i % 2 === 0 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#12B8B0] items-center justify-center shadow-lg">
                    <ArrowRight className="w-4 h-4 text-[#0B2D5C]" />
                  </div>
                )}
              </div>

              {/* ── Content ── */}
              <div className="p-7 flex flex-col flex-1">
                <h3
                  className="text-xl font-extrabold text-[#0B2D5C] dark:text-white mb-3"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  {s.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                  {s.description}
                </p>
                <ul className="space-y-2.5">
                  {s.details.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
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

