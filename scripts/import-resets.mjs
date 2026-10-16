// Import historical reset timestamps into an existing, owned habit.
// Usage: bun scripts/import-resets.mjs <uri> <db> <habitId> <userId> <json-file>
import { MongoClient, ObjectId } from 'mongodb'

const [uri, dbName, habitIdHex, userId, file] = process.argv.slice(2)
if (
  !uri ||
  !dbName ||
  !ObjectId.isValid(habitIdHex ?? '') ||
  !userId ||
  !file
) {
  throw new Error(
    'usage: bun scripts/import-resets.mjs <uri> <db> <habitId> <userId> <json-file>',
  )
}
const events = await Bun.file(file).json()
if (!Array.isArray(events))
  throw new Error('The export must be an array of events.')
const now = new Date()
const times = new Map()
for (const event of events) {
  const value = event?.occurredAt?.$date ?? event?.occurredAt
  if (typeof value !== 'string') continue
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime()) || timestamp > now) continue
  const loggedValue = event?.createdAt?.$date ?? event?.createdAt
  const loggedAt = typeof loggedValue === 'string' ? new Date(loggedValue) : now
  times.set(timestamp.getTime(), {
    timestamp,
    createdAt: Number.isNaN(loggedAt.getTime()) ? now : loggedAt,
  })
}

const client = new MongoClient(uri)
const db = client.db(dbName)
const habitId = new ObjectId(habitIdHex)
try {
  const inserted = await client.withSession((session) =>
    session.withTransaction(async () => {
      // Same parent write as application mutations: imports cannot race edits/deletion.
      const habit = await db
        .collection('habits')
        .findOneAndUpdate(
          { _id: habitId, userId },
          { $inc: { revision: 1 } },
          { session, returnDocument: 'after' },
        )
      if (!habit)
        throw new Error('No habit belongs to that habit/user combination.')
      const existing = await db
        .collection('resets')
        .find({ habitId, userId }, { session, projection: { timestamp: 1 } })
        .toArray()
      const known = new Set(existing.map((r) => r.timestamp.getTime()))
      const docs = Array.from(times.values())
        .filter((t) => !known.has(t.timestamp.getTime()))
        .map((t) => ({
          ...t,
          habitId,
          userId,
          trigger: null,
          note: null,
        }))
      let earliest = habit.startDate
      for (const { timestamp } of times.values())
        if (timestamp < earliest) earliest = timestamp
      if (earliest < habit.startDate) {
        await db
          .collection('habits')
          .updateOne(
            { _id: habitId, userId },
            { $set: { startDate: earliest } },
            { session },
          )
      }
      if (docs.length)
        await db.collection('resets').insertMany(docs, { session })
      return docs.length
    }),
  )
  console.log(
    `Events: ${events.length}; valid unique timestamps: ${times.size}; inserted: ${inserted}`,
  )
} finally {
  await client.close()
}
