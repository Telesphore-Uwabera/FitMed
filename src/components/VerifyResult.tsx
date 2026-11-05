"use client";

import { useEffect, useState } from "react";
import OfficialMedicalCertificate from "@/components/OfficialMedicalCertificate";
import type { CertificateData } from "@/components/OfficialMedicalCertificate";
import VerifySearchForm from "@/components/VerifySearchForm";

type Outcome = "valid" | "invalid" | "expired" | "unavailable" | "checking";

type Result = {
  outcome: Outcome;
  certificateId: string;
  title: string;
  message: string;
  purpose?: string;
  candidateName?: string;
  issueDate?: string;
  expiryDate?: string;
  data?: CertificateData;
};

const tone: Record<string, string> = {
  valid: "border-emerald-200 bg-emerald-50 text-emerald-950",
  expired: "border-amber-200 bg-amber-50 text-amber-950",
  invalid: "border-rose-200 bg-rose-50 text-rose-900",
  unavailable: "border-amber-200 bg-amber-50 text-amber-950",
  checking: "border-slate-200 bg-white text-slate-700",
};

export default function VerifyResult({ certificateId }: { certificateId: string }) {
  const [result, setResult] = useState<Result>({
    outcome: "checking",
    certificateId,
    title: "Checking",
    message: "Checking this certificate…",
  });

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    let cancelled = false;

    fetch(`/api/public/certificates/${encodeURIComponent(certificateId)}`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as Partial<Result> | null;
        if (cancelled) return;
        if (!data || !data.outcome || !data.message) {
          setResult({
            outcome: "unavailable",
            certificateId,
            title: "Unavailable",
            message: "This certificate could not be checked right now. Please try again in a moment.",
          });
          return;
        }
        setResult({
          outcome: data.outcome,
          certificateId: data.certificateId || certificateId,
          title: data.title || "Result",
          message: data.message,
          purpose: data.purpose,
          candidateName: data.candidateName,
          issueDate: data.issueDate,
          expiryDate: data.expiryDate,
          data: data.outcome === "valid" ? data.data : undefined,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResult({
          outcome: "unavailable",
          certificateId,
          title: "Unavailable",
          message: "This certificate could not be checked right now. Please try again in a moment.",
        });
      })
      .finally(() => window.clearTimeout(timer));

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [certificateId]);

  return (
    <div className="container-wide max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#12B8B0] mb-3">Public verification</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0B2D5C] dark:text-white" style={{ fontFamily: "var(--font-primary)" }}>
          {result.title}
        </h1>
      </div>

      <div className={`rounded-2xl border p-6 text-sm ${tone[result.outcome] || tone.invalid}`} role="status">
        <p className="font-extrabold uppercase tracking-wider text-xs mb-2">{result.outcome}</p>
        <p>{result.message}</p>
        {result.outcome === "expired" ? (
          <dl className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
            {result.candidateName ? (
              <div>
                <dt className="text-xs uppercase tracking-wider opacity-70">Name</dt>
                <dd className="font-semibold">{result.candidateName}</dd>
              </div>
            ) : null}
            {result.purpose ? (
              <div>
                <dt className="text-xs uppercase tracking-wider opacity-70">Purpose</dt>
                <dd className="font-semibold">{result.purpose}</dd>
              </div>
            ) : null}
            {result.issueDate ? (
              <div>
                <dt className="text-xs uppercase tracking-wider opacity-70">Issued</dt>
                <dd className="font-semibold">{result.issueDate}</dd>
              </div>
            ) : null}
            {result.expiryDate ? (
              <div>
                <dt className="text-xs uppercase tracking-wider opacity-70">Expired</dt>
                <dd className="font-semibold">{result.expiryDate}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>

      {result.outcome === "valid" && result.data ? <OfficialMedicalCertificate data={result.data} /> : null}
      <VerifySearchForm initialId={result.certificateId} />
    </div>
  );
}
