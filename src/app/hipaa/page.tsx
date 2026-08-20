import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Shield, Lock, Eye, Server, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "HIPAA Notice — FitMed",
  description: "FitMed HIPAA-aligned security notice — how we protect your health information.",
};

export default function HipaaPage() {
  return (
    <PageLayout title="HIPAA Notice" subtitle="How we protect your health information" lastUpdated="19 August 2026">
      <div className="space-y-8">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-7">
          <p className="text-slate-700 leading-relaxed">
            FitMed is operated in Rwanda and is primarily governed by Rwandan health, data-protection,
            and telemedicine law. While HIPAA (the US Health Insurance Portability and Accountability Act)
            does not directly apply as Rwandan law, FitMed voluntarily aligns its security architecture
            with HIPAA standards as a global best-practice framework for health data protection.
          </p>
        </div>

        {[
          { icon: Shield,  color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100",     title: "Protected Health Information (PHI)", body: "FitMed treats all health data collected during assessments as sensitive personal data requiring the highest level of protection. This includes medical history, vital signs, questionnaire responses, consultation notes, and certificate records. PHI is never sold, rented, or traded." },
          { icon: Lock,    color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-100",    title: "Technical Safeguards", body: "All health data is encrypted in transit using TLS 1.3+ and at rest using AES-256. Access to PHI is controlled through role-based access management. All data access events are logged in tamper-evident audit trails. Video consultations are end-to-end encrypted." },
          { icon: Eye,     color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100",  title: "Minimum Necessary Principle", body: "FitMed applies the minimum necessary standard: each user role accesses only the data required for their function. Employers see certificate validity only. Doctors see only assigned applicant data. Administrators access only what is required for platform operation." },
          { icon: Server,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", title: "Physical & Administrative Safeguards", body: "FitMed infrastructure is hosted in data centres with physical access controls, CCTV, and environmental monitoring. Our administrative policies include staff training, background checks, and documented incident response procedures." },
        ].map((s) => (
          <div key={s.title} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`flex items-center gap-3 px-7 py-5 ${s.bg} border-b ${s.border}`}>
              <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-primary)" }}>{s.title}</h2>
            </div>
            <div className="p-7"><p className="text-sm text-slate-600 leading-relaxed">{s.body}</p></div>
          </div>
        ))}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-7 py-5 bg-sky-50 border-b border-sky-100">
            <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-primary)" }}>Your Rights</h2>
          </div>
          <div className="p-7">
            <ul className="space-y-3">
              {[
                "Right to access your health information held by FitMed",
                "Right to request correction of inaccurate personal data",
                "Right to request deletion of your data (subject to legal retention obligations)",
                "Right to receive a copy of your data in a portable format",
                "Right to withdraw consent for non-essential data processing",
                "Right to be notified in the event of a data breach affecting your information",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-3" style={{ fontFamily: "var(--font-primary)" }}>Contact Our Privacy Team</h2>
          <div className="space-y-1.5 text-sm text-slate-600">
            <div><strong className="text-slate-800">Email:</strong>{" "}<a href="mailto:privacy@fitmed.rw" className="text-sky-600 hover:underline">privacy@fitmed.rw</a></div>
            <div><strong className="text-slate-800">Address:</strong> Kigali, Rwanda</div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/" className="hover:text-sky-600">Home</Link><span>·</span>
          <Link href="/privacy" className="hover:text-sky-600">Privacy Policy</Link><span>·</span>
          <Link href="/hipaa" className="text-sky-600 font-medium">HIPAA Notice</Link>
        </p>
      </div>
    </PageLayout>
  );
}
