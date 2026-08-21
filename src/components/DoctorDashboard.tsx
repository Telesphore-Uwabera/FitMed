"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Activity, Brain, CheckCircle2, ClipboardList, FileSignature, Shield, Video } from "lucide-react";
import Image from "next/image";
import type { PublicTeamMember } from "@/lib/publicStaffTypes";

const features = [
  { icon: ClipboardList, title: "Applicant Overview", desc: "Full history, vitals, medications, and AI-flagged red flags before the consultation.", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
  { icon: Video, title: "Secure Video Call", desc: "End-to-end encrypted live video with built-in identity verification.", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  { icon: Brain, title: "AI Decision Support", desc: "Summaries, risk flags, and documentation assistance — you stay in control.", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
  { icon: FileSignature, title: "Digital Signature", desc: "One-click digitally signed certificate issuance with a full audit trail.", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
];

const decisions = [
  { label: "FIT", desc: "Medically fit for stated purpose", cls: "bg-green-50 text-green-700 border-green-200" },
  { label: "FIT WITH RESTRICTIONS", desc: "Fit with documented limitations", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  { label: "FURTHER ASSESSMENT", desc: "Requires additional examination", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  { label: "NOT FIT", desc: "Not fit at time of assessment", cls: "bg-red-50 text-red-700 border-red-200" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function DoctorDashboard({ doctors: initialDoctors }: { doctors?: PublicTeamMember[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [doctors, setDoctors] = useState<PublicTeamMember[]>(initialDoctors || []);
  const [currentDoctor, setCurrentDoctor] = useState(0);

  useEffect(() => {
    if (initialDoctors?.length) setDoctors(initialDoctors);
    fetch("/api/public/staff", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.doctors) && data.doctors.length) setDoctors(data.doctors);
      })
      .catch(() => {
        if (initialDoctors?.length) setDoctors(initialDoctors);
      });
  }, [initialDoctors]);

  useEffect(() => {
    if (doctors.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrentDoctor((current) => (current + 1) % doctors.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [doctors.length]);

  const doctor = doctors[currentDoctor] || doctors[0];
  const photo = doctor?.image && !doctor.image.includes("images.unsplash.com") ? doctor.image : "";

  return (
    <section className="relative py-28 section-light overflow-hidden">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          <motion.div ref={ref} initial={{ opacity: 0, x: -50 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-5 badge-teal">For Licensed Doctors</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6" style={{ fontFamily: "var(--font-primary)", color: "#0B2D5C" }}>The Clinical <span className="gradient-text">Workspace</span></h2>
            <p className="text-lg leading-relaxed mb-10" style={{ color: "#5b6f86" }}>Everything you need — applicant history, vitals, AI summaries, video consultation, and certificate issuance — in one secure, well-designed place.</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {features.map((feature, index) => (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 + index * 0.1 }} className={`rounded-2xl p-5 border ${feature.border} ${feature.bg} transition-all group`}>
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform"><feature.icon className={`w-4.5 h-4.5 ${feature.color}`} strokeWidth={1.5} /></div>
                  <h4 className="text-sm font-bold mb-1" style={{ fontFamily: "var(--font-primary)", color: "#0B2D5C" }}>{feature.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: "#5b6f86" }}>{feature.desc}</p>
                </motion.div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#7a8ea3" }}>Decision Framework</p>
              <div className="grid grid-cols-2 gap-2">
                {decisions.map((decision) => (
                  <div key={decision.label} className={`px-3 py-2.5 rounded-xl border text-center ${decision.cls}`}><div className="text-[10px] font-extrabold tracking-wide">{decision.label}</div><div className="text-[10px] mt-0.5 font-medium opacity-90">{decision.desc}</div></div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border border-slate-200 bg-[#0B2D5C]">
              {!doctor ? (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-[#8ff3e8]">
                  Licensed doctors added in FitMed will appear here.
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={doctor.id} initial={{ opacity: 0, x: 35 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -35 }} transition={{ duration: 0.55 }} className="absolute inset-0">
                    {photo ? (
                      <Image src={photo} alt={doctor.name} fill className="object-cover object-top" sizes="(max-width:1024px) 100vw, 50vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-7xl font-extrabold text-[#12B8B0]">
                        {initials(doctor.name)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-6 text-white bg-[#0B2D5C]/65 backdrop-blur-md border-t border-[#12B8B0]/40">
                      <h3 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-primary)", color: "#FFFFFF" }}>{doctor.name}</h3>
                      <p className="mt-1 text-sm text-[#8ff3e8]">{doctor.specialty || doctor.role}</p>
                      {doctor.license ? <p className="mt-1 text-xs text-white/80">Licence {doctor.license}</p> : null}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
            <motion.div animate={{ y: [-4, 4, -4] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 border border-slate-200 shadow-xl max-w-[240px]">
              <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-sky-500" /><span className="text-xs font-bold text-slate-700">Vitals Summary</span></div>
              <div className="grid grid-cols-2 gap-1.5">
                {[['BP', '118/78', 'text-teal-600'], ['HR', '72 bpm', 'text-sky-600'], ['BMI', '23.4', 'text-violet-600'], ['SpO₂', '98%', 'text-emerald-600']].map(([label, value, color]) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100"><div className={`text-sm font-bold ${color}`}>{value}</div><div className="text-[10px] text-slate-400">{label}</div></div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /><span className="text-[10px] text-green-600 font-semibold">0 red flags detected</span></div>
            </motion.div>
            <motion.div animate={{ y: [-3, 5, -3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute -top-5 -left-4 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xl">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center"><Shield className="w-4 h-4 text-emerald-600" /></div><div><div className="text-xs font-bold text-slate-800">Certificate Issued</div><div className="text-[10px] text-emerald-600">✓ Digitally signed</div></div></div>
            </motion.div>
            {doctors.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4" aria-label="Doctor profiles">
                {doctors.map((item, index) => (
                  <button key={item.id} type="button" onClick={() => setCurrentDoctor(index)} aria-label={`Show ${item.name}`} className={`h-2 rounded-full transition-all ${index === currentDoctor ? "w-8 bg-[#12B8B0]" : "w-2 bg-slate-300 hover:bg-slate-400"}`} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
