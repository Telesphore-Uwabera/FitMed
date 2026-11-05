"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function VerifySearchForm({ initialId = "" }: { initialId?: string }) {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState(initialId);
  const [error, setError] = useState("");

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const id = certificateId.trim();
    if (!id) {
      setError("Enter a certificate number to continue.");
      return;
    }
    setError("");
    router.push(`/verify/${encodeURIComponent(id)}`);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl bg-white dark:bg-[#12253d] p-6 sm:p-8 shadow-sm">
      <label htmlFor="certificate-id" className="block text-sm font-bold text-[#0B2D5C] dark:text-white mb-2">
        Certificate number
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="certificate-id"
          name="certificateId"
          value={certificateId}
          onChange={(event) => setCertificateId(event.target.value)}
          placeholder="e.g. FM-2026-00001"
          autoComplete="off"
          className="flex-1 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-transparent px-4 py-3 text-sm font-semibold text-[#0B2D5C] dark:text-white"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12B8B0] px-5 py-3 text-sm font-extrabold text-[#0B2D5C]"
        >
          <Search className="w-4 h-4" />
          Check certificate
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        This page confirms whether a certificate is valid, expired, or not valid. Medical history is not shown.
      </p>
    </form>
  );
}
