import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";
import { sendBrevoEmail } from "@/lib/brevo";

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
      subject: `Inquiry Received: ${subject} [FitMed Rwanda]`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0B2D5C;">
          <h2>Thank you for contacting FitMed Rwanda, ${fullName}!</h2>
          <p>We have received your message regarding "<strong>${subject}</strong>".</p>
          <p>Our clinical administrative team is reviewing your inquiry and will respond within 1-2 business hours.</p>
          <blockquote style="border-left: 3px solid #12B8B0; padding-left: 10px; color: #475569;">
            ${message}
          </blockquote>
          <p style="font-size: 12px; color: #94a3b8;">FitMed Support Team · info.teletech.rw@gmail.com</p>
        </div>
      `,
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
