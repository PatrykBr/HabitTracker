<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# Reset — habit-quitting tracker

A PWA for tracking bad habits you're trying to quit. Core loop: live streak
since the last reset (relapse), log resets (backdatable, with optional
trigger tag and note), plus history, stats, milestones, and a month calendar
per habit. Multi-user with username/password auth; every habit and reset is
scoped to one user.

Tone rule: supportive and non-judgmental everywhere. A reset is a normal part
of quitting, never "failure" — copy says "Streak restarted", not "You failed".

## How this project was scaffolded

```powershell
npx -y @tanstack/cli@latest create reset-tracker --agent --package-manager pnpm --tailwind
# (CLI warned --tailwind is deprecated/ignored; Tailwind is included by default)
npx -y @tanstack/intent@latest install
npx -y @tanstack/intent@latest list
pnpm dlx @tanstack/intent@latest load "@tanstack/start-client-core#start-core/server-functions"
pnpm dlx @tanstack/intent@latest load "@tanstack/start-client-core#start-core/auth-server-primitives"
```

No Better Auth Intent skill existed; current Better Auth docs were used instead.

## Stack

- TanStack Start (React 19, file-based routes in `src/routes`, Vite 8, Tailwind 4)
- MongoDB via the official `mongodb` driver, called only inside server
  functions (`createServerFn`) — no separate REST API except Better Auth's
  handler at `src/routes/api/auth/$.ts`
- Better Auth (`better-auth`) with the MongoDB adapter, username plugin, and
  `tanstackStartCookies` for session cookies
- Zod for server-function input validation
- Custom Workbox service-worker build (see PWA section)

## Environment variables

Copy `.env.example` to `.env`:

- `MONGODB_URI` (required) — MongoDB connection string
- `MONGODB_DB` (optional, default `reset-tracker`) — database name
- `BETTER_AUTH_SECRET` (required) — generate with `openssl rand -base64 32`
  or `node -e "console.log(crypto.randomBytes(32).toString('base64'))"`
- `BETTER_AUTH_URL` — exact deployment origin (e.g. `http://localhost:3000`)

Never commit secrets. `.env` is gitignored.

## Commands

```powershell
pnpm dev                  # dev server on http://localhost:3000 (needs env vars)
pnpm dev:mongo            # throwaway in-memory MongoDB on 127.0.0.1:27017
pnpm generate-routes      # regenerate routeTree.gen.ts after adding routes
npx tsc --noEmit          # typecheck
pnpm build                # production build (also generates dist/client/sw.js)
pnpm smoke:data           # data-layer smoke test (CRUD, validation, isolation)
pnpm generate:pwa-assets  # regenerate icons + iPhone splash screens (needs sharp)
```

Local dev without Atlas: run `pnpm dev:mongo` in one terminal, then set
`MONGODB_URI=mongodb://127.0.0.1:27017/` and start `pnpm dev`.

## Architecture

- `src/lib/auth.ts` — Better Auth server config (Mongo adapter, username plugin)
- `src/lib/auth-client.ts` — client-side auth calls
- `src/lib/auth.server.ts` — `requireUserId()`: reads the session, throws if absent
- `src/lib/auth.functions.ts` — session server functions for route guards
- `src/lib/db.server.ts` — Mongo client singleton + typed collection access
- `src/lib/habits.server.ts` — data layer: all habit/reset queries, always
  filtered by `userId`
- `src/lib/habits.functions.ts` — `createServerFn` wrappers with Zod validation
- `src/lib/streaks.ts`, `src/lib/format.ts`, `src/lib/hooks.ts` — pure streak
  math, formatting, live-ticking hooks
- `src/routes/_app.tsx` — authenticated layout (redirects to `/login`)
- `src/routes/_app.index.tsx` — dashboard, `src/routes/_app.habits.$habitId.tsx`
  — one-page habit detail, `src/routes/_app.you.tsx` — settings/sign-out
- `src/components/` — shared UI (bottom sheets, tab bar, calendar, charts, …)

### Data model

- `habits`: `_id`, `userId`, `name`, `icon`, `color`, `startDate`,
  `costPerUnit?`, `unitsPerDay?`, `createdAt`
- `resets`: `_id`, `habitId`, `userId`, `timestamp` (when it actually
  happened, backdatable), `trigger?`, `note?`, `createdAt` (when logged —
  deliberately distinct from `timestamp`)
