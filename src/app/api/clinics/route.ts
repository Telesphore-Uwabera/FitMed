import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Clinic from "@/models/Clinic";
import { COOKIE_NAME, verifySession } from "@/lib/authCookie";
import { isAdminRole } from "@/lib/roles";
import { seedFitMedAccounts } from "@/lib/seedAccounts";

function serializeClinic(c: {
  _id: unknown;
  name: string;
  city: string;
  status?: string;
  capacity?: string;
  phone?: string;
  type?: string;
}) {
  return {
    id: String(c._id),
    name: c.name,
    city: c.city,
    status: c.status || "Active Partner",
    capacity: c.capacity || "Medium",
    phone: c.phone || "",
    type: c.type || "",
  };
}

export function isClinicActive(status?: string) {
  const value = String(status || "").toLowerCase();
  if (value.includes("inactive") || value.includes("deactiv") || value.includes("suspend")) return false;
  return !value || value.includes("active");
}

async function requireAdmin(request: NextRequest) {
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!session || !isAdminRole(session.role)) {
    return { error: NextResponse.json({ success: false, error: "Administrator access required." }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
    await connectToDatabase();
    if ((await Clinic.countDocuments()) === 0) {
      await seedFitMedAccounts();
    }
    const clinics = await Clinic.find({}).sort({ createdAt: -1 }).lean();
    const rows = clinics.map(serializeClinic);
    const forAdmin = session && isAdminRole(session.role);
    return NextResponse.json({
      success: true,
      clinics: forAdmin ? rows : rows.filter((c) => isClinicActive(c.status)),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load clinics.";
    return NextResponse.json({ success: false, error: message, clinics: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const city = String(body.city || "").trim();
    if (!name || !city) {
      return NextResponse.json({ success: false, error: "Clinic name and city are required." }, { status: 400 });
    }
    await connectToDatabase();
    const clinic = await Clinic.create({
      name,
      city,
      status: body.status || "Active Partner",
      capacity: body.capacity || "Medium",
      phone: body.phone || "",
      type: body.type || "Partner clinic",
    });
    return NextResponse.json({ success: true, clinic: serializeClinic(clinic) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not save clinic.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, error: "Clinic id is required." }, { status: 400 });
    }
    await connectToDatabase();
    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return NextResponse.json({ success: false, error: "Clinic not found." }, { status: 404 });
    }

    if (body.action === "activate") clinic.status = "Active Partner";
    else if (body.action === "deactivate") clinic.status = "Inactive";
    else {
      if (body.name !== undefined) clinic.name = String(body.name).trim();
      if (body.city !== undefined) clinic.city = String(body.city).trim();
      if (body.phone !== undefined) clinic.phone = String(body.phone).trim();
      if (body.type !== undefined) clinic.type = String(body.type).trim();
      if (body.capacity !== undefined) clinic.capacity = String(body.capacity).trim();
      if (body.status !== undefined) clinic.status = String(body.status).trim();
    }
    if (!clinic.name || !clinic.city) {
      return NextResponse.json({ success: false, error: "Clinic name and city are required." }, { status: 400 });
    }
    await clinic.save();
    return NextResponse.json({ success: true, clinic: serializeClinic(clinic) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not update clinic.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const id = String(request.nextUrl.searchParams.get("id") || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, error: "Clinic id is required." }, { status: 400 });
    }
    await connectToDatabase();
    const clinic = await Clinic.findByIdAndDelete(id);
    if (!clinic) {
      return NextResponse.json({ success: false, error: "Clinic not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not delete clinic.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
