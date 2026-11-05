import PublicShell from "@/components/PublicShell";
import SupportInquiryForm from "@/components/SupportInquiryForm";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";

export const metadata = pageMeta({
  title: "Doctor Support",
  description: "Support for licensed doctors using FitMed: RMDC licence documents, video consultations, and certificate decisions.",
  path: "/support/doctors",
});

export default function DoctorSupportPage() {
  return (
    <PublicShell>
      <div className="container-wide max-w-3xl space-y-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#12B8B0] mb-3">Doctor support</p>
          <h1 className="text-4xl font-extrabold text-[#0B2D5C] dark:text-white mb-4" style={{ fontFamily: "var(--font-primary)" }}>
            Help for doctors
          </h1>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            This page is for licensed clinicians using the FitMed dashboard. Applicants should use the help centre.
          </p>
        </div>
        <ul className="rounded-3xl bg-white dark:bg-[#12253d] p-6 sm:p-8 space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li>Sign in with the doctor account FitMed approved. New clinicians apply from the doctors page and wait for review.</li>
          <li>Your Rwanda Medical and Dental Council licence number and licence document are required before you are listed publicly.</li>
          <li>Open an assigned applicant, complete the consultation, and record the fitness decision yourself. The platform does not issue a certificate without that decision.</li>
          <li>Video rooms are opened from the appointment. If a room will not connect, note the appointment time and applicant name in the message below.</li>
        </ul>
        <p className="text-sm">
          <Link href="/doctors" className="font-bold text-[#0d9690]">Doctor directory</Link>
          {" · "}
          <Link href="/signin" className="font-bold text-[#0d9690]">Doctor sign in</Link>
        </p>
        <SupportInquiryForm category="doctors" defaultSubject="Doctor support" />
      </div>
    </PublicShell>
  );
}
