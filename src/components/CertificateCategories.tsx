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
    // African businessman at modern office — employment fitness context
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=900&q=85&auto=format&fit=crop",
    position: "object-center",
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
    position: "object-[center_10%]",
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
    img: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80&auto=format&fit=crop",
    position: "object-center",
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
    position: "object-top",
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
    // African woman jogging / running outdoors — health & fitness
    img: "https://images.unsplash.com/photo-1594882645126-14020914d58d?w=900&q=85&auto=format&fit=crop",
    position: "object-center",
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
    position: "object-top",
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
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-5 badge-primary">
            Clearance Categories
          </span>
          <h2
            className="text-4xl md:text-5xl font-extrabold text-[#0B2D5C] dark:text-white mb-5"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Clearance <span className="gradient-text">Categories</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Every certificate purpose has tailored clinical assessments — understand which clearance pathway applies to you.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {categories.map((cat, i) => {
            const typeData = typeInfo[cat.type as keyof typeof typeInfo];
            return (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="group card-white rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-300"
              >
                <Link
                  href={requestHref(cat.purpose)}
                  className="flex flex-col h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                {/* Image with generous height and proper object-position so subjects are never cut */}
                <div className="relative h-60 sm:h-64 overflow-hidden flex-shrink-0">
                  <Image
                    src={cat.img}
                    alt={cat.title}
                    fill
                    className={`object-cover ${cat.position || "object-top"} group-hover:scale-105 transition-transform duration-700`}
                    sizes="(max-width:768px) 100vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/25" />
                  <div className={`absolute top-4 left-4 w-11 h-11 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                    <cat.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                  </div>
                  <span className={`absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full ${cat.badgeColor} shadow-md`}>
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
