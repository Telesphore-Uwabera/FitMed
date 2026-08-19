import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Stethoscope, Video, Brain, FileSignature, CheckCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Doctors — FitMed",
  description: "Join the FitMed doctor network — conduct digital medical fitness assessments and issue certificates through a secure clinical dashboard.",
};

export default function DoctorsPage() {
  return (
    <PageLayout
      title="Our Doctors"
      subtitle="Licensed medical professionals powering every FitMed assessment"
    >
      <div className="space-y-10">

        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-7">
          <p className="text-slate-700 leading-relaxed">
            Every FitMed certificate is issued by an appropriately licensed doctor. Our doctors
            use a purpose-built clinical dashboard to review patient history, conduct live video
            consultations, and digitally sign certificates — all within a single secure platform.
          </p>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-7 py-5 bg-teal-50 border-b border-teal-100">
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-primary)" }}>Doctor Requirements</h2>
          </div>
          <div className="p-7">
            <ul className="space-y-3">
              {[
                "Valid medical licence registered with the Rwanda Medical and Dental Council (RMDC)",
                "Minimum 2 years post-graduation clinical experience",
                "Competency in telemedicine and remote clinical assessment",
                "Completed FitMed clinical onboarding and platform training",
                "Agreement to FitMed's clinical standards and code of conduct",
                "Ongoing quality monitoring and peer review participation",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dashboard features */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-primary)" }}>The Clinical Dashboard</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: Stethoscope, color: "text-sky-600",    bg: "bg-sky-50",    title: "Patient Overview",     desc: "Full history, vitals, medications, and AI-flagged red flags — all before the consultation begins." },
              { icon: Video,       color: "text-teal-600",   bg: "bg-teal-50",   title: "Secure Video Call",    desc: "End-to-end encrypted live video with built-in identity verification workflow." },
              { icon: Brain,       color: "text-violet-600", bg: "bg-violet-50", title: "AI Decision Support",  desc: "AI-generated summaries, risk scoring, and documentation assistance — you stay in clinical control." },
              { icon: FileSignature, color: "text-emerald-600", bg: "bg-emerald-50", title: "Digital Signature", desc: "One-click digitally signed certificate issuance with a full, traceable audit trail." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1" style={{ fontFamily: "var(--font-primary)" }}>{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join CTA */}
        <div className="bg-slate-900 rounded-3xl p-10 text-center">
          <Stethoscope className="w-10 h-10 text-teal-400 mx-auto mb-5" strokeWidth={1.5} />
          <h2 className="text-2xl font-extrabold text-white mb-4" style={{ fontFamily: "var(--font-primary)" }}>Join the FitMed Doctor Network</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">Expand your practice with flexible telemedicine assessments. Apply to join our growing network of licensed doctors.</p>
          <Link
            href="/contact#doctors"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white btn-primary shadow-xl shadow-sky-500/25 group"
          >
            Apply to Join <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span>·</span>
          <Link href="/about" className="hover:text-sky-600 transition-colors">About FitMed</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-sky-600 transition-colors">Contact</Link>
        </p>
      </div>
    </PageLayout>
  );
}
