import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";

export async function GET() {
  try {
    await connectToDatabase();
    const subscribers = await NewsletterSubscriber.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      subscribers: subscribers.map((s) => ({
        id: String(s._id),
        email: s.email,
        name: s.name || "",
        date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—",
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load subscribers.";
    return NextResponse.json({ success: false, error: message, subscribers: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    if (!subject || !message) {
      return NextResponse.json({ success: false, error: "Subject and message are required." }, { status: 400 });
    }
    await connectToDatabase();
    const subscribers = await NewsletterSubscriber.find({}).lean();
    if (!subscribers.length) {
      return NextResponse.json({ success: false, error: "There are no subscribers yet." }, { status: 400 });
    }

    let sent = 0;
    for (const subscriber of subscribers) {
      const result = await sendBrevoEmail({
        toEmail: subscriber.email,
        toName: subscriber.name || "FitMed reader",
        subject,
        htmlContent: EmailTemplates.newsletterBroadcast(subscriber.name || "reader", message),
        tags: ["fitmed-newsletter"],
      });
      if (result.success) sent += 1;
    }

    return NextResponse.json({
      success: true,
      sent,
      total: subscribers.length,
      message: `Broadcast sent to ${sent} of ${subscribers.length} subscribers.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Broadcast failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
