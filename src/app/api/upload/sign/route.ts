import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET(request: NextRequest) {
  return generateSignature(request);
}

export async function POST(request: NextRequest) {
  return generateSignature(request);
}

async function generateSignature(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let folder = searchParams.get("folder");

    if (!folder && request.method === "POST") {
      try {
        const body = await request.json();
        folder = body?.folder;
      } catch {
        // Body may not be JSON
      }
    }

    folder = folder || "fitmed/general";
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
  } catch (error: any) {
    console.error("Failed to generate upload signature:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
