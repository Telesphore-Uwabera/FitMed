"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, FileText, Video, Award, ArrowRight, CheckCircle } from "lucide-react";
import Image from "next/image";

const steps = [
  {
    icon: UserPlus,
    title: "Request",
    description:
      "Create your account, choose your certificate purpose, and provide your identity details. We make it simple to get started.",
    color: "from-sky-500 to-sky-600",
    accent: "sky",
    // Black African man on laptop — account creation
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop&crop=top",
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
    // Black woman on phone / tablet — health questionnaire
    img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80&auto=format&fit=crop&crop=top",
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
    // African doctor in telemedicine consultation
    img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80&auto=format&fit=crop",
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
    // Black professional with documents / certificate
    img: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800&q=80&auto=format&fit=crop",
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
      <div className="max-w-7xl mx-auto px-6">

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

          Cards are intentionally large: tall image + generous content area.
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
              {/* ── Image — tall, fills well on large cards ── */}
              <div className="relative h-72 lg:h-96 overflow-hidden flex-shrink-0">
                <Image
                  src={s.img}
                  alt={s.title}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
                {/* Gradient overlay — darkens bottom for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/65" />

                {/* Icon badge — top left, no step number */}
                <div
                  className={`absolute top-5 left-5 w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-xl`}
                >
                  <s.icon className="w-7 h-7 text-white" strokeWidth={1.8} />
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
            href="#request"
            whileHover={{ scale: 1.04, boxShadow: "0 16px 40px rgba(14,165,233,.3)" }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-white btn-primary shadow-lg shadow-sky-500/20 text-base"
          >
            Start Your Assessment
            <ArrowRight className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
