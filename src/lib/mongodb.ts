import mongoose from "mongoose";

/**
 * MongoDB connection with a short timeout so APIs fall back quickly
 * when Atlas / local MongoDB is unreachable (dev or misconfigured env).
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/FitMed";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "FitMed";
const isAtlas = MONGODB_URI.startsWith("mongodb+srv://");

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      dbName: MONGODB_DB_NAME,
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: isAtlas ? 10000 : 2500,
      connectTimeoutMS: isAtlas ? 10000 : 2500,
      socketTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log("Connected to MongoDB");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
