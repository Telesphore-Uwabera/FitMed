import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import Schedule from "@/models/Schedule";
import { COOKIE_NAME, verifySession } from "@/lib/authCookie";

async function requireDoctor(request: NextRequest) {
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!session || (session.role !== "doctor" && session.role !== "admin")) {
    return { error: NextResponse.json({ success: false, error: "Please sign in as a doctor." }, { status: 401 }) };
  }
  return { session };
}

function serializeDoctor(doctor: Record<string, unknown> & { _id: unknown }) {
  return {
    id: String(doctor._id),
    name: doctor.fullName || "",
    email: doctor.email || "",
    licenseNumber: doctor.licenseNumber || "",
    specialty: doctor.specialty || "",
    phone: doctor.phone || "",
    avatarUrl: doctor.avatarUrl || "",
    isVerified: Boolean(doctor.isVerified),
    status: doctor.status || "OFF",
    weeklySchedule: doctor.weeklySchedule || [],
    consultationFee: doctor.consultationFee || 0,
    totalCertificatesIssued: doctor.totalCertificatesIssued || 0,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireDoctor(request);
  if ("error" in auth && auth.error) return auth.error;
  const session = auth.session!;

  try {
    await connectToDatabase();
    const doctor = await Doctor.findOne({ email: session.email }).lean();
    if (!doctor) {
      return NextResponse.json({
        success: true,
        doctor: {
          id: "",
          name: session.name,
          email: session.email,
          licenseNumber: "",
          specialty: "",
          phone: "",
          avatarUrl: "",
          isVerified: false,
          status: "OFF",
          weeklySchedule: [],
          consultationFee: 0,
          totalCertificatesIssued: 0,
        },
      });
    }
    await Schedule.findOneAndUpdate(
      { doctorEmail: session.email },
      {
        doctorEmail: session.email,
        doctorName: doctor.fullName,
        doctorId: String(doctor._id),
        status: doctor.status,
        weeklySchedule: doctor.weeklySchedule || [],
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, doctor: serializeDoctor(doctor as Record<string, unknown> & { _id: unknown }) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load doctor profile.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireDoctor(request);
  if ("error" in auth && auth.error) return auth.error;
  const session = auth.session!;

  try {
    const body = await request.json();
    await connectToDatabase();
    const doctor = await Doctor.findOne({ email: session.email });
    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor profile not found." }, { status: 404 });
    }

    if (body.status && ["ONLINE", "BUSY", "OFF"].includes(body.status)) {
      doctor.status = body.status;
    }
    if (Array.isArray(body.weeklySchedule)) {
      doctor.weeklySchedule = body.weeklySchedule;
    }
    if (typeof body.avatarUrl === "string") {
      doctor.avatarUrl = body.avatarUrl;
    }
    if (typeof body.phone === "string") {
      doctor.phone = body.phone;
    }
    await doctor.save();
    await Schedule.findOneAndUpdate(
      { doctorEmail: session.email },
      {
        doctorEmail: session.email,
        doctorName: doctor.fullName,
        doctorId: String(doctor._id),
        status: doctor.status,
        weeklySchedule: doctor.weeklySchedule,
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, doctor: serializeDoctor(doctor.toObject()) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not update doctor profile.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
