import { MongoClient, type Db } from "mongodb";

function getMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production.");
  }

  return "mongodb://127.0.0.1:27017";
}

function getOperationTimeoutMS() {
  const operationTimeoutMS = Number(process.env.MONGODB_OPERATION_TIMEOUT_MS ?? 10_000);

  if (!Number.isFinite(operationTimeoutMS) || operationTimeoutMS <= 0) {
    throw new Error("MONGODB_OPERATION_TIMEOUT_MS must be a positive number.");
  }

  return operationTimeoutMS;
}

function getDbName() {
  return process.env.MONGODB_DB ?? "habit_tracker";
}

export function getMongoSupportsTransactions() {
  return process.env.MONGODB_ENABLE_TRANSACTIONS === "true" ||
    (process.env.MONGODB_ENABLE_TRANSACTIONS !== "false" && process.env.MONGODB_URI?.startsWith("mongodb+srv://") === true);
}

declare global {
  var __habitTrackerMongoClient: MongoClient | undefined;
}

function getMongoClient() {
  if (!globalThis.__habitTrackerMongoClient) {
    globalThis.__habitTrackerMongoClient = new MongoClient(getMongoUri(), {
      // Vercel/serverless assumption: every warm function instance owns a pool, so keep it small.
      maxPoolSize: 5,
      // Avoid holding idle Atlas connections open while the app is quiet.
      minPoolSize: 0,
      // Release inactive sockets quickly for a low-traffic personal app.
      maxIdleTimeMS: 30_000,
      // Bound short OLTP operations for this app's simple indexed CRUD/stat queries.
      timeoutMS: getOperationTimeoutMS(),
      // Fail fast enough to show a useful UI error instead of hanging requests.
      serverSelectionTimeoutMS: 5_000,
    });
  }

  return globalThis.__habitTrackerMongoClient;
}

export function getMongoDb() {
  return getMongoClient().db(getDbName());
}

export const mongoClient = new Proxy({} as MongoClient, {
  get(_target, property) {
    const client = getMongoClient();
    const value = Reflect.get(client, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});

export const db = new Proxy({} as Db, {
  get(_target, property) {
    const database = getMongoDb();
    const value = Reflect.get(database, property, database);

    return typeof value === "function" ? value.bind(database) : value;
  },
});
