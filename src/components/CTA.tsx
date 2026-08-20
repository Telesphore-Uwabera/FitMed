"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const paths = [
  { icon: Shield, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200 hover:border-sky-400", label: "Start Your Assessment", sub: "Get your medical fitness certificate", shadow: "hover:shadow-sky-100", href: "/signin" },
];

export default function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="request" className="relative py-28 overflow-hidden" style={{ background: "#071d3d" }}>
      {/* Background photo — subtle */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1600&q=60&auto=format&fit=crop"
          alt="Medical professional background"
          fill className="object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/75 to-slate-800/70" />
      </div>

      {/* Glow */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-sky-600/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 45 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >

          <h2 className="text-4xl md:text-6xl xl:text-7xl font-extrabold text-white mb-6 leading-[1.05]" style={{ fontFamily: "var(--font-primary)" }}>
            Your health.{" "}
            <span className="bg-gradient-to-r from-[#12B8B0] to-[#1dd9d0] bg-clip-text text-transparent">Fit, Verified, and Ready.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-14 leading-relaxed">
            Get your medical fitness certificate online — assessed by a licensed doctor, digitally signed, and instantly verifiable anywhere in the world.
          </p>

          {/* Three paths */}
          <div className="grid gap-4 max-w-md mx-auto mb-14">
            {paths.map((p, i) => (
              <motion.div key={p.label}
                initial={{ opacity: 0, y: 25 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.35 + i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href={p.href}
                  className={`group flex flex-col items-center gap-3 p-6 bg-white/8 backdrop-blur-sm rounded-3xl border ${p.border} transition-all duration-300 shadow-sm ${p.shadow} hover:bg-white/15 hover:shadow-xl`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${p.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <p.icon className={`w-6 h-6 ${p.color}`} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: "var(--font-primary)" }}>{p.label}</div>
                    <div className="text-xs text-slate-400">{p.sub}</div>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${p.color} group-hover:translate-x-1 transition-transform`} />
                </Link>
              </motion.div>
            ))}
          </div>

        </motion.div>
      </div>
    </section>
  );
}
