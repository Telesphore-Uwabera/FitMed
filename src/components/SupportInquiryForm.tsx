"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

export default function SupportInquiryForm({
  category,
  defaultSubject,
}: {
  category: "general" | "doctors" | "employers" | "report";
  defaultSubject: string;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          subject: defaultSubject,
          message,
          category,
        }),
      });
      const data = await res.json().catch(() => ({ success: false }));
      if (!res.ok || !data.success) {
        setNote(data.error || "Could not send your message. Please try again.");
      } else {
        setNote("Message received. FitMed will reply by email.");
        setFullName("");
        setEmail("");
        setMessage("");
      }
    } catch {
      setNote("Could not reach FitMed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl bg-white dark:bg-[#12253d] p-6 sm:p-8 shadow-sm space-y-4">
      <h2 className="text-lg font-extrabold text-[#0B2D5C] dark:text-white" style={{ fontFamily: "var(--font-primary)" }}>
        Send a message
      </h2>
      <label className="block text-sm">
        <span className="font-bold text-[#0B2D5C] dark:text-slate-200">Name</span>
        <input
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-transparent px-3 py-2.5 text-sm text-[#0B2D5C] dark:text-white"
        />
      </label>
      <label className="block text-sm">
        <span className="font-bold text-[#0B2D5C] dark:text-slate-200">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-transparent px-3 py-2.5 text-sm text-[#0B2D5C] dark:text-white"
        />
      </label>
      <label className="block text-sm">
        <span className="font-bold text-[#0B2D5C] dark:text-slate-200">Message</span>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-transparent px-3 py-2.5 text-sm text-[#0B2D5C] dark:text-white"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-[#12B8B0] px-5 py-2.5 text-sm font-extrabold text-[#0B2D5C] disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {busy ? "Sending…" : "Send"}
      </button>
      {note ? <p className="text-sm text-[#0B2D5C] dark:text-[#8ff3e8]">{note}</p> : null}
    </form>
  );
}
