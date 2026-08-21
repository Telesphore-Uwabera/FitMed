import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }
    await connectToDatabase();
    const existing = await NewsletterSubscriber.findOne({ email });
    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { email, name: name || existing?.name || "" },
      { upsert: true, returnDocument: "after" }
    );
    await sendBrevoEmail({
      toEmail: email,
      toName: name || "FitMed reader",
      subject: existing ? "You are still subscribed to FitMed news" : "Welcome to FitMed news",
      htmlContent: EmailTemplates.newsletterWelcome(name || "there"),
    });
    return NextResponse.json({
      success: true,
      message: existing
        ? "This email is already subscribed. We sent a confirmation anyway."
        : "You are subscribed to FitMed news.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not subscribe.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
