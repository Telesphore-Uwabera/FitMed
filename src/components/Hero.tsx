"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Shield, ArrowRight, Play, CheckCircle,
  TrendingUp, Clock, Star, ChevronLeft, ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/* ────────────────────────────────────────────────────────────────
   Slides — Black African people, fitness & medical context
──────────────────────────────────────────────────────────────── */
const SLIDES = [
  {
    // African doctor with applicant — telemedicine consultation
    url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1800&q=85&auto=format&fit=crop",
    alt: "African doctor conducting a telemedicine consultation with an applicant",
    caption: "Consult a licensed doctor from anywhere",
  },
  {
    // Black woman running — fitness assessment context
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1800&q=85&auto=format&fit=crop",
    alt: "Black woman running as part of a fitness health assessment",
    caption: "Medical fitness certified — stay active with confidence",
  },
  {
    // African medical professional reviewing records on tablet
    // photo-1666214276372 was broken — replaced with reliable alternative
    url: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=1800&q=85&auto=format&fit=crop",
    alt: "African medical professional reviewing applicant digital health records on a tablet",
    caption: "Digitally signed certificates issued in hours",
  },
  {
    // Black man working out / gym — occupational fitness context
    url: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1800&q=85&auto=format&fit=crop",
    alt: "Black man exercising — medical fitness assessment for physical roles",
    caption: "Fit for work. Certified and verified.",
  },
];

const SLIDE_DURATION = 6000; // ms

const stats = [
  { icon: TrendingUp, value: "10,000+", label: "Certificates Issued", color: "text-[#12B8B0]"  },
  { icon: Star,        value: "4.9 / 5",  label: "Doctor Rating",      color: "text-amber-300" },
  { icon: Clock,       value: "< 4 hrs",  label: "Avg. Turnaround",    color: "text-white"  },
];

const trustBadges = [
  "Licensed doctors only",
  "End-to-end encrypted",
  "Instant QR verification",
  "24 / 7 availability",
];

