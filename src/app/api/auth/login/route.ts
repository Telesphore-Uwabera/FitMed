import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { seedFitMedAccounts } from "@/lib/seedAccounts";
import { verifyPassword } from "@/lib/password";
import User from "@/models/User";
import { attachAuthCookie } from "@/lib/authCookie";

function sessionRole(role?: string): "admin" | "doctor" | "user" {
  if (role === "admin") return "admin";
  if (role === "doctor") return "doctor";
  return "user";
}

function userPayload(user: { fullName?: string; name?: string; email: string; role?: string; phone?: string; nationalId?: string; avatarUrl?: string; dateOfBirth?: string; gender?: string; address?: string }) {
  const role = sessionRole(user.role);
  return {
    name: user.fullName || user.name || "FitMed user",
    email: user.email,
    role,
    phone: user.phone || "",
    nationalId: user.nationalId || "",
    avatarUrl: user.avatarUrl || "",
    dateOfBirth: user.dateOfBirth || "",
    gender: user.gender || "",
    address: user.address || "",
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });
    }

    await connectToDatabase();
    await seedFitMedAccounts();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ success: false, error: "No account found with that email address." }, { status: 404 });
    }

    const status = String(user.status || "").toLowerCase();
    if (status === "pending" || status === "pending_approval") {
      return NextResponse.json(
        { success: false, error: "Your account is waiting for administrator approval. You cannot sign in until it is approved." },
        { status: 403 }
      );
    }
    if (status === "suspended") {
      return NextResponse.json({ success: false, error: "This account has been paused." }, { status: 403 });
    }

    const passwordOk = verifyPassword(password, user.password);
    const tempOk =
      Boolean(user.temporaryPassword) &&
      (password === user.temporaryPassword || verifyPassword(password, user.temporaryPassword));

    if (!passwordOk && !tempOk) {
      return NextResponse.json({ success: false, error: "Incorrect password." }, { status: 401 });
    }

    const payload = userPayload(user);

    if (user.requiresPasswordReset && tempOk && !passwordOk) {
      return NextResponse.json({
        success: true,
        requiresPasswordReset: true,
        user: payload,
      });
    }

    const res = NextResponse.json({ success: true, user: payload });
    await attachAuthCookie(res, { email: payload.email, role: payload.role, name: payload.name });
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Sign-in failed.";
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
