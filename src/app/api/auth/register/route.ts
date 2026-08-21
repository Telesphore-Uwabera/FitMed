import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, nationalId, password, avatarUrl, idDocUrl } = body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "").trim();
    const cleanNationalId = String(nationalId || "").trim();
    const cleanPassword = String(password || "");

    if (!cleanName || !cleanEmail || !cleanNationalId) {
      return NextResponse.json(
        { success: false, error: "Name, email and National ID are required." },
        { status: 400 }
      );
    }
    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Please choose a password of at least 6 characters." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    await User.create({
      name: cleanName,
      fullName: cleanName,
      email: cleanEmail,
      phone: phone || "",
      nationalId: cleanNationalId,
      password: hashPassword(cleanPassword),
      avatarUrl: avatarUrl || undefined,
      nationalIdImageUrl: idDocUrl || "",
      role: "user",
      status: "pending_approval",
      requiresPasswordReset: false,
    });

    await sendBrevoEmail({
      toEmail: "info.teletech.rw@gmail.com",
      toName: "FitMed Admin",
      subject: `New Applicant Registration Pending Approval: ${cleanName}`,
      htmlContent: EmailTemplates.adminNewApplicantNotification(cleanName, cleanEmail, cleanNationalId),
    });
    await sendBrevoEmail({
      toEmail: cleanEmail,
      toName: cleanName,
      subject: "FitMed received your registration — wait for approval",
      htmlContent: EmailTemplates.welcomeApplicantPending(cleanName),
    });

    return NextResponse.json({
      success: true,
      message:
        "Registration submitted successfully. Your account will be activated once an administrator verifies your National ID.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    console.error("Register error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
