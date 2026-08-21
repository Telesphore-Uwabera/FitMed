import Appointment from "@/models/Appointment";
import { EmailTemplates } from "@/lib/brevo";
import { notifyPerson } from "@/lib/notify";
import { appointmentStartMs, meetingLifecycleStatus, publicMeetUrl } from "@/lib/meetingTime";

export async function processDueMeetingNotices() {
  const now = Date.now();
  const upcoming = await Appointment.find({
    status: { $in: ["scheduled", "in-progress", "rescheduled", "overdue"] },
  }).lean();

  let sent = 0;
  for (const apt of upcoming) {
    const stored = String(apt.status || "").toLowerCase();
    if (stored === "completed" || stored === "cancelled") continue;
    const start = appointmentStartMs(apt.scheduledDate, apt.scheduledTime);
    if (!start) continue;
    const nextStatus = meetingLifecycleStatus(apt);
    if (nextStatus !== String(apt.status || "") && ["in-progress", "overdue", "scheduled", "rescheduled"].includes(nextStatus)) {
      await Appointment.updateOne({ _id: apt._id }, { status: nextStatus });
    }
    const joinUrl = publicMeetUrl(String(apt.roomId || apt.appointmentId));
    const timeLabel = `${apt.scheduledDate} at ${apt.scheduledTime} (Africa/Kigali)`;
    const doctor = String(apt.doctorName || "your FitMed doctor");
    const name = String(apt.applicantName || "Applicant");
    const email = String(apt.applicantEmail || "");
    if (!email) continue;

    const thirtyWindow = start - 30 * 60 * 1000;
    if (!apt.reminder30Sent && now >= thirtyWindow && now < start) {
      await notifyPerson({
        toEmail: email,
        toName: name,
        role: "user",
        subject: "Your FitMed video visit starts in 30 minutes",
        htmlContent: EmailTemplates.appointmentStartingSoon(name, doctor, joinUrl, timeLabel, 30),
        snippet: `Join in 30 minutes with ${doctor}.`,
        href: joinUrl,
      });
      await Appointment.updateOne({ _id: apt._id }, { reminder30Sent: true });
      sent += 1;
    }

    if (!apt.startNoticeSent && now >= start && now <= start + 15 * 60 * 1000) {
      await notifyPerson({
        toEmail: email,
        toName: name,
        role: "user",
        subject: "Your FitMed video visit is starting now",
        htmlContent: EmailTemplates.appointmentStartingNow(name, doctor, joinUrl, timeLabel),
        snippet: `Your consultation with ${doctor} is starting now.`,
        href: joinUrl,
      });
      await Appointment.updateOne({ _id: apt._id }, { startNoticeSent: true });
      sent += 1;
    }
  }
  return sent;
}
