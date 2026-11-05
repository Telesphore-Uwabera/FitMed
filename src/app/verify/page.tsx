import PublicShell from "@/components/PublicShell";
import VerifySearchForm from "@/components/VerifySearchForm";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";

export const metadata = pageMeta({
  title: "Verify a Certificate",
  description: "Look up a FitMed medical fitness certificate by its document number and see whether it is valid, expired, or not valid.",
  path: "/verify",
});

export default function VerifyIndexPage() {
  return (
    <PublicShell>
      <div className="container-wide max-w-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#12B8B0] mb-3">Public verification</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#0B2D5C] dark:text-white mb-4" style={{ fontFamily: "var(--font-primary)" }}>
          Verify a certificate
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          Enter the number printed on the certificate, or open the link from its QR code. You will see whether that document is valid, expired, or not valid.
        </p>
        <VerifySearchForm />
        <p className="mt-6 text-sm text-slate-500">
          Need a certificate? <Link href="/signup?next=%2Fdashboard%2Fuser%3Ftab%3Drequest" className="font-bold text-[#0d9690]">Request one</Link>
          {" · "}
          <Link href="/pricing" className="font-bold text-[#0d9690]">See the service fee</Link>
        </p>
      </div>
    </PublicShell>
  );
}
