import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { COOKIE_NAME, verifySession } from "@/lib/authCookie";

function profileFromUser(user: Record<string, unknown> & { _id: unknown; fullName?: string; name?: string; email: string; role?: string }) {
  return {
    id: String(user._id),
    name: user.fullName || user.name || "",
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    nationalId: user.nationalId || "",
    nationalIdImageUrl: user.nationalIdImageUrl || "",
    avatarUrl: user.avatarUrl || "",
    dateOfBirth: user.dateOfBirth || "",
    gender: user.gender || "",
    address: user.address || "",
    status: user.status,
  };
}

async function sessionUser(request: NextRequest) {
  return verifySession(request.cookies.get(COOKIE_NAME)?.value);
}

export async function GET(request: NextRequest) {
  try {
    const session = await sessionUser(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });
    }

    const requested = String(request.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
    const email = session.role === "admin" && requested ? requested : session.email;

    await connectToDatabase();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, user: profileFromUser(user) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await sessionUser(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const requested = String(body.email || "").trim().toLowerCase();
    const email = session.role === "admin" && requested ? requested : session.email;

    await connectToDatabase();
    const update: Record<string, unknown> = {};
    if (body.name) {
      update.name = body.name;
      update.fullName = body.name;
    }
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.nationalId !== undefined) update.nationalId = body.nationalId;
    if (body.avatarUrl !== undefined) update.avatarUrl = body.avatarUrl;
    if (body.dateOfBirth !== undefined) update.dateOfBirth = body.dateOfBirth;
    if (body.gender !== undefined) update.gender = body.gender;
    if (body.address !== undefined) update.address = body.address;
    if (body.nationalIdImageUrl !== undefined) update.nationalIdImageUrl = body.nationalIdImageUrl;

    const user = await User.findOneAndUpdate({ email }, update, { new: true });
    if (!user) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, user: profileFromUser(user) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
