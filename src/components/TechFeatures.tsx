"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Watch, QrCode, Lock, Zap, Activity, Smartphone, Globe } from "lucide-react";

const features = [
  { icon: Brain,    badge: "Decision Support", title: "AI Decision Support",          color: "from-violet-500 to-violet-600", bg: "bg-violet-50", border: "border-violet-100", iconColor: "text-violet-600", desc: "Analyses questionnaire responses, flags red flags, calculates risk scores, and generates structured clinical summaries for the reviewing doctor." },
  { icon: Watch,    badge: "Device Sync",       title: "Wearable Integration",         color: "from-sky-500 to-sky-600",     bg: "bg-sky-50",    border: "border-sky-100",    iconColor: "text-sky-600",    desc: "Connect Apple Health, Google Health, Fitbit, Garmin, Samsung Health, and Bluetooth medical devices. Source and timestamp clearly displayed." },
  { icon: QrCode,   badge: "Instant Verify",   title: "QR Verification",              color: "from-teal-500 to-teal-600",   bg: "bg-teal-50",   border: "border-teal-100",   iconColor: "text-teal-600",   desc: "Every certificate has a unique number and scannable QR code. Employers verify validity without accessing sensitive medical details." },
  { icon: Lock,     badge: "Enterprise",        title: "Medical-Grade Security",       color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-600", desc: "End-to-end encryption, role-based access, audit trails, and full compliance with Rwandan health and data-protection requirements." },
  { icon: Zap,      badge: "Smart Routing",    title: "Fitness Rules Engine",         color: "from-amber-500 to-amber-600", bg: "bg-amber-50",  border: "border-amber-100",  iconColor: "text-amber-600",  desc: "A central rules engine determines the assessment pathway by certificate purpose — controlling history requirements and escalation criteria." },
  { icon: Activity, badge: "Remote Vitals",    title: "Digital Vital Measurements",   color: "from-rose-500 to-rose-600",   bg: "bg-rose-50",   border: "border-rose-100",   iconColor: "text-rose-600",   desc: "AI-estimated vitals via smartphone camera (remote-PPG). All AI-estimated values are clearly labelled as screening measurements." },
];

const integrations = ["Apple Health", "Google Health Connect", "Fitbit", "Garmin", "Samsung Health", "Bluetooth BP Monitor", "Pulse Oximeter", "Smart Scale"];

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {features.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.09 }}
              whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(0,0,0,.08)", transition: { duration: 0.22 } }}
              className={`rounded-3xl p-7 border ${f.border} ${f.bg} transition-all duration-300 group`}
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

        {/* Architecture flow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.65 }}
          className="rounded-3xl border border-sky-100 bg-sky-50 p-8 mb-14"
        >
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-1" style={{ fontFamily: "var(--font-primary)" }}>Platform Architecture</h3>
            <p className="text-sm text-slate-500">Every assessment follows a verified, auditable pathway</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs">
            {[
              { label: "Applicant App",    icon: Smartphone, cls: "text-sky-700 border-sky-200 bg-white" },
              { label: "AI Screening",     icon: Brain,      cls: "text-violet-700 border-violet-200 bg-white" },
              { label: "Clinical Engine",  icon: Activity,   cls: "text-teal-700 border-teal-200 bg-white" },
              { label: "Doctor Dashboard", icon: Lock,       cls: "text-emerald-700 border-emerald-200 bg-white" },
              { label: "Video Consult",    icon: Globe,      cls: "text-amber-700 border-amber-200 bg-white" },
              { label: "Digital Cert",     icon: QrCode,     cls: "text-rose-700 border-rose-200 bg-white" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold ${item.cls} shadow-sm`}>
                  <item.icon className="w-3.5 h-3.5" /><span>{item.label}</span>
                </div>
                {i < 5 && <span className="text-slate-400 text-base font-light">→</span>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Integrations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.85 }}
          className="text-center"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-5">Compatible Devices & Platforms</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {integrations.map(d => (
              <div key={d} className="px-4 py-2 rounded-full border border-slate-200 bg-white text-xs text-slate-600 font-medium hover:border-sky-300 hover:text-sky-700 transition-all cursor-default shadow-sm">
                {d}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
