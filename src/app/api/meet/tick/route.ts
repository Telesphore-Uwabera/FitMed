import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { processDueMeetingNotices } from "@/lib/meetingReminders";
import { checkAndNotifyExpiringLicenses } from "@/lib/licenseExpiry";

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

    // Run reminders and license expiry checks
    const [sent, licenseNotices] = await Promise.all([
      Promise.race([
        processDueMeetingNotices(),
        new Promise<number>((resolve) =>
          setTimeout(() => resolve(0), 20000)
        ),
      ]),
      checkAndNotifyExpiringLicenses().catch((err) => {
        console.warn("[meet/tick] license check error:", err);
        return { checked: 0, sent: 0 };
      }),
    ]);

    return NextResponse.json({ success: true, sent, licenseNotices });
  } catch (error: unknown) {
    // Return 200 with the error detail — dashboards fire this every 60 s
    // and a 500 triggers console noise; the tick is non-critical.
    const message = error instanceof Error ? error.message : "Could not send meeting notices.";
    console.warn("[meet/tick] non-fatal error:", message);
    return NextResponse.json({ success: false, error: message });
  }
}
