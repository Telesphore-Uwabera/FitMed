import PublicShell from "@/components/PublicShell";
import SupportInquiryForm from "@/components/SupportInquiryForm";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { IREMBO_FEE_RWF } from "@/lib/iremboPay";
import { CERTIFICATE_VALIDITY_MONTHS } from "@/lib/fitmedServices";

export const metadata = pageMeta({
  title: "Help Centre",
  description: "Answers for FitMed applicants: how to request a certificate, what it costs, how long it lasts, and where to get doctor or employer help.",
  path: "/help",
});

const topics = [
  {
    href: "/support/doctors",
    title: "Doctor support",
    body: "Licensing, video consultations, and the clinical dashboard.",
  },
  {
    href: "/support/employers",
    title: "Employer support",
    body: "How organisations confirm a certificate without seeing medical history.",
  },
  {
    href: "/support/report",
    title: "Report an issue",
    body: "Something failed, a certificate looks wrong, or a payment did not complete.",
  },
];

const answers = [
  {
    q: "How do I request a certificate?",
    a: "Create an applicant account, choose the certificate purpose, and complete the health questions. A licensed doctor reviews the file and meets you by video before deciding.",
  },
  {
    q: "What does it cost?",
    a: `The published FitMed service fee is ${IREMBO_FEE_RWF.toLocaleString("en-US")} FRW per assessment. It is collected after a doctor approves a certificate that can be issued.`,
  },
  {
    q: "How long is a certificate valid?",
    a: `Issued certificates are valid for ${CERTIFICATE_VALIDITY_MONTHS} months. After that date the public verification page shows the certificate as expired.`,
  },
  {
    q: "How does someone check my certificate?",
    a: "They open the QR link or go to the Verify page and enter the document number. The result is valid, expired, or not valid. Clinical notes are not on that page.",
  },
];

export default function HelpPage() {
  return (
    <PublicShell>
      <div className="container-wide max-w-4xl space-y-10">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#12B8B0] mb-3">Help centre</p>
          <h1 className="text-4xl font-extrabold text-[#0B2D5C] dark:text-white mb-4" style={{ fontFamily: "var(--font-primary)" }}>
            Help for applicants
          </h1>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Start here if you are requesting a certificate. Doctors and employers have their own support pages.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <Link key={topic.href} href={topic.href} className="rounded-3xl bg-white dark:bg-[#12253d] p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="font-extrabold text-[#0B2D5C] dark:text-white mb-2">{topic.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{topic.body}</p>
            </Link>
          ))}
        </div>

        <div className="space-y-4">
          {answers.map((item) => (
            <article key={item.q} className="rounded-3xl bg-white dark:bg-[#12253d] p-6 shadow-sm">
              <h2 className="font-extrabold text-[#0B2D5C] dark:text-white mb-2">{item.q}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
            </article>
          ))}
        </div>

        <SupportInquiryForm category="general" defaultSubject="Help centre question" />
      </div>
    </PublicShell>
  );
}
