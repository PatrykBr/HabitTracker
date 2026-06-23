import { MongoClient } from "mongodb";

function getMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production.");
  }

  return "mongodb://127.0.0.1:27017";
}

const uri = getMongoUri();
export const dbName = process.env.MONGODB_DB ?? "habit_tracker";
export const mongoSupportsTransactions =
  process.env.MONGODB_ENABLE_TRANSACTIONS === "true" ||
  (process.env.MONGODB_ENABLE_TRANSACTIONS !== "false" && uri.startsWith("mongodb+srv://"));

const clientOptions = {
  // Vercel/serverless assumption: every warm function instance owns a pool, so keep it small.
  maxPoolSize: 5,
  // Avoid holding idle Atlas connections open while the app is quiet.
  minPoolSize: 0,
  // Release inactive sockets quickly for a low-traffic personal app.
  maxIdleTimeMS: 30_000,
  // Fail fast enough to show a useful UI error instead of hanging requests.
  serverSelectionTimeoutMS: 5_000,
};

declare global {
  var __habitTrackerMongoClient: MongoClient | undefined;
}

export const mongoClient =
  globalThis.__habitTrackerMongoClient ?? new MongoClient(uri, clientOptions);

if (process.env.NODE_ENV !== "production") {
  globalThis.__habitTrackerMongoClient = mongoClient;
}

export const db = mongoClient.db(dbName);
