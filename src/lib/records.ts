export function displayValue(value: unknown, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

export function isIssuedCertificate(cert: { status?: string; decision?: string } | null | undefined) {
  if (!cert) return false;
  const status = String(cert.status || "").toLowerCase();
  const decision = String(cert.decision || "PENDING")
    .toUpperCase()
    .replace(/\s+/g, "_");
  const issuedStatus = ["valid", "approved", "issued", "signed"].includes(status);
  const fitDecision = decision === "FIT" || decision === "FIT_RESTRICTED";
  return issuedStatus && fitDecision;
}

export function sameCalendarDay(value: unknown, day: Date) {
  if (!value) return false;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === day.toDateString();
}

export function todayShift(schedule: Array<{
  day: string;
  dayEnabled?: boolean;
  dayStart?: string;
  dayEnd?: string;
  nightEnabled?: boolean;
  nightStart?: string;
  nightEnd?: string;
}> = []) {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const row = schedule.find((item) => item.day === weekday);
  if (!row) {
    return { label: "Not scheduled", hours: "No hours saved for today" };
  }
  if (row.dayEnabled) {
    return { label: "Day shift", hours: `${row.dayStart || "—"} – ${row.dayEnd || "—"}` };
  }
  if (row.nightEnabled) {
    return { label: "Night shift", hours: `${row.nightStart || "—"} – ${row.nightEnd || "—"}` };
  }
  return { label: "Off duty", hours: "Not scheduled today" };
}
