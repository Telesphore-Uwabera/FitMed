"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Users, SendHorizonal, CheckCircle,
  BarChart3, CreditCard, Bell, ShieldCheck, ArrowRight,
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Users,
    title: "Manage Your Team",
    desc: "Centralised dashboard for all employee assessments — track who is certified, pending, or due for renewal.",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
  },
  {
    icon: SendHorizonal,
    title: "Send Certificate Requests",
    desc: "Generate secure invitation links or codes. Employees complete the assessment on their own schedule.",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    icon: CheckCircle,
    title: "Verify Certificate Status",
    desc: "Instant QR verification — see if a certificate is valid, expired, or revoked in seconds.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    desc: "Completion rates, pending assessments, and team fitness overview at a glance.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: CreditCard,
    title: "Flexible Billing",
    desc: "Organisational packages, assessment credits, and per-assessment pricing to suit any team size.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Automated reminders for upcoming renewals and expiring certificates — never miss a deadline.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
];

export default function EmployerPortal() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="employers" className="relative py-28 section-gray overflow-hidden">
      <div className="container-wide">

        {/*
         * items-stretch  → both columns grow to the same height.
         * Left column uses flex-col so its content fills the height
         * and the CTA button is pinned to the bottom.
         */}
        <div className="grid lg:grid-cols-[1fr_0.75fr] gap-16 xl:gap-20 items-start">

          {/* ── Left column ─────────────────────────────────── */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            {/* Heading block */}
            <div className="mb-10">

              <h2
                className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Streamline Your{" "}
                <span className="gradient-text">Workforce Health</span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed">
                Manage employee medical fitness certifications at scale. Send requests, track status, verify certificates — all from one secure employer portal.
              </p>
            </div>

            {/* Features grid — fills remaining height */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.09 }}
                  className={`rounded-2xl p-5 border ${f.border} ${f.bg} flex flex-col gap-3 transition-all hover:shadow-md group`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} strokeWidth={1.5} />
                  </div>
                  {/* Text */}
                  <div>
                    <h4
                      className="text-sm font-bold text-slate-800 mb-1.5"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      {f.title}
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>

          {/* ── Right column ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-5"
          >
            {/* HR team photo */}
            <div className="relative rounded-3xl overflow-hidden aspect-video shadow-xl flex-shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&q=80&auto=format&fit=crop"
                alt="HR team reviewing employee medical fitness certificates on the FitMed employer portal"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-slate-700 font-semibold">Live employer portal</span>
              </div>
            </div>

            {/* Privacy by Design card */}
            <div className="bg-white rounded-2xl p-6 border-0 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h3
                    className="text-base font-bold text-slate-800"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    Privacy by Design
                  </h3>
                  <p className="text-xs text-slate-400">Minimum necessary data principle</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Employers see certificate validity only — not diagnoses or clinical notes",
                  "Applicant full medical history is never shared with employers",
                  "All certificate data is encrypted and access-controlled",
                  "Applicant consent is obtained before any employer access",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-slate-500">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-1">
              <motion.a
                href="/signin"
                whileHover={{ scale: 1.04, boxShadow: "0 12px 35px rgba(14,165,233,.3)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-[#0B2D5C] bg-[#12B8B0] hover:bg-[#1dd9d0] shadow-lg shadow-sky-500/20 group text-base transition-colors"
              >
                <span>Set Up Employer Account</span>
                <ArrowRight className="w-5 h-5 text-[#0B2D5C] group-hover:translate-x-0.5 transition-transform" />
              </motion.a>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
