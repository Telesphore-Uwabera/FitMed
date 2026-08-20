import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

function profileFromUser(user: any) {
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

export async function GET(request: NextRequest) {
  try {
    const email = String(request.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
    }
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
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ success: false, error: "email is required" }, { status: 400 });
    }
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
