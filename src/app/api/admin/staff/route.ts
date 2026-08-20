import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { seedFitMedAccounts } from "@/lib/seedAccounts";
import { generateTempPassword, hashPassword } from "@/lib/password";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";

export async function GET() {
  try {
    await connectToDatabase();
    await seedFitMedAccounts();

    const users = await User.find({ role: { $in: ["admin", "doctor"] } })
      .select("fullName name email role status createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const doctors = await Doctor.find({}).select("fullName email licenseNumber specialty status isVerified").lean();

    return NextResponse.json({
      success: true,
      admins: users.filter((u) => u.role === "admin"),
      doctors: doctors.map((d) => ({
        id: String(d._id),
        name: d.fullName,
        email: d.email,
        license: d.licenseNumber,
        role: d.specialty,
        status: d.isVerified ? "Active" : "Pending",
      })),
      staff: users,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load staff.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = body.role === "admin" ? "admin" : "doctor";
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const license = String(body.license || body.licenseNumber || "").trim();
    const specialty = String(body.specialty || "Occupational Medicine & Telehealth").trim();
    const avatarUrl = String(body.avatarUrl || "").trim();

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required." }, { status: 400 });
    }
    if (role === "doctor" && !license) {
      return NextResponse.json({ success: false, error: "Doctor license number is required." }, { status: 400 });
    }

    await connectToDatabase();
    await seedFitMedAccounts();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists." }, { status: 400 });
    }

    const plainPassword = String(body.password || "").trim() || generateTempPassword();
    const user = await User.create({
      fullName: name,
      name,
      email,
      phone,
      password: hashPassword(plainPassword),
      role,
      status: "active",
      avatarUrl: avatarUrl || undefined,
      requiresPasswordReset: !body.password,
      temporaryPassword: body.password ? undefined : plainPassword,
    });

    if (role === "doctor") {
      await Doctor.create({
        user: user._id,
        fullName: name,
        email,
        phone,
        licenseNumber: license,
        specialty,
        avatarUrl: avatarUrl || undefined,
        isVerified: true,
        status: "ONLINE",
      });
    }

    await sendBrevoEmail({
      toEmail: email,
      toName: name,
      subject: role === "admin" ? "Your FitMed administrator account" : "Your FitMed doctor account",
      htmlContent: EmailTemplates.staffAccountCreated(name, email, role, plainPassword),
    });

    return NextResponse.json({
      success: true,
      temporaryPassword: body.password ? undefined : plainPassword,
      user: {
        id: String(user._id),
        name,
        email,
        role,
        license,
        status: "Active",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create account.";
    console.error("Create staff error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
