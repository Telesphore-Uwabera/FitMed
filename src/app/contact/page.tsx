import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Mail, Phone, MapPin, Clock, MessageCircle, Stethoscope, Building2, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — FitMed",
  description: "Get in touch with FitMed — patient support, doctor support, employer support, and general enquiries.",
};

const contacts = [
  {
    id: "general",
    icon: Mail,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    title: "General Enquiries",
    email: "hello@fitmed.rw",
    desc: "Questions about the platform, certificates, or anything else.",
  },
  {
    id: "doctors",
    icon: Stethoscope,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    title: "Doctor Support",
    email: "doctors@fitmed.rw",
    desc: "Support for licensed doctors using the FitMed clinical dashboard.",
  },
  {
    id: "employers",
    icon: Building2,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    title: "Employer Support",
    email: "employers@fitmed.rw",
    desc: "Help with employer accounts, bulk assessments, and certificate verification.",
  },
  {
    id: "report",
    icon: AlertCircle,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    title: "Report an Issue",
    email: "support@fitmed.rw",
    desc: "Report platform issues, security concerns, or certificate disputes.",
  },
  {
    id: "privacy",
    icon: MessageCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Privacy & Data",
    email: "privacy@fitmed.rw",
    desc: "Data access requests, privacy concerns, or consent withdrawals.",
  },
  {
    id: "legal",
    icon: Mail,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    title: "Legal & Compliance",
    email: "legal@fitmed.rw",
    desc: "Legal enquiries, compliance questions, and regulatory matters.",
  },
];

export default function ContactPage() {
  return (
    <PageLayout
      title="Contact Us"
      subtitle="We're here to help — reach the right team directly."
    >
      <div className="space-y-10">

        {/* Quick info bar */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock,   label: "Response Time", value: "Within 24 hours" },
            { icon: Phone,   label: "Phone",         value: "+250 700 000 000" },
            { icon: MapPin,  label: "Address",       value: "Kigali, Rwanda"  },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-sky-600" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {contacts.map((c) => (
            <div key={c.id} id={c.id} className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden`}>
              <div className={`flex items-center gap-3 px-6 py-5 ${c.bg} border-b ${c.border}`}>
                <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
                  <c.icon className={`w-4.5 h-4.5 ${c.color}`} strokeWidth={1.5} />
                </div>
                <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-primary)" }}>
                  {c.title}
                </h2>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">{c.desc}</p>
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {c.email}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Physical address */}
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-5" style={{ fontFamily: "var(--font-primary)" }}>
            Office Address
          </h2>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-sky-600" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800 mb-1">FitMed — A MediConnect Product</div>
              <div className="text-sm text-slate-500 leading-relaxed">
                Kigali, Rwanda<br />
                <a href="mailto:hello@fitmed.rw" className="text-sky-600 hover:underline">hello@fitmed.rw</a><br />
                <a href="tel:+250700000000" className="text-sky-600 hover:underline">+250 700 000 000</a>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-sky-600 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-sky-600 transition-colors">Terms of Service</Link>
        </p>
      </div>
    </PageLayout>
  );
}
