"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is a digital medical fitness certificate legally valid?",
    a: "FitMed certificates are issued by licensed doctors and digitally signed. Compliance with Rwandan laws — including telemedicine, electronic signature, and professional licensing requirements — is reviewed before launching each certificate category. High-risk categories requiring physical examination are referred for in-person assessment.",
  },
  {
    q: "Can AI issue the certificate on its own?",
    a: "No. AI is strictly a decision-support tool. It screens questionnaires, flags red flags, summarises applicant history, and assists with documentation — but the final fitness decision is always made by a licensed doctor after a live video consultation.",
  },
  {
    q: "What if I need a certificate for a high-risk occupation like aviation or heavy machinery?",
    a: "Some certificate categories require an in-person physical examination. If your purpose falls into that category, FitMed will inform you and refer you to an appropriate in-person facility. The platform clearly communicates which categories are telemedicine-eligible.",
  },
  {
    q: "How does the employer verify my certificate without seeing my medical history?",
    a: "Employers access a public verification page linked to your QR code. This shows only certificate validity status, issue and expiry dates, purpose, and certificate number. Your full medical history and clinical notes are never shared with employers.",
  },
  {
    q: "How long is my certificate valid?",
    a: "FitMed digital fitness certificates are valid for 6 months from the issue date. After expiry, you can apply for a new assessment if you still need a current certificate.",
  },
  {
    q: "How long does the process take?",
    a: "For standard fitness certificates, you can typically get your certificate in under 2 hours from account creation to issuance, depending on doctor availability.",
  },
  {
    q: "What measurements or devices do I need?",
    a: "You will be asked to provide basic measurements — height, weight, blood pressure, and heart rate. You can enter these manually or connect a wearable device (Fitbit, Apple Health, Garmin, etc.) or Bluetooth medical device.",
  },
  {
    q: "What if the doctor determines I need further assessment?",
    a: "The doctor may issue a 'Further Assessment Required' decision if physical examination, specialist review, or additional investigation is needed. This reflects real clinical uncertainty and ensures safe escalation. You will receive clear guidance on next steps.",
  },
  {
    q: "How is my health data protected?",
    a: "FitMed uses encryption in transit and at rest, role-based access control, and audit logging. We comply with applicable Rwandan health and data-protection requirements. Your data is used solely for your medical assessment and is never sold.",
  },
];

/* Single accordion item */
function FAQItem({ faq, index }: { faq: (typeof faqs)[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-[#12253d] rounded-2xl border-0 transition-all duration-300 overflow-hidden shadow-sm h-fit"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between p-5 md:p-6 text-left gap-4"
        aria-expanded={open}
      >
        <span
          className="text-sm md:text-base font-semibold leading-snug flex-1 text-[#0B2D5C] dark:text-slate-100"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          {faq.q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors mt-0.5 ${
            open ? "bg-sky-100 text-sky-600 dark:bg-[#12B8B0]/20 dark:text-[#12B8B0]" : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-300"
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-5 md:px-6 pb-5 md:pb-6">
              <div className="w-full h-px bg-slate-100 dark:bg-slate-600 mb-4" />
              <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">{faq.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="relative py-28 section-white overflow-hidden">
      <div className="container-wide">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl md:text-5xl font-extrabold mb-5 text-[#0B2D5C] dark:text-slate-100"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Got <span className="gradient-text">Questions?</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto leading-relaxed text-slate-500 dark:text-slate-300">
            Everything you need to know about FitMed.{" "}
            <Link
              href="/contact"
              className="font-semibold underline underline-offset-4"
              style={{ color: "#12B8B0" }}
            >
              Contact us
            </Link>{" "}
            if you can&apos;t find the answer.
          </p>
        </motion.div>

        {/*
          Layout:
          - Mobile / tablet  → single column (space-y-3)
          - Large screens    → two equal columns side by side
        */}
        <div className="block lg:hidden space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.q} faq={faq} index={i} />
          ))}
        </div>

        {/* Shared-row two-column layout on lg+ keeps paired cards equal in height. */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:items-stretch">
          {faqs.map((faq, i) => (
            <FAQItem key={faq.q} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
