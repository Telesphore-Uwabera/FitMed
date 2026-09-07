"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  Briefcase, GraduationCap, Truck, Wrench, HeartPulse, Anchor,
  ChevronRight, CheckCircle, AlertTriangle, Info,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function requestHref(purpose: string) {
  return `/dashboard/user?tab=request&purpose=${encodeURIComponent(purpose)}`;
}

/* ── All images: Black African people, fitness & medical context ── */
const categories = [
  {
    icon: Briefcase,
    title: "Employment Fitness",
    purpose: "Workplace & Office Fitness",
    type: "telemedicine",
    badge: "Telemedicine Eligible",
    badgeColor: "badge-fit",
    color: "from-sky-500 to-sky-600",
    // Black professional at office — employment fitness context
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=75&auto=format&fit=crop",
    desc: "General medical fitness for office roles and standard workplace positions.",
    examples: ["Office & admin roles", "Customer service", "Professional services"],
  },
  {
    icon: GraduationCap,
    title: "School & University",
    purpose: "School & University Admission",
    type: "telemedicine",
    badge: "Telemedicine Eligible",
    badgeColor: "badge-fit",
    color: "from-teal-500 to-teal-600",
    // African university students on Kigali campus — education fitness clearance
    img: "/category-education.jpg",
    desc: "Health clearance for educational institutions and student admissions.",
    examples: ["University enrolment", "School sports clearance", "Scholarship medical"],
  },
  {
    icon: Truck,
    title: "Transport & Driving",
    purpose: "Commercial Driver & Transport",
    type: "review",
    badge: "May Require Review",
    badgeColor: "badge-review",
    color: "from-amber-500 to-amber-600",
    // African transport professional — commercial transport fitness
    img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500&q=75&auto=format&fit=crop",
    desc: "Fitness assessments for drivers and transport workers.",
    examples: ["Commercial vehicle drivers", "Public transport operators", "Taxi / motorcycle riders"],
  },
  {
    icon: Wrench,
    title: "Occupational / High-Risk",
    purpose: "Construction & Heights Fitness",
    type: "physical",
    badge: "Physical Exam Required",
    badgeColor: "badge-notfit",
    color: "from-rose-500 to-rose-600",
    // African civil engineer & safety officer — high-risk infrastructure occupation
    img: "/category-construction.jpg",
    desc: "For roles involving heights, heavy machinery, or hazardous environments.",
    examples: ["Work at heights", "Heavy machinery operators", "Mining & construction"],
  },
  {
    icon: HeartPulse,
    title: "General Health Fitness",
    purpose: "Sports, Gym & Athletic Fitness",
    type: "telemedicine",
    badge: "Telemedicine Eligible",
    badgeColor: "badge-fit",
    color: "from-violet-500 to-violet-600",
    // Black woman running outdoors — fitness and wellness
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=75&auto=format&fit=crop",
    desc: "General wellness and fitness-for-activity certificates for personal or insurance purposes.",
    examples: ["Sports & gym fitness", "Insurance health check", "Travel health clearance"],
  },
  {
    icon: Anchor,
    title: "Aviation & Specialised",
    purpose: "Construction & Heights Fitness",
    type: "physical",
    badge: "Physical Exam Required",
    badgeColor: "badge-notfit",
    color: "from-red-500 to-red-600",
    // African commercial airline pilot — aviation fitness clearance
    img: "/category-aviation.jpg",
    desc: "Aviation medical certificates and specialist high-risk occupational health assessments.",
    examples: ["Aviation / pilots", "Diving & marine roles", "Armed / security forces"],
  },
];

const typeInfo = {
  telemedicine: { icon: CheckCircle,   label: "Fully telemedicine-eligible",             color: "text-green-600" },
  review:       { icon: AlertTriangle, label: "May require additional clinical review",   color: "text-amber-600" },
  physical:     { icon: Info,          label: "In-person physical examination required",  color: "text-rose-600"  },
};

export default function CertificateCategories() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="certificates" className="relative py-28 section-gray">
      <div className="container-wide">

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >

          <h2
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Certificate <span className="gradient-text">Categories</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Fitness is purpose-specific. Our platform matches every assessment to its clinical
            requirements — ensuring every certificate meets the right standard.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {categories.map((cat, i) => {
            const typeData = typeInfo[cat.type as keyof typeof typeInfo];
            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 45 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.22 } }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="group card-white rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-300"
              >
                <Link
                  href={requestHref(cat.purpose)}
                  className="flex flex-col h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                {/* Image */}
                <div className="relative h-44 overflow-hidden flex-shrink-0">
                  <Image
                    src={cat.img}
                    alt={cat.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width:768px) 100vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-black/65" />
                  <div className={`absolute top-3 left-3 w-10 h-10 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                    <cat.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                  </div>
                  <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${cat.badgeColor}`}>
                    {cat.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3
                    className="text-base font-bold text-slate-800 mb-2"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    {cat.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">
                    {cat.desc}
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {cat.examples.map((ex) => (
                      <li key={ex} className="flex items-center gap-2 text-xs text-slate-500">
                        <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${typeData.color} pt-3 border-t border-slate-100`}>
                    <typeData.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{typeData.label}</span>
                  </div>
                  <div
                    className={`mt-3 inline-flex items-center gap-1 text-xs font-bold transition-colors ${
                      hovered === i ? "text-sky-700" : "text-sky-600"
                    }`}
                  >
                    Request this certificate
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
