import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OfficialMedicalCertificate from "@/components/OfficialMedicalCertificate";
import type { CertificateData } from "@/components/OfficialMedicalCertificate";
import { officialDocumentNo, publicApiOrigin } from "@/lib/certificateDisplay";
import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}): Promise<Metadata> {
  const { certificateId } = await params;
  const id = officialDocumentNo(certificateId);
  return pageMeta({
    title: id ? `Verify ${id}` : "Verify Certificate",
    description: id
      ? `Check whether FitMed certificate ${id} is valid. Medical history is never shown on this page.`
      : "Verify a FitMed medical fitness certificate by official document number.",
    path: `/verify/${encodeURIComponent(id || certificateId || "")}`,
  });
}

async function apiOrigin() {
  const configured = publicApiOrigin();
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host.split(",")[0].trim()}` : "https://fitmed-gncf.onrender.com";
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const id = officialDocumentNo(certificateId);

  let data: CertificateData | null = null;
  let loadError = "";
  let notFound = !id;

  if (id) {
    try {
      const origin = await apiOrigin();
      const res = await fetch(`${origin}/api/public/certificates/${encodeURIComponent(id)}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (res.status === 404) {
        notFound = true;
      } else if (!res.ok) {
        loadError = "This certificate could not be opened right now. Please try again in a moment.";
      } else {
        const json = (await res.json()) as { success?: boolean; data?: CertificateData };
        data = json.data || null;
        notFound = !data;
      }
    } catch {
      loadError = "This certificate could not be opened right now. Please try again in a moment.";
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        {loadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
            {loadError}
          </div>
        ) : notFound ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
            No FitMed certificate was found for <strong className="font-mono">{id || "this number"}</strong>.
          </div>
        ) : (
          <OfficialMedicalCertificate data={data as CertificateData} />
        )}
      </main>
      <Footer />
    </div>
  );
}