/* ECG line ---------------------------------------------------------- */
function ECGLine() {
  return (
    <svg viewBox="0 0 500 48" className="w-full opacity-55" preserveAspectRatio="none">
      <motion.path
        d="M0,24 L75,24 L90,24 L102,4 L112,44 L122,24 L160,24 L174,17 L184,31 L194,24 L268,24 L281,2 L293,46 L305,24 L338,24 L368,24 L382,20 L394,28 L406,24 L500,24"
        fill="none"
        stroke="url(#ecgHero)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 3, ease: "easeInOut", delay: 1.2 }}
      />
      <defs>
        <linearGradient id="ecgHero" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#fff"    stopOpacity="0" />
          <stop offset="25%"  stopColor="#12B8B0" stopOpacity="1" />
          <stop offset="75%"  stopColor="#1dd9d0" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff"    stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ================================================================= */
export default function Hero() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
  const back = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

  /* Auto-advance */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, SLIDE_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, next]);

  return (
    <section className="relative min-h-screen w-full flex flex-col overflow-hidden">

      {/* ── Full-bleed image slider ────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {SLIDES.map((slide, i) => (
          <AnimatePresence key={i}>
            {i === current && (
              <motion.div
                key={`img-${i}`}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.07 }}
                animate={{ opacity: 1, scale: 1.02 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 1.3, ease: "easeInOut" }}
              >
                <Image
                  src={slide.url}
                  alt={slide.alt}
                  fill
                  className="object-cover object-center"
                  priority={i === 0}
                  sizes="100vw"
                />
              </motion.div>
            )}
          </AnimatePresence>
        ))}

        {/* Layered overlays — brand navy #0B2D5C with reduced opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2D5C]/70 via-[#0B2D5C]/45 to-[#0B2D5C]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D5C]/60 via-transparent to-[#0B2D5C]/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#071d3d]/15 to-transparent" />
      </div>

      {/* ── Hero content ─────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center w-full">
        <div className="w-full pt-32 pb-8 md:pb-10">
          <motion.h1
            key={`h1-${current}`}
            initial={{ opacity: 0, y: 38 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="w-full px-2 sm:px-6 md:px-8 lg:px-10 mb-3 md:mb-5 text-5xl sm:text-6xl md:text-7xl xl:text-[5.25rem] font-extrabold tracking-tight leading-[1.06] text-white"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            <span className="block w-full text-justify [text-align-last:justify] text-white">
              Get Your
            </span>
            <span className="block w-full text-justify [text-align-last:justify] bg-gradient-to-r from-[#12B8B0] via-[#1dd9d0] to-[#12B8B0] bg-clip-text text-transparent">
              Medical Fitness
            </span>
            <span className="block w-full text-justify [text-align-last:justify] text-white">
              Certificate Online.
            </span>
          </motion.h1>

          <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
          <div className="w-full lg:w-[70%]">

            {/* Animated slide caption */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`cap-${current}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.45 }}
                className="text-[#12B8B0] text-sm font-bold mb-2 md:mb-4 tracking-wide uppercase"
              >
                {SLIDES[current].caption}
              </motion.p>
            </AnimatePresence>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-lg text-slate-300 max-w-xl mb-5 md:mb-7 leading-relaxed"
            >
              A secure digital medical fitness assessment conducted by a{" "}
              <span className="text-white font-semibold">licensed doctor</span> — verified,
              digitally signed, and instantly shareable.
            </motion.p>

            {/* ECG animation */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mb-6 md:mb-8 origin-left max-w-xs"
            >
              <ECGLine />
            </motion.div>

            {/* CTA buttons — one row on small and medium screens */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.5 }}
              className="flex flex-row items-stretch gap-2 md:gap-4 mb-8 md:mb-10"
            >
              <motion.div
                whileHover={{ scale: 1.04, boxShadow: "0 20px 50px rgba(14,165,233,.45)" }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 min-w-0"
              >
                <Link
                  href="/signin"
                  className="group w-full h-full inline-flex items-center justify-center gap-2 md:gap-3 px-3 py-2 md:px-8 md:py-4 rounded-2xl text-sm md:text-base font-bold text-white btn-primary shadow-xl shadow-sky-500/25"
                >
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <span className="leading-tight text-center">Request a Certificate</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0 hidden sm:block" />
                </Link>
              </motion.div>

              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group flex-1 min-w-0 inline-flex items-center justify-center gap-2 md:gap-3 px-3 py-2 md:px-7 md:py-4 rounded-2xl font-semibold text-white/90 glass-dark hover:bg-white/12 hover:text-white transition-all duration-300 text-sm"
              >
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-sky-500/30 transition-colors flex-shrink-0">
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                </div>
                <span className="leading-tight text-center">Watch how it works</span>
              </motion.a>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="flex flex-wrap gap-x-3 gap-y-1 md:gap-x-5 md:gap-y-2 mb-12 md:mb-14"
            >
              {trustBadges.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.82 + i * 0.07 }}
                  className="flex items-center gap-1.5 text-xs text-slate-400"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  <span>{item}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Stats — inside the text column, below trust badges ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 1.0 }}
              className="flex flex-nowrap gap-2 md:gap-3"
            >
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.05 + i * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="flex-1 min-w-0 glass-dark rounded-2xl px-3 py-2 md:px-5 md:py-3.5 flex items-center gap-2 md:gap-3 cursor-default border border-white/10 hover:border-sky-400/35 transition-colors"
                >
                  <s.icon className={`w-5 h-5 ${s.color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <div
                      className={`text-xl font-extrabold ${s.color} leading-tight`}
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      {s.value}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          </div>
        </div>
      </div>

      {/* ── Slider dots ─────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-center gap-2 pb-12 md:pb-14">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          >
            <span
              className={`block rounded-full transition-all duration-400 ${
                i === current
                  ? "w-7 h-2.5 bg-[#12B8B0]"
                  : "w-2.5 h-2.5 bg-white/30 hover:bg-white/55"
              }`}
            />
          </button>
        ))}
      </div>

      {/* ── Prev / Next arrows ──────────────────────────────────── */}
      <button
        onClick={back}
        aria-label="Previous slide"
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full glass-dark border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/12 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full glass-dark border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/12 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* ── Slide progress bar ──────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-white/8">
        <motion.div
          key={current}
          className="h-full bg-gradient-to-r from-[#12B8B0] to-[#1dd9d0]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
        />
      </div>
    </section>
  );
}
