import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PageLayout from "@/components/PageLayout";
import { Shield, Target, Heart, Globe, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About FitMed",
  description: "Learn about FitMed — the digital medical fitness certification platform connecting patients with licensed doctors in Rwanda and beyond.",
};

export default function AboutPage() {
  return (
    <PageLayout title="About FitMed" subtitle="Your health. Verified.">
      <div className="space-y-10">

        {/* Mission */}
        <div className="bg-gradient-to-br from-sky-50 to-teal-50 rounded-3xl p-8 border border-sky-100">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4" style={{ fontFamily: "var(--font-primary)" }}>Our Mission</h2>
          <p className="text-slate-700 text-lg leading-relaxed">
            FitMed exists to make medical fitness certification accessible, trustworthy, and
            efficient — connecting patients with licensed doctors through secure digital assessments
            that produce instantly verifiable certificates.
          </p>
        </div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-5" style={{ fontFamily: "var(--font-primary)" }}>Our Story</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                FitMed was born from a simple observation: obtaining a medical fitness certificate
                in Rwanda — and across East Africa — was time-consuming, paper-heavy, and
                geographically restrictive. Workers in remote areas, students needing clearance
                letters, and employers managing large teams all faced the same bottleneck.
              </p>
              <p>
                We built FitMed to change that. By combining telemedicine, AI decision support,
                and digital certification, we created a platform where a licensed doctor can
                assess a patient anywhere, and issue a certificate that is legally signed,
                instantly verifiable, and privacy-protected.
              </p>
              <p>
                FitMed is a product of MediConnect — Rwanda's broader telemedicine and virtual
                care platform — designed to extend quality healthcare access across the region.
              </p>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/3]">
            <Image
              src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80&auto=format&fit=crop"
              alt="African doctor conducting a telemedicine consultation"
              fill className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8 text-center" style={{ fontFamily: "var(--font-primary)" }}>Our Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Shield,  color: "text-sky-600",     bg: "bg-sky-50",     title: "Clinical Integrity",    desc: "Every certificate is issued by a licensed doctor. AI supports — never replaces — the doctor's decision." },
              { icon: Heart,   color: "text-rose-600",    bg: "bg-rose-50",    title: "Patient Privacy",       desc: "Your medical history is yours. Employers see only what they need — certificate validity, nothing more." },
              { icon: Target,  color: "text-teal-600",    bg: "bg-teal-50",    title: "Purpose-Specific",      desc: "Fitness is assessed for a stated purpose. We match every assessment to its clinical and legal requirements." },
              { icon: Globe,   color: "text-violet-600",  bg: "bg-violet-50",  title: "Accessibility",         desc: "Built for Rwanda and East Africa — accessible from any device, in any location with internet." },
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
                <div className={`w-12 h-12 rounded-2xl ${v.bg} flex items-center justify-center mx-auto mb-4`}>
                  <v.icon className={`w-6 h-6 ${v.color}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-primary)" }}>{v.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-slate-900 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4" style={{ fontFamily: "var(--font-primary)" }}>Ready to get certified?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">Get your medical fitness certificate online — assessed by a licensed doctor, digitally signed, and instantly verifiable.</p>
          <Link
            href="/#request"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white btn-primary shadow-xl shadow-sky-500/25 group"
          >
            Request a Certificate <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-sky-600 transition-colors">Contact</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-sky-600 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </PageLayout>
  );
}
