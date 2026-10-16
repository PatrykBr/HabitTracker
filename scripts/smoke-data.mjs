// Self-contained integration checks. Never connects to or drops a configured DB.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { Collection, ObjectId } from 'mongodb'
import { tmpdir } from 'node:os'
import path from 'node:path'

const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
process.env.MONGODB_URI = mongo.getUri()
process.env.MONGODB_DB = `reset-smoke-${randomUUID()}`
process.env.BETTER_AUTH_SECRET = randomUUID()
process.env.BETTER_AUTH_URL = 'http://localhost:3000'

let client
const day = 86_400_000
const now = Date.now()
const at = (days) => new Date(now + days * day).toISOString()
const fields = {
  name: 'Coffee',
  icon: '☕',
  color: '#34C759',
  startDate: at(-10),
  costPerUnit: null,
  unitsPerDay: null,
}
const reset = (habitId, timestamp) => ({
  habitId,
  timestamp,
  trigger: null,
  note: null,
})
const expectedError = { name: 'UserFacingError' }
let failures = 0
async function check(label, test) {
  try {
    await test()
    console.log('✓', label)
  } catch (error) {
    failures++
    console.error('✗', label, error)
  }
}

try {
  const data = await import('../src/lib/habits.server.ts')
  const { getMongoClient, getDb } = await import('../src/lib/db.server.ts')
  client = getMongoClient()
  await check(
    'CRUD, validation, editing, ordering, and isolation',
    async () => {
      const habit = await data.createHabitForUser('alice', fields)
      assert.equal(habit.totalResets, 0)
      await assert.rejects(
        data.createHabitForUser('alice', { ...fields, startDate: at(1) }),
        expectedError,
      )
      const first = await data.logResetForUser('alice', reset(habit.id, at(-6)))
      const last = await data.logResetForUser('alice', reset(habit.id, at(-2)))
      for (const timestamp of [at(-20), at(-8), at(1), at(-2)]) {
        await assert.rejects(
          data.logResetForUser('alice', reset(habit.id, timestamp)),
          expectedError,
        )
      }
      await assert.rejects(
        data.updateHabitForUser('alice', habit.id, {
          ...fields,
          startDate: at(-5),
        }),
        expectedError,
      )
      await data.updateHabitForUser('alice', habit.id, {
        ...fields,
        name: 'Less coffee',
      })
      const detail = await data.getHabitDetailForUser('alice', habit.id)
      assert.equal(detail.name, 'Less coffee')
      assert.deepEqual(
        detail.resets.map((r) => r.id),
        [last.id, first.id],
      )
      assert.equal(detail.lastResetAt, last.timestamp)
      assert.equal(await data.getHabitDetailForUser('bob', habit.id), null)
      await assert.rejects(
        data.updateHabitForUser('bob', habit.id, fields),
        expectedError,
      )
      await assert.rejects(
        data.logResetForUser('bob', reset(habit.id, at(0))),
        expectedError,
      )
      await assert.rejects(
        data.deleteResetForUser('bob', last.id),
        expectedError,
      )
      await assert.rejects(
        data.deleteHabitForUser('bob', habit.id),
        expectedError,
      )
      assert.deepEqual(await data.listHabitsForUser('bob'), [])
      assert.equal((await data.listHabitsForUser('alice'))[0].totalResets, 2)
      await data.deleteResetForUser('alice', last.id)
      assert.equal(
        (await data.getHabitDetailForUser('alice', habit.id)).lastResetAt,
        first.timestamp,
      )
      await data.deleteHabitForUser('alice', habit.id)
      assert.equal(await data.getHabitDetailForUser('alice', habit.id), null)
      assert.equal(
        await getDb().collection('resets').countDocuments({ userId: 'alice' }),
        0,
      )
    },
  )

  await check(
    'concurrent duplicate resets create exactly one entry',
    async () => {
      const habit = await data.createHabitForUser('race', fields)
      const results = await Promise.allSettled(
        Array.from({ length: 8 }, () =>
          data.logResetForUser('race', reset(habit.id, at(-1))),
        ),
      )
      assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1)
      assert.equal(
        (await data.getHabitDetailForUser('race', habit.id)).totalResets,
        1,
      )
    },
  )

  await check(
    'editing a start and logging a reset cannot break the lifetime invariant',
    async () => {
      for (let i = 0; i < 8; i++) {
        const habit = await data.createHabitForUser('edit-race', fields)
        const results = await Promise.allSettled([
          data.logResetForUser('edit-race', reset(habit.id, at(-5))),
          data.updateHabitForUser('edit-race', habit.id, {
            ...fields,
            startDate: at(-2),
          }),
        ])
        assert.ok(results.some((result) => result.status === 'fulfilled'))
        for (const result of results) {
          if (result.status === 'rejected')
            assert.equal(result.reason.name, 'UserFacingError')
        }
        const detail = await data.getHabitDetailForUser('edit-race', habit.id)
        assert.ok(detail.resets.every((r) => r.timestamp >= detail.startDate))
      }
    },
  )

  await check('deleting while logging leaves no orphan resets', async () => {
    for (let i = 0; i < 8; i++) {
      const habit = await data.createHabitForUser('delete-race', fields)
      const results = await Promise.allSettled([
        data.logResetForUser('delete-race', reset(habit.id, at(-1))),
        data.deleteHabitForUser('delete-race', habit.id),
      ])
      assert.equal(results[1].status, 'fulfilled')
      if (results[0].status === 'rejected')
        assert.equal(results[0].reason.name, 'UserFacingError')
    }
    assert.equal(
      await getDb()
        .collection('resets')
        .countDocuments({ userId: 'delete-race' }),
      0,
    )
  })

  await check(
    'a failed history cleanup rolls back the habit deletion',
    async () => {
      const habit = await data.createHabitForUser('rollback', fields)
      await data.logResetForUser('rollback', reset(habit.id, at(-1)))
      const original = Collection.prototype.deleteMany
      try {
        Collection.prototype.deleteMany = async function (filter, options) {
          if (filter.userId === 'rollback')
            throw new Error('injected cleanup error')
          return original.call(this, filter, options)
        }
        await assert.rejects(
          data.deleteHabitForUser('rollback', habit.id),
          /injected cleanup error/,
        )
      } finally {
        Collection.prototype.deleteMany = original
      }
      assert.equal(
        (await data.getHabitDetailForUser('rollback', habit.id)).totalResets,
        1,
      )
    },
  )

  await check(
    'import checks ownership, handles empty exports, deduplicates, and fixes invalid logged dates',
    async () => {
      const habit = await data.createHabitForUser('import', fields)
      const file = path.join(tmpdir(), `reset-import-${randomUUID()}.json`)
      const run = async (user) => {
        const child = Bun.spawn([
          process.execPath,
          '--no-env-file',
          'scripts/import-resets.mjs',
          process.env.MONGODB_URI,
          process.env.MONGODB_DB,
          habit.id,
          user,
          file,
        ], { stdout: 'pipe', stderr: 'pipe' })
        const [exitCode, , stderr] = await Promise.all([
          child.exited,
          new Response(child.stdout).text(),
          new Response(child.stderr).text(),
        ])
        if (exitCode !== 0) throw new Error(stderr)
      }
      try {
        await Bun.write(file, '[]')
        await run('import')
        await Bun.write(
          file,
          JSON.stringify([
            { occurredAt: { $date: at(-20) }, createdAt: 'invalid' },
            { occurredAt: at(-20) },
            { occurredAt: null },
            { occurredAt: at(1) },
          ]),
        )
        await assert.rejects(run('someone-else'))
        assert.equal(
          (await data.getHabitDetailForUser('import', habit.id)).totalResets,
          0,
        )
        await run('import')
        await run('import')
        const detail = await data.getHabitDetailForUser('import', habit.id)
        assert.equal(detail.totalResets, 1)
        assert.equal(detail.startDate, at(-20))
        assert.ok(Number.isFinite(Date.parse(detail.resets[0].createdAt)))
      } finally {
        await Bun.file(file).delete()
      }
    },
  )

  const { Route: authRoute } = await import('../src/routes/api/auth/$.ts')
  const { internalEmailFor } = await import('../src/lib/schemas.ts')
  const password = 'smoke-test-password'
  const callAuth = (endpoint, body, headers = {}) =>
    authRoute.options.server.handlers[body ? 'POST' : 'GET']({
      request: new Request(`http://localhost:3000/api/auth/${endpoint}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          origin: 'http://localhost:3000',
          'content-type': 'application/json',
          'x-forwarded-for': '192.0.2.10',
          ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    })
  await check(
    'auth enforces username-only signup, cookies, login, logout, and unused endpoint restrictions',
    async () => {
      const missing = await callAuth('sign-up/email', {
        name: 'Missing',
        email: 'missing@example.com',
        password,
      })
      assert.equal(missing.status, 400)
      const signup = await callAuth('sign-up/email', {
        username: 'a..b',
        name: 'Untrusted name',
        email: 'untrusted@example.com',
        password,
      })
      assert.equal(signup.status, 200, await signup.clone().text())
      const user = (await signup.json()).user
      assert.equal(user.email, internalEmailFor('a..b'))
      assert.equal(user.name, 'a..b')
      const cookie = signup.headers
        .getSetCookie()
        .map((c) => c.split(';')[0])
        .join('; ')
      assert.ok(/HttpOnly/i.test(signup.headers.get('set-cookie')))
      assert.ok(/SameSite=Lax/i.test(signup.headers.get('set-cookie')))
      const session = await callAuth('get-session', undefined, { cookie })
      assert.equal((await session.json()).user.id, user.id)
      const forbidden = await callAuth(
        'update-user',
        { name: 'Changed' },
        { cookie },
      )
      assert.equal(forbidden.status, 404)
      const signedOut = await callAuth('sign-out', {}, { cookie })
      assert.equal(signedOut.status, 200)
      assert.equal(
        await (await callAuth('get-session', undefined, { cookie })).json(),
        null,
      )
      const signin = await callAuth('sign-in/username', {
        username: 'A..B',
        password,
      })
      assert.equal(signin.status, 200)
      assert.equal((await signin.json()).user.id, user.id)
      const foreign = await callAuth(
        'sign-out',
        {},
        { cookie, origin: 'https://other.example' },
      )
      assert.equal(foreign.status, 403)
    },
  )
  await check(
    'concurrent signups cannot create duplicate identities or orphan credential accounts',
    async () => {
      const body = {
        username: 'concurrent',
        name: 'Concurrent',
        email: internalEmailFor('concurrent'),
        password,
      }
      const results = await Promise.all(
        Array.from({ length: 4 }, () =>
          callAuth('sign-up/email', body, { 'x-forwarded-for': '192.0.2.20' }),
        ),
      )
      assert.equal(results.filter((r) => r.status === 200).length, 1)
      const users = await getDb()
        .collection('user')
        .find({ username: 'concurrent' })
        .toArray()
      assert.equal(users.length, 1)
      assert.equal(
        await getDb()
          .collection('account')
          .countDocuments({ userId: new ObjectId(users[0]._id) }),
        1,
      )
    },
  )
  await check('auth rate limiting is shared through the database', async () => {
    const statuses = []
    for (let i = 0; i < 11; i++) {
      statuses.push(
        (
          await callAuth(
            'sign-in/username',
            { username: 'none', password: 'x' },
            { 'x-forwarded-for': '192.0.2.30' },
          )
        ).status,
      )
    }
    assert.ok(statuses.slice(0, 10).every((status) => status === 400))
    assert.equal(statuses[10], 429)
  })
  await check('unsupported auth paths are rejected before database rate-limit writes', async () => {
    const before = await getDb().collection('rateLimit').countDocuments()
    for (let i = 0; i < 5; i++) {
      const response = await authRoute.options.server.handlers.GET({
        request: new Request(`http://localhost:3000/api/auth/unknown-${i}`, {
          headers: { 'x-forwarded-for': '192.0.2.40' },
        }),
      })
      assert.equal(response.status, 404)
    }
    assert.equal(await getDb().collection('rateLimit').countDocuments(), before)
  })
} finally {
  try {
    await client?.db(process.env.MONGODB_DB).dropDatabase()
  } finally {
    try {
      await client?.close()
    } finally {
      await mongo.stop()
    }
  }
}
process.exitCode = failures ? 1 : 0
