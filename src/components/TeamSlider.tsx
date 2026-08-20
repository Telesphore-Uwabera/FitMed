"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import Image from "next/image";

export interface TeamMember {
  name: string;
  role: string;
  qualifications: string;
  bio: string;
  image: string;
  badge: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Dr. Eric Kwizera, MD",
    role: "Chief Medical Officer",
    qualifications: "MD, MMed (Occupational Health)",
    bio: "Over 14 years leading clinical governance, telemedicine protocol design, and occupational clearance.",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&q=85&auto=format&fit=crop",
    badge: "Clinical Lead",
  },
  {
    name: "Dr. Amina Nshimiyimana, MD",
    role: "Telehealth Operations Director",
    qualifications: "MD, MSc Telemedicine",
    bio: "Specialist in remote clinical assessments, digital triage algorithms, and risk-stratified referral workflows.",
    image: "https://images.unsplash.com/photo-1594824813566-78853d95c1a8?w=800&q=85&auto=format&fit=crop",
    badge: "Telehealth Lead",
  },
  {
    name: "David Mutanguha",
    role: "Chief Executive Officer",
    qualifications: "BSc Health Informatics, MBA",
    bio: "Pioneering accessible, secure digital health technology and clinical infrastructure across East Africa.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85&auto=format&fit=crop",
    badge: "Leadership",
  },
  {
    name: "Dr. Patrick Uwase, MBBS",
    role: "Risk Stratification Lead",
    qualifications: "MBBS, Dip. Sports Medicine",
    bio: "Expert in physical activity clearance, cardiovascular screening standards, and athletic fitness protocols.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=85&auto=format&fit=crop",
    badge: "Sports & Fitness",
  },
  {
    name: "Grace Umutoni, MSc",
    role: "Head of Compliance & Privacy",
    qualifications: "MSc Cybersecurity, CIPP/E",
    bio: "Ensures platform adherence to HIPAA standards, data encryption, and medical record confidentiality.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=85&auto=format&fit=crop",
    badge: "Data Privacy",
  },
  {
    name: "Dr. Claire Akamanzi, MD",
    role: "In-Person Referral Coordinator",
    qualifications: "MD, General Practitioner",
    bio: "Manages partner clinic integrations, physical examination referrals, and secondary diagnostic routing.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=85&auto=format&fit=crop",
    badge: "Clinic Network",
  },
];

const AUTO_SLIDE_MS = 5000;

export default function TeamSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % TEAM_MEMBERS.length);
  }, []);

  const back = useCallback(() => {
    setCurrent((prev) => (prev - 1 + TEAM_MEMBERS.length) % TEAM_MEMBERS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, AUTO_SLIDE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, isPaused, next]);

  return (
    <div
      className="relative space-y-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >


      {/* Main Carousel Display */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl min-h-[440px] flex items-center">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#12B8B0]/10 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full grid lg:grid-cols-12 gap-8 p-8 md:p-12 items-center"
          >
            {/* Team Photo */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-slate-700 shadow-xl group">
                <Image
                  src={TEAM_MEMBERS[current].image}
                  alt={TEAM_MEMBERS[current].name}
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
                  <span className="px-3 py-1 rounded-full bg-[#12B8B0]/20 border border-[#12B8B0]/40 text-[#12B8B0] font-bold">
                    {TEAM_MEMBERS[current].badge}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Practitioner
                  </span>
                </div>
              </div>
            </div>

            {/* Team Bio & Details */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-widest text-[#12B8B0]">
                  {TEAM_MEMBERS[current].role}
                </div>
                <h3
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  {TEAM_MEMBERS[current].name}
                </h3>
                <div className="text-sm text-slate-400 font-medium">
                  {TEAM_MEMBERS[current].qualifications}
                </div>
              </div>

              <p className="text-slate-300 text-base md:text-lg leading-relaxed font-normal">
                "{TEAM_MEMBERS[current].bio}"
              </p>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Profile ID: FM-MD00{current + 1}</span>
                <span>System Role: Clinical Team</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Buttons */}
        <button
          onClick={back}
          aria-label="Previous Team Member"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-800/80 hover:bg-[#12B8B0] text-slate-300 hover:text-slate-950 border border-slate-700 flex items-center justify-center transition-all shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={next}
          aria-label="Next Team Member"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-800/80 hover:bg-[#12B8B0] text-slate-300 hover:text-slate-950 border border-slate-700 flex items-center justify-center transition-all shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Pagination Indicators */}
      <div className="flex items-center justify-center gap-3 pt-2">
        {TEAM_MEMBERS.map((m, i) => (
          <button
            key={m.name}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="group py-2 px-1 focus:outline-none"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 h-2.5 bg-[#12B8B0]"
                  : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
