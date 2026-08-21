import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates, FITMED_APP_URL } from "@/lib/brevo";

function sessionRole(role?: string): "admin" | "doctor" | "user" {
  if (role === "admin") return "admin";
  if (role === "doctor") return "doctor";
  return "user";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const nameHint = String(body.name || "").trim();

    if (!email) {
      return NextResponse.json({ success: false, error: "Applicant email required." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: "This applicant is not registered." }, { status: 404 });
    }

    const role = sessionRole(user.role);
    if (role !== "user") {
      return NextResponse.json({ success: false, error: "Only applicant accounts can be approved here." }, { status: 400 });
    }

    const name = user.fullName || user.name || nameHint || "Applicant";
    const hasOwnPassword = Boolean(user.password);
    let tempPassword = "";

    user.status = "Active";
    if (hasOwnPassword) {
      user.requiresPasswordReset = false;
    } else {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      tempPassword = `FitMed#${randomDigits}`;
      user.password = hashPassword(tempPassword);
      user.temporaryPassword = tempPassword;
      user.requiresPasswordReset = true;
    }
    await user.save();

    const emailResult = hasOwnPassword
      ? await sendBrevoEmail({
          toEmail: email,
          toName: name,
          subject: "Your FitMed account is approved",
          htmlContent: EmailTemplates.applicantAccountApprovedOwnPassword(name, `${FITMED_APP_URL}/signin`),
        })
      : await sendBrevoEmail({
          toEmail: email,
          toName: name,
          subject: "Your FitMed account is approved — sign-in details inside",
          htmlContent: EmailTemplates.applicantAccountApprovedWithTempPassword(
            name,
            email,
            tempPassword,
            `${FITMED_APP_URL}/signin`
          ),
        });

    return NextResponse.json({
      success: true,
      usedOwnPassword: hasOwnPassword,
      emailSent: emailResult.success,
      message: hasOwnPassword
        ? `Account approved. ${name} can sign in with the password they created at registration.`
        : `Account approved and a first-time sign-in password was emailed to ${email}.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Approval failed.";
    console.error("Approve user error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
