import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = {
    mongodb: Boolean(process.env.MONGODB_URI),
    cloudinary: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    ),
    brevo: Boolean(process.env.BREVO_API_KEY),
  };

  let mongodb = "not_configured";
  if (configured.mongodb) {
    try {
      await connectToDatabase();
      mongodb = "connected";
    } catch {
      mongodb = "error";
    }
  }

  const ok = true;
  return NextResponse.json(
    {
      ok,
      service: "fitmed",
      configured,
      mongodb,
    },
    { status: 200 }
  );
}
