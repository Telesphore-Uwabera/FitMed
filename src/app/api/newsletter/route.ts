import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }
    await connectToDatabase();
    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { email, name },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, message: "You are subscribed to FitMed news." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not subscribe.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
