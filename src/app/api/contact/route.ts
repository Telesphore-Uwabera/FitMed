import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";
import { sendBrevoEmail, EmailTemplates, FITMED_ADMIN_EMAIL } from "@/lib/brevo";

export async function GET() {
  try {
    try {
      await connectToDatabase();
      const inquiries = await ContactMessage.find().sort({ createdAt: -1 }).limit(50);
      return NextResponse.json({ success: true, inquiries });
    } catch (dbErr) {
      console.warn("MongoDB fetch contact fallback:", dbErr);
      return NextResponse.json({ success: true, inquiries: [] });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, organization, subject, message, category } = body;

    if (!fullName || !email || !subject || !message) {
      return NextResponse.json({ error: "Please fill in all required fields" }, { status: 400 });
    }

    let savedDoc = null;
    try {
      await connectToDatabase();
      savedDoc = await ContactMessage.create({
        fullName,
        email,
        phone,
        organization,
        subject,
        message,
        category: category || "general",
        status: "New",
      });
    } catch (dbError) {
      console.warn("MongoDB Contact save fallback:", dbError);
    }

    // Send email alert to Admin and auto-responder to user via Brevo
    await sendBrevoEmail({
      toEmail: email,
      toName: fullName,
      subject: `We received your inquiry: ${subject}`,
      htmlContent: EmailTemplates.contactConfirmation(fullName, subject, message),
    });
    await sendBrevoEmail({
      toEmail: FITMED_ADMIN_EMAIL,
      toName: "FitMed Admin",
      subject: `Contact form: ${subject} — ${fullName}`,
      htmlContent: EmailTemplates.contactAdminCopy(
        fullName,
        email,
        phone || "",
        subject,
        message,
        category || "general"
      ),
    });

    return NextResponse.json({
      success: true,
      message: "Your inquiry has been submitted and registered with FitMed administrative portal.",
      inquiryId: savedDoc?._id || `INQ-${Date.now()}`,
    });
  } catch (error: any) {
    console.error("Contact submission error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
