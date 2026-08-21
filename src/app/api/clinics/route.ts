import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Clinic from "@/models/Clinic";
import { COOKIE_NAME, verifySession } from "@/lib/authCookie";
import { seedFitMedAccounts } from "@/lib/seedAccounts";

export async function GET() {
  try {
    await connectToDatabase();
    await seedFitMedAccounts();
    const clinics = await Clinic.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      clinics: clinics.map((c) => ({
        id: String(c._id),
        name: c.name,
        city: c.city,
        status: c.status,
        capacity: c.capacity,
        phone: c.phone || "",
        type: c.type || "",
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load clinics.";
    return NextResponse.json({ success: false, error: message, clinics: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Administrator access required." }, { status: 403 });
  }
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
    return NextResponse.json({
      success: true,
      clinic: {
        id: String(clinic._id),
        name: clinic.name,
        city: clinic.city,
        status: clinic.status,
        capacity: clinic.capacity,
        phone: clinic.phone,
        type: clinic.type,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not save clinic.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
