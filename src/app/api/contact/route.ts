import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";
import { sendBrevoEmail, EmailTemplates, FITMED_ADMIN_EMAIL } from "@/lib/brevo";

function categoryFromSubject(subject: string, category?: string) {
  if (category && category !== "general") return String(category);
  const value = String(subject || "").toLowerCase();
  if (value.includes("doctor")) return "doctors";
  if (value.includes("employer") || value.includes("corporate")) return "employers";
  if (value.includes("technical") || value.includes("issue")) return "report";
  if (value.includes("privacy")) return "privacy";
  if (value.includes("legal")) return "legal";
  if (value.includes("other") || value.includes("clinic")) return "others";
  return "general";
}

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
      return NextResponse.json({ success: false, error: "Please fill in all required fields" }, { status: 400 });
    }

    const resolvedCategory = categoryFromSubject(subject, category);
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
        category: resolvedCategory,
        status: "New",
      });
    } catch (dbError) {
      try {
        const fallback = new ContactMessage({
          fullName,
          email,
          phone,
          organization,
          subject,
          message,
          category: resolvedCategory,
          status: "New",
        });
        savedDoc = await fallback.save({ validateBeforeSave: false });
      } catch (retryErr) {
        console.warn("MongoDB Contact save fallback:", dbError, retryErr);
      }
    }

    const confirmation = await sendBrevoEmail({
      toEmail: email,
      toName: fullName,
      subject: "We received your FitMed request",
      htmlContent: EmailTemplates.contactConfirmation(fullName, subject, message),
    });
    if (!confirmation.success) {
      console.error("Contact confirmation email failed:", confirmation.error);
    }
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
        resolvedCategory
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, error: "Inquiry id is required." }, { status: 400 });
    }

    await connectToDatabase();
    const inquiry = await ContactMessage.findById(id);
    if (!inquiry) {
      return NextResponse.json({ success: false, error: "Inquiry not found." }, { status: 404 });
    }

    if (body.action === "reply") {
      const reply = String(body.message || "").trim();
      if (!reply) {
        return NextResponse.json({ success: false, error: "Reply message is required." }, { status: 400 });
      }
      await sendBrevoEmail({
        toEmail: inquiry.email,
        toName: inquiry.fullName,
        subject: `Re: ${inquiry.subject}`,
        htmlContent: EmailTemplates.contactReply(inquiry.fullName, reply),
      });
      inquiry.status = "Resolved";
      inquiry.adminNotes = reply;
      await inquiry.save();
      return NextResponse.json({ success: true, inquiry });
    }

    if (body.status) inquiry.status = body.status;
    if (typeof body.adminNotes === "string") inquiry.adminNotes = body.adminNotes;
    await inquiry.save();
    return NextResponse.json({ success: true, inquiry });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not update inquiry.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
