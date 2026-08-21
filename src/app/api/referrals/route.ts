import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Referral from "@/models/Referral";
import { COOKIE_NAME, verifySession } from "@/lib/authCookie";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const email = String(request.nextUrl.searchParams.get("applicantEmail") || "").trim().toLowerCase();
    const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
    const query: Record<string, string> = {};
    if (session?.role === "user") {
      query.applicantEmail = session.email.toLowerCase();
    } else if (email) {
      query.applicantEmail = email;
    }
    const referrals = await Referral.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      referrals: referrals.map((r) => ({
        id: String(r._id),
        applicantName: r.applicantName,
        applicantEmail: r.applicantEmail,
        clinicName: r.clinicName,
        clinicCity: r.clinicCity,
        reason: r.reason,
        doctorName: r.doctorName,
        status: r.status,
        date: r.createdAt ? new Date(r.createdAt).toLocaleString() : "—",
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load referrals.";
    return NextResponse.json({ success: false, error: message, referrals: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!session || (session.role !== "doctor" && session.role !== "admin")) {
    return NextResponse.json({ success: false, error: "Please sign in as a doctor." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const applicantName = String(body.applicantName || "").trim();
    const clinicName = String(body.clinicName || "").trim();
    const reason = String(body.reason || "").trim();
    if (!applicantName || !clinicName || !reason) {
      return NextResponse.json({ success: false, error: "Applicant, clinic, and reason are required." }, { status: 400 });
    }
    await connectToDatabase();
    const referral = await Referral.create({
      applicantName,
      applicantEmail: String(body.applicantEmail || "").trim().toLowerCase(),
      clinicName,
      clinicCity: body.clinicCity || "",
      reason,
      doctorName: session.name,
      doctorEmail: session.email,
    });
    return NextResponse.json({
      success: true,
      referral: {
        id: String(referral._id),
        applicantName: referral.applicantName,
        clinicName: referral.clinicName,
        reason: referral.reason,
        status: referral.status,
        date: new Date(referral.createdAt).toLocaleString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not save referral.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
