"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Shield, CheckCircle, QrCode, Calendar, User,
  Stethoscope, Award, Lock,
} from "lucide-react";
import Image from "next/image";

export default function CertificatePreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 section-light overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/*
         * items-stretch → both columns grow to the same height.
         * Left col: self-contained (certificate card).
         * Right col: flex-col so the photo strip is always pinned to the bottom.
         */}
        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24 items-stretch">

          {/* ── Left: Certificate mock ─────────────────────── */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-200/40 to-teal-100/40 rounded-3xl blur-2xl scale-105 pointer-events-none" />

            <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl flex-1">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 via-teal-400 to-sky-500" />
              <div className="p-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-auto flex-shrink-0" style={{ width: 90, height: 32 }}>
                      <Image
                        src="/logo.webp"
                        alt="FitMed"
                        width={939}
                        height={330}
                        className="w-24 h-auto object-contain"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Certificate No.</div>
                    <div className="text-[10px] font-mono text-sky-600 mt-0.5">FM-2026-00847291</div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-1">
                    Medical Fitness Certificate
                  </div>
                  <h3
                    className="text-xl font-extrabold text-slate-900"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    CERTIFICATE OF MEDICAL FITNESS
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">General Employment Fitness</div>
                </div>

                {/* Patient info */}
                <div className="grid grid-cols-2 gap-3 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  {[
                    { icon: User,     label: "Patient Name",    value: "Jean-Paul Habimana" },
                    { icon: Calendar, label: "Date of Birth",   value: "15 March 1990" },
                    { icon: Calendar, label: "Assessment Date", value: "18 August 2026" },
                    { icon: Calendar, label: "Valid Until",     value: "18 August 2027", accent: true },
                  ].map((f) => (
                    <div key={f.label}>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                        <f.icon className="w-2.5 h-2.5" />
                        {f.label}
                      </div>
                      <div className={`text-xs font-bold ${f.accent ? "text-teal-600" : "text-slate-800"}`}>
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Decision */}
                <div className="flex justify-center mb-5">
                  <div className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="text-center">
                      <div
                        className="text-xl font-extrabold text-green-700 tracking-wider"
                        style={{ fontFamily: "var(--font-primary)" }}
                      >
                        FIT
                      </div>
                      <div className="text-[10px] text-green-600/70">Medically fit for stated purpose</div>
                    </div>
                  </div>
                </div>

                {/* Doctor */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Certified by</div>
                      <div className="text-xs font-bold text-slate-800">Dr. Claudine Murekatete</div>
                      <div className="text-[10px] text-slate-400">License: MD-RW-2024-00312</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                    <Lock className="w-3 h-3" /> Digitally signed
                  </div>
                </div>

                {/* QR */}
                <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 mb-1">Scan to verify</div>
                    <div className="text-[10px] font-mono text-sky-600">verify.fitmed.rw/FM-2026-00847291</div>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-green-600 font-semibold">
                      <CheckCircle className="w-2.5 h-2.5" /> VALID — Verified 18 Aug 2026
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-sky-500 via-teal-400 to-sky-500 opacity-50" />
            </div>

            {/* Floating QR verified badge */}
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-5 -top-5 bg-white rounded-xl p-3.5 border border-slate-200 shadow-xl z-10"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-800">QR Verified</div>
                  <div className="text-[10px] text-green-600">✓ Authentic</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Right: content + photo ─────────────────────────
              flex-col so the photo strip always sits at the bottom,
              matching the bottom edge of the certificate on the left.
          ───────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            {/* Top: heading & features */}
            <div className="flex-1">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-5 badge-teal">
                The Certificate
              </span>
              <h2
                className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Professionally Designed.
                <br />
                <span className="gradient-text">Digitally Signed.</span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-10">
                Every FitMed certificate is purpose-specific, doctor-signed, and instantly verifiable.
                It contains only what the recipient needs — protecting your medical privacy.
              </p>

              <div className="space-y-5 mb-10">
                {[
                  {
                    icon: Shield,
                    color: "text-sky-600",
                    bg: "bg-sky-50",
                    border: "border-sky-100",
                    title: "Purpose-specific",
                    desc: "Each certificate states exactly what it certifies — fitness for the specific role or activity requested.",
                  },
                  {
                    icon: Lock,
                    color: "text-teal-600",
                    bg: "bg-teal-50",
                    border: "border-teal-100",
                    title: "Doctor-signed & traceable",
                    desc: "Digitally signed by a licensed doctor. Full audit trail from submission to issuance.",
                  },
                  {
                    icon: QrCode,
                    color: "text-violet-600",
                    bg: "bg-violet-50",
                    border: "border-violet-100",
                    title: "Instantly verifiable",
                    desc: "QR code links to a public verification page. Anyone can check validity without seeing medical details.",
                  },
                  {
                    icon: CheckCircle,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                    border: "border-emerald-100",
                    title: "Privacy-protecting",
                    desc: "Medical history and clinical notes stay private from employers. Always.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4
                        className="text-sm font-bold text-slate-800 mb-0.5"
                        style={{ fontFamily: "var(--font-primary)" }}
                      >
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: photo strip — pinned to the same level as certificate bottom */}
            <div className="relative rounded-2xl overflow-hidden h-36 flex-shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&q=70&auto=format&fit=crop"
                alt="Black employer scanning medical fitness certificate QR code for instant verification"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-transparent flex items-center px-6">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Employer QR scan</p>
                  <p className="text-sm font-bold text-slate-800">Verified in seconds, anywhere.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
