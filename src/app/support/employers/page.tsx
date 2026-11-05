import PublicShell from "@/components/PublicShell";
import SupportInquiryForm from "@/components/SupportInquiryForm";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";

export const metadata = pageMeta({
  title: "Employer Support",
  description: "How employers confirm a FitMed certificate: public verification, what you can see, and how to ask for an organisational account.",
  path: "/support/employers",
});

export default function EmployerSupportPage() {
  return (
    <PublicShell>
      <div className="container-wide max-w-3xl space-y-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#12B8B0] mb-3">Employer support</p>
          <h1 className="text-4xl font-extrabold text-[#0B2D5C] dark:text-white mb-4" style={{ fontFamily: "var(--font-primary)" }}>
            Help for employers
          </h1>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Employers confirm certificate status. They do not receive the applicant’s medical history, questionnaire, or consultation notes.
          </p>
        </div>
        <ul className="rounded-3xl bg-white dark:bg-[#12253d] p-6 sm:p-8 space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li>Ask the applicant for the certificate number or scan the QR code on the document.</li>
          <li>Open the public verification page. A current certificate shows as valid, with purpose and expiry. An old one shows as expired.</li>
          <li>A result of “not valid” means that number is not an issued FitMed certificate you can rely on.</li>
          <li>For several staff, or a company record of checks, send the organisation name and a contact email below. FitMed will reply about an employer arrangement. There is no separate employer sign-up on this site yet.</li>
        </ul>
        <p className="text-sm">
          <Link href="/verify" className="font-bold text-[#0d9690]">Verify a certificate</Link>
          {" · "}
          <Link href="/pricing" className="font-bold text-[#0d9690]">Service fee</Link>
        </p>
        <SupportInquiryForm category="employers" defaultSubject="Employer support" />
      </div>
    </PublicShell>
  );
}
