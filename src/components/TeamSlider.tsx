"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import type { PublicTeamMember } from "@/lib/publicStaffTypes";

export type TeamMember = PublicTeamMember;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const AUTO_SLIDE_MS = 5000;

export default function TeamSlider({ members: initialMembers }: { members?: TeamMember[] }) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers || []);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(!initialMembers);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/public/staff", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const live = Array.isArray(data.team) ? data.team : [];
        if (live.length) setMembers(live);
        else if (initialMembers?.length) setMembers(initialMembers);
      })
      .catch(() => {
        if (active && initialMembers?.length) setMembers(initialMembers);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [initialMembers]);

  const count = members.length || 1;
  const goTo = useCallback((idx: number) => setCurrent(idx), []);
  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % count);
  }, [count]);
  const back = useCallback(() => {
    setCurrent((prev) => (prev - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (isPaused || members.length < 2) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, AUTO_SLIDE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, isPaused, next, members.length]);

  if (loading) {
    return <p className="text-center text-sm text-slate-500">Loading FitMed team…</p>;
  }

  if (!members.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
        Team profiles will appear here once staff are added in FitMed.
      </div>
    );
  }

  const member = members[current] || members[0];
  const photo = member.image && !member.image.includes("images.unsplash.com") ? member.image : "";

  return (
    <div className="relative space-y-8" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl min-h-[440px] flex items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#12B8B0]/10 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full grid lg:grid-cols-12 gap-8 p-8 md:p-12 items-center"
          >
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-slate-700 shadow-xl group bg-[#0B2D5C]">
                {photo ? (
                  // User-uploaded Cloudinary photos must not go through the Next image optimizer.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={member.name} className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl font-extrabold text-[#12B8B0]">
                    {initials(member.name)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
                  <span className="px-3 py-1 rounded-full bg-[#12B8B0]/20 border border-[#12B8B0]/40 text-[#12B8B0] font-bold">
                    {member.badge}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {member.kind === "doctor" ? "Verified Practitioner" : "FitMed Staff"}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-1">
                <div className="text-xs font-extrabold uppercase tracking-widest text-[#12B8B0]">{member.role}</div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white" style={{ fontFamily: "var(--font-primary)" }}>
                  {member.name}
                </h3>
                <div className="text-sm text-slate-400 font-medium">{member.qualifications}</div>
              </div>
              <p className="text-slate-300 text-base md:text-lg leading-relaxed font-normal">{member.bio}</p>
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {member.kind === "doctor"
                    ? "FitMed clinical network"
                    : member.kind === "staff"
                      ? "FitMed leadership team"
                      : "FitMed administration"}
                </span>
                <span>Role: {member.role}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {members.length > 1 && (
          <>
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
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        {members.map((item, i) => (
          <button key={item.id} onClick={() => goTo(i)} aria-label={`Go to ${item.name}`} className="group py-2 px-1 focus:outline-none">
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === current ? "w-8 h-2.5 bg-[#12B8B0]" : "w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
