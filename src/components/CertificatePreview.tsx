"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Shield, CheckCircle, QrCode, Lock,
} from "lucide-react";
import Image from "next/image";

export default function CertificatePreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 section-light overflow-hidden">
      <div className="container-wide">

        {/*
         * items-stretch → both columns grow to the same height.
         * Left col: self-contained (certificate card).
         * Right col: flex-col so the photo strip is always pinned to the bottom.
         */}
        <div className="w-full">
          {/* ── Certificate content ─────────────────────────── */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col max-w-5xl mx-auto"
          >
            {/* Heading and certificate benefits */}
            <div className="flex-1">
              <h2
                className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 text-center"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Professionally Designed.
                <br />
                <span className="gradient-text">Digitally Signed.</span>
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-10 text-center max-w-3xl mx-auto">
                Every FitMed certificate is purpose-specific, doctor-signed, and instantly verifiable.
                It contains only what the recipient needs — protecting your medical privacy.
              </p>

              <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 mb-10 max-w-5xl mx-auto">
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
                alt="Employer scanning a FitMed medical fitness certificate QR code for instant verification"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/90 dark:from-[#071d3d]/92 to-transparent flex items-center px-6">
                <div>
                  <p className="text-xs text-slate-500 dark:text-[#8ff3e8] mb-0.5">Employer QR scan</p>
                  <p className="text-sm font-bold text-[#0B2D5C] dark:text-white">Verified in seconds, anywhere.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
