import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { sendBrevoEmail, EmailTemplates, FITMED_APP_URL } from "@/lib/brevo";
import { listAppointments, patchAppointment, saveAppointment } from "@/lib/memoryStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const applicantEmail = searchParams.get("applicantEmail");
    const status = searchParams.get("status");

    try {
      await connectToDatabase();
      const query: any = {};
      const doctorEmail = searchParams.get("doctorEmail");
      const doctorKeys = [...new Set([doctorId, doctorEmail].filter(Boolean))] as string[];
      if (doctorKeys.length) {
        query.$or = doctorKeys.flatMap((key) => {
          const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return [
            { doctorId: key },
            { doctorEmail: { $regex: `^${escaped}$`, $options: "i" } },
          ];
        });
      }
      if (applicantEmail) query.applicantEmail = { $regex: `^${applicantEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
      if (status) query.status = status;

      const appointments = await Appointment.find(query).sort({ scheduledDate: 1, scheduledTime: 1 });
      return NextResponse.json({ success: true, appointments });
    } catch (dbErr) {
      console.warn("MongoDB fetch appointments failed:", dbErr);
      return NextResponse.json({ success: true, appointments: [] });
    }
  } catch (error: any) {
    console.error("GET appointments error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    const appointmentId = `APT-${Date.now().toString().slice(-6)}`;
    const roomId = body.roomId || appointmentId;
    const roomUrl = `/dashboard/user?tab=consultation&room=${roomId}`;

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
      createdAt: new Date(),
    };

    try {
      await connectToDatabase();
      savedAppointment = await Appointment.create(savedAppointment);
    } catch (dbErr) {
      console.warn("MongoDB appointment save fallback:", dbErr);
      savedAppointment = saveAppointment(savedAppointment);
    }

    // Dispatch Brevo email notification to the applicant
    const meetingLink = `${FITMED_APP_URL}${roomUrl}`;
    const formattedTime = `${scheduledDate} at ${scheduledTime}`;
    const physician = doctorName || "FitMed Physician";
    await sendBrevoEmail({
      toEmail: applicantEmail,
      toName: applicantName,
      subject: `FitMed video consultation scheduled with ${physician}`,
      htmlContent: EmailTemplates.telehealthInvite(applicantName, physician, meetingLink, formattedTime),
    });
    await sendBrevoEmail({
      toEmail: applicantEmail,
      toName: applicantName,
      subject: `Reminder: FitMed consultation ${formattedTime}`,
      htmlContent: EmailTemplates.appointmentReminder(applicantName, physician, meetingLink, formattedTime),
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
    const { appointmentId, status, notes, scheduledDate, scheduledTime, action } = body;

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
        const time = `${appointment.scheduledDate || ""} ${appointment.scheduledTime || ""}`.trim() || "as scheduled";
        const meetingLink = `${FITMED_APP_URL}${appointment.roomUrl || "/dashboard/user?tab=consultation"}`;
        await sendBrevoEmail({
          toEmail: appointment.applicantEmail,
          toName: appointment.applicantName,
          subject: "Reminder: your FitMed video visit",
          htmlContent: EmailTemplates.appointmentReminder(
            appointment.applicantName,
            appointment.doctorName || "your FitMed doctor",
            meetingLink,
            time
          ),
        });
        return NextResponse.json({ success: true, appointment });
      }

      const updated = await Appointment.findOneAndUpdate(
        { appointmentId },
        {
          ...(status && { status }),
          ...(notes && { notes }),
          ...(scheduledDate && { scheduledDate }),
          ...(scheduledTime && { scheduledTime }),
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
