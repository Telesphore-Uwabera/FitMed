import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET(request: NextRequest) {
  try {
    const folder = request.nextUrl.searchParams.get("folder") || "fitmed/general";
    const timestamp = Math.round(Date.now() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json(
        { error: "Cloudinary credentials not properly configured on server." },
        { status: 503 }
      );
    }

    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      apiSecret
    );

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "fitmed/profiles";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if Cloudinary credentials are configured
    const hasCloudinary =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (!hasCloudinary) {
      return NextResponse.json(
        { error: "Cloudinary is not configured. Photos cannot be stored until CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set." },
        { status: 503 }
      );
    }

    const isPdf =
      (file instanceof Blob && (file.type === "application/pdf" || (file as File).name?.toLowerCase().endsWith(".pdf"))) ||
      (typeof file === "string" && (file.startsWith("data:application/pdf") || (file.includes(";base64,") && file.toLowerCase().includes("pdf"))));
    const isDocument = isPdf || folder.includes("document") || folder.includes("clinical") || folder.includes("id");
    const uploadOptions = isDocument
      ? { folder, resource_type: "auto" as const }
      : { folder, format: "webp" as const, resource_type: "image" as const };

    const maxRetries = 2;
    let uploadData: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (typeof file === "string") {
          uploadData = await cloudinary.uploader.upload(file, uploadOptions);
        } else if (file instanceof Blob) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          uploadData = await new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(uploadOptions, (error, result) => {
                if (error) reject(error);
                else resolve(result);
              })
              .end(buffer);
          });
        }
        break;
      } catch (err: any) {
        const is429 =
          err?.http_code === 429 ||
          String(err?.message || "").includes("429") ||
          String(err?.message || "").toLowerCase().includes("slow down") ||
          String(err?.message || "").toLowerCase().includes("processing capacity");

        if (is429 && attempt < maxRetries) {
          const waitMs = (attempt + 1) * 1500;
          console.warn(`[Cloudinary API] 429 rate limit encountered, retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        throw err;
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadData.secure_url || uploadData.url,
      publicId: uploadData.public_id,
      format: uploadData.format || (isPdf ? "pdf" : "webp"),
      bytes: uploadData.bytes,
    });
  } catch (error: any) {
    console.error("Cloudinary upload failed:", error);
    const is429 =
      error?.http_code === 429 ||
      String(error?.message || "").includes("429") ||
      String(error?.message || "").toLowerCase().includes("slow down") ||
      String(error?.message || "").toLowerCase().includes("processing capacity");

    const status = is429 ? 429 : 500;
    const userMessage = is429
      ? "Cloudinary media service is temporarily busy. Please wait a moment and try again."
      : error?.message || "Failed to upload image to Cloudinary";

    return NextResponse.json(
      { error: userMessage },
      { status }
    );
  }
}
