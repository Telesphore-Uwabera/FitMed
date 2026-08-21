import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Certificate from "@/models/Certificate";
import { approveApplicantAccount, rejectApplicantAccount, resetApplicantPasswordWithApprovalEmail } from "@/lib/approveApplicant";
import { ensureApplicantIds } from "@/lib/sequentialIds";

const PENDING = new Set(["pending", "Pending", "pending_approval"]);

function displayStatus(raw: string) {
  if (PENDING.has(raw)) return raw;
  const value = raw.toLowerCase();
  if (value === "suspended") return "Suspended";
  if (value === "rejected") return "Rejected";
  return "Active";
}

async function findApplicant(id: string, email?: string) {
  const roleFilter = { $nor: [{ role: "admin" }, { role: "doctor" }] };
  if (email) {
    const byEmail = await User.findOne({ ...roleFilter, email: email.trim().toLowerCase() });
    if (byEmail) return byEmail;
  }
  if (mongoose.isValidObjectId(id)) {
    const byId = await User.findOne({ ...roleFilter, _id: id });
    if (byId) return byId;
  }
  return User.findOne({
    ...roleFilter,
    $or: [
      { email: id.trim().toLowerCase() },
      { nationalId: id },
      { applicantId: id.trim().toUpperCase() },
    ],
  });
}

function mapApplicant(u: Record<string, unknown>, certCount = 0) {
  const status = displayStatus(String(u.status || "Active"));
  return {
    id: String(u._id),
    applicantId: String(u.applicantId || ""),
    name: String(u.fullName || u.name || "Applicant"),
    email: String(u.email || ""),
    phone: String(u.phone || "—"),
    nationalId: String(u.nationalId || "—"),
    idDocUrl: String(u.nationalIdImageUrl || ""),
    avatarUrl: String(u.avatarUrl || ""),
    dateOfBirth: String(u.dateOfBirth || "—"),
    gender: String(u.gender || "—"),
    address: String(u.address || "—"),
    applied: u.createdAt ? new Date(String(u.createdAt)).toLocaleString() : "—",
    joined: u.createdAt ? new Date(String(u.createdAt)).toLocaleDateString() : "—",
    status,
    certs: certCount,
  };
}

export async function GET() {
  try {
    await connectToDatabase();
    await ensureApplicantIds();
    const users = await User.find({
      $nor: [{ role: "admin" }, { role: "doctor" }],
    })
      .select("applicantId fullName name email phone nationalId nationalIdImageUrl avatarUrl status createdAt dateOfBirth gender address")
      .sort({ createdAt: -1 })
      .lean();

    let certCounts = new Map<string, number>();
    try {
      const certificates = await Certificate.find({}).select("applicantEmail").lean();
      for (const cert of certificates) {
        const email = String(cert.applicantEmail || "").toLowerCase();
        if (!email) continue;
        certCounts.set(email, (certCounts.get(email) || 0) + 1);
      }
    } catch {
      certCounts = new Map();
    }

    const mapped = users.map((u) =>
      mapApplicant(u as Record<string, unknown>, certCounts.get(String(u.email || "").toLowerCase()) || 0)
    );

    return NextResponse.json({
      success: true,
      pending: mapped.filter((u) => PENDING.has(u.status)),
      applicants: mapped.filter((u) => !PENDING.has(u.status)),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load applicants.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const email = String(body.email || "").trim();
    const action = String(body.action || "").trim();
    if ((!id && !email) || !action) {
      return NextResponse.json({ success: false, error: "Applicant and action are required." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await findApplicant(id, email);
    if (!user) {
      return NextResponse.json({ success: false, error: "Applicant not found." }, { status: 404 });
    }

    if (action === "approve") {
      const result = await approveApplicantAccount(user.email, user.fullName || user.name || "");
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: result.status });
      }
      return NextResponse.json(result);
    }

    if (action === "reject") {
      const result = await rejectApplicantAccount(user.email, String(body.reason || ""), user.fullName || user.name || "");
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: result.status });
      }
      return NextResponse.json(result);
    }

    if (action === "suspend") {
      user.status = "Suspended";
      await user.save();
      return NextResponse.json({ success: true, status: user.status });
    }

    if (action === "activate") {
      user.status = "Active";
      await user.save();
      return NextResponse.json({ success: true, status: user.status });
    }

    if (action === "reset-password") {
      const result = await resetApplicantPasswordWithApprovalEmail(user);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: result.status });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not update applicant.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    const email = searchParams.get("email") || "";
    if (!id && !email) {
      return NextResponse.json({ success: false, error: "Applicant id is required." }, { status: 400 });
    }
    await connectToDatabase();
    const user = await findApplicant(id, email);
    if (!user) {
      return NextResponse.json({ success: false, error: "Applicant not found." }, { status: 404 });
    }
    await User.findByIdAndDelete(user._id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not delete applicant.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
