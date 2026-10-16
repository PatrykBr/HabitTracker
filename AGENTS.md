<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `bunx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>` before changing files.
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
bunx @tanstack/intent@latest load "@tanstack/start-client-core#start-core/server-functions"
bunx @tanstack/intent@latest load "@tanstack/start-client-core#start-core/auth-server-primitives"
```

No Better Auth Intent skill existed; current Better Auth docs were used instead.

## Stack

- Bun 1.4.3+ for package management, runtime, tests and scripts (`bun.lock`);
  the tested version is pinned in `.bun-version`
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

- `MONGODB_URI` (required) — MongoDB replica-set connection string (Atlas works)
- `MONGODB_DB` (optional, default `reset-tracker`) — database name
- `BETTER_AUTH_SECRET` (required) — generate with `openssl rand -base64 32`
  or `bun -e "console.log(crypto.randomBytes(32).toString('base64'))"`
- `BETTER_AUTH_URL` — exact deployment origin (e.g. `http://localhost:3000`)
- `TRUST_PROXY` (optional, default `false`) — Bun production server only;
  enable only behind a proxy that sets `X-Forwarded-For` to one verified client
  IP and prevents untrusted clients from connecting directly to the backend

Never commit secrets. `.env` is gitignored.

## Commands

```powershell
bun run dev                  # dev server on http://localhost:3000 (needs env vars)
bun run dev:mongo             # throwaway single-node replica set on 127.0.0.1:27017
bun run generate-routes      # regenerate routeTree.gen.ts after adding routes
bun run typecheck            # bun check (native TypeScript checker)
bun test                     # Bun unit tests for the pure modules in src/lib
bun run build                # production build (also generates dist/client/sw.js)
bun run start                # Bun.serve production server (build first)
bun run test:watch            # Bun test watch mode
bun run test:coverage        # Bun test coverage
bun run smoke:data           # isolated Mongo/auth/import integration tests (starts its own DB)
bun run smoke:server         # production HTTP/auth/PWA checks (build first)
bun run smoke:ui             # browser/focus/offline/PWA checks (build first)
bun run generate:pwa-assets  # regenerate icons + iPhone splash screens (needs sharp)
```

Local dev without Atlas: run `bun run dev:mongo` in one terminal, then set
`MONGODB_URI=mongodb://127.0.0.1:27017/` and start `bun run dev`.

## Architecture

- `src/lib/env.server.ts` — `dbEnv()` / `authEnv()`: Zod-validated env, parsed
  lazily on first use with one clear error listing what's missing
- `src/lib/auth.ts` — Better Auth server config (Mongo adapter, username plugin)
- `src/routes/api/auth/$.ts` — the four-operation HTTP auth allowlist, checked
  before Better Auth dispatch so unsupported paths never write rate-limit rows
- `src/lib/auth-client.ts` — client-side auth calls
- `src/lib/auth.server.ts` — `requireUserId()`: reads the session, throws a
  `redirect` to `/login` if absent
- `src/lib/auth.functions.ts` — session server functions for route guards;
  `src/lib/session.ts` wraps them in a short client-side cache
  with in-flight deduplication; the login guard clears stale cached sessions.
  Sign-in/out replace the document to discard private router/preload state.
- `src/lib/db.server.ts` — Mongo client singleton, typed collections, awaited indexes
- `src/start.ts` — private/no-store responses, RPC CSRF protection, and the
  `UserFacingError` serialization adapter (`src/lib/errors.serialization.ts`)
- `src/lib/habits.server.ts` — data layer: all habit/reset queries, always
  filtered by `userId`; expected failures throw `UserFacingError`
- `src/lib/habits.functions.ts` — `createServerFn` wrappers; validators come
  from `src/lib/schemas.ts`
- `src/lib/schemas.ts` — Zod schemas + copy shared by forms and server
  functions (credentials, habit form, log-reset); `firstIssueMessage()`
- `src/lib/errors.ts` — `UserFacingError` and `userMessage(err, fallback)`
- `src/lib/streaks.ts`, `src/lib/format.ts`, `src/lib/color.ts` — pure streak
  math, formatting (`dominantUnit` for the big streak numbers), readable text
  color on a habit color. Unit-tested in `src/lib/*.test.ts`.
- `src/lib/hooks.ts` — `useAsyncAction` (busy/error for one request),
  `useNow`, `useOnline`, `haptic`
- `src/lib/theme.ts` — theme mode read/apply/persist; `THEME_INIT_SCRIPT` is
  derived from `applyTheme` and inlined in `__root.tsx`
- `src/routes/_app.tsx` — authenticated layout (redirects to `/login`)
- `src/routes/_app.index.tsx` — dashboard, `src/routes/_app.habits.$habitId.tsx`
  — one-page habit detail (with Edit), `src/routes/_app.you.tsx` —
  settings/sign-out
