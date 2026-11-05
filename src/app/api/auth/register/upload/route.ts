import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import {
  MAX_APPLICANT_SIGNUP_BYTES,
  detectSignupImageType,
  isApplicantSignupFolder,
} from "@/lib/applicantSignupUpload";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const buckets = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 20;

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function allowUpload(ip: string) {
  const now = Date.now();
  const recent = (buckets.get(ip) || []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_UPLOADS_PER_WINDOW) {
    buckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  buckets.set(ip, recent);
  if (buckets.size > 5000) {
    const oldest = buckets.keys().next().value;
    if (oldest) buckets.delete(oldest);
  }
  return true;
}

/**
 * Public photo upload used only while creating an applicant account.
 * Authenticated dashboard uploads stay on `/api/upload`, which middleware still requires a session for.
 * This route accepts images only, and only the applicant passport and National ID folders.
 */
export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > MAX_APPLICANT_SIGNUP_BYTES + 256 * 1024) {
    return NextResponse.json({ success: false, error: "Photo must be 4 MB or smaller." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not read the photo upload. Try a smaller JPEG, PNG, or WebP image." },
      { status: 400 }
    );
  }

  const folder = String(formData.get("folder") || "");
  if (!isApplicantSignupFolder(folder)) {
    return NextResponse.json(
      { success: false, error: "That upload destination is not available during registration." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size <= 0) {
    return NextResponse.json(
      { success: false, error: "Choose a passport photo or National ID image to upload." },
      { status: 400 }
    );
  }
  if (file.size > MAX_APPLICANT_SIGNUP_BYTES) {
    return NextResponse.json({ success: false, error: "Photo must be 4 MB or smaller." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectSignupImageType(bytes);
  if (!kind) {
    return NextResponse.json(
      { success: false, error: "Upload a JPEG, PNG, or WebP image. Other file types are not accepted." },
      { status: 400 }
    );
  }

  if (!allowUpload(clientIp(request))) {
    return NextResponse.json(
      { success: false, error: "Too many photo uploads from this network. Wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      { success: false, error: "Photo storage is not configured. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const uploadData = await new Promise<{ secure_url?: string; public_id?: string; format?: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image", format: "webp" },
          (error, result) => {
            if (error || !result) reject(error || new Error("Upload failed"));
            else resolve(result);
          }
        );
        stream.end(Buffer.from(bytes));
      }
    );

    const url = String(uploadData.secure_url || "");
    if (!url.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
      return NextResponse.json(
        { success: false, error: "Photo storage did not return a usable image link. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url,
      publicId: uploadData.public_id || "",
      format: uploadData.format || "webp",
    });
  } catch (error: unknown) {
    console.error("Applicant signup upload failed:", error);
    const message = error instanceof Error ? error.message : "";
    const httpCode = typeof error === "object" && error && "http_code" in error ? Number(error.http_code) : 0;
    const busy = httpCode === 429 || message.includes("429");
    return NextResponse.json(
      {
        success: false,
        error: busy
          ? "Photo storage is temporarily busy. Wait a moment and try again."
          : "Could not store the photo. Try another image.",
      },
      { status: busy ? 429 : 500 }
    );
  }
}
