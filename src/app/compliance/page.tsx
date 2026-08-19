import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Compliance — FitMed",
  description: "FitMed regulatory compliance — Rwandan health law, telemedicine, data protection, and electronic signature requirements.",
};

const frameworks = [
  { color: "bg-sky-50 border-sky-100", heading: "bg-sky-50 border-sky-100", title: "Rwandan Health Law", items: ["Ministry of Health telemedicine guidelines", "Medical practice and licensing requirements", "Occupational health standards", "Professional medical certification rules"] },
  { color: "bg-teal-50 border-teal-100", heading: "bg-teal-50 border-teal-100", title: "Data Protection", items: ["Rwanda Data Protection Act", "Patient consent and data minimisation", "Right to access, correct, and delete data", "Data retention and deletion policies"] },
  { color: "bg-violet-50 border-violet-100", heading: "bg-violet-50 border-violet-100", title: "Electronic Signatures", items: ["Rwanda Electronic Transactions Act", "Qualified electronic signatures by licensed doctors", "Certificate authenticity and non-repudiation", "Legally binding digital issuance"] },
  { color: "bg-emerald-50 border-emerald-100", heading: "bg-emerald-50 border-emerald-100", title: "International Standards", items: ["HIPAA-aligned data security architecture", "ISO 27001-compatible controls", "GDPR-aligned data subject rights", "WHO telemedicine guidelines"] },
];

export default function CompliancePage() {
  return (
    <PageLayout
      title="Compliance"
      subtitle="Our regulatory and standards framework"
      lastUpdated="19 August 2026"
    >
      <div className="space-y-8">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-7">
          <p className="text-slate-700 leading-relaxed">
            FitMed is built in full compliance with applicable Rwandan health, telemedicine,
            data-protection, electronic-signature, and professional licensing requirements.
            This page outlines the regulatory frameworks we operate under.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {frameworks.map((f) => (
            <div key={f.title} className={`rounded-3xl border overflow-hidden bg-white border-slate-100 shadow-sm`}>
              <div className={`px-7 py-5 border-b ${f.heading}`}>
                <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-primary)" }}>{f.title}</h2>
              </div>
              <ul className="p-6 space-y-3">
                {f.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-primary)" }}>Pre-Launch Legal Review</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Before launching each certificate category, FitMed conducts a legal and clinical review covering:
          </p>
          <ul className="space-y-2">
            {["Occupational fitness categories and telemedicine eligibility", "Electronic medical certificates and digital signature validity", "Remote clinical assessment limitations", "Identity verification and biometric technology regulations", "AI-assisted measurement labelling requirements", "Cross-border telemedicine use"].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-3" style={{ fontFamily: "var(--font-primary)" }}>Compliance Enquiries</h2>
          <p className="text-sm text-slate-600 mb-3">For compliance and regulatory questions:</p>
          <div className="space-y-1.5 text-sm text-slate-600">
            <div><strong className="text-slate-800">Email:</strong>{" "}<a href="mailto:compliance@fitmed.rw" className="text-sky-600 hover:underline">compliance@fitmed.rw</a></div>
            <div><strong className="text-slate-800">Address:</strong> Kigali, Rwanda</div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-sky-600 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-sky-600 transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link href="/compliance" className="text-sky-600 font-medium">Compliance</Link>
        </p>
      </div>
    </PageLayout>
  );
}
