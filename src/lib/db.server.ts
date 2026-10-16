import { MongoClient } from 'mongodb'
import type { Collection, Db, ObjectId } from 'mongodb'
import { dbEnv } from './env.server'

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
  /** Serializes changes to this habit and its reset history in transactions. */
  revision?: number
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

// Cache the client across dev-server HMR reloads so we don't leak connections.
const globalForMongo = globalThis as unknown as {
  __mongoClient?: MongoClient
}

export function getMongoClient(): MongoClient {
  if (!globalForMongo.__mongoClient) {
    globalForMongo.__mongoClient = new MongoClient(dbEnv().MONGODB_URI)
  }
  return globalForMongo.__mongoClient
}

export function getDb(): Db {
  return getMongoClient().db(dbEnv().MONGODB_DB)
}

let indexesPromise: Promise<unknown> | undefined

/** Await before serving requests: uniqueness is a constraint, not an optimization. */
export function ensureIndexes(): Promise<unknown> {
  const db = getDb()
  return (indexesPromise ??= Promise.all([
    db.collection('habits').createIndex({ userId: 1, createdAt: 1 }),
    db
      .collection('resets')
      .createIndex({ userId: 1, habitId: 1, timestamp: -1 }),
    db.collection('user').createIndex({ email: 1 }, { unique: true }),
    db
      .collection('user')
      .createIndex({ username: 1 }, { unique: true, sparse: true }),
    db.collection('session').createIndex({ token: 1 }, { unique: true }),
    db.collection('session').createIndex({ userId: 1 }),
    db
      .collection('session')
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('account').createIndex({ userId: 1, providerId: 1 }),
    db.collection('rateLimit').createIndex({ key: 1 }, { unique: true }),
  ]).catch((error: unknown) => {
    indexesPromise = undefined
    throw error
  }))
}

export function collections(): {
  habits: Collection<HabitDoc>
  resets: Collection<ResetDoc>
} {
  const db = getDb()
  return {
    habits: db.collection<HabitDoc>('habits'),
    resets: db.collection<ResetDoc>('resets'),
  }
}
