import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword, isReusedPassword, nextPasswordHistory, verifyPassword } from "@/lib/password";
import User from "@/models/User";
import { attachAuthCookie } from "@/lib/authCookie";

function sessionRole(role?: string): "admin" | "doctor" | "user" {
  if (role === "admin") return "admin";
  if (role === "doctor") return "doctor";
  return "user";
}

function isBlocked(status?: string) {
  const value = String(status || "").toLowerCase();
  return value === "pending" || value === "pending_approval" || value === "suspended" || value === "rejected";
}

export async function PATCH(request: NextRequest) {
  try {
    const { email, currentPassword, newPassword, confirmPassword } = await request.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !newPassword) {
      return NextResponse.json({ success: false, error: "Email and new password are required." }, { status: 400 });
    }
    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return NextResponse.json({ success: false, error: "New password and confirmation do not match." }, { status: 400 });
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!currentPassword) {
      return NextResponse.json({ success: false, error: "Current password is required." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }

    const ok =
      verifyPassword(currentPassword, user.password) ||
      currentPassword === user.temporaryPassword ||
      verifyPassword(currentPassword, user.temporaryPassword);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 401 });
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { success: false, error: "Choose a new password. You cannot reuse a password you have used before." },
        { status: 400 }
      );
    }

    const previous = Array.isArray(user.previousPasswords) ? user.previousPasswords : [];
    if (isReusedPassword(newPassword, user.password, previous)) {
      return NextResponse.json(
        { success: false, error: "Choose a new password. You cannot reuse a password you have used before." },
        { status: 400 }
      );
    }

    user.previousPasswords = nextPasswordHistory(user.password, previous);
    user.password = hashPassword(newPassword);
    user.temporaryPassword = undefined;
    user.requiresPasswordReset = false;
    await user.save();

    const payload = {
      name: user.fullName || user.name || "FitMed user",
      email: user.email,
      role: sessionRole(user.role),
    };

    const res = NextResponse.json({ success: true, user: payload });
    if (!isBlocked(user.status)) {
      await attachAuthCookie(res, payload);
    }
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Password update failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
