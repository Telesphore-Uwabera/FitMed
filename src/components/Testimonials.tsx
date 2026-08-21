"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

const testimonials = [
  { name: "Alphonse Rugira",        role: "Construction Site Manager",   company: "Kigali Build Co.",     text: "Our whole team got their certificates within 48 hours. The employer portal makes tracking renewals effortless. No more chasing paperwork.",          img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&auto=format&fit=crop&crop=face", rating: 5 },
  { name: "Diane Uwimana",          role: "University Student",           company: "University of Rwanda",  text: "I needed a fitness certificate for enrolment and got it without leaving my dorm. The doctor was thorough and professional. Took about 2 hours total.", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80&auto=format&fit=crop&crop=face", rating: 5 },
  { name: "Dr. Emmanuel N.",        role: "Occupational Health Physician",company: "Independent Practitioner",text: "The dashboard gives me everything I need before the consultation. The AI summary saves 15 minutes per applicant.",                                       img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&q=80&auto=format&fit=crop&crop=face", rating: 5 },
  { name: "Grace Mukashyaka",       role: "HR Director",                  company: "Telecom Rwanda",        text: "FitMed has cut our administrative workload in half. The QR verification means instant confirmation for our compliance records.",                     img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&q=80&auto=format&fit=crop&crop=face", rating: 5 },
  { name: "Patrick Ntirenganya",    role: "Long-Distance Truck Driver",   company: "East Africa Logistics", text: "I was sceptical but the doctor was as thorough as any clinic I've visited. My employer accepted the certificate immediately.",                        img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&auto=format&fit=crop&crop=face", rating: 5 },
  { name: "Solange Musabyimana",    role: "Head of Compliance",           company: "Rwanda Finance Group",  text: "Employees complete their own assessments and we only see validity status. Clean, compliant, and efficient.",                                          img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80&auto=format&fit=crop&crop=face", rating: 5 },
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
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5" style={{ fontFamily: "var(--font-primary)" }}>
            What People <span className="gradient-text">Are Saying</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            From applicants to doctors to HR teams — FitMed is transforming how medical fitness certification gets done.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 45 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.09 }}
              whileHover={{ y: -5, boxShadow: "0 16px 40px rgba(14,165,233,.1)", transition: { duration: 0.22 } }}
              className="card-white rounded-3xl p-7 flex flex-col transition-all duration-300 group"
            >
              <Quote className="w-7 h-7 text-sky-100 mb-5 group-hover:text-sky-200 transition-colors" />
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={t.img} alt={t.name} fill className="object-cover" sizes="40px" loading="lazy" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800" style={{ fontFamily: "var(--font-primary)" }}>{t.name}</div>
                  <div className="text-xs text-slate-400">{t.role} · {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
