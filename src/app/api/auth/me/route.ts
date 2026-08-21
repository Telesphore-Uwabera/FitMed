import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { COOKIE_NAME, verifySession, attachAuthCookie } from "@/lib/authCookie";
import { isAdminRole, normalizeRole } from "@/lib/roles";
import { findAccountByNationalId, normalizeNationalId } from "@/lib/applicantIdentity";
import { applicantRegistrationError, compactPhone } from "@/lib/registrationRules";
import { ensureApplicantIds } from "@/lib/sequentialIds";

function profileFromUser(user: Record<string, unknown> & { _id: unknown; fullName?: string; name?: string; email: string; role?: string }) {
  return {
    id: String(user._id),
    name: user.fullName || user.name || "",
    email: user.email,
    role: user.role,
    applicantId: user.applicantId || "",
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
    const email = isAdminRole(session.role) && requested ? requested : session.email;

    await connectToDatabase();
    let user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }
    const role = String(user.role || "");
    if (role !== "admin" && role !== "doctor" && !/^APP-RW-\d{4}$/i.test(String(user.applicantId || ""))) {
      await ensureApplicantIds();
      user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
      }
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
    const email = isAdminRole(session.role) && requested ? requested : session.email;

    await connectToDatabase();
    const current = await User.findOne({ email });
    if (!current) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if (body.name) {
      const nameError = applicantRegistrationError({ name: String(body.name) });
      if (nameError) {
        return NextResponse.json({ success: false, error: nameError }, { status: 400 });
      }
      update.name = body.name;
      update.fullName = body.name;
    }
    if (body.phone !== undefined) {
      const phone = compactPhone(String(body.phone));
      const phoneError = applicantRegistrationError({ phone });
      if (phoneError) {
        return NextResponse.json({ success: false, error: phoneError }, { status: 400 });
      }
      update.phone = phone;
    }
    if (body.nationalId !== undefined) {
      const nextId = normalizeNationalId(body.nationalId);
      const idError = applicantRegistrationError({ nationalId: nextId });
      if (idError) {
        return NextResponse.json({ success: false, error: idError }, { status: 400 });
      }
      if (nextId) {
        const taken = await findAccountByNationalId(nextId, String(current._id));
        if (taken) {
          return NextResponse.json(
            {
              success: false,
              error: "An account with this National ID already exists. Each applicant may have only one FitMed account.",
            },
            { status: 409 }
          );
        }
      }
      update.nationalId = nextId;
    }
    if (body.avatarUrl !== undefined) update.avatarUrl = body.avatarUrl;
    if (body.dateOfBirth !== undefined) update.dateOfBirth = body.dateOfBirth;
    if (body.gender !== undefined) update.gender = body.gender;
    if (body.address !== undefined) update.address = body.address;
    if (body.nationalIdImageUrl !== undefined) update.nationalIdImageUrl = body.nationalIdImageUrl;

    const user = await User.findOneAndUpdate({ email }, update, { new: true });
    if (!user) {
      return NextResponse.json({ success: false, error: "Account not found." }, { status: 404 });
    }
    const res = NextResponse.json({ success: true, user: profileFromUser(user) });
    if (String(user.email || "").toLowerCase() === String(session.email || "").toLowerCase()) {
      await attachAuthCookie(res, {
        email: session.email,
        role: normalizeRole(user.role || session.role),
        name: String(user.fullName || user.name || session.name),
      });
    }
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
