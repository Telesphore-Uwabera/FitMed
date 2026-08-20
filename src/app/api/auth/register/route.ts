import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, nationalId, password, avatarUrl, idDocUrl } = body;

    if (!name || !email || !nationalId) {
      return NextResponse.json({ error: "Name, email and National ID are required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
      }

      await User.create({
        name,
        fullName: name,
        email: email.toLowerCase(),
        phone: phone || "+250 788 123 456",
        nationalId,
        password: password ? hashPassword(password) : undefined,
        avatarUrl,
        nationalIdImageUrl: idDocUrl,
        role: "user",
        status: "pending_approval",
        requiresPasswordReset: true,
      });
    } catch (dbErr) {
      console.warn("MongoDB register fallback:", dbErr);
    }

    // Send notification to Admin
    await sendBrevoEmail({
      toEmail: "info.teletech.rw@gmail.com",
      toName: "FitMed Admin",
      subject: `New Applicant Registration Pending Approval: ${name}`,
      htmlContent: EmailTemplates.adminNewApplicantNotification(name, email, nationalId),
    });
    await sendBrevoEmail({
      toEmail: email,
      toName: name,
      subject: "FitMed received your registration",
      htmlContent: EmailTemplates.welcomeApplicantPending(name),
    });

    return NextResponse.json({
      success: true,
      message: "Registration submitted successfully! Your account will be activated once your National ID is verified by admin.",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
