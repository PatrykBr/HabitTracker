// Local visual-review fixtures only. Start the review replica set on port 27027
// and create apple_review through the app before running this script.
import { MongoClient, ObjectId } from 'mongodb'

const client = new MongoClient('mongodb://127.0.0.1:27027/')
const db = client.db('reset-ui-review')
const now = new Date()
const day = 86_400_000
const ago = (days) => new Date(now.getTime() - days * day)
const triggers = ['Stress', 'Routine', 'Social', 'Boredom', 'Fatigue']
const notes = [
  'A busy day. Taking a short walk helped me start again.',
  'Noticed the usual trigger and made a plan for tomorrow.',
  'Spent time with friends. Next time I’ll bring an alternative.',
  'A quiet evening turned into the old routine. Moving my phone out of reach.',
  'Low energy after work. An earlier bedtime may help.',
]
const fixtures = [
  { name: 'Smoking', icon: '🚬', color: '#34C759', start: 105,
    resets: [101, 96, 90, 82, 70, 53, 32, 7], cost: 0.65, units: 12 },
  { name: 'Scrolling before bed', icon: '📱', color: '#5856D6', start: 120,
    resets: [116, 110, 103, 95, 88, 80, 73, 67, 58, 47, 35, 24, 14, 8, 2.5, 2.2] },
  { name: 'Energy drinks', icon: '🥤', color: '#FFCC00', start: 35,
    resets: [], cost: 2.5, units: 2 },
  { name: 'Impulse shopping', icon: '🛒', color: '#FF2D55', start: 60,
    resets: [48, 30, 12, 0.45], cost: 18, units: 1 },
  { name: 'Late-night gaming and endless videos', icon: '🎮', color: '#30B0C7', start: 6,
    resets: [5.7, 5, 4.2, 3, 1.8, 0.8, 0.03] },
]

try {
  const user = await db.collection('user').findOne({ username: 'apple_review' })
  if (!user) throw new Error('Create the apple_review account in the local review app first.')
  const userId = user._id.toHexString()
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      for (const [index, fixture] of fixtures.entries()) {
        let habit = await db.collection('habits').findOne({ userId, name: fixture.name }, { session })
        if (!habit) {
          habit = { _id: new ObjectId(), userId, name: fixture.name,
            icon: fixture.icon, color: fixture.color, startDate: ago(fixture.start),
            costPerUnit: fixture.cost ?? null, unitsPerDay: fixture.units ?? null,
            createdAt: new Date(now.getTime() + index), revision: 0 }
          await db.collection('habits').insertOne(habit, { session })
        }
        await db.collection('habits').updateOne({ _id: habit._id, userId }, { $inc: { revision: 1 } }, { session })
        // Keep fixture generation idempotent; preserve resets entered in the UI.
        const existing = await db.collection('resets').findOne({ habitId: habit._id, userId, note: notes[0] }, { session })
        if (existing || fixture.resets.length === 0) continue
        await db.collection('resets').insertMany(fixture.resets.map((offset, i) => ({
          _id: new ObjectId(), userId, habitId: habit._id, timestamp: ago(offset),
          trigger: triggers[i % triggers.length], note: notes[i % notes.length], createdAt: now,
        })), { session })
      }
    })
  } finally {
    await session.endSession()
  }
  console.log(JSON.stringify({ database: db.databaseName,
    habits: await db.collection('habits').countDocuments({ userId }),
    resets: await db.collection('resets').countDocuments({ userId }) }))
} finally {
  await client.close()
}
