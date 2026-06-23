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

try {
  await client.connect();
  const db = client.db(dbName);

  await Promise.all([
    db.collection("habits").createIndex({ userId: 1, archivedAt: 1, createdAt: 1 }),
    db.collection("reset_events").createIndex({ userId: 1, habitId: 1, occurredAt: -1, createdAt: -1 }),
    db.collection("reset_events").createIndex({ userId: 1, occurredAt: -1 }),
  ]);

  console.log(`Indexes are ready in database "${dbName}".`);
} finally {
  await client.close();
}