- `src/components/` — shared UI (bottom sheets, tab bar, calendar, charts, …);
  `HabitSheet` creates or edits a habit (`habit` prop switches mode)

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

- **Synthetic emails**: Better Auth requires an email. Signup synthesizes
  `u-<hex-encoded-normalized-username>@users.reset.internal` on the server;
  this supports usernames containing repeated/leading dots. Existing accounts
  keep their original synthetic emails and still sign in by username. Only
  signup, username sign-in, session read, and sign-out are exposed. Auth is
  rate-limited through MongoDB with unique email, username, token and rate-key
  indexes. No email is collected or sent; verification/reset remain out of scope.
- **UTC + local time**: all timestamps stored as UTC `Date`s; streaks,
  calendar days, and day-of-week/time-of-day patterns are computed in the
  browser's local timezone so days match the user's actual day.
- **Validation** (enforced server-side in `habits.server.ts`): no future habit
  start, no reset before habit start, no reset before the latest existing
  reset, no future reset, and editing a habit can't move its start after the
  first logged reset. Every query is scoped by the session's `userId` —
  route guards are UX only, server functions re-check auth.
- **Shared schemas, two-layer validation**: forms run the same Zod schema from
  `schemas.ts` before submitting (so the user sees the friendly message
  inline); the server function's `.validator()` runs it again. A Zod failure
  inside the validator surfaces as raw issue JSON, which is why the client
  pre-validates.
- **User-facing errors**: the data layer throws `UserFacingError` for
  expected failures. The router's default Error adapter strips custom identity;
  the adapter registered in `src/start.ts` preserves expected error messages
  and identity without sending their stacks. The client uses
  `userMessage(err, fallback)`. Anything else — driver errors, network failures — shows the
  fallback copy instead of leaking internals. Components use `useAsyncAction`
  for busy/error state; event handlers call server functions through
  `useServerFn` so a thrown `redirect` (expired session) navigates instead of
  erroring.
- **Client-only rendering for time-dependent routes**: the three `_app` child
  routes set `ssr: 'data-only'` — loaders still run on the server, but the
  component renders only in the browser (SSR emits `pendingComponent`). Live
  counters, locale formatting, and `localStorage` theme reads would otherwise
  hydrate against HTML rendered with the server's clock/locale.
- **Offline v1**: the service worker precaches public assets and a static
  `offline.html` fallback. SSR HTML contains private loader data and must never
  be cached, including data-only routes. Navigations use NetworkOnly; activation
  removes legacy `pages`/`static-media` caches. An already-open page keeps its
  counters running offline; fresh loads require reconnection. Writes are disabled
  offline with a visible banner (no queued sync in v1).
- **Haptics**: Vibration API on key confirmations where supported.
- **Detail-page performance**: the detail route re-renders every second for
  the live counter, so all O(resets) derivations (broken-streak map,
  completed segments, longest/average totals, calendar grouping, patterns)
  use `summarizeHistory()` inside one `useMemo`; only the ongoing segment is
  recomputed per tick. The chart copies at most 24 segments. `MonthCalendar`
  and `PatternsCard` receive stable props; a local day key refreshes the calendar
  at midnight. Detail state is keyed by habit ID.
- **Journey rendering cap**: `JourneyTimeline` shows 7 recent resets and
  expands in steps of 30 ("Show more" / "Show fewer"), keyed by habit id so
  expansion state doesn't leak between habits. All resets are still in the
  detail payload — fine at ~400 resets; server-side pagination/aggregation
  is a future improvement if histories grow much larger.
- **Sheets**: `Sheet` traps Tab focus, moves focus in on open, restores it
  on close, handles Escape, and supports `dismissible={false}` so busy
  confirmations can't be dismissed mid-request. `ConfirmSheet` takes an
  `error` prop rendered with `role="alert"`; mutations keep the sheet open
  on failure so the user can retry. `title` is required and wired to
  `aria-labelledby`. Form sheets reset their state `SHEET_CLOSE_MS` after
  closing so the close animation doesn't flash empty fields.
- **Savings fields**: `costPerUnit`/`unitsPerDay` must be both set (positive)
  or both null — one rule in `habitFormSchema`, used by both the form and the
  server.
- **Habit-color contrast**: text on a solid habit-color fill uses
  `onColor(color)`, choosing black/white for WCAG AA contrast in both themes.
- **Atomic history mutations**: `mutateHabit()` writes the habit's internal
  `revision` before reading/changing history inside a Mongo transaction. This
  makes competing edits/logs/deletes conflict and retry; snapshot reads alone
  cannot prevent insert races. Deletion rolls back as a whole on cleanup failure.
  Imports use the same parent-write protocol. MongoDB must be a replica set;
  restart an old standalone `dev:mongo` process after upgrading.

## PWA / service worker gotcha

