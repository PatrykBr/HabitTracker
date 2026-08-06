import { MongoClient } from 'mongodb'
import type { Collection, Db, ObjectId } from 'mongodb'

export interface HabitDoc {
  _id: ObjectId
  userId: string
  name: string
  icon: string
  color: string
  startDate: Date
  costPerUnit: number | null
  unitsPerDay: number | null
  createdAt: Date
}

export interface ResetDoc {
  _id: ObjectId
  habitId: ObjectId
  userId: string
  /** When the reset actually happened (may be backdated). Stored in UTC. */
  timestamp: Date
  trigger: string | null
  note: string | null
  /** When the entry was logged. Stored in UTC. */
  createdAt: Date
}

const DB_NAME = process.env.MONGODB_DB || 'reset-tracker'

// Cache the client across dev-server HMR reloads so we don't leak connections.
const globalForMongo = globalThis as unknown as {
  __mongoClient?: MongoClient
}

export function getMongoClient(): MongoClient {
  if (!globalForMongo.__mongoClient) {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error(
        'MONGODB_URI is not set. Add it to your .env file (see .env.example).',
      )
    }
    globalForMongo.__mongoClient = new MongoClient(uri)
  }
  return globalForMongo.__mongoClient
}

export function getDb(): Db {
  return getMongoClient().db(DB_NAME)
}

let indexesEnsured = false

export function collections(): {
  habits: Collection<HabitDoc>
  resets: Collection<ResetDoc>
} {
  const db = getDb()
  const habits = db.collection<HabitDoc>('habits')
  const resets = db.collection<ResetDoc>('resets')
  if (!indexesEnsured) {
    indexesEnsured = true
    void Promise.all([
      habits.createIndex({ userId: 1 }),
      resets.createIndex({ habitId: 1, timestamp: -1 }),
      resets.createIndex({ userId: 1 }),
    ]).catch(() => {
      indexesEnsured = false
    })
  }
  return { habits, resets }
}
