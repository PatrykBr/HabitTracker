// One-off import: pulls reset timestamps from an exported JSON file into an
// existing habit. Only occurredAt/createdAt date-times are used.
// Usage:
//   node scripts/import-resets.mjs <MONGODB_URI> <db> <habitId> <userId> <json-file>
import { readFileSync } from 'node:fs'
import { MongoClient, ObjectId } from 'mongodb'

const [uri, dbName, habitIdHex, userId, file] = process.argv.slice(2)
if (!uri || !dbName || !habitIdHex || !userId || !file) {
  console.error('usage: node scripts/import-resets.mjs <uri> <db> <habitId> <userId> <json-file>')
  process.exit(1)
}

const events = JSON.parse(readFileSync(file, 'utf8'))
const client = new MongoClient(uri)
const db = client.db(dbName)
const habitId = new ObjectId(habitIdHex)

const now = new Date()
const times = events
  .map((e) => ({
    ts: new Date(e.occurredAt?.$date ?? e.occurredAt),
    loggedAt: e.createdAt ? new Date(e.createdAt.$date ?? e.createdAt) : now,
  }))
  .filter((t) => !Number.isNaN(t.ts.getTime()) && t.ts <= now)
console.log('events in file:', events.length, '| valid:', times.length)

const existing = await db
  .collection('resets')
  .find({ habitId })
  .project({ timestamp: 1 })
  .toArray()
const existingKeys = new Set(existing.map((r) => r.timestamp.getTime()))
const seen = new Set()
const docs = []
for (const t of times) {
  const k = t.ts.getTime()
  if (existingKeys.has(k) || seen.has(k)) continue
  seen.add(k)
  docs.push({
    habitId,
    userId,
    timestamp: t.ts,
    trigger: null,
    note: null,
    createdAt: t.loggedAt,
  })
}
console.log(
  'existing resets:',
  existing.length,
  '| to insert:',
  docs.length,
  '| dupes skipped:',
  times.length - docs.length,
)

if (docs.length) await db.collection('resets').insertMany(docs)

// Backdate the habit start so imported resets fall inside its lifetime.
const earliest = new Date(Math.min(...times.map((t) => t.ts.getTime())))
const habit = await db.collection('habits').findOne({ _id: habitId })
if (habit.startDate > earliest) {
  await db
    .collection('habits')
    .updateOne({ _id: habitId }, { $set: { startDate: earliest } })
  console.log(
    'startDate backdated:',
    habit.startDate.toISOString(),
    '->',
    earliest.toISOString(),
  )
}

const total = await db.collection('resets').countDocuments({ habitId })
const first = await db.collection('resets').find({ habitId }).sort({ timestamp: 1 }).limit(1).toArray()
const last = await db.collection('resets').find({ habitId }).sort({ timestamp: -1 }).limit(1).toArray()
console.log('total resets now:', total)
console.log('earliest:', first[0].timestamp.toISOString(), '| latest:', last[0].timestamp.toISOString())
await client.close()
