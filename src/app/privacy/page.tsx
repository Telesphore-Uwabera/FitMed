import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Shield, Lock, Eye, FileCheck, Server, BookOpen,
  ArrowLeft, Key, AlertCircle, CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — FitMed",
  description:
    "FitMed Privacy Policy: How we collect, use, protect, and secure your personal and health information.",
};

/* ── Policy sections 1-6 ─────────────────────────────────────────── */
const policySections = [
  {
    icon: Eye,
    title: "1. Information We Collect",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    content: [
      { heading: "1.1 Identity & Demographic Information",   text: "When you create an account, we collect your full name, date of birth, sex, phone number, email address, physical address, national ID or passport information, emergency contact details, and required consent declarations." },
      { heading: "1.2 Medical & Health Information",         text: "To conduct your medical fitness assessment, we collect health-related information including your medical history (previous illnesses, conditions, medications, allergies, family history, surgical history), current vital signs and measurements (height, weight, BMI, blood pressure, heart rate, SpO₂, temperature, respiratory rate), and responses to our adaptive health questionnaire. This information is classified as sensitive personal data and handled with the highest level of protection." },
      { heading: "1.3 Device & Wearable Data",              text: "If you connect a wearable device or health platform (Apple Health, Google Health Connect, Fitbit, Garmin, Samsung Health, Bluetooth medical devices), we collect measurement data from those devices. All device-sourced data is clearly labelled with its source and timestamp." },
      { heading: "1.4 Technical Information",               text: "We collect standard technical data including IP address, browser type and version, operating system, device identifiers, session data, and usage logs. This data is used solely for security, performance, and compliance purposes." },
      { heading: "1.5 AI-Estimated Measurements",           text: "Where smartphone camera or remote-PPG technology is used to estimate physiological parameters, such outputs are clearly labelled as AI-estimated or screening measurements. These are not used as standalone clinical data." },
    ],
  },
  {
    icon: FileCheck,
    title: "2. How We Use Your Information",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
    content: [
      { heading: "2.1 Conducting Your Medical Assessment",  text: "Your health information is used to conduct your medical fitness assessment, facilitate your video consultation with a licensed doctor, and issue your digitally signed certificate." },
      { heading: "2.2 Certificate Verification",           text: "Your certificate information (excluding medical details) is stored to enable QR code and online verification by authorised parties." },
      { heading: "2.3 Platform Improvement",               text: "Anonymised and aggregated data may be used to improve our platform, assessment quality, and clinical pathways. This data cannot be used to identify individual users." },
      { heading: "2.4 Legal & Regulatory Compliance",      text: "We process your data as required by applicable Rwandan health, telemedicine, data-protection, and electronic-signature legislation." },
    ],
  },
  {
    icon: Shield,
    title: "3. Data Sharing",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    content: [
      { heading: "3.1 With Doctors",                        text: "Your health information is shared with the licensed doctor assigned to conduct your assessment. Doctors are bound by professional and legal confidentiality obligations." },
      { heading: "3.2 With Employers & Organisations",      text: "Employers or organisations that request or verify your certificate are shown only the certificate validity status, issue and expiry dates, certificate purpose, and certificate number. Your full medical history, diagnoses, clinical notes, and other health information are never shared with employers." },
      { heading: "3.3 With Third-Party Processors",         text: "We may share data with trusted third-party processors (such as cloud storage, video consultation, and payment providers) strictly under data processing agreements that require them to protect your data in accordance with this policy." },
      { heading: "3.4 Legal Requirements",                  text: "We may disclose data where required by applicable Rwandan law, court order, or regulatory requirement. We will notify you where legally permitted to do so." },
      { heading: "3.5 No Sale of Data",                    text: "FitMed does not sell, rent, or trade your personal or health information to any third party under any circumstances." },
    ],
  },
  {
    icon: Server,
    title: "4. Data Retention",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    content: [
      { heading: "4.1 Retention Periods",  text: "We retain your medical assessment data and issued certificates for the period required by applicable Rwandan health and medical records legislation, and for as long as necessary to provide certificate verification services." },
      { heading: "4.2 Deletion",           text: "You may request deletion of your personal data by contacting us at privacy@fitmed.rw. Deletion requests will be processed within 30 days, subject to any legal retention obligations. Certificate records required for ongoing validity verification may be retained in a minimised form." },
    ],
  },
  {
    icon: BookOpen,
    title: "5. Your Rights",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    content: [
      { heading: "5.1 Access",              text: "You have the right to access the personal and health information we hold about you. Submit an access request to privacy@fitmed.rw." },
      { heading: "5.2 Correction",          text: "You have the right to correct inaccurate personal information. Contact us at privacy@fitmed.rw." },
      { heading: "5.3 Erasure",             text: "Subject to legal retention obligations, you have the right to request deletion of your personal data." },
      { heading: "5.4 Portability",         text: "You have the right to receive a copy of your personal data in a structured, commonly used, machine-readable format." },
      { heading: "5.5 Objection",           text: "You have the right to object to certain processing activities and to request restriction of processing in certain circumstances." },
      { heading: "5.6 Withdraw Consent",    text: "Where processing is based on your consent, you have the right to withdraw consent at any time. Withdrawal does not affect the lawfulness of processing prior to withdrawal." },
    ],
  },
];

