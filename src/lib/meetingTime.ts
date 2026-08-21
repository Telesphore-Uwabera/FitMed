/** Appointment times are booked in Africa/Kigali (UTC+2, no DST). */

export function appointmentStartMs(scheduledDate?: string, scheduledTime?: string) {
  const date = String(scheduledDate || "").trim();
  const time = String(scheduledTime || "00:00").trim();
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return Date.UTC(year, month - 1, day, hour - 2, minute || 0, 0);
}

export function meetingWindow(apt: {
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
}) {
  const start = appointmentStartMs(apt.scheduledDate, apt.scheduledTime);
  if (!start) {
    return { start: null, end: null, canJoin: false, minutesUntilStart: null, status: "invalid" as const };
  }
  const duration = Number(apt.durationMinutes || 15);
  const end = start + (duration + 30) * 60 * 1000;
  const now = Date.now();
  const minutesUntilStart = Math.ceil((start - now) / 60000);
  if (now < start - 60 * 1000) {
    return { start, end, canJoin: false, minutesUntilStart, status: "waiting" as const };
  }
  if (now > end) {
    return { start, end, canJoin: false, minutesUntilStart: 0, status: "ended" as const };
  }
  return { start, end, canJoin: true, minutesUntilStart: Math.max(0, minutesUntilStart), status: "open" as const };
}

export function publicMeetUrl(roomId: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://fitmed-l2uv.onrender.com").replace(/\/$/, "");
  return `${base}/meet/${encodeURIComponent(roomId)}`;
}

export function canRescheduleMeeting(apt: {
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  status?: string;
}) {
  const status = meetingLifecycleStatus(apt);
  return status === "scheduled" || status === "rescheduled" || status === "overdue";
}

export function isMeetingClosed(apt: {
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  status?: string;
}) {
  const status = meetingLifecycleStatus(apt);
  return status === "overdue" || status === "completed" || status === "cancelled";
}

export function meetingLifecycleStatus(apt: {
  scheduledDate?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  status?: string;
}) {
  const stored = String(apt.status || "scheduled").toLowerCase();
  if (stored === "completed" || stored === "cancelled") return stored;
  const start = appointmentStartMs(apt.scheduledDate, apt.scheduledTime);
  if (!start) return stored || "scheduled";
  const duration = Number(apt.durationMinutes || 15);
  const end = start + duration * 60 * 1000;
  const now = Date.now();
  if (now < start) return stored === "rescheduled" ? "rescheduled" : "scheduled";
  if (now <= end) return "in-progress";
  return "overdue";
}

export function meetingStatusLabel(status: string) {
  const value = String(status || "").toLowerCase();
  if (value === "in-progress") return "In progress";
  if (value === "overdue") return "Overdue";
  if (value === "rescheduled") return "Rescheduled";
  if (value === "completed") return "Completed";
  if (value === "cancelled") return "Cancelled";
  return "Scheduled";
}

export function meetingStatusClass(status: string) {
  const value = String(status || "").toLowerCase();
  if (value === "in-progress") return "bg-sky-100 text-sky-800";
  if (value === "overdue") return "bg-rose-100 text-rose-800";
  if (value === "rescheduled") return "bg-amber-100 text-amber-800";
  if (value === "completed") return "bg-emerald-100 text-emerald-800";
  if (value === "cancelled") return "bg-slate-100 text-slate-600";
  return "bg-teal-100 text-teal-800";
}

export function formatCountdown(minutesUntilStart: number | null) {
  if (minutesUntilStart == null) return "";
  if (minutesUntilStart <= 0) return "starting now";
  const hours = Math.floor(minutesUntilStart / 60);
  const minutes = minutesUntilStart % 60;
  if (hours <= 0) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"}`;
}
