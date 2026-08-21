import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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

    const isDocument = folder.includes("document") || folder.includes("clinical");
    const uploadOptions = isDocument
      ? { folder, resource_type: "auto" as const }
      : { folder, format: "webp" as const, resource_type: "image" as const };

    if (!hasCloudinary) {
      let base64String = "";
      let mime = "application/octet-stream";
      if (typeof file === "string") {
        base64String = file;
      } else if (file instanceof Blob) {
        mime = file.type || mime;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        base64String = `data:${mime};base64,${buffer.toString("base64")}`;
      }

      return NextResponse.json({
        success: true,
        url: base64String,
        publicId: `fitmed-file-${Date.now()}`,
        format: isDocument ? "file" : "webp",
      });
    }

    let uploadData: any;

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

    return NextResponse.json({
      success: true,
      url: uploadData.secure_url || uploadData.url,
      publicId: uploadData.public_id,
      format: uploadData.format || "webp",
      bytes: uploadData.bytes,
    });
  } catch (error: any) {
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image to Cloudinary" },
      { status: 500 }
    );
  }
}
