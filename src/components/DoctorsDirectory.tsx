"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { PublicTeamMember } from "@/lib/publicStaffTypes";
import { CheckCircle, Stethoscope } from "lucide-react";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function DoctorsDirectory({
  initialDoctors = [],
}: {
  initialDoctors?: PublicTeamMember[];
}) {
  const [doctors, setDoctors] = useState<PublicTeamMember[]>(initialDoctors);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialDoctors.length) {
      setDoctors(initialDoctors);
    }
    // Fetch fresh doctors from database via public API
    fetch("/api/public/staff", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.doctors) && data.doctors.length > 0) {
          setDoctors(data.doctors);
        }
      })
      .catch(() => {});
  }, [initialDoctors]);

  if (doctors.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/30">
        <Stethoscope className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="font-medium text-base text-slate-700 dark:text-slate-300">No doctors listed yet</p>
        <p className="text-xs mt-1 text-slate-400">Licensed doctors added in FitMed will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {doctors.map((doctor) => {
        const hasPhoto =
          Boolean(doctor.image) &&
          !failedImages[doctor.id] &&
          doctor.image !== "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop";

        return (
          <div
            key={doctor.id}
            className="group relative rounded-3xl overflow-hidden aspect-[4/5] shadow-xl border-0 bg-[#0B2D5C] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5"
          >
            {/* Doctor Photo or Initials Fallback */}
            {hasPhoto ? (
              <Image
                src={doctor.image}
                alt={doctor.name}
                fill
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                onError={() =>
                  setFailedImages((prev) => ({ ...prev, [doctor.id]: true }))
                }
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl font-extrabold text-[#12B8B0] select-none bg-gradient-to-b from-[#0B2D5C] to-[#061830]">
                {initials(doctor.name)}
              </div>
            )}

            {/* Subtle Gradient Shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/25 to-transparent pointer-events-none" />

            {/* Top Badge: Verified Status */}
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#0B2D5C]/80 text-[#8ff3e8] backdrop-blur-md border border-[#12B8B0]/30 shadow-sm">
                <CheckCircle className="w-3 h-3 text-[#12B8B0]" />
                {doctor.badge || "Licensed Physician"}
              </span>
            </div>

            {/* Bottom Glassmorphic Information Bar (identical to For Licensed Doctors workspace card) */}
            <div className="absolute bottom-0 inset-x-0 p-5 text-white bg-[#0B2D5C]/75 backdrop-blur-md border-t border-[#12B8B0]/40 transition-colors group-hover:bg-[#0B2D5C]/85">
              <h3
                className="text-lg md:text-xl font-extrabold text-white leading-snug line-clamp-1"
                style={{ fontFamily: "var(--font-primary)" }}
                title={doctor.name}
              >
                {doctor.name}
              </h3>
              <p className="mt-1 text-xs md:text-sm text-[#8ff3e8] font-medium line-clamp-1">
                {doctor.specialty || doctor.role}
              </p>
              {doctor.license ? (
                <p className="mt-1.5 text-xs text-white/80 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12B8B0]" />
                  <span>Licence {doctor.license}</span>
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
