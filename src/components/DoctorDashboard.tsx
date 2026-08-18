"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Video, Shield, ClipboardList, FileSignature, Brain, CheckCircle2, Activity } from "lucide-react";
import Image from "next/image";

const features = [
  { icon: ClipboardList, title: "Patient Overview",      desc: "Full history, vitals, medications, and AI-flagged red flags before the consultation.",            color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100" },
  { icon: Video,          title: "Secure Video Call",    desc: "End-to-end encrypted live video with built-in identity verification.",                            color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-100" },
  { icon: Brain,          title: "AI Decision Support",  desc: "Summaries, risk flags, and documentation assistance — you stay in control.",                      color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
  { icon: FileSignature,  title: "Digital Signature",    desc: "One-click digitally signed certificate issuance with a full audit trail.",                        color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
];

const decisions = [
  { label: "FIT",                   desc: "Medically fit for stated purpose",    cls: "bg-green-50   text-green-700  border-green-200" },
  { label: "FIT WITH RESTRICTIONS", desc: "Fit with documented limitations",     cls: "bg-amber-50   text-amber-700  border-amber-200" },
  { label: "FURTHER ASSESSMENT",    desc: "Requires additional examination",     cls: "bg-orange-50  text-orange-700 border-orange-200" },
  { label: "NOT FIT",               desc: "Not fit at time of assessment",       cls: "bg-red-50     text-red-700    border-red-200" },
];

export default function DoctorDashboard() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 section-light overflow-hidden">

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-center">

          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-5 badge-teal">
              For Licensed Doctors
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-primary)" }}>
              The Clinical <span className="gradient-text">Workspace</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-10">
              Everything you need — patient history, vitals, AI summaries, video consultation, and certificate issuance — in one secure, well-designed place.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {features.map((f, i) => (
                <motion.div key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className={`rounded-2xl p-5 border ${f.border} ${f.bg} transition-all group`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-4.5 h-4.5 ${f.color}`} strokeWidth={1.5} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1" style={{ fontFamily: "var(--font-primary)" }}>{f.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Decision Framework</p>
              <div className="grid grid-cols-2 gap-2">
                {decisions.map(d => (
                  <div key={d.label} className={`px-3 py-2.5 rounded-xl border text-center ${d.cls}`}>
                    <div className="text-[10px] font-extrabold tracking-wide">{d.label}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — doctor image + floating cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl border border-slate-200">
              <Image
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80&auto=format&fit=crop"
                alt="Black African doctor at telemedicine workstation conducting patient consultation"
                fill className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
            </div>

            {/* Vitals card */}
            <motion.div
              animate={{ y: [-4, 4, -4] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 border border-slate-200 shadow-xl max-w-[240px]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-sky-500" />
                <span className="text-xs font-bold text-slate-700">Vitals Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[["BP","118/78","text-teal-600"],["HR","72 bpm","text-sky-600"],["BMI","23.4","text-violet-600"],["SpO₂","98%","text-emerald-600"]].map(([k,v,c]) => (
                  <div key={k} className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                    <div className={`text-sm font-bold ${c}`}>{v}</div>
                    <div className="text-[10px] text-slate-400">{k}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[10px] text-green-600 font-semibold">0 red flags detected</span>
              </div>
            </motion.div>

            {/* Cert badge */}
            <motion.div
              animate={{ y: [-3, 5, -3] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -top-5 -right-4 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xl"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Certificate Issued</div>
                  <div className="text-[10px] text-emerald-600">✓ Digitally signed</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
