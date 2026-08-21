"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandSelect from "@/components/BrandSelect";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Stethoscope,
  Building2,
  AlertCircle,
  ShieldCheck,
  Send,
  CheckCircle2,
} from "lucide-react";

const contactDepartments = [
  {
    id: "general",
    icon: Mail,
    color: "text-[#12B8B0]",
    badgeBg: "bg-teal-50 border-teal-200 text-teal-800",
    title: "General Enquiries",
    email: "hello@fitmed.rw",
    desc: "General questions about the FitMed platform, certificate verification, or platform access.",
  },
  {
    id: "doctors",
    icon: Stethoscope,
    color: "text-sky-500",
    badgeBg: "bg-sky-50 border-sky-200 text-sky-800",
    title: "Doctor & Clinical Support",
    email: "doctors@fitmed.rw",
    desc: "Support for licensed doctors using FitMed video consultations and applicant reviews.",
  },
  {
    id: "employers",
    icon: Building2,
    color: "text-indigo-500",
    badgeBg: "bg-indigo-50 border-indigo-200 text-indigo-800",
    title: "Employer & Corporate Support",
    email: "employers@fitmed.rw",
    desc: "Help with company accounts, staff fitness certificates, and verification for HR teams.",
  },
  {
    id: "report",
    icon: AlertCircle,
    color: "text-rose-500",
    badgeBg: "bg-rose-50 border-rose-200 text-rose-800",
    title: "Report an Issue",
    email: "support@fitmed.rw",
    desc: "Report platform technical issues, urgent certificate disputes, or clinical referral queries.",
  },
  {
    id: "privacy",
    icon: MessageCircle,
    color: "text-emerald-500",
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
    title: "Privacy & Data Protection",
    email: "privacy@fitmed.rw",
    desc: "Questions about how we protect your health information, or requests about your personal data.",
  },
  {
    id: "legal",
    icon: ShieldCheck,
    color: "text-amber-500",
    badgeBg: "bg-amber-50 border-amber-200 text-amber-800",
    title: "Legal & Regulatory Compliance",
    email: "legal@fitmed.rw",
    desc: "Questions about regulations, doctor licensing, or legal documents.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    organization: "",
    category: "general",
    subject: "General Certificate Enquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    const params = new URLSearchParams(window.location.search);
    const subjectParam = params.get("subject");
    const hashToSubject: Record<string, string> = {
      doctors: "Doctor Network Application",
      employers: "Employer Corporate Account (5,000 FRW)",
      report: "Technical support",
      privacy: "Others",
      legal: "Others",
    };
    setFormData((prev) => ({
      ...prev,
      category: hash && contactDepartments.some((d) => d.id === hash) ? hash : prev.category,
      subject: subjectParam || hashToSubject[hash] || prev.subject,
    }));
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(
          `Thank you ${formData.fullName}! Your message is in the FitMed inbox and a confirmation email was sent to you.`
        );
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          organization: "",
          category: "general",
          subject: "General Certificate Enquiry",
          message: "",
        });
      } else {
        setSubmitError(data.error || "Could not send your message. Please try again.");
      }
    } catch {
      setSubmitError("Could not reach FitMed. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50 flex flex-col justify-between">
      {/* Shared Navbar */}
      <Navbar />

      {/* ── HERO SECTION — Full bleed brand navy ────────────────── */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 bg-[#0B2D5C] text-white overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#12B8B0]/15 rounded-full blur-[150px] pointer-events-none" />

        <div className="container-wide relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              We're Here to{" "}
              <span className="bg-gradient-to-r from-[#12B8B0] via-[#1dd9d0] to-[#12B8B0] bg-clip-text text-transparent">
                Help You.
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Connect directly with our applicant care team, clinical operations leads, or corporate support specialists.
            </p>
          </div>
        </div>
      </section>

      {/* ── QUICK CONTACT INFO BAR ───────────────────────────── */}
      <section className="py-6 sm:py-12 bg-[#f4f7fb] border-b border-slate-200">
        <div className="container-wide">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-[#12B8B0] flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Response Time</div>
                <div className="text-base font-extrabold text-[#0B2D5C] mt-0.5">Within 2 Hours</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direct Hotline</div>
                <div className="text-base font-extrabold text-[#0B2D5C] mt-0.5">+250 788 000 000</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</div>
                <div className="text-base font-extrabold text-[#0B2D5C] mt-0.5">Kigali, Rwanda</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPARTMENT CONTACT CARDS ──────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
              Reach the Dedicated Department
            </h2>
            <p className="text-slate-600 text-base">
              Select the appropriate contact channel for rapid assistance from our clinical or technical team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {contactDepartments.map((dept) => (
              <div
                key={dept.id}
                id={dept.id}
                className="bg-slate-50 rounded-3xl border border-slate-200 p-4 sm:p-8 flex flex-col justify-between hover:border-[#12B8B0] hover:shadow-lg transition-all duration-300 group scroll-mt-28"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <dept.icon className={`w-6 h-6 ${dept.color}`} />
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${dept.badgeBg}`}>
                      {dept.title}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                    {dept.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {dept.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200">
                  <a
                    href={`mailto:${dept.email}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#12B8B0] hover:text-[#0d9690] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{dept.email}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

              {/* ── PHYSICAL LOCATION & DIRECT CONTACT FORM ── */}
      <section className="py-20 lg:py-28 bg-[#f4f7fb]">
        <div className="container-wide">
          <div className="bg-[#0B2D5C] rounded-3xl p-3 sm:p-8 lg:p-12 text-white border border-[#12B8B0]/30 shadow-2xl relative overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12B8B0]/15 border border-[#12B8B0]/30 text-[#12B8B0] text-xs font-bold uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  Headquarters & Regional Operations
                </div>

                <h2 className="text-3xl font-extrabold text-white" style={{ fontFamily: "var(--font-primary)" }}>
                  FitMed Technology Headquarters
                </h2>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  FitMed is a digital medical fitness certification platform connecting applicants with licensed doctors through secure video consultations.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#12B8B0]" />
                    <span>Fixed General Service Rate: <strong>5,000 FRW</strong> per assessment</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#12B8B0]" />
                    <span>Automatic email confirmation & admin inquiry queue</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-[#12B8B0]" />
                    <span>Kigali, Rwanda · East Africa Virtual Health Operations</span>
                  </div>
                </div>
              </div>

              {/* Direct Message Form */}
              <div className="bg-slate-900/90 rounded-2xl p-3 sm:p-7 border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-primary)" }}>
                  Send Us a Direct Message
                </h3>

                {submitSuccess && (
                  <div className="p-4 rounded-xl bg-teal-900/60 border border-[#12B8B0] text-xs text-teal-200 font-semibold space-y-1">
                    <div className="flex items-center gap-2 font-bold text-[#12B8B0]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Message sent</span>
                    </div>
                    <p>{submitSuccess}</p>
                  </div>
                )}
                {submitError && (
                  <div className="p-4 rounded-xl bg-rose-900/40 border border-rose-400 text-xs text-rose-100 font-semibold">
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Your Full Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Jean Paul Habimana"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Your Email</label>
                      <input
                        required
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        placeholder="+250 788 000 000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Subject / Enquiry Category</label>
                    <BrandSelect
                      value={formData.subject}
                      onChange={(subject) => setFormData({ ...formData, subject })}
                      options={[
                        "General Certificate Enquiry",
                        "Doctor Network Application",
                        "Employer Corporate Account (5,000 FRW)",
                        "In-Person Partner Clinic Referral",
                        "Technical support",
                        "Others",
                      ]}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Message</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we help you?"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl font-bold text-[#0B2D5C] bg-[#12B8B0] hover:bg-[#1dd9d0] text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-75"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? "Sending & saving..." : "Submit Message"}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shared CTA component */}

      {/* Shared Footer */}
      <Footer />
    </main>
  );
}
