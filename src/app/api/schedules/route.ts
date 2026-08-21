import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Schedule from "@/models/Schedule";
import Appointment from "@/models/Appointment";

export async function GET() {
  try {
    await connectToDatabase();
    const [schedules, appointments] = await Promise.all([
      Schedule.find({}).sort({ updatedAt: -1 }).lean(),
      Appointment.find({}).sort({ scheduledDate: 1, scheduledTime: 1 }).lean(),
    ]);
    return NextResponse.json({
      success: true,
      schedules: schedules.map((s) => ({
        id: String(s._id),
        doctorEmail: s.doctorEmail,
        doctorName: s.doctorName,
        status: s.status,
        weeklySchedule: s.weeklySchedule || [],
        updatedAt: s.updatedAt,
      })),
      appointments,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load schedules.";
    return NextResponse.json({ success: false, error: message, schedules: [], appointments: [] }, { status: 500 });
  }
}
