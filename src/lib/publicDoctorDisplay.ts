/**
 * Known non-clinical licence values. These come from local seed data and from
 * obvious placeholder numbers already stored on the platform. Real RMDC
 * numbers are left untouched — this list does not invent licences.
 */
const PLACEHOLDER_LICENSES = new Set([
  "RMDC-0001",
  "RW-RMDC-4091",
  "RMDC-PENDING",
  "DOC-RW-0001",
]);

const PLACEHOLDER_DOCTOR_EMAILS = new Set(["uwaberatelesphore@gmail.com"]);

export function isPlaceholderLicense(license?: string) {
  const value = String(license || "").trim().toUpperCase();
  if (!value) return false;
  if (PLACEHOLDER_LICENSES.has(value)) return true;
  if (/^RMDC-0+$/.test(value)) return true;
  if (/(PENDING|DEMO|TEST|FAKE|SAMPLE|PLACEHOLDER)/.test(value)) return true;
  return false;
}

export function isPlaceholderDoctorRecord(input: { email?: string; licenseNumber?: string }) {
  const email = String(input.email || "").trim().toLowerCase();
  if (PLACEHOLDER_DOCTOR_EMAILS.has(email)) return true;
  return isPlaceholderLicense(input.licenseNumber);
}

/** Corrects the repeated public-profile misspelling without changing stored names. */
export function correctPublicSpelling(value?: string) {
  return String(value || "")
    .replace(/\bPractioners\b/g, "Practitioners")
    .replace(/\bPractioner\b/g, "Practitioner")
    .replace(/\bpractioners\b/g, "practitioners")
    .replace(/\bpractioner\b/g, "practitioner");
}

export function leadershipDisplayName(fullName?: string) {
  return String(fullName || "")
    .replace(/^dr\.?\s+/i, "")
    .replace(/,?\s*MD$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}
