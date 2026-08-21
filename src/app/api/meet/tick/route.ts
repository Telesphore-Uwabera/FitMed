import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { processDueMeetingNotices } from "@/lib/meetingReminders";

export async function GET() {
  try {
    await connectToDatabase();
    const sent = await processDueMeetingNotices();
    return NextResponse.json({ success: true, sent });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not send meeting notices.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
