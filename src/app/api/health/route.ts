import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { FITMED_COLLECTIONS, seedFitMedAccounts } from "@/lib/seedAccounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasExplicitMongoUri = Boolean((process.env.MONGODB_URI || "").trim());
  const configured = {
    mongodb: hasExplicitMongoUri,
    cloudinary: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    ),
    brevo: Boolean(process.env.BREVO_API_KEY),
  };

  let mongodb = "not_configured";
  const collections: Record<string, number> = {};
  let dbName = "";

  try {
    const mongoose = await connectToDatabase();
    dbName = mongoose.connection.name;
    await seedFitMedAccounts();
    const db = mongoose.connection.db;
    if (db) {
      for (const name of FITMED_COLLECTIONS) {
        collections[name] = await db.collection(name).countDocuments();
      }
    }
    mongodb = "connected";
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Health check] MongoDB connection error:", errMsg);
    mongodb = "error";
  }

  return NextResponse.json(
    {
      ok: true,
      service: "fitmed",
      dbName,
      configured,
      mongodb,
      collections,
    },
    { status: 200 }
  );
}
