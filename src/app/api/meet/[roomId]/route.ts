import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { meetingWindow } from "@/lib/meetingTime";
import { processDueMeetingNotices } from "@/lib/meetingReminders";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const key = decodeURIComponent(roomId || "").trim();
  if (!key) {
    return NextResponse.json({ success: false, error: "Missing meeting room." }, { status: 400 });
  }

  await connectToDatabase();
  void processDueMeetingNotices().catch(() => null);

  const apt = await Appointment.findOne({
    $or: [{ roomId: key }, { appointmentId: key }],
  }).lean();

  if (!apt) {
    return NextResponse.json({ success: false, error: "This meeting link is not valid." }, { status: 404 });
  }

  const stored = String(apt.status || "").toLowerCase();
  if (stored === "completed") {
    return NextResponse.json({
      success: true,
      canJoin: false,
      status: "completed",
      minutesUntilStart: 0,
      appointment: {
        appointmentId: apt.appointmentId,
        roomId: apt.roomId || apt.appointmentId,
        applicantName: apt.applicantName,
        doctorName: apt.doctorName,
        purpose: apt.purpose,
        scheduledDate: apt.scheduledDate,
        scheduledTime: apt.scheduledTime,
        durationMinutes: apt.durationMinutes,
      },
    });
  }

  const windowInfo = meetingWindow(apt);
  return NextResponse.json({
    success: true,
    canJoin: windowInfo.canJoin,
    status: windowInfo.status,
    minutesUntilStart: windowInfo.minutesUntilStart,
    startsAt: windowInfo.start,
    appointment: {
      appointmentId: apt.appointmentId,
      roomId: apt.roomId || apt.appointmentId,
      applicantName: apt.applicantName,
      doctorName: apt.doctorName,
      purpose: apt.purpose,
      scheduledDate: apt.scheduledDate,
      scheduledTime: apt.scheduledTime,
      durationMinutes: apt.durationMinutes,
    },
  });
}