/* ── Security pillars (from the removed TrustSecurity component) ─── */
const securityPillars = [
  { icon: Lock,        title: "End-to-End Encryption",         color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100",     desc: "All health data, consultations, and certificates are encrypted in transit using TLS 1.3+ and at rest using AES-256." },
  { icon: Eye,         title: "Minimal Data Disclosure",        color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-100",    desc: "Employers see only certificate validity. Medical history stays private between applicant and doctor at all times." },
  { icon: FileCheck,   title: "Full Audit Trail",               color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-100",  desc: "Every certificate is fully traceable from applicant submission through doctor review, decision, signature, and issuance." },
  { icon: Key,         title: "Role-Based Access Control",      color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   desc: "Applicants, doctors, employers, and admins each see only what they are permitted to access. No over-sharing." },
  { icon: Server,      title: "Secure Data Storage",            color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", desc: "Medical data is stored with HIPAA-compliant security, with defined data retention and deletion policies." },
  { icon: AlertCircle, title: "Incident Response",              color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100",    desc: "Dedicated incident response procedures with transparent communication to affected users and relevant authorities." },
  { icon: Shield,      title: "Doctor Credential Verification", color: "text-sky-600",     bg: "bg-sky-50",     border: "border-sky-100",     desc: "All doctors are vetted — licence number verification, specialty confirmation, and ongoing quality monitoring." },
  { icon: BookOpen,    title: "Rwandan Regulatory Compliance",  color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-100",    desc: "Built in compliance with Rwandan health, telemedicine, data-protection, and electronic-signature requirements." },
];

const securityBadges = [
  "HIPAA Compliant",
  "TLS 1.3 Encrypted",
  "AES-256 at Rest",
  "Full Audit Logged",
  "Role-Based Access",
  "GDPR-Aligned",
  "Doctor Vetting",
  "Rwandan Regulatory Compliance",
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Dark header ─────────────────────────────────────── */}
      <header className="bg-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to FitMed
          </Link>

          <div className="flex items-center gap-5 mb-5">
            <div className="relative flex-shrink-0" style={{ width: 160, height: 56 }}>
              <Image src="/logo-4.webp" alt="FitMed" fill className="object-contain" />
            </div>
          </div>

          <h1
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Privacy Policy
          </h1>
          <p className="text-slate-400">
            Last updated:{" "}
            <strong className="text-slate-300">19 August 2026</strong>
            {" · "}Effective: 19 August 2026
          </p>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-8 sm:py-16">

        {/* Intro */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-7 mb-14">
          <p className="text-slate-700 leading-relaxed mb-4">
            FitMed (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting
            the privacy and security of your personal and health information. This Privacy Policy explains
            how we collect, use, share, and protect your information when you use the FitMed digital
            medical fitness certification platform. By using FitMed, you agree to the practices described
            in this policy.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Because FitMed processes health data — which is sensitive personal data — we apply the
            strictest standards of data protection, in compliance with applicable Rwandan health,
            telemedicine, data-protection, electronic-signature, and professional licensing requirements.
          </p>
        </div>

        {/* ── Policy sections 1-5 ─────────────────────────── */}
        <div className="space-y-8 mb-14">
          {policySections.map((section) => (
            <section
              key={section.title}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className={`flex items-center gap-3 px-7 py-5 ${section.bg} border-b ${section.border}`}>
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <section.icon className={`w-5 h-5 ${section.color}`} strokeWidth={1.5} />
                </div>
                <h2
                  className="text-lg font-bold text-slate-900"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  {section.title}
                </h2>
              </div>
              <div className="p-7 space-y-5">
                {section.content.map((item) => (
                  <div key={item.heading}>
                    <h3
                      className="text-sm font-bold text-slate-800 mb-1.5"
                      style={{ fontFamily: "var(--font-primary)" }}
                    >
                      {item.heading}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════
            SECTION 6 — SECURITY MEASURES
            (Content moved from the main page TrustSecurity section)
        ════════════════════════════════════════════════════ */}
        <section className="mb-14 overflow-hidden rounded-3xl border border-slate-200 shadow-sm">

          {/* Section header */}
          <div className="flex items-center gap-3 px-7 py-5 bg-emerald-50 border-b border-emerald-100">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
              <Lock className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
            </div>
            <h2
              className="text-lg font-bold text-slate-900"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              6. Security Measures
            </h2>
          </div>

          <div className="bg-white p-7">

            {/* Intro text */}
            <p className="text-slate-600 text-sm leading-relaxed mb-7">
              Medical data requires the highest level of protection. Privacy and security are
              built into our architecture from day one — not added as an afterthought. Below is a
              full description of the technical and organisational security measures we have in place.
            </p>

            {/* Security badges */}
            <div className="flex flex-wrap gap-2.5 mb-10">
              {securityBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-emerald-200 text-xs font-bold text-emerald-700 shadow-sm"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  {badge}
                </span>
              ))}
            </div>

            {/* Security image */}
            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] mb-10 border border-slate-100 shadow-sm">
              <Image
                src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1200&q=80&auto=format&fit=crop"
                alt="Secure encrypted medical data storage infrastructure"
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 960px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/20 to-transparent flex items-end pb-6 pl-7">
                <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-sm border border-slate-100">
                  <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">256-bit AES Encryption</p>
                    <p className="text-[10px] text-slate-500">Data encrypted at rest &amp; in transit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security pillars grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {securityPillars.map((p) => (
                <div
                  key={p.title}
                  className={`rounded-2xl p-5 border ${p.border} ${p.bg} transition-all group hover:shadow-md`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm`}>
                    <p.icon className={`w-4 h-4 ${p.color}`} strokeWidth={1.5} />
                  </div>
                  <h4
                    className="text-sm font-bold text-slate-800 mb-1.5"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    {p.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            {/* Detailed security writeups */}
            <div className="mt-10 space-y-5 border-t border-slate-100 pt-8">
              <h3
                className="text-base font-bold text-slate-800 mb-5"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Technical Security Details
              </h3>
              {[
                { heading: "6.1 Encryption in Transit",          text: "All data transmitted between your device and FitMed's servers is encrypted using TLS 1.3 or higher. Video consultations are end-to-end encrypted, meaning no third party — including FitMed's infrastructure team — can access the content of your consultation." },
                { heading: "6.2 Encryption at Rest",             text: "All personal and health data stored on FitMed servers is encrypted at rest using AES-256. Encryption keys are managed using industry-standard key management practices with regular rotation." },
                { heading: "6.3 Role-Based Access Control",      text: "Our platform enforces strict role-based access control (RBAC). Applicants can access only their own data. Doctors can access only the applicant data assigned to them for assessment. Employers can access only certificate validity information. Administrators have access only to data required for platform operation and compliance." },
                { heading: "6.4 Audit Logging",                  text: "Every action involving personal or health data is logged with a timestamp, user identifier, and action type. These audit logs are tamper-evident and retained for the period required by applicable law. They enable full traceability from applicant submission through to certificate issuance." },
                { heading: "6.5 Doctor Credential Verification", text: "Before any doctor can access applicant data or conduct assessments on FitMed, their professional licence number, specialty, and credentials are verified against official registries. Doctor performance is monitored on an ongoing basis, and access can be suspended immediately if concerns arise." },
                { heading: "6.6 Incident Response",              text: "FitMed maintains a documented security incident response plan. In the event of a data breach or security incident, we will notify affected users and relevant Rwandan regulatory authorities within the timeframes required by applicable law. All incidents are investigated, documented, and reviewed to prevent recurrence." },
                { heading: "6.7 Vulnerability Management",       text: "We conduct regular security assessments, penetration testing, and vulnerability scans of our platform. Security patches and updates are applied promptly. Our development team follows secure coding practices including input validation, parameterised queries, and code review for security issues." },
                { heading: "6.8 Physical Security",              text: "FitMed's infrastructure is hosted in data centres that maintain ISO 27001 or equivalent physical security certifications, including 24/7 physical access controls, CCTV surveillance, and environmental controls." },
              ].map((item) => (
                <div key={item.heading}>
                  <h4
                    className="text-sm font-bold text-slate-800 mb-1.5"
                    style={{ fontFamily: "var(--font-primary)" }}
                  >
                    {item.heading}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact ─────────────────────────────────────── */}
        <div className="bg-slate-50 rounded-2xl p-7 border border-slate-200">
          <h2
            className="text-lg font-bold text-slate-900 mb-4"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            7. Contact Us
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            For questions, concerns, or requests relating to this Privacy Policy or your personal data,
            please contact us using the details below.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Data Controller",   value: "FitMed" },
              { label: "Privacy Contact",   value: "privacy@fitmed.rw",  href: "mailto:privacy@fitmed.rw" },
              { label: "General Enquiries", value: "hello@fitmed.rw",    href: "mailto:hello@fitmed.rw" },
              { label: "Address",           value: "Kigali, Rwanda" },
            ].map(({ label, value, href }) => (
              <div key={label} className="bg-white rounded-xl p-4 border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
                {href ? (
                  <a href={href} className="text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                    {value}
                  </a>
                ) : (
                  <div className="text-sm font-semibold text-slate-800">{value}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer nav */}
        <p className="text-center text-xs text-slate-400 mt-14 flex flex-wrap justify-center gap-3">
          <span>© {new Date().getFullYear()} FitMed. All rights reserved.</span>
          <span className="text-slate-300">·</span>
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span className="text-slate-300">·</span>
          <Link href="/cookies" className="hover:text-sky-600 transition-colors">Cookie Policy</Link>
          <span className="text-slate-300">·</span>
          <Link href="/privacy" className="text-sky-600 font-medium">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
