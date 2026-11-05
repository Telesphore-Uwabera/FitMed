/** Where a new applicant should land after they can sign in. */
export function requestCertificatePath(purpose?: string) {
  const params = new URLSearchParams({ tab: "request" });
  const trimmed = String(purpose || "").trim();
  if (trimmed) params.set("purpose", trimmed);
  return `/dashboard/user?${params.toString()}`;
}

/** Public CTA for people who do not have an account yet. */
export function newApplicantHref(purpose?: string) {
  return `/signup?next=${encodeURIComponent(requestCertificatePath(purpose))}`;
}

export function safeApplicantNext(raw: string | null | undefined) {
  const value = String(raw || "");
  if (!value.startsWith("/dashboard/user")) return "";
  if (value.startsWith("//") || value.includes("\\")) return "";
  return value;
}
