// Starts a throwaway in-memory MongoDB for local dev/smoke-testing.
// Run: node scripts/dev-mongo.mjs  → prints the URI and stays alive.
import { MongoMemoryServer } from 'mongodb-memory-server'

const server = await MongoMemoryServer.create({
  instance: { port: 27017, ip: '127.0.0.1' },
})
console.log(`MONGODB_URI=${server.getUri()}`)
process.on('SIGINT', async () => {
  await server.stop()
  process.exit(0)
})
