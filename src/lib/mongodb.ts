import mongoose from "mongoose";

/**
 * MongoDB connection optimised for Netlify serverless cold starts.
 *
 * Key changes vs the original:
 *  - serverSelectionTimeoutMS reduced 10 s → 8 s  (fail fast on Atlas hiccups)
 *  - connectTimeoutMS reduced 10 s → 6 s          (TCP + TLS budget)
 *  - socketTimeoutMS increased 15 s → 20 s        (give slow queries more room)
 *  - maxPoolSize reduced 10 → 5                   (Atlas M0 limit is 500; 5 is plenty)
 *  - minPoolSize 0 → 1                            (keep 1 warm socket between invocations)
 *  - heartbeatFrequencyMS added: 30 s              (keeps connection alive in idle periods)
 *  - warm-path guard checks readyState === 1       (avoids re-using a broken cached conn)
 *  - cached.conn reset to null in catch block      (so the next request retries clean)
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
  // Warm path — reuse an established, healthy connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      dbName: MONGODB_DB_NAME,
      bufferCommands: false,
      // How long to wait for a healthy primary before giving up
      serverSelectionTimeoutMS: isAtlas ? 8000 : 2000,
      // TCP + TLS handshake budget (shorter than serverSelection so DNS errors surface fast)
      connectTimeoutMS: isAtlas ? 6000 : 2000,
      // Per-operation socket idle timeout — 20 s covers even slow Atlas M0 queries
      socketTimeoutMS: 20000,
      // Keep pool small: 5 is plenty for serverless; Atlas M0 allows 500 total
      maxPoolSize: 5,
      minPoolSize: 1,
      // Ping Atlas every 30 s to keep the socket warm between function invocations
      heartbeatFrequencyMS: 30000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log("Connected to MongoDB");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset both so the next cold-start retries from scratch
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
