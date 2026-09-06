import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { processDueMeetingNotices } from "@/lib/meetingReminders";

export async function GET() {
  try {
    // Connect with a hard 10 s timeout so a cold-start Atlas hiccup
    // doesn't block the response and cause a 504 / function timeout.
    await Promise.race([
      connectToDatabase(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB connect timeout")), 10000)
      ),
    ]);

    // Run with a 20 s ceiling — enough to process a batch of reminders
    // but safely inside Netlify's 26 s function timeout.
    const sent = await Promise.race([
      processDueMeetingNotices(),
      new Promise<number>((resolve) =>
        setTimeout(() => resolve(0), 20000)
      ),
    ]);

    return NextResponse.json({ success: true, sent });
  } catch (error: unknown) {
    // Return 200 with the error detail — dashboards fire this every 60 s
    // and a 500 triggers console noise; the tick is non-critical.
    const message = error instanceof Error ? error.message : "Could not send meeting notices.";
    console.warn("[meet/tick] non-fatal error:", message);
    return NextResponse.json({ success: false, error: message });
  }
}
