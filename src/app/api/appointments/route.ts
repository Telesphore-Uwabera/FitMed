import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { EmailTemplates } from "@/lib/brevo";
import { listAppointments, patchAppointment, saveAppointment } from "@/lib/memoryStore";
import { nextKey } from "@/lib/sequentialIds";
import { notifyPerson } from "@/lib/notify";
import { canRescheduleMeeting, isMeetingClosed, publicMeetUrl } from "@/lib/meetingTime";
import { processDueMeetingNotices } from "@/lib/meetingReminders";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const applicantEmail = searchParams.get("applicantEmail");
    const status = searchParams.get("status");
    const doctorEmail = searchParams.get("doctorEmail");
    const doctorName = searchParams.get("doctorName");

    await connectToDatabase();
    void processDueMeetingNotices().catch(() => null);
    const query: Record<string, unknown> = {};

    if (applicantEmail) {
      query.applicantEmail = {
        $regex: `^${applicantEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      };
    }

    const or: object[] = [];
    const doctorKeys = [...new Set([doctorId, doctorEmail].filter(Boolean))] as string[];
    for (const key of doctorKeys) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      or.push({ doctorId: key });
      or.push({ doctorId: { $regex: `^${escaped}$`, $options: "i" } });
      or.push({ doctorEmail: { $regex: `^${escaped}$`, $options: "i" } });
    }
    if (doctorName) {
      const nameKey = doctorName
        .replace(/\b(dr|md|mbbs)\b\.?/gi, "")
        .replace(/[,\.]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const last = nameKey.split(" ").filter(Boolean).pop();
      if (last && last.length > 2) {
        const escapedLast = last.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        or.push({ doctorName: { $regex: escapedLast, $options: "i" } });
      }
    }
    if (or.length && !applicantEmail) query.$or = or;
    if (status) query.status = status;

    const appointments = await Appointment.find(query).sort({ scheduledDate: 1, scheduledTime: 1 }).lean();
    return NextResponse.json({ success: true, appointments });
  } catch (error: any) {
    console.error("GET appointments error:", error);
    return NextResponse.json({ success: false, error: error.message, appointments: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      applicantName,
      applicantEmail,
      applicantPhone,
      doctorId,
      doctorName,
      doctorSpecialty,
      purpose,
      certificateDraftId,
      scheduledDate,
      scheduledTime,
      durationMinutes,
      notes,
    } = body;

    if (!applicantName || !applicantEmail || !scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: "Missing required appointment fields" }, { status: 400 });
    }

    await connectToDatabase();
    const appointmentId = await nextKey("appointment");
    const roomId = body.roomId || appointmentId;
    const roomUrl = `/meet/${roomId}`;

    let savedAppointment: any = {
      appointmentId,
      applicantName,
      applicantEmail: String(applicantEmail).toLowerCase(),
      applicantPhone: applicantPhone || "",
      doctorId: doctorId || "",
      doctorEmail: String(body.doctorEmail || doctorId || "").toLowerCase(),
      doctorName: doctorName || "",
      doctorSpecialty: doctorSpecialty || "",
      purpose: purpose || "Medical Fitness Review",
      certificateDraftId: certificateDraftId || "",
      scheduledDate,
      scheduledTime,
      durationMinutes: durationMinutes || 15,
      status: "scheduled",
      notes: notes || "Video consultation scheduled for fitness certificate review.",
      roomId,
      roomUrl,
      emailNotified: true,
      reminder30Sent: false,
      startNoticeSent: false,
      createdAt: new Date(),
    };

    try {
      savedAppointment = await Appointment.create(savedAppointment);
    } catch (dbErr) {
      console.warn("MongoDB appointment save fallback:", dbErr);
      savedAppointment = saveAppointment(savedAppointment);
    }

    // Dispatch Brevo email notification to the applicant
    const meetingLink = publicMeetUrl(roomId);
    const formattedTime = `${scheduledDate} at ${scheduledTime} (Africa/Kigali)`;
    const physician = doctorName || "FitMed Physician";
    const inviteDetails = {
      scheduledDate,
      scheduledTime,
      durationMinutes: durationMinutes || 15,
      purpose: purpose || "Medical Fitness Review",
      appointmentId,
      notes: notes || "",
    };
    await notifyPerson({
      toEmail: applicantEmail,
      toName: applicantName,
      role: "user",
      subject: `FitMed video consultation scheduled with ${physician}`,
      htmlContent: EmailTemplates.telehealthInvite(applicantName, physician, meetingLink, inviteDetails),
      snippet: `Consultation with ${physician} on ${formattedTime}.`,
      href: meetingLink,
    });
    await notifyPerson({
      toEmail: applicantEmail,
      toName: applicantName,
      role: "user",
      subject: `Reminder: FitMed consultation ${formattedTime}`,
      htmlContent: EmailTemplates.appointmentReminder(applicantName, physician, meetingLink, formattedTime),
      snippet: `Join your video consultation with ${physician}.`,
      href: meetingLink,
    });

    return NextResponse.json({
      success: true,
      appointment: savedAppointment,
      emailSent: true,
      message: `Appointment scheduled and notification dispatched to ${applicantEmail}.`,
    });
  } catch (error: any) {
    console.error("POST appointment error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, status, notes, scheduledDate, scheduledTime, durationMinutes, action } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const appointment = await Appointment.findOne({ appointmentId });
      if (!appointment) {
        return NextResponse.json({ success: false, error: "Appointment not found." }, { status: 404 });
      }

      if (action === "remind") {
        if (isMeetingClosed(appointment)) {
          return NextResponse.json(
            { success: false, error: "This visit has ended. Reschedule it to notify the applicant." },
            { status: 400 }
          );
        }
        const time = `${appointment.scheduledDate || ""} ${appointment.scheduledTime || ""}`.trim() || "as scheduled";
        const meetingLink = publicMeetUrl(String(appointment.roomId || appointment.appointmentId));
        await notifyPerson({
          toEmail: appointment.applicantEmail,
          toName: appointment.applicantName,
          role: "user",
          subject: "Reminder: your FitMed video visit",
          htmlContent: EmailTemplates.appointmentReminder(
            appointment.applicantName,
            appointment.doctorName || "your FitMed doctor",
            meetingLink,
            time
          ),
          snippet: `Reminder for your consultation ${time}.`,
          href: meetingLink,
        });
        return NextResponse.json({ success: true, appointment });
      }

      if (action === "reschedule") {
        if (!canRescheduleMeeting(appointment)) {
          return NextResponse.json(
            { success: false, error: "Completed visits cannot be rescheduled." },
            { status: 400 }
          );
        }
        if (!scheduledDate || !scheduledTime) {
          return NextResponse.json({ success: false, error: "Choose a new date and time." }, { status: 400 });
        }
        appointment.scheduledDate = scheduledDate;
        appointment.scheduledTime = scheduledTime;
        if (durationMinutes) appointment.durationMinutes = Number(durationMinutes);
        appointment.status = "rescheduled";
        appointment.reminder30Sent = false;
        appointment.startNoticeSent = false;
        await appointment.save();
        const meetingLink = publicMeetUrl(String(appointment.roomId || appointment.appointmentId));
        const time = `${scheduledDate} at ${scheduledTime} (Africa/Kigali)`;
        await notifyPerson({
          toEmail: appointment.applicantEmail,
          toName: appointment.applicantName,
          role: "user",
          subject: "Your FitMed video visit was rescheduled",
          htmlContent: EmailTemplates.appointmentRescheduled(
            appointment.applicantName,
            appointment.doctorName || "your FitMed doctor",
            meetingLink,
            {
              scheduledDate,
              scheduledTime,
              durationMinutes: Number(appointment.durationMinutes || durationMinutes || 15),
              purpose: appointment.purpose,
              appointmentId: appointment.appointmentId,
            }
          ),
          snippet: `Your visit is now ${time}.`,
          href: meetingLink,
        });
        return NextResponse.json({ success: true, appointment });
      }

      if (status && !["completed", "cancelled"].includes(String(status)) && isMeetingClosed(appointment)) {
        return NextResponse.json(
          { success: false, error: "This visit has ended. Reschedule it before starting or inviting again." },
          { status: 400 }
        );
      }

      const updated = await Appointment.findOneAndUpdate(
        { appointmentId },
        {
          ...(status && { status }),
          ...(notes && { notes }),
          ...(scheduledDate && { scheduledDate }),
          ...(scheduledTime && { scheduledTime }),
          ...(durationMinutes && { durationMinutes: Number(durationMinutes) }),
        },
        { new: true }
      );
      return NextResponse.json({ success: true, appointment: updated });
    } catch (dbErr) {
      console.warn("MongoDB patch appointment fallback:", dbErr);
      const updated = patchAppointment(appointmentId, {
        ...(status && { status }),
        ...(notes && { notes }),
        ...(scheduledDate && { scheduledDate }),
        ...(scheduledTime && { scheduledTime }),
      });
      return NextResponse.json({ success: true, appointment: updated, source: "memory" });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
