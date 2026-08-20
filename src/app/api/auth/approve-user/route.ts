import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates, FITMED_APP_URL } from "@/lib/brevo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json({ error: "Applicant email required" }, { status: 400 });
    }

    // Generate random temporary password e.g. FitMed#9241
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `FitMed#${randomDigits}`;

    try {
      await connectToDatabase();
      await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          status: "active",
          password: hashPassword(tempPassword),
          temporaryPassword: tempPassword,
          requiresPasswordReset: true,
        },
        { new: true, upsert: true }
      );
    } catch (dbErr) {
      console.warn("MongoDB approve user fallback:", dbErr);
    }

    // Send email with temporary password
    const emailResult = await sendBrevoEmail({
      toEmail: email,
      toName: name || "FitMed Applicant",
      subject: "Your FitMed account is approved — sign-in details inside",
      htmlContent: EmailTemplates.applicantAccountApprovedWithTempPassword(
        name || "Applicant",
        email,
        tempPassword,
        `${FITMED_APP_URL}/signin`
      ),
    });

    return NextResponse.json({
      success: true,
      tempPassword,
      emailSent: emailResult.success,
      message: `Account approved and temporary password dispatched to ${email}.`,
    });
  } catch (error: any) {
    console.error("Approve user error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
