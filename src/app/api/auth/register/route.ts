import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates } from "@/lib/brevo";
import { notifyFitMedAdmins } from "@/lib/notify";
import { nextApplicantId } from "@/lib/sequentialIds";
import {
  duplicateKeyMessage,
  findAccountByEmail,
  findAccountByNationalId,
  isMongoDuplicateKey,
  normalizeEmail,
  normalizeNationalId,
} from "@/lib/applicantIdentity";
import { applicantRegistrationError, compactPhone } from "@/lib/registrationRules";
import { isCloudinaryUrl } from "@/lib/imageUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, nationalId, dateOfBirth, gender, address, password, avatarUrl, idDocUrl } = body;
    const cleanEmail = normalizeEmail(email);
    const cleanName = String(name || "").trim();
    const cleanNationalId = normalizeNationalId(nationalId);
    const cleanPhone = compactPhone(String(phone || ""));
    const cleanPassword = String(password || "");

    const fieldError = applicantRegistrationError({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      nationalId: cleanNationalId,
    });
    if (fieldError) {
      return NextResponse.json({ success: false, error: fieldError }, { status: 400 });
    }
    const cleanGender = String(gender || "").trim();
    const cleanAddress = String(address || "").trim();
    const cleanDob = String(dateOfBirth || "").trim();
    if (!cleanDob || !cleanGender || !cleanAddress) {
      return NextResponse.json(
        { success: false, error: "Date of birth, gender, and address are required." },
        { status: 400 }
      );
    }
    let finalAvatarUrl = String(avatarUrl || "");
    let finalIdDocUrl = String(idDocUrl || "");

    // If base64 data URLs are provided, upload to Cloudinary on the server
    if (finalAvatarUrl.startsWith("data:") || finalIdDocUrl.startsWith("data:")) {
      try {
        const { v2: cloudinary } = await import("cloudinary");
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true,
        });
        if (finalAvatarUrl.startsWith("data:")) {
          const upPhoto = await cloudinary.uploader.upload(finalAvatarUrl, {
            folder: "fitmed/applicants",
            format: "webp",
            resource_type: "image",
          });
          if (upPhoto?.secure_url) finalAvatarUrl = upPhoto.secure_url;
        }
        if (finalIdDocUrl.startsWith("data:")) {
          const upId = await cloudinary.uploader.upload(finalIdDocUrl, {
            folder: "fitmed/national_ids",
            format: "webp",
            resource_type: "image",
          });
          if (upId?.secure_url) finalIdDocUrl = upId.secure_url;
        }
      } catch (uploadErr) {
        console.warn("Register route image upload fallback warning:", uploadErr);
      }
    }

    if (!finalAvatarUrl || !finalIdDocUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Passport photo and National ID document are both required to create your account.",
        },
        { status: 400 }
      );
    }
    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Please choose a password of at least 6 characters." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const existingEmail = await findAccountByEmail(cleanEmail);
    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists. Please sign in, or use a different email.",
        },
        { status: 409 }
      );
    }
    const existingId = await findAccountByNationalId(cleanNationalId);
    if (existingId) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this National ID already exists. Each applicant may have only one FitMed account.",
        },
        { status: 409 }
      );
    }

    await User.create({
      name: cleanName,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      nationalId: cleanNationalId,
      dateOfBirth: cleanDob,
      gender: cleanGender,
      address: cleanAddress,
      applicantId: await nextApplicantId(),
      password: hashPassword(cleanPassword),
      avatarUrl: finalAvatarUrl || undefined,
      nationalIdImageUrl: finalIdDocUrl || "",
      role: "user",
      status: "pending_approval",
      requiresPasswordReset: false,
    });

    const adminMail = await notifyFitMedAdmins({
      subject: `New applicant registration pending approval: ${cleanName}`,
      htmlContent: EmailTemplates.adminNewApplicantNotification(cleanName, cleanEmail, cleanNationalId),
      snippet: `${cleanName} registered and is waiting for verification.`,
    });
    if (!adminMail.success) {
      console.warn("New applicant registered, but the admin alert email did not send.");
    }
    const applicantMail = await sendBrevoEmail({
      toEmail: cleanEmail,
      toName: cleanName,
      subject: "FitMed received your registration — wait for approval",
      htmlContent: EmailTemplates.welcomeApplicantPending(cleanName),
    });
    if (!applicantMail.success) {
      console.warn("Applicant welcome email failed:", applicantMail.error);
    }

    return NextResponse.json({
      success: true,
      message:
        "Registration submitted successfully. Your account will be activated once an administrator verifies your National ID.",
    });
  } catch (error: unknown) {
    if (isMongoDuplicateKey(error)) {
      return NextResponse.json({ success: false, error: duplicateKeyMessage(error) }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Registration failed.";
    console.error("Register error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
