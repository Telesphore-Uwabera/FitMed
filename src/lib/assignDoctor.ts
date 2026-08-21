import Doctor from "@/models/Doctor";
import Schedule from "@/models/Schedule";
import PlatformSettings from "@/models/PlatformSettings";
import AuditLog from "@/models/AuditLog";

type DayRow = {
  day?: string;
  dayEnabled?: boolean;
  dayStart?: string;
  dayEnd?: string;
  nightEnabled?: boolean;
  nightStart?: string;
  nightEnd?: string;
};

function toMinutes(value?: string) {
  const text = String(value || "").trim();
  if (!text) return null;
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = (match[3] || "").toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

export function nowInKigali() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Kigali", weekday: "long" }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Kigali",
      hour: "numeric",
      hourCycle: "h23",
    }).format(now)
  );
  const minute = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Kigali", minute: "numeric" }).format(now));
  return { weekday, minutes: hour * 60 + minute };
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function inRange(start?: string, end?: string, minutes?: number) {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === null || to === null || minutes === undefined) return false;
  if (to >= from) return minutes >= from && minutes <= to;
  return minutes >= from || minutes <= to;
}

function doctorWeekly(doctor: { email?: string; weeklySchedule?: DayRow[] }, scheduleByEmail: Map<string, { weeklySchedule?: DayRow[] }>) {
  const saved = scheduleByEmail.get(String(doctor.email || "").toLowerCase());
  return (saved?.weeklySchedule as DayRow[] | undefined) || doctor.weeklySchedule || [];
}

export function isWithinWeeklyHours(schedule: DayRow[] | undefined, weekday: string, minutes: number) {
  const rows = Array.isArray(schedule) ? schedule : [];
  if (!rows.length) return true;
  const hasAnyShift = rows.some((row) => row.dayEnabled || row.nightEnabled);
  if (!hasAnyShift) return false;
  const today = rows.find((row) => String(row.day || "").toLowerCase() === weekday.toLowerCase());
  if (!today) return false;
  if (today.dayEnabled && inRange(today.dayStart, today.dayEnd, minutes)) return true;
  if (today.nightEnabled && inRange(today.nightStart, today.nightEnd, minutes)) return true;
  return false;
}

/** Minutes until the next saved shift starts (0 if that shift is already underway). */
export function minutesUntilNextShift(schedule: DayRow[] | undefined, weekday: string, minutes: number) {
  const rows = Array.isArray(schedule) ? schedule : [];
  const todayIndex = WEEKDAYS.findIndex((day) => day.toLowerCase() === weekday.toLowerCase());
  if (todayIndex < 0) return null;

  const shifts: { dayIndex: number; start: number; end: number }[] = [];
  for (const row of rows) {
    const dayIndex = WEEKDAYS.findIndex((day) => day.toLowerCase() === String(row.day || "").toLowerCase());
    if (dayIndex < 0) continue;
    if (row.dayEnabled) {
      const start = toMinutes(row.dayStart);
      const end = toMinutes(row.dayEnd);
      if (start !== null && end !== null) shifts.push({ dayIndex, start, end });
    }
    if (row.nightEnabled) {
      const start = toMinutes(row.nightStart);
      const end = toMinutes(row.nightEnd);
      if (start !== null && end !== null) shifts.push({ dayIndex, start, end });
    }
  }
  if (!shifts.length) return null;

  let nearest: number | null = null;
  for (let offset = 0; offset <= 7; offset += 1) {
    const dayIndex = (todayIndex + offset) % 7;
    for (const shift of shifts) {
      const wraps = shift.end < shift.start;
      const onStartDay = shift.dayIndex === dayIndex;
      const onWrapMorning = wraps && (shift.dayIndex + 1) % 7 === dayIndex;
      const underway =
        offset === 0 &&
        ((onStartDay && (wraps ? minutes >= shift.start : minutes >= shift.start && minutes <= shift.end)) ||
          (onWrapMorning && minutes <= shift.end));
      if (underway) return 0;
      if (!onStartDay) continue;

      let wait: number | null = null;
      if (offset === 0) {
        if (minutes < shift.start) wait = shift.start - minutes;
      } else {
        wait = offset * 24 * 60 - minutes + shift.start;
      }
      if (wait !== null && wait >= 0 && (nearest === null || wait < nearest)) nearest = wait;
    }
  }
  return nearest;
}

export async function pickOnDutyDoctor() {
  const { weekday, minutes } = nowInKigali();
  const doctors = await Doctor.find({ isVerified: true }).sort({ createdAt: 1 }).lean();
  const schedules = await Schedule.find({}).lean();
  const scheduleByEmail = new Map(schedules.map((row) => [String(row.doctorEmail || "").toLowerCase(), row]));

  const withWeekly = doctors.map((doctor) => ({
    doctor,
    weekly: doctorWeekly(doctor, scheduleByEmail as Map<string, { weeklySchedule?: DayRow[] }>),
  }));

  const onDuty = withWeekly.filter(({ doctor, weekly }) => {
    const status = String(doctor.status || "OFF").toUpperCase();
    if (status !== "ONLINE") return false;
    return isWithinWeeklyHours(weekly, weekday, minutes);
  });

  let pool = onDuty.map((row) => row.doctor);
  let reason = "on-duty";

  if (!pool.length) {
    const upcoming = withWeekly
      .map(({ doctor, weekly }) => ({
        doctor,
        wait: minutesUntilNextShift(weekly, weekday, minutes),
      }))
      .filter((row) => row.wait !== null) as { doctor: (typeof doctors)[number]; wait: number }[];

    upcoming.sort((a, b) => a.wait - b.wait);
    const nearestWait = upcoming[0]?.wait;
    if (nearestWait === undefined) {
      return {
        assignedDoctor: "Unassigned",
        assignedDoctorId: "",
        assignedDoctorLicense: "",
        assignedDoctorEmail: "",
      };
    }
    pool = upcoming.filter((row) => row.wait === nearestWait).map((row) => row.doctor);
    reason = "nearest-schedule";
  }

  const bumped = await PlatformSettings.findOneAndUpdate(
    { key: "fitmed" },
    { $inc: { roundRobinIndex: 1 }, $setOnInsert: { key: "fitmed" } },
    { upsert: true, new: true }
  );
  const index = Math.abs(Number(bumped.roundRobinIndex || 1) - 1) % pool.length;
  const chosen = pool[index];
  await PlatformSettings.updateOne(
    { key: "fitmed" },
    {
      $set: {
        lastAssignedDoctorId: String(chosen._id),
        lastAssignedDoctorName: chosen.fullName,
      },
    }
  );

  await AuditLog.create({
    action: "certificate_assigned",
    detail:
      reason === "on-duty"
        ? `${chosen.fullName} received the next application (slot ${index + 1} of ${pool.length} on-duty doctors).`
        : `${chosen.fullName} received the application — no doctor was on duty, so it went to the nearest upcoming schedule (slot ${index + 1} of ${pool.length}).`,
    actor: "system",
    meta: { doctorId: String(chosen._id), doctorEmail: chosen.email, poolSize: pool.length, reason },
  }).catch(() => null);

  return {
    assignedDoctor: chosen.fullName,
    assignedDoctorId: String(chosen._id),
    assignedDoctorLicense: chosen.licenseNumber || "",
    assignedDoctorEmail: chosen.email || "",
  };
}
