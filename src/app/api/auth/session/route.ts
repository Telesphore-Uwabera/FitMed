import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { COOKIE_NAME, verifySession, clearAuthCookieOptions, attachAuthCookie } from "@/lib/authCookie";
import { normalizeRole } from "@/lib/roles";

function blockedStatus(status?: string) {
  const value = String(status || "").toLowerCase();
  if (value === "pending" || value === "pending_approval") {
    return "Your account is waiting for administrator approval.";
  }
  if (value === "rejected") {
    return "This registration was not approved. Check your email for the reason.";
  }
  return null;
}

export async function GET(request: NextRequest) {
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({ email: session.email });
    if (!user) {
      const res = NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });
      res.cookies.set(COOKIE_NAME, "", clearAuthCookieOptions());
      return res;
    }

    const blocked = blockedStatus(user.status);
    if (blocked) {
      const res = NextResponse.json({ success: false, error: blocked }, { status: 403 });
      res.cookies.set(COOKIE_NAME, "", clearAuthCookieOptions());
      return res;
    }

    const role = normalizeRole(user.role);
    const payload = {
      name: user.fullName || user.name || session.name,
      email: user.email,
      role,
      avatarUrl: user.avatarUrl || "",
      status: user.status,
    };
    const res = NextResponse.json({ success: true, user: payload });
    if (session.role !== role || session.name !== payload.name) {
      await attachAuthCookie(res, { email: payload.email, role, name: payload.name });
    }
    return res;
  } catch {
    return NextResponse.json({ success: false, error: "Could not verify your session." }, { status: 500 });
  }
}
