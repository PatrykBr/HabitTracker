// Starts a throwaway in-memory MongoDB for local dev/smoke-testing.
// Run bun run dev:mongo to print the URI and keep the replica set running.
import { MongoMemoryReplSet } from 'mongodb-memory-server'

const server = await MongoMemoryReplSet.create({
  instanceOpts: [{ port: 27017 }],
  replSet: { count: 1, ip: '127.0.0.1' },
})
console.log(`MONGODB_URI=${server.getUri()}`)
const stop = async () => {
  await server.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
