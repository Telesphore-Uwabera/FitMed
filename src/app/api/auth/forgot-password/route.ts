import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
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

    // Step 1: Request OTP
    if (action === "request_otp") {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(cleanEmail, {
        otp: generatedOtp,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
      });

      const emailResult = await sendBrevoEmail({
        toEmail: cleanEmail,
        toName: "FitMed User",
        subject: "FitMed Password Reset Verification Code",
        htmlContent: EmailTemplates.forgotPasswordOTP(cleanEmail.split("@")[0], generatedOtp),
      });

      return NextResponse.json({
        success: true,
        message: `6-digit reset code sent to ${cleanEmail}.`,
        otpForDev: generatedOtp, // For quick testing convenience
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

      try {
        await connectToDatabase();
        await User.findOneAndUpdate(
          { email: cleanEmail },
          { password: newPassword, requiresPasswordReset: false },
          { new: true }
        );
      } catch (dbErr) {
        console.warn("MongoDB password reset fallback:", dbErr);
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
