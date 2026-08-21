import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { EmailTemplates } from "@/lib/brevo";
import { notifyPerson } from "@/lib/notify";
import { isMeetingClosed, publicMeetUrl } from "@/lib/meetingTime";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.applicantEmail || body.patientEmail || "").trim().toLowerCase();
    const name = String(body.applicantName || body.patientName || "").trim();
    const roomKey = String(body.roomId || body.appointmentId || "").trim();

    if (!email || !name) {
      return NextResponse.json({ error: "Applicant email and name required" }, { status: 400 });
    }

    await connectToDatabase();
    const appointment = roomKey
      ? await Appointment.findOne({ $or: [{ appointmentId: roomKey }, { roomId: roomKey }] })
      : await Appointment.findOne({ applicantEmail: email }).sort({ createdAt: -1 });

    if (appointment && isMeetingClosed(appointment)) {
      return NextResponse.json(
        { success: false, error: "This visit has ended. Reschedule it to invite the applicant again." },
        { status: 400 }
      );
    }

    const meetingLink = publicMeetUrl(String(appointment?.roomId || appointment?.appointmentId || roomKey || "meeting"));
    const doctorName = String(body.doctorName || appointment?.doctorName || "your FitMed physician");
    const details = {
      scheduledDate: String(appointment?.scheduledDate || body.scheduledDate || "To be confirmed"),
      scheduledTime: String(appointment?.scheduledTime || body.scheduledTime || "To be confirmed"),
      durationMinutes: Number(appointment?.durationMinutes || body.durationMinutes || 15),
      purpose: String(appointment?.purpose || body.purpose || "Medical fitness consultation"),
      appointmentId: String(appointment?.appointmentId || roomKey || "—"),
      notes: String(appointment?.notes || body.notes || ""),
    };

    await notifyPerson({
      toEmail: email,
      toName: name,
      role: "user",
      subject: `FitMed video consultation with ${doctorName}`,
      htmlContent: EmailTemplates.telehealthInvite(name, doctorName, meetingLink, details),
      snippet: `Join ${doctorName} on ${details.scheduledDate} at ${details.scheduledTime}.`,
      href: meetingLink,
    });

    return NextResponse.json({
      success: true,
      meetingLink,
      emailSent: true,
      message: `Invitation successfully sent to ${email}.`,
    });
  } catch (error: any) {
    console.error("Telehealth invite error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
