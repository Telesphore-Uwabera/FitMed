import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { seedFitMedAccounts } from "@/lib/seedAccounts";
import { generateTempPassword, hashPassword } from "@/lib/password";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Schedule from "@/models/Schedule";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";
import { ensureDoctorIds, nextDoctorId } from "@/lib/sequentialIds";
import StaffTitle, { DEFAULT_STAFF_TITLES } from "@/models/StaffTitle";
import { checkAndNotifyExpiringLicenses } from "@/lib/licenseExpiry";
import { COOKIE_NAME, verifySession } from "@/lib/authCookie";

async function listStaffTitles() {
  await StaffTitle.bulkWrite(
    DEFAULT_STAFF_TITLES.map((title) => ({
      updateOne: { filter: { title }, update: { $setOnInsert: { title } }, upsert: true },
    })),
    { ordered: false }
  ).catch(() => null);
  const rows = await StaffTitle.find({}).sort({ title: 1 }).select("title").lean();
  return rows.map((row) => String(row.title));
}

export async function GET() {
  try {
    await connectToDatabase();

    // Check expiring licenses in background
    checkAndNotifyExpiringLicenses().catch((err) =>
      console.warn("[staff/GET] background license check error:", err)
    );

    const users = await User.find({ role: { $nin: ["user", "applicant"] } })
      .select("fullName name email phone role status createdAt jobTitle bio avatarUrl")
      .sort({ createdAt: -1 })
      .lean();
    await ensureDoctorIds();
    const doctors = await Doctor.find({})
      .select(
        "fullName email phone licenseNumber licenseExpiryDate doctorId specialty status isVerified avatarUrl weeklySchedule totalCertificatesIssued nationalIdUrl licenseCertificateUrl diplomaUrl"
      )
      .sort({ createdAt: 1 })
      .lean();
    const userByEmail = new Map(users.map((u) => [String(u.email || "").toLowerCase(), u]));

    return NextResponse.json({
      success: true,
      admins: users.filter((u) => u.role === "admin"),
      teamMembers: users.filter((u) => String(u.role || "").toLowerCase() === "staff"),
      doctors: doctors.map((d) => {
        const linked = userByEmail.get(String(d.email || "").toLowerCase());
        const suspended = String(linked?.status || "").toLowerCase() === "suspended";
        return {
          id: String(d._id),
          doctorId: String(d.doctorId || ""),
          name: d.fullName,
          email: d.email,
          phone: d.phone || linked?.phone || "",
          license: d.licenseNumber,
          licenseExpiryDate: d.licenseExpiryDate ? new Date(d.licenseExpiryDate).toISOString() : "",
          role: d.specialty,
          specialty: d.specialty,
          avatarUrl: d.avatarUrl || "",
          nationalIdUrl: d.nationalIdUrl || "",
          licenseCertificateUrl: d.licenseCertificateUrl || "",
          diplomaUrl: d.diplomaUrl || "",
          presence: d.status,
          weeklySchedule: d.weeklySchedule || [],
          totalCertificatesIssued: d.totalCertificatesIssued || 0,
          status: suspended ? "Suspended" : d.isVerified ? "Active" : "Pending",
        };
      }),
      staff: users,
      titles: await listStaffTitles(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load staff.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestedRole = String(body.role || "doctor").trim().toLowerCase();
    const role = requestedRole === "admin" ? "admin" : requestedRole === "staff" ? "staff" : "doctor";
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const license = String(body.license || body.licenseNumber || "").trim();
    const rawLicenseExpiry = body.licenseExpiryDate ? new Date(body.licenseExpiryDate) : undefined;
    const licenseExpiryDate =
      rawLicenseExpiry && !isNaN(rawLicenseExpiry.getTime()) ? rawLicenseExpiry : undefined;
    const specialty = String(body.specialty || "Occupational Medicine & Telehealth").trim();
    const avatarUrl = String(body.avatarUrl || "").trim();
    const nationalIdUrl = String(body.nationalIdUrl || "").trim();
    const licenseCertificateUrl = String(body.licenseCertificateUrl || "").trim();
    const diplomaUrl = String(body.diplomaUrl || "").trim();
    const jobTitle = String(body.jobTitle || body.title || "").trim();
    const bio = String(body.bio || "").trim();
    const newTitle = String(body.newTitle || "").trim();
    const resolvedTitle = newTitle || jobTitle;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required." }, { status: 400 });
    }
    if (role === "doctor" && !license) {
      return NextResponse.json({ success: false, error: "Doctor license number is required." }, { status: 400 });
    }
    if (role === "staff" && !resolvedTitle) {
      return NextResponse.json({ success: false, error: "Choose a staff title, or add a new one." }, { status: 400 });
    }
    if (role === "staff" && !bio) {
      return NextResponse.json({ success: false, error: "Add a short bio for the About Us page." }, { status: 400 });
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
      nationalIdImageUrl: nationalIdUrl || undefined,
      jobTitle: resolvedTitle || (role === "admin" ? "Platform Administrator" : specialty),
      bio,
      showOnAbout: true,
      requiresPasswordReset: role !== "staff" && !body.password,
      temporaryPassword: role !== "staff" && !body.password ? plainPassword : undefined,
    });

    if (resolvedTitle) {
      await StaffTitle.updateOne({ title: resolvedTitle }, { $setOnInsert: { title: resolvedTitle } }, { upsert: true }).catch(
        () => null
      );
    }

    if (role === "doctor") {
      await Doctor.create({
        user: user._id,
        fullName: name,
        email,
        phone,
        licenseNumber: license,
        licenseExpiryDate,
        doctorId: await nextDoctorId(),
        specialty,
        avatarUrl: avatarUrl || undefined,
        nationalIdUrl: nationalIdUrl || undefined,
        licenseCertificateUrl: licenseCertificateUrl || undefined,
        diplomaUrl: diplomaUrl || undefined,
        isVerified: true,
        status: "ONLINE",
      });
    }

    if (role !== "staff") {
      await sendBrevoEmail({
        toEmail: email,
        toName: name,
        subject: role === "admin" ? "Your FitMed administrator account" : "Your FitMed doctor account",
        htmlContent: EmailTemplates.staffAccountCreated(name, email, role, plainPassword),
      });
    }

    return NextResponse.json({
      success: true,
      oneTimePassword: body.password ? undefined : plainPassword,
      user: {
        id: String(user._id),
        name,
        email,
        role,
        jobTitle: resolvedTitle,
        license,
        licenseExpiryDate: licenseExpiryDate?.toISOString(),
        status: "Active",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create account.";
    console.error("Create staff error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PUT: Full CRUD update for all staff (Doctor, Admin, Staff).
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required." }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Locate Doctor and User records
    let doctor = await Doctor.findById(id);
    let user: any = null;

    if (doctor) {
      user = await User.findOne({ email: doctor.email });
    } else {
      user = await User.findById(id);
      if (user) {
        doctor = await Doctor.findOne({ email: user.email });
      }
    }

    if (!doctor && !user) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    // 2. Extract update fields
    const name = String(body.name || body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const role = String(body.role || "").trim().toLowerCase();
    const status = String(body.status || "").trim();
    const jobTitle = String(body.jobTitle || "").trim();
    const bio = String(body.bio || "").trim();
    const avatarUrl = String(body.avatarUrl || "").trim();
    const license = String(body.license || body.licenseNumber || "").trim();
    const specialty = String(body.specialty || "").trim();
    const nationalIdUrl = String(body.nationalIdUrl || "").trim();
    const licenseCertificateUrl = String(body.licenseCertificateUrl || "").trim();
    const diplomaUrl = String(body.diplomaUrl || "").trim();
    const password = String(body.password || "").trim();

    let licenseExpiryDate: Date | undefined | null = undefined;
    if (body.licenseExpiryDate !== undefined) {
      if (!body.licenseExpiryDate) {
        licenseExpiryDate = null;
      } else {
        const parsed = new Date(body.licenseExpiryDate);
        if (!isNaN(parsed.getTime())) licenseExpiryDate = parsed;
      }
    }

    // 3. Update User
    if (user) {
      if (name) {
        user.fullName = name;
        user.name = name;
      }
      if (phone !== undefined) user.phone = phone;
      if (role && ["admin", "doctor", "staff"].includes(role)) user.role = role;
      if (status) user.status = status.toLowerCase() === "active" ? "active" : "Suspended";
      if (jobTitle !== undefined) user.jobTitle = jobTitle;
      if (bio !== undefined) user.bio = bio;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      if (nationalIdUrl) user.nationalIdImageUrl = nationalIdUrl;
      if (password) {
        user.password = hashPassword(password);
        user.requiresPasswordReset = false;
      }
      await user.save();
    }

    // 4. Update Doctor (if doctor record exists or role is doctor)
    if (doctor) {
      if (name) doctor.fullName = name;
      if (phone !== undefined) doctor.phone = phone;
      if (license) doctor.licenseNumber = license;
      if (specialty) doctor.specialty = specialty;
      if (licenseExpiryDate !== undefined) {
        doctor.licenseExpiryDate = licenseExpiryDate || undefined;
      }
      if (avatarUrl) doctor.avatarUrl = avatarUrl;
      if (nationalIdUrl) doctor.nationalIdUrl = nationalIdUrl;
      if (licenseCertificateUrl) doctor.licenseCertificateUrl = licenseCertificateUrl;
      if (diplomaUrl) doctor.diplomaUrl = diplomaUrl;

      if (status) {
        const isActive = status.toLowerCase() === "active";
        doctor.isVerified = isActive;
        doctor.status = isActive ? "ONLINE" : "OFF";
      }
      await doctor.save();
    } else if (role === "doctor" && user) {
      // If user was promoted to doctor and didn't have doctor model before
      doctor = await Doctor.create({
        user: user._id,
        fullName: name || user.fullName || user.name,
        email: user.email,
        phone: phone || user.phone,
        licenseNumber: license || "RMDC-PENDING",
        licenseExpiryDate: licenseExpiryDate || undefined,
        doctorId: await nextDoctorId(),
        specialty: specialty || "General Practitioner",
        avatarUrl: avatarUrl || user.avatarUrl,
        nationalIdUrl: nationalIdUrl || user.nationalIdImageUrl,
        licenseCertificateUrl: licenseCertificateUrl || undefined,
        diplomaUrl: diplomaUrl || undefined,
        isVerified: true,
        status: "ONLINE",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Staff details updated successfully.",
      user: {
        id: String(user?._id || doctor?._id),
        name: name || user?.fullName || doctor?.fullName,
        email: user?.email || doctor?.email,
        role: user?.role || "doctor",
        status: status || (user?.status === "active" ? "Active" : "Suspended"),
        phone: phone || user?.phone || doctor?.phone,
        license: doctor?.licenseNumber,
        licenseExpiryDate: doctor?.licenseExpiryDate ? new Date(doctor.licenseExpiryDate).toISOString() : "",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not update staff member.";
    console.error("PUT staff error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const action = String(body.action || "").trim();

    // Route action === "update" to the full update handler
    if (action === "update") {
      return PUT(request);
    }

    if (!id || !action) {
      return NextResponse.json({ success: false, error: "Staff member and action are required." }, { status: 400 });
    }

    await connectToDatabase();
    let doctor = await Doctor.findById(id);
    let user = doctor ? await User.findOne({ email: doctor.email }) : await User.findById(id);

    if (!doctor && user) {
      doctor = await Doctor.findOne({ email: user.email });
    }

    if (!doctor && !user) {
      return NextResponse.json({ success: false, error: "Staff account not found." }, { status: 404 });
    }

    if (action === "approve") {
      if (doctor) {
        doctor.isVerified = true;
        doctor.status = "ONLINE";
        await doctor.save();
      }
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
      if (doctor) {
        doctor.status = "OFF";
        await doctor.save();
      }
      return NextResponse.json({ success: true, status: "Suspended" });
    }

    if (action === "activate") {
      if (doctor) {
        doctor.isVerified = true;
        doctor.status = "ONLINE";
        await doctor.save();
      }
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
        toName: user.fullName || user.name || doctor?.fullName || "Staff Member",
        subject: "Your FitMed account sign-in details",
        htmlContent: EmailTemplates.staffAccountCreated(
          user.fullName || user.name || doctor?.fullName || "Staff Member",
          user.email,
          user.role === "admin" ? "admin" : "doctor",
          oneTimePassword
        ),
      });
      if (!mail.success) {
        return NextResponse.json(
          { success: false, error: "The sign-in email could not be sent. Check Brevo and try again." },
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
    const rawId = (searchParams.get("id") || "").trim();
    const rawEmail = (searchParams.get("email") || "").trim().toLowerCase();

    if (!rawId && !rawEmail) {
      return NextResponse.json({ success: false, error: "Staff member ID or email is required." }, { status: 400 });
    }

    const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);

    await connectToDatabase();

    const isValidId = mongoose.isValidObjectId(rawId);

    // 1. Check if Doctor exists by _id, doctorId, or email
    let doctor: any = null;
    if (isValidId) {
      doctor = await Doctor.findById(rawId);
    }
    if (!doctor && rawId) {
      doctor = await Doctor.findOne({
        $or: [
          { doctorId: rawId.toUpperCase() },
          { email: rawId.toLowerCase() },
          { licenseNumber: rawId },
        ],
      });
    }
    if (!doctor && rawEmail) {
      doctor = await Doctor.findOne({ email: rawEmail });
    }

    // 2. Check if User exists by _id or email
    let user: any = null;
    if (isValidId) {
      user = await User.findById(rawId);
    }
    if (!user && rawEmail) {
      user = await User.findOne({ email: rawEmail });
    }
    if (!user && doctor?.email) {
      user = await User.findOne({ email: doctor.email.toLowerCase() });
    }
    if (!doctor && user?.email) {
      doctor = await Doctor.findOne({ email: user.email.toLowerCase() });
    }

    if (!doctor && !user) {
      return NextResponse.json({ success: false, error: "Staff member not found." }, { status: 404 });
    }

    // Safety check: Prevent deleting currently active administrator account
    const targetEmail = (doctor?.email || user?.email || "").toLowerCase();
    if (session?.email && targetEmail === session.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own active administrator account while signed in." },
        { status: 400 }
      );
    }

    // Clean up Doctor
    if (doctor) {
      await Doctor.findByIdAndDelete(doctor._id);
    }

    // Clean up User
    if (user) {
      await User.findByIdAndDelete(user._id);
    }
    if (targetEmail) {
      const escaped = targetEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const emailRegex = new RegExp(`^${escaped}$`, "i");
      await User.deleteMany({ email: emailRegex });
      await Doctor.deleteMany({ email: emailRegex });
      await Schedule.deleteMany({ doctorEmail: emailRegex }).catch(() => null);
    }

    return NextResponse.json({ success: true, message: "Staff account deleted successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not delete staff member.";
    console.error("Delete staff error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
