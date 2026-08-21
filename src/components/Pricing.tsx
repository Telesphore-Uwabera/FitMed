"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  Car,
  Utensils,
  Plane,
  HardHat,
} from "lucide-react";
import { CERTIFICATE_VALIDITY_MONTHS, FITMED_SERVICES } from "@/lib/fitmedServices";

const serviceIcons = {
  workplace: Briefcase,
  school: GraduationCap,
  sports: HeartPulse,
  transport: Car,
  food: Utensils,
  travel: Plane,
  construction: HardHat,
} as const;

const iconColors = {
  workplace: "text-sky-600 dark:text-sky-400",
  school: "text-teal-600 dark:text-teal-400",
  sports: "text-rose-600 dark:text-rose-400",
  transport: "text-amber-600 dark:text-amber-400",
  food: "text-emerald-600 dark:text-emerald-400",
  travel: "text-indigo-600 dark:text-indigo-400",
  construction: "text-violet-600 dark:text-violet-400",
} as const;

function ServiceCard({
  service,
}: {
  service: (typeof FITMED_SERVICES)[number];
}) {
  const Icon = serviceIcons[service.id];
  const iconColor = iconColors[service.id];

  return (
    <article className="w-[min(20rem,82vw)] aspect-square shrink-0 bg-white dark:bg-[#12253d] rounded-3xl border-0 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col overflow-hidden">
      <div className="p-6 flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <Icon className={`w-8 h-8 ${iconColor} flex-shrink-0`} strokeWidth={1.5} />
          <span className="px-2.5 py-1 rounded-full bg-[#edf6f6] dark:bg-[#12B8B0]/15 text-[#0B2D5C] dark:text-[#7ee8e2] text-[10px] font-extrabold border border-teal-200 dark:border-[#12B8B0]/35">
            {service.tag}
          </span>
        </div>

        <h3
          className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-1 leading-snug"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          {service.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed flex-1">
          {service.desc}
        </p>

        <div className="mb-3 flex-shrink-0">
          <span
            className="text-2xl font-black text-slate-900 dark:text-white"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            5,000 FRW
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">service fee</span>
        </div>

        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{service.time}</p>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Valid for {CERTIFICATE_VALIDITY_MONTHS} months
        </p>
      </div>
    </article>
  );
}

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="relative py-28 section-gray overflow-hidden">
      <div className="container-wide">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-5 badge-teal">
            Simple, Transparent Pricing
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-5"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Services for Every{" "}
            <span className="gradient-text">Fitness Requirement</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            The same seven assessments available in your applicant dashboard.
            Each includes licensed doctor review and a verifiable digital certificate valid for 6 months.
          </p>
        </motion.div>
      </div>

      <div className="overflow-hidden" aria-label="FitMed services">
        <div className="services-marquee-track">
          {[0, 1].map((copy) => (
            <div key={copy} className="services-marquee-group">
              {FITMED_SERVICES.map((service) => (
                <ServiceCard key={`${copy}-${service.id}`} service={service} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-slate-400 mt-10 px-4">
        Pricing is a FitMed service fee covering clinical review, doctor time, and technology.
        Refund available if the assessment cannot be completed.
      </p>
    </section>
  );
}
