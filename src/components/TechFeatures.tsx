"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Watch, QrCode, Lock, Zap, Activity } from "lucide-react";

const features = [
  { icon: Brain,    badge: "Decision Support", title: "AI Decision Support",          color: "from-violet-500 to-violet-600", bg: "bg-violet-50", border: "border-violet-100", iconColor: "text-violet-600", desc: "Analyses questionnaire responses, flags red flags, calculates risk scores, and generates structured clinical summaries for the reviewing doctor." },
  { icon: Watch,    badge: "Device Sync",       title: "Wearable Integration",         color: "from-sky-500 to-sky-600",     bg: "bg-sky-50",    border: "border-sky-100",    iconColor: "text-sky-600",    desc: "Connect Apple Health, Google Health, Fitbit, Garmin, Samsung Health, and Bluetooth medical devices. Source and timestamp clearly displayed." },
  { icon: QrCode,   badge: "Instant Verify",   title: "QR Verification",              color: "from-teal-500 to-teal-600",   bg: "bg-teal-50",   border: "border-teal-100",   iconColor: "text-teal-600",   desc: "Every certificate has a unique number and scannable QR code. Employers verify validity without accessing sensitive medical details." },
  { icon: Lock,     badge: "Enterprise",        title: "Medical-Grade Security",       color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-600", desc: "End-to-end encryption, role-based access, audit trails, and full compliance with Rwandan health and data-protection requirements." },
  { icon: Zap,      badge: "Smart Routing",    title: "Fitness Rules Engine",         color: "from-amber-500 to-amber-600", bg: "bg-amber-50",  border: "border-amber-100",  iconColor: "text-amber-600",  desc: "A central rules engine determines the assessment pathway by certificate purpose — controlling history requirements and escalation criteria." },
  { icon: Activity, badge: "Remote Vitals",    title: "Digital Vital Measurements",   color: "from-rose-500 to-rose-600",   bg: "bg-rose-50",   border: "border-rose-100",   iconColor: "text-rose-600",   desc: "AI-estimated vitals via smartphone camera (remote-PPG). All AI-estimated values are clearly labelled as screening measurements." },
];

export default function TechFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="technology" className="relative py-28 section-white overflow-hidden">
      <div className="container-wide">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >

          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5" style={{ fontFamily: "var(--font-primary)" }}>
            Built for the <span className="gradient-text">Future of Healthcare</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
            A secure, AI-assisted platform where technology supports doctors — never replaces them.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.09 }}
              whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(0,0,0,.08)", transition: { duration: 0.22 } }}
              className={`rounded-3xl p-7 border-0 ${f.bg} transition-all duration-300 group`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} strokeWidth={1.5} />
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm">{f.badge}</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-3" style={{ fontFamily: "var(--font-primary)" }}>{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
