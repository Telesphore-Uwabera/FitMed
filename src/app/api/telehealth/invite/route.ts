import { NextRequest, NextResponse } from "next/server";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicantEmail, applicantName, patientEmail, patientName, doctorName, scheduledTime, roomUrl } = body;

    const email = applicantEmail || patientEmail;
    const name = applicantName || patientName;

    if (!email || !name) {
      return NextResponse.json({ error: "Applicant email and name required" }, { status: 400 });
    }

    const meetingLink = roomUrl || "https://fitmed.netlify.app/dashboard/user?tab=consultation";

    // Send Brevo Email Invitation
    const emailResult = await sendBrevoEmail({
      toEmail: email,
      toName: name,
      subject: `Live Telehealth Video Assessment Invitation with ${doctorName || "Dr. Telesphore Uwabera"}`,
      htmlContent: EmailTemplates.telehealthInvite(
        name,
        doctorName || "Dr. Telesphore Uwabera, MD",
        meetingLink,
        scheduledTime || "Immediately (Active Room)"
      ),
    });

    return NextResponse.json({
      success: true,
      meetingLink,
      emailSent: emailResult.success,
      message: `Invitation successfully sent to ${email}.`,
    });
  } catch (error: any) {
    console.error("Telehealth invite error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
