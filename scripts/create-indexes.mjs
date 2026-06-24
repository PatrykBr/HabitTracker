import { existsSync, readFileSync } from "node:fs";

import { MongoClient } from "mongodb";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);

    if (!match || process.env[match[1]] !== undefined) {
      continue;
    }

    process.env[match[1]] = (match[2] ?? "").replace(/^(["'])(.*)\1$/, "$2");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "habit_tracker";

if (!uri) {
  throw new Error("MONGODB_URI is required to create indexes.");
}

const client = new MongoClient(uri);

async function upsertValidator(db, collectionName, validator) {
  const exists = await db.listCollections({ name: collectionName }).hasNext();

  if (exists) {
    await db.command({
      collMod: collectionName,
      validator,
      validationLevel: "moderate",
      validationAction: "error",
    });
    return;
  }

  await db.createCollection(collectionName, {
    validator,
    validationLevel: "strict",
    validationAction: "error",
  });
}

const habitValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "name", "quitStartedAt", "motivation", "targetDays", "createdAt", "updatedAt"],
    properties: {
      userId: { bsonType: "string" },
      name: { bsonType: "string", minLength: 2 },
      quitStartedAt: { bsonType: "date" },
      motivation: { bsonType: "string" },
      targetDays: { bsonType: "number", minimum: 1, maximum: 3650 },
      archivedAt: { bsonType: "date" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

const resetEventValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "habitId", "occurredAt", "createdAt", "updatedAt"],
    properties: {
      userId: { bsonType: "string" },
      habitId: { bsonType: "objectId" },
      occurredAt: { bsonType: "date" },
      note: { bsonType: "string" },
      trigger: { bsonType: "string" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
    },
  },
};

try {
  await client.connect();
  const db = client.db(dbName);

  await Promise.all([
    upsertValidator(db, "habits", habitValidator),
    upsertValidator(db, "reset_events", resetEventValidator),
  ]);

  await Promise.all([
    db.collection("habits").createIndex({ userId: 1, archivedAt: 1, createdAt: 1 }),
    db.collection("habits").createIndex(
      { userId: 1 },
      {
        unique: true,
        partialFilterExpression: { archivedAt: { $exists: false } },
      },
    ),
    db.collection("reset_events").createIndex({ userId: 1, habitId: 1, occurredAt: -1, createdAt: -1 }),
    db.collection("reset_events").createIndex({ userId: 1, occurredAt: -1 }),
    db.collection("user").createIndex({ email: 1 }, { unique: true }),
    db.collection("session").createIndex({ token: 1 }, { unique: true }),
    db.collection("session").createIndex({ userId: 1 }),
    db.collection("account").createIndex({ userId: 1 }),
    db.collection("verification").createIndex({ identifier: 1 }),
    db.collection("rateLimit").createIndex({ key: 1 }, { unique: true }),
  ]);

  console.log(`Indexes and validators are ready in database "${dbName}".`);
} finally {
  await client.close();
}