- Better Auth manages its own collections (`user`, `session`, `account`, …).
  **Gotcha:** raw `user` docs have `_id` (ObjectId); the API-level `user.id`
  is its hex string. App `userId` fields store that hex string.

### Key decisions

- **Synthetic emails**: Better Auth's email/password flow requires an email,
  but the app is username-only. Signup synthesizes
  `<normalized-username>@users.reset.internal`. No email is collected or sent;
  verification/password-reset are out of scope for v1.
- **UTC + local time**: all timestamps stored as UTC `Date`s; streaks,
  calendar days, and day-of-week/time-of-day patterns are computed in the
  browser's local timezone so days match the user's actual day.
- **Validation** (enforced server-side in `habits.server.ts`): no future habit
  start, no reset before habit start, no reset before the latest existing
  reset, no future reset. Every query is scoped by the session's `userId` —
  route guards are UX only, server functions re-check auth.
- **Offline v1**: service worker caches the app shell; writes are disabled
  while offline with a visible banner (no queued sync in v1).
- **Haptics**: Vibration API on key confirmations where supported.
- **Detail-page performance**: the detail route re-renders every second for
  the live counter, so all O(resets) derivations (broken-streak map,
  completed segments, longest/average totals, calendar grouping, patterns)
  are memoized in one `useMemo`; only the ongoing segment is recomputed per
  tick. `MonthCalendar` and `PatternsCard` are `memo`-wrapped and receive
  stable props.
- **Journey rendering cap**: `JourneyTimeline` shows 7 recent resets and
  expands in steps of 30 ("Show more" / "Show fewer"), keyed by habit id so
  expansion state doesn't leak between habits. All resets are still in the
  detail payload — fine at ~400 resets; server-side pagination/aggregation
  is a future improvement if histories grow much larger.
- **Sheets**: `Sheet` traps Tab focus, moves focus in on open, restores it
  on close, handles Escape, and supports `dismissible={false}` so busy
  confirmations can't be dismissed mid-request. `ConfirmSheet` takes an
  `error` prop rendered with `role="alert"`; mutations keep the sheet open
  on failure so the user can retry.
- **Savings fields**: `costPerUnit`/`unitsPerDay` must be both set (positive)
  or both null — enforced by Zod on the server and mirrored client-side.
- **Habit deletion order**: delete the habit doc first, then its resets;
  without transactions a partial failure leaves invisible orphans rather
  than a habit with destroyed history.

## PWA / service worker gotcha

`vite-plugin-pwa` does not emit `sw.js` under TanStack Start's Vite
multi-environment build, so `vite.config.ts` contains a small custom plugin
that runs Workbox `generateSW` after the SSR environment finishes building.
The SW is registered manually (production only) in `src/routes/__root.tsx`,
which also holds the manifest link, `apple-mobile-web-app-*` meta tags, and
splash-screen links. Assets live in `public/icons`, `public/splash`,
`public/manifest.webmanifest`; regenerate with `pnpm generate:pwa-assets`.

## Deployment

Build with `pnpm build`; deploy to any TanStack Start target (Vercel,
Netlify, Cloudflare, or a plain Node server). Requirements:

- Set `MONGODB_URI`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` (must be the
  exact public origin, or auth cookies/redirects break).
- MongoDB Atlas: create a DB user and allow the host's IPs in Network Access.
- The server target must support Node APIs (the `mongodb` driver); on
  Cloudflare Workers check driver compatibility first.

## Dev tooling notes

- `mongodb-memory-server` and `scripts/` are dev-only conveniences (local
  Mongo, PWA asset generation, data smoke test). `pnpm-workspace.yaml`
  `allowBuilds` permits their postinstall builds (`sharp`,
  `mongodb-memory-server`).
- `pnpm smoke:data` uses `pnpm dlx tsx` because the script imports TS modules
  from `src/lib` directly; it uses a separate `reset-tracker-smoke` database.
- `scripts/import-resets.mjs` imports reset timestamps from an exported JSON
  file (fields `occurredAt.$date` / `createdAt.$date`) into an existing habit,
  deduping on exact timestamp and backdating the habit's `startDate` to the
  earliest imported reset:
  `node scripts/import-resets.mjs <uri> <db> <habitId> <userId> <json-file>`

## Next steps / future ideas (out of scope for v1)

Email verification, password reset, push notifications/reminders, offline
write queueing with sync, social/sharing, native app.