`vite-plugin-pwa` does not emit `sw.js` under TanStack Start's Vite
multi-environment build, so `vite.config.ts` contains a small custom plugin
that runs Workbox `generateSW` after the SSR environment finishes building.
The SW is registered manually (production only) in `src/routes/__root.tsx`,
which also holds the manifest link, `apple-mobile-web-app-*` meta tags, and
splash-screen links. Assets live in `public/icons`, `public/splash`,
`public/manifest.webmanifest`; regenerate with `bun run generate:pwa-assets`.

## Deployment

Build with `bun run build`, then run `bun run start` (or `bun run preview`).
`server.ts` uses `Bun.serve` and a `Bun.Glob` allowlist of `dist/client`
files served with `Bun.file`; SSR/auth/RPC delegate to `dist/server/server.js`.
Only fingerprinted assets get immutable caching; SW/public files revalidate,
and private app responses remain no-store. `PORT` defaults to 3000 and `HOST`
to `0.0.0.0`. Deploy `server.ts`, `dist/`, `package.json`, `bun.lock` and
production dependencies (`bun install --production --frozen-lockfile`).
Other hosting targets require their TanStack Start adapter. Requirements:

- Set `MONGODB_URI`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` (must be the
  exact public origin, or auth cookies/redirects break).
- MongoDB Atlas: create a DB user and allow the host's IPs in Network Access.
- MongoDB must support transactions (replica set or sharded cluster). On first
  access the app creates unique auth indexes; existing duplicate identities or
  conflicting index definitions must be resolved before deploying. Do not
  silently drop data or uniqueness constraints to make startup succeed.
- The Bun server replaces `X-Forwarded-For` with the socket peer by default.
  Behind a reverse proxy, set `TRUST_PROXY=true` only when the proxy sets that
  header to one verified client IP and blocks direct untrusted access to the
  backend. With the default, proxied requests share the proxy's rate-limit bucket. Other adapters
  must supply their own trusted IP policy. JSON/form request bodies are capped
  at 64 KiB by the Bun server before authentication or validation.
- The server target must support Bun and Node-compatible APIs (the `mongodb` driver); on
  Cloudflare Workers check driver compatibility first.

## Dev tooling notes

- `bun install --frozen-lockfile` reproduces `bun.lock`. `package.json`
  `trustedDependencies` limits install scripts to `esbuild`, `lightningcss`,
  `sharp` and `mongodb-memory-server`. The Seroval override lives there too.
- Vite runs on Bun (`bun --bun vite`) and remains the TanStack Start bundler;
  keep its framework transforms and the Workbox build plugin.
- `bun run typecheck` uses Bun's native `bun check`. The TypeScript package
  remains available for editor tooling and comparison with `bun --bun tsc --noEmit`.
- Bun executes `.ts`/`.mjs` scripts directly; no `tsx` loader is needed.
  Bun loads `.env` automatically for app commands. Smoke subprocesses disable
  file loading with `--no-env-file` and use their isolated environment.
- `bun run smoke:data` starts an ephemeral
  replica set with a random database, ignoring configured Mongo credentials;
  tests cover CRUD, isolation, concurrency, rollback, imports, and auth. It
  closes/drops only its own database and stops its own Mongo process.
- `scripts/smoke-app.mjs` shares isolated production-server/replica-set setup
  between the HTTP and browser smoke checks. The HTTP checks call every data
  RPC directly to verify auth, ownership, CSRF, methods and error serialization.
  Browser checks use Playwright with a fresh profile; install Chromium with
  `bunx playwright install chromium`, or set `PLAYWRIGHT_EXECUTABLE_PATH` in the
  shell to an existing Chromium/Edge executable. They cover sheets/focus, CRUD,
  long text, busy dismissal, offline behavior and actual service-worker caches.
- `bun test` uses `bun:test` with `bunfig.toml` rooted in `src` (no Vite
  plugins). Tests cover pure logic, session caching,
  theme fallback, env validation, and the configured RPC error serialization;
  anything touching Mongo goes in
  the smoke test instead.
- Most `@tanstack/*` dependencies use caret ranges; `router-core` is pinned to
  the version used by `react-router` so serialization tests share its types.
  Bump them deliberately and re-run typecheck + build.
- The Start override keeps optional Better Auth peers on the patched Start
  release (GHSA-qx66-fv34-fjm8). Bun 1.4.3 is required because BSON's V8
  startup-snapshot check crashes under the previously installed Bun 1.3.14.
- The Seroval override keeps Solid's older serializer range on the patched
  release used by Start. Check `bun audit` after dependency changes.
- `scripts/import-resets.mjs` imports reset timestamps from an exported JSON
  file (fields `occurredAt.$date` / `createdAt.$date`) into an existing habit,
  deduping on exact timestamp and backdating the habit's `startDate` to the
  earliest imported reset:
  `bun scripts/import-resets.mjs <uri> <db> <habitId> <userId> <json-file>`

## Next steps / future ideas (out of scope for v1)

Email verification, password reset, push notifications/reminders, offline
write queueing with sync, social/sharing, native app.
