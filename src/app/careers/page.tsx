import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Briefcase, Heart, Globe, Zap, ArrowRight, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers — FitMed",
  description: "Join the FitMed team — help build Rwanda's leading digital medical fitness certification platform.",
};

const openRoles = [
  { title: "Senior Full-Stack Developer", dept: "Engineering", type: "Full-time · Remote", desc: "Build and scale the FitMed platform using Next.js, TypeScript, and modern cloud infrastructure." },
  { title: "Product Designer (UI/UX)", dept: "Design", type: "Full-time · Kigali / Remote", desc: "Design intuitive clinical and patient experiences that make medical certification simple and beautiful." },
  { title: "Clinical Operations Manager", dept: "Medical", type: "Full-time · Kigali", desc: "Manage the FitMed doctor network, quality control processes, and clinical compliance." },
  { title: "Business Development Manager", dept: "Growth", type: "Full-time · Kigali", desc: "Drive employer and institutional partnerships across Rwanda and East Africa." },
  { title: "Customer Success Specialist", dept: "Support", type: "Full-time · Kigali", desc: "Support patients, doctors, and employers using the FitMed platform." },
];

export default function CareersPage() {
  return (
    <PageLayout title="Careers" subtitle="Build the future of healthcare certification with us">
      <div className="space-y-10">

        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-7">
          <p className="text-slate-700 leading-relaxed">
            FitMed is growing fast. We are building Rwanda's leading digital medical fitness
            certification platform and we need passionate, talented people to join us. We offer
            meaningful work, competitive compensation, and the opportunity to impact healthcare
            access across East Africa.
          </p>
        </div>

        {/* Why join */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Heart,   color: "text-rose-600",    bg: "bg-rose-50",    title: "Meaningful Mission",   desc: "Improve healthcare access for millions across East Africa." },
            { icon: Globe,   color: "text-sky-600",     bg: "bg-sky-50",     title: "Remote Friendly",      desc: "Most roles can be done from anywhere. We value impact over hours." },
            { icon: Zap,     color: "text-amber-600",   bg: "bg-amber-50",   title: "Fast Growth",          desc: "Join early and grow with the platform as we expand regionally." },
            { icon: Briefcase, color: "text-teal-600",  bg: "bg-teal-50",    title: "Competitive Pay",      desc: "Fair compensation, equity options, and health benefits." },
          ].map((v) => (
            <div key={v.title} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <div className={`w-11 h-11 rounded-2xl ${v.bg} flex items-center justify-center mx-auto mb-3`}>
                <v.icon className={`w-5.5 h-5.5 ${v.color}`} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5" style={{ fontFamily: "var(--font-primary)" }}>{v.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Open roles */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-primary)" }}>Open Positions</h2>
          <div className="space-y-4">
            {openRoles.map((role) => (
              <div key={role.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start justify-between gap-4 hover:border-sky-200 hover:shadow-md transition-all group">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-primary)" }}>{role.title}</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">{role.dept}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2 font-medium">{role.type}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{role.desc}</p>
                </div>
                <Link href="/contact" className="flex-shrink-0 flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors group-hover:translate-x-0.5 duration-200">
                  Apply <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* General application */}
        <div className="bg-slate-900 rounded-3xl p-8 text-center">
          <Mail className="w-10 h-10 text-sky-400 mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-extrabold text-white mb-3" style={{ fontFamily: "var(--font-primary)" }}>Don't see your role?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">We're always interested in talented people. Send us your CV and a note about what you'd bring to FitMed.</p>
          <a href="mailto:careers@fitmed.rw" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white btn-primary">
            careers@fitmed.rw
          </a>
        </div>

        <p className="text-center text-xs text-slate-400 flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/" className="hover:text-sky-600">Home</Link><span>·</span>
          <Link href="/about" className="hover:text-sky-600">About FitMed</Link><span>·</span>
          <Link href="/contact" className="hover:text-sky-600">Contact</Link>
        </p>
      </div>
    </PageLayout>
  );
}
