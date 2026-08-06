// Data-layer smoke test against a running MongoDB (uses MONGODB_URI).
// Exercises habit/reset CRUD, validation rules, and user isolation.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/'
process.env.MONGODB_DB = 'reset-tracker-smoke'

const {
  createHabitForUser,
  getHabitDetailForUser,
  listHabitsForUser,
  logResetForUser,
  deleteResetForUser,
  deleteHabitForUser,
} = await import('../src/lib/habits.server.ts')
const { getMongoClient } = await import('../src/lib/db.server.ts')

let passed = 0
let failed = 0
function ok(cond, label) {
  if (cond) {
    passed++
    console.log('  ✓', label)
  } else {
    failed++
    console.error('  ✗', label)
  }
}
async function expectError(fn, label) {
  try {
    await fn()
    ok(false, `${label} (expected error, got none)`)
  } catch (e) {
    ok(true, `${label} → "${e.message}"`)
  }
}

const user = 'user-a'
const otherUser = 'user-b'
const dayMs = 86_400_000

console.log('create habit')
const habit = await createHabitForUser(user, {
  name: 'Smoking',
  icon: '🚬',
  color: '#2FD6A7',
  startDate: new Date(Date.now() - 10 * dayMs).toISOString(),
  costPerUnit: 0.5,
  unitsPerDay: 15,
})
ok(habit.id && habit.totalResets === 0, 'created with 0 resets')

await expectError(
  () =>
    createHabitForUser(user, {
      name: 'Future',
      icon: '🍺',
      color: '#4EA8FF',
      startDate: new Date(Date.now() + dayMs).toISOString(),
      costPerUnit: null,
      unitsPerDay: null,
    }),
  'rejects future start date',
)

console.log('log resets')
const r1 = await logResetForUser(user, {
  habitId: habit.id,
  timestamp: new Date(Date.now() - 6 * dayMs).toISOString(),
  trigger: 'Stress',
  note: 'long day',
})
ok(r1.trigger === 'Stress', 'backdated reset logged with trigger')

await expectError(
  () =>
    logResetForUser(user, {
      habitId: habit.id,
      timestamp: new Date(Date.now() - 20 * dayMs).toISOString(),
      trigger: null,
      note: null,
    }),
  'rejects reset before habit start',
)
await expectError(
  () =>
    logResetForUser(user, {
      habitId: habit.id,
      timestamp: new Date(Date.now() - 8 * dayMs).toISOString(),
      trigger: null,
      note: null,
    }),
  'rejects reset earlier than latest reset',
)
await expectError(
  () =>
    logResetForUser(user, {
      habitId: habit.id,
      timestamp: new Date(Date.now() + dayMs).toISOString(),
      trigger: null,
      note: null,
    }),
  'rejects future reset',
)

const r2 = await logResetForUser(user, {
  habitId: habit.id,
  timestamp: new Date(Date.now() - 2 * dayMs).toISOString(),
  trigger: null,
  note: null,
})
ok(Boolean(r2.id), 'second reset logged')

console.log('detail + isolation')
const detail = await getHabitDetailForUser(user, habit.id)
ok(detail.totalResets === 2, 'detail has 2 resets')
ok(
  new Date(detail.resets[0].timestamp) > new Date(detail.resets[1].timestamp),
  'resets are newest-first',
)
ok(detail.lastResetAt === detail.resets[0].timestamp, 'lastResetAt matches')

const stolen = await getHabitDetailForUser(otherUser, habit.id)
ok(stolen === null, 'other user cannot read the habit')
await expectError(
  () =>
    logResetForUser(otherUser, {
      habitId: habit.id,
      timestamp: new Date().toISOString(),
      trigger: null,
      note: null,
    }),
  'other user cannot log a reset',
)
await expectError(
  () => deleteResetForUser(otherUser, r2.id),
  'other user cannot delete a reset',
)

const listA = await listHabitsForUser(user)
const listB = await listHabitsForUser(otherUser)
ok(listA.length === 1 && listA[0].totalResets === 2, 'list shows stats')
ok(listB.length === 0, 'other user sees no habits')

console.log('cleanup')
await deleteResetForUser(user, r2.id)
const afterDelete = await getHabitDetailForUser(user, habit.id)
ok(afterDelete.totalResets === 1, 'reset removed')
await deleteHabitForUser(user, habit.id)
ok((await getHabitDetailForUser(user, habit.id)) === null, 'habit deleted')

await getMongoClient().db('reset-tracker-smoke').dropDatabase()
await getMongoClient().close()

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
