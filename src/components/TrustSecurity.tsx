"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Lock, Shield, Eye, FileCheck, Server, Key, AlertCircle, BookOpen } from "lucide-react";
import Image from "next/image";

const pillars = [
  { icon: Lock,        title: "End-to-End Encryption",         desc: "All health data, consultations, and certificates are encrypted in transit and at rest.",                    color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100" },
  { icon: Eye,         title: "Minimal Data Disclosure",        desc: "Employers see only certificate validity. Medical history stays private between patient and doctor.",          color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-100" },
  { icon: FileCheck,   title: "Full Audit Trail",               desc: "Every certificate is fully traceable from patient submission through doctor review to issuance.",             color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100" },
  { icon: Key,         title: "Role-Based Access",              desc: "Patients, doctors, employers, and admins each see only what they are permitted to access.",                  color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
  { icon: Server,      title: "Secure Data Storage",            desc: "Medical data is stored with HIPAA-compliant security, with defined data retention and deletion policies.",   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { icon: AlertCircle, title: "Incident Response",              desc: "Dedicated incident response procedures with transparent communication to affected users.",                   color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100" },
  { icon: Shield,      title: "Doctor Credential Verification", desc: "All doctors are vetted — license number, specialty, and ongoing quality monitoring.",                        color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100" },
  { icon: BookOpen,    title: "Rwandan Regulatory Compliance",  desc: "Built in compliance with Rwandan health, telemedicine, data-protection, and e-signature requirements.",      color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-100" },
];

export default function TrustSecurity() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="relative py-28 section-slate overflow-hidden">

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-14 xl:gap-20 items-center mb-20">

          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-5 badge-fit">
              Security & Privacy
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-primary)" }}>
              Built with <span className="gradient-text">Security First</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Medical data requires the highest level of protection. Privacy and security are built into our architecture from day one — not added as an afterthought.
            </p>
            <div className="flex flex-wrap gap-3">
              {["HIPAA Compliant", "End-to-End Encrypted", "Full Audit Logged", "GDPR-aligned"].map(badge => (
                <span key={badge} className="px-4 py-2 rounded-full bg-white border border-emerald-200 text-xs font-bold text-emerald-700 shadow-sm">
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: security image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl overflow-hidden aspect-[16/10] shadow-xl border border-slate-200"
          >
            <Image
              src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=900&q=80&auto=format&fit=crop"
              alt="Secure encrypted medical data infrastructure for African health platform"
              fill className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
            <div className="absolute bottom-5 left-5 flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm border border-slate-100">
              <Lock className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-800">256-bit AES Encryption</p>
                <p className="text-[10px] text-slate-500">Data encrypted at rest & in transit</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pillars */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p, i) => (
            <motion.div key={p.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.07 }}
              whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,.06)", transition: { duration: 0.2 } }}
              className={`bg-white rounded-2xl p-5 border ${p.border} shadow-sm transition-all group`}
            >
              <div className={`w-9 h-9 rounded-xl ${p.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <p.icon className={`w-4 h-4 ${p.color}`} strokeWidth={1.5} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-2" style={{ fontFamily: "var(--font-primary)" }}>{p.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
