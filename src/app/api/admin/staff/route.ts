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

    const users = await User.find({ role: { $in: ["admin", "doctor"] } })
      .select("fullName name email role status createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const doctors = await Doctor.find({})
      .select("fullName email licenseNumber specialty status isVerified avatarUrl weeklySchedule totalCertificatesIssued")
      .lean();
    const userByEmail = new Map(users.map((u) => [String(u.email || "").toLowerCase(), u]));

    return NextResponse.json({
      success: true,
      admins: users.filter((u) => u.role === "admin"),
      doctors: doctors.map((d) => {
        const linked = userByEmail.get(String(d.email || "").toLowerCase());
        const suspended = String(linked?.status || "").toLowerCase() === "suspended";
        return {
          id: String(d._id),
          name: d.fullName,
          email: d.email,
          license: d.licenseNumber,
          role: d.specialty,
          specialty: d.specialty,
          avatarUrl: d.avatarUrl || "",
          presence: d.status,
          weeklySchedule: d.weeklySchedule || [],
          totalCertificatesIssued: d.totalCertificatesIssued || 0,
          status: suspended ? "Suspended" : d.isVerified ? "Active" : "Pending",
        };
      }),
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
      oneTimePassword: body.password ? undefined : plainPassword,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const action = String(body.action || "").trim();
    if (!id || !action) {
      return NextResponse.json({ success: false, error: "Staff member and action are required." }, { status: 400 });
    }

    await connectToDatabase();
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found." }, { status: 404 });
    }
    const user = await User.findOne({ email: doctor.email });

    if (action === "approve") {
      doctor.isVerified = true;
      doctor.status = "ONLINE";
      await doctor.save();
      if (user) {
        user.status = "active";
        await user.save();
      }
      return NextResponse.json({ success: true, status: "Active" });
    }

    if (action === "suspend") {
      if (user) {
        user.status = "Suspended";
        await user.save();
      }
      doctor.status = "OFF";
      await doctor.save();
      return NextResponse.json({ success: true, status: "Suspended" });
    }

    if (action === "activate") {
      doctor.isVerified = true;
      doctor.status = "ONLINE";
      await doctor.save();
      if (user) {
        user.status = "active";
        await user.save();
      }
      return NextResponse.json({ success: true, status: "Active" });
    }

    if (action === "reset-password" && user) {
      const oneTimePassword = generateTempPassword();
      const mail = await sendBrevoEmail({
        toEmail: user.email,
        toName: user.fullName || user.name || doctor.fullName,
        subject: "Your FitMed account sign-in details",
        htmlContent: EmailTemplates.staffAccountCreated(
          user.fullName || user.name || doctor.fullName,
          user.email,
          user.role === "admin" ? "admin" : "doctor",
          oneTimePassword
        ),
      });
      if (!mail.success) {
        return NextResponse.json(
          { success: false, error: "The sign-in email could not be sent, so the password was not changed. Check Brevo and try again." },
          { status: 502 }
        );
      }
      user.password = hashPassword(oneTimePassword);
      user.temporaryPassword = oneTimePassword;
      user.requiresPasswordReset = true;
      await user.save();
      return NextResponse.json({ success: true, emailSent: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not update staff account.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Doctor id is required." }, { status: 400 });
    }
    await connectToDatabase();
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found." }, { status: 404 });
    }
    await User.deleteOne({ email: doctor.email, role: "doctor" });
    await Doctor.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not delete doctor.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
