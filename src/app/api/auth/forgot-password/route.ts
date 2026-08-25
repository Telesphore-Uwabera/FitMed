import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword, isReusedPassword, nextPasswordHistory } from "@/lib/password";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function passwordsMatch(a?: string, b?: string) {
  return Boolean(a) && a === b;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, otp, newPassword, confirmPassword } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    await connectToDatabase();

    if (action === "request_otp") {
      const user = await User.findOne({ email: cleanEmail }).select("email name fullName");
      if (!user) {
        return NextResponse.json({ success: false, error: "No FitMed account uses this email." }, { status: 404 });
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(cleanEmail, {
        otp: generatedOtp,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      await sendBrevoEmail({
        toEmail: cleanEmail,
        toName: user.fullName || user.name || "FitMed User",
        subject: "FitMed password reset code — not a sign-in",
        htmlContent: EmailTemplates.forgotPasswordOTP(
          (user.fullName || user.name || cleanEmail.split("@")[0]) as string,
          generatedOtp
        ),
      });

      return NextResponse.json({
        success: true,
        message: `6-digit reset code sent to ${cleanEmail}.`,
      });
    }

    if (action === "reset_password") {
      if (!otp || !newPassword) {
        return NextResponse.json({ error: "OTP and new password are required" }, { status: 400 });
      }
      if (!passwordsMatch(newPassword, confirmPassword)) {
        return NextResponse.json({ error: "New password and confirmation do not match." }, { status: 400 });
      }
      if (String(newPassword).length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }

      const stored = otpStore.get(cleanEmail);
      if (!stored || stored.otp !== String(otp).trim()) {
        return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
      }
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(cleanEmail);
        return NextResponse.json({ error: "Verification code has expired." }, { status: 400 });
      }

      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return NextResponse.json({ success: false, error: "No FitMed account uses this email." }, { status: 404 });
      }

      const previous = Array.isArray(user.previousPasswords) ? user.previousPasswords : [];
      if (isReusedPassword(newPassword, user.password, previous) || (user.temporaryPassword && isReusedPassword(newPassword, user.temporaryPassword, []))) {
        return NextResponse.json(
          { error: "Choose a new password. You cannot reuse a password you have used before." },
          { status: 400 }
        );
      }

      user.previousPasswords = nextPasswordHistory(user.password, previous);
      user.password = hashPassword(newPassword);
      user.requiresPasswordReset = false;
      user.temporaryPassword = undefined;
      await user.save();
      otpStore.delete(cleanEmail);

      const name = user.fullName || user.name || "FitMed user";
      await sendBrevoEmail({
        toEmail: cleanEmail,
        toName: name,
        subject: "Your FitMed password was changed",
        htmlContent: EmailTemplates.passwordChanged(name),
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: "Your password has been reset. Sign in with the new password.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    const message = error instanceof Error ? error.message : "Password reset failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
