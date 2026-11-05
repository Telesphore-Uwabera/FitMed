import PublicShell from "@/components/PublicShell";
import Pricing from "@/components/Pricing";
import { newApplicantHref } from "@/lib/applicantLinks";
import { IREMBO_FEE_RWF } from "@/lib/iremboPay";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";

export const metadata = pageMeta({
  title: "Pricing",
  description: `FitMed charges ${IREMBO_FEE_RWF.toLocaleString("en-US")} FRW per medical fitness assessment, including doctor review and a verifiable digital certificate.`,
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <PublicShell>
      <Pricing />
      <div className="container-wide max-w-3xl -mt-10 pb-4 text-center">
        <Link
          href={newApplicantHref()}
          className="inline-flex items-center justify-center rounded-2xl bg-[#0B2D5C] px-6 py-3 text-sm font-extrabold text-white"
        >
          Request a certificate
        </Link>
      </div>
    </PublicShell>
  );
}
