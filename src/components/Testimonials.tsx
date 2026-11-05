"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck, BadgeCheck, QrCode, Clock } from "lucide-react";
import { IREMBO_FEE_RWF } from "@/lib/iremboPay";
import { CERTIFICATE_VALIDITY_MONTHS } from "@/lib/fitmedServices";

const points = [
  {
    icon: ShieldCheck,
    title: "A doctor decides",
    body: "Questionnaires can highlight answers for review. The fitness decision is made by a licensed doctor after the consultation.",
  },
  {
    icon: BadgeCheck,
    title: `${IREMBO_FEE_RWF.toLocaleString("en-US")} FRW service fee`,
    body: "That is the published fee for an assessment. It is charged when a doctor approves a certificate that can be issued.",
  },
  {
    icon: Clock,
    title: `${CERTIFICATE_VALIDITY_MONTHS} months`,
    body: "An issued certificate stays valid for six months. After the expiry date, public verification shows it as expired.",
  },
  {
    icon: QrCode,
    title: "Anyone can check the number",
    body: "The QR code opens a public result: valid, expired, or not valid. Medical history stays off that page.",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 section-white overflow-hidden">
      <div className="container-wide">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-5" style={{ fontFamily: "var(--font-primary)" }}>
            What the certificate <span className="gradient-text">includes</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-300 text-lg max-w-xl mx-auto">
            These are product facts. FitMed does not publish a certificate count or an average rating until those figures come from the live records.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {points.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="card-white rounded-3xl p-7"
            >
              <point.icon className="w-6 h-6 text-[#12B8B0] mb-4" />
              <h3 className="text-lg font-extrabold text-[#0B2D5C] dark:text-white mb-2" style={{ fontFamily: "var(--font-primary)" }}>
                {point.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{point.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
