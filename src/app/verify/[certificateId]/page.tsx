import PublicShell from "@/components/PublicShell";
import VerifyResult from "@/components/VerifyResult";
import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}): Promise<Metadata> {
  const { certificateId } = await params;
  return pageMeta({
    title: `Verify ${certificateId}`,
    description: "Check whether a FitMed certificate is valid, expired, or not valid. Medical history is not shown.",
    path: `/verify/${encodeURIComponent(certificateId || "")}`,
  });
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  return (
    <PublicShell>
      <VerifyResult certificateId={certificateId} />
    </PublicShell>
  );
}
