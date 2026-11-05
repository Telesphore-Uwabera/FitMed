import PublicShell from "@/components/PublicShell";
import SupportInquiryForm from "@/components/SupportInquiryForm";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Report an Issue",
  description: "Report a FitMed problem: a failed page, a payment that did not complete, or a certificate that verifies incorrectly.",
  path: "/support/report",
});

export default function ReportIssuePage() {
  return (
    <PublicShell>
      <div className="container-wide max-w-3xl space-y-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#12B8B0] mb-3">Report an issue</p>
          <h1 className="text-4xl font-extrabold text-[#0B2D5C] dark:text-white mb-4" style={{ fontFamily: "var(--font-primary)" }}>
            Tell FitMed what went wrong
          </h1>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Use this form for faults and disputes. It is separate from a new certificate request and from doctor or employer onboarding.
          </p>
        </div>
        <ul className="rounded-3xl bg-white dark:bg-[#12253d] p-6 sm:p-8 space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed list-disc pl-10">
          <li>What you were trying to do, and the page address if you have it.</li>
          <li>The certificate number, if the problem is about a document or a payment.</li>
          <li>The approximate time, and whether money left your Mobile Money account.</li>
          <li>Do not include medical history in this message. Clinical questions belong with your doctor inside the consultation.</li>
        </ul>
        <SupportInquiryForm category="report" defaultSubject="Report an issue" />
      </div>
    </PublicShell>
  );
}
