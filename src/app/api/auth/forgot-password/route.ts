import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";

// In-memory OTP storage for rapid verification
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, otp, newPassword } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase();
    await connectToDatabase();

    // Step 1: Request OTP
    if (action === "request_otp") {
      const user = await User.findOne({ email: cleanEmail }).select("email name fullName");
      if (!user) {
        return NextResponse.json({ success: false, error: "No FitMed account uses this email." }, { status: 404 });
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(cleanEmail, {
        otp: generatedOtp,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
      });

      await sendBrevoEmail({
        toEmail: cleanEmail,
        toName: user.fullName || user.name || "FitMed User",
        subject: "FitMed Password Reset Verification Code",
        htmlContent: EmailTemplates.forgotPasswordOTP((user.fullName || user.name || cleanEmail.split("@")[0]) as string, generatedOtp),
      });

      return NextResponse.json({
        success: true,
        message: `6-digit reset code sent to ${cleanEmail}.`,
      });
    }

    // Step 2: Verify OTP & Reset Password
    if (action === "reset_password") {
      if (!otp || !newPassword) {
        return NextResponse.json({ error: "OTP and new password are required" }, { status: 400 });
      }

      const stored = otpStore.get(cleanEmail);
      if (!stored || stored.otp !== otp.trim()) {
        return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(cleanEmail);
        return NextResponse.json({ error: "Verification code has expired." }, { status: 400 });
      }

      const user = await User.findOneAndUpdate(
        { email: cleanEmail },
        { password: hashPassword(newPassword), requiresPasswordReset: false, temporaryPassword: undefined },
        { new: true }
      );
      if (!user) {
        return NextResponse.json({ success: false, error: "No FitMed account uses this email." }, { status: 404 });
      }

      otpStore.delete(cleanEmail);

      return NextResponse.json({
        success: true,
        message: "Your password has been successfully reset! You may now sign in.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
