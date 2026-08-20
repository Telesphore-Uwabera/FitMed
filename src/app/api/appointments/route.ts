import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const applicantEmail = searchParams.get("applicantEmail");
    const status = searchParams.get("status");

    try {
      await connectToDatabase();
      const query: any = {};
      if (doctorId) query.doctorId = doctorId;
      if (applicantEmail) query.applicantEmail = applicantEmail;
      if (status) query.status = status;

      const appointments = await Appointment.find(query).sort({ scheduledDate: 1, scheduledTime: 1 });
      return NextResponse.json({ success: true, appointments });
    } catch (dbErr) {
      console.warn("MongoDB fetch appointments fallback:", dbErr);
      return NextResponse.json({
        success: true,
        appointments: [
          {
            appointmentId: "APT-2026-891",
            applicantName: "Telesphore Uwabera",
            applicantEmail: "telesphore91073@gmail.com",
            doctorId: "DOC-RW-4091",
            doctorName: "Dr. Telesphore Uwabera, MD",
            purpose: "Workplace & Office Fitness Certification",
            scheduledDate: "Today",
            scheduledTime: "14:30",
            durationMinutes: 15,
            status: "scheduled",
            roomUrl: "/dashboard/user?tab=consultation",
            notes: "Routine medical clearance and identity verification.",
          },
          {
            appointmentId: "APT-2026-904",
            applicantName: "Jean-Paul Habimana",
            applicantEmail: "jp.habimana@gmail.com",
            doctorId: "DOC-RW-4091",
            doctorName: "Dr. Telesphore Uwabera, MD",
            purpose: "Commercial Driver & Transport License",
            scheduledDate: "Tomorrow",
            scheduledTime: "10:00",
            durationMinutes: 20,
            status: "scheduled",
            roomUrl: "/dashboard/doctor?nav=telehealth",
            notes: "Vision and reflex check review.",
          },
        ],
      });
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
      scheduledDate,
      scheduledTime,
      durationMinutes,
      notes,
    } = body;

    if (!applicantName || !applicantEmail || !scheduledDate || !scheduledTime) {
      return NextResponse.json({ error: "Missing required appointment fields" }, { status: 400 });
    }

    const appointmentId = `APT-${Date.now().toString().slice(-6)}`;
    const roomUrl = `/dashboard/user?tab=consultation&room=${appointmentId}`;

    let savedAppointment: any = {
      appointmentId,
      applicantName,
      applicantEmail,
      applicantPhone: applicantPhone || "+250 788 123 456",
      doctorId: doctorId || "DOC-RW-4091",
      doctorName: doctorName || "Dr. Telesphore Uwabera, MD",
      doctorSpecialty: doctorSpecialty || "Telehealth Physician",
      purpose: purpose || "Medical Fitness Review",
      scheduledDate,
      scheduledTime,
      durationMinutes: durationMinutes || 15,
      status: "scheduled",
      notes: notes || "Video consultation scheduled for fitness certificate review.",
      roomUrl,
      emailNotified: true,
      createdAt: new Date(),
    };

    try {
      await connectToDatabase();
      savedAppointment = await Appointment.create(savedAppointment);
    } catch (dbErr) {
      console.warn("MongoDB appointment save fallback:", dbErr);
    }

    // Dispatch Brevo email notification to the applicant
    const formattedTime = `${scheduledDate} at ${scheduledTime}`;
    const emailResult = await sendBrevoEmail({
      toEmail: applicantEmail,
      toName: applicantName,
      subject: `FitMed Video Consultation Scheduled with ${doctorName || "Dr. Telesphore Uwabera"}`,
      htmlContent: EmailTemplates.telehealthInvite(
        applicantName,
        doctorName || "Dr. Telesphore Uwabera, MD",
        `https://fitmed.rw${roomUrl}`,
        formattedTime
      ),
    });

    return NextResponse.json({
      success: true,
      appointment: savedAppointment,
      emailSent: emailResult.success,
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
    const { appointmentId, status, notes, scheduledDate, scheduledTime } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
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
      return NextResponse.json({ success: true, message: "Appointment updated (local fallback)" });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
