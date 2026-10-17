<!-- intent-skills:start -->
## Skill loading

Before editing files for a substantial task:

- Run `bunx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- When working across packages in a monorepo, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Prefer the most specific matching skill. Load additional skills when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# Reset habit tracker

Reset is a PWA for tracking habits you're trying to quit. Each habit has a live
streak counter, reset history, stats, milestones, and a month calendar. Resets
can be backdated and have an optional trigger tag and note. Users sign in with
a username and password. Every habit and reset belongs to one user.

Keep the tone supportive and non-judgmental. A reset is a normal part of quitting.
Use "Streak restarted" to describe a reset. Avoid language that judges the user.
Apply the unslop skill to UI copy, documentation, comments, and developer messages.
Use plain words, sentence case, and straight quotes. Avoid slogans and em dashes.

## Project creation

The project was created with these commands:

```powershell
npx -y @tanstack/cli@latest create reset-tracker --agent --package-manager pnpm --tailwind
# The CLI warned that --tailwind was deprecated. Tailwind is included by default.
npx -y @tanstack/intent@latest install
npx -y @tanstack/intent@latest list
bunx @tanstack/intent@latest load "@tanstack/start-client-core#start-core/server-functions"
bunx @tanstack/intent@latest load "@tanstack/start-client-core#start-core/auth-server-primitives"
```

No Better Auth Intent skill was available during setup, so setup used the Better Auth docs.

## Stack

- Bun 1.4.3 or newer manages packages, runs scripts, and executes tests.
  `.bun-version` pins the tested version. `bun.lock` records dependencies.
- TanStack Start uses React 19, file-based routes in `src/routes`, Vite 8, and Tailwind 4.
- Server functions use the official `mongodb` driver. There is no separate REST
  API except the Better Auth handler at `src/routes/api/auth/$.ts`.
- Better Auth uses the MongoDB adapter, username plugin, and `tanstackStartCookies`.
- Zod validates server-function input.
- A custom Workbox build generates the service worker.

## Environment variables

Copy `.env.example` to `.env` and set these values:

- `MONGODB_URI` is the required MongoDB replica-set connection string. Atlas works.
- `MONGODB_DB` is optional and defaults to `reset-tracker`.
- `BETTER_AUTH_SECRET` is required. Generate it with `openssl rand -base64 32`
  or `bun -e "console.log(crypto.randomBytes(32).toString('base64'))"`.
- `BETTER_AUTH_URL` is the required deployment origin, such as `http://localhost:3000`.
- `TRUST_PROXY` applies to the Bun production server and defaults to `false`.
  Enable it only behind a proxy that sets `X-Forwarded-For` to one verified
  client IP and prevents untrusted clients from connecting directly to the backend.

Never commit secrets. Git ignores `.env`.

## Commands

```powershell
bun run dev                  # Start development on http://localhost:3000 with .env settings.
bun run dev:mongo            # Start a temporary replica set on 127.0.0.1:27017.
bun run generate-routes      # Regenerate routeTree.gen.ts after adding routes.
bun run typecheck            # Run Bun's native TypeScript checker.
bun test                     # Run unit tests in src.
bun run build                # Build production files and dist/client/sw.js.
bun run start                # Start the Bun production server after building.
bun run test:watch           # Watch unit tests.
bun run test:coverage        # Run unit tests with coverage.
bun run smoke:data           # Run Mongo, auth, and import tests with an isolated database.
bun run smoke:server         # Run HTTP, auth, and PWA checks after building.
bun run smoke:ui             # Run browser, focus, offline, and PWA checks after building.
bun run generate:pwa-assets  # Regenerate icons and iPhone splash screens with Sharp.
```

For local development without Atlas, run `bun run dev:mongo` in one terminal.
Set `MONGODB_URI=mongodb://127.0.0.1:27017/`, then run `bun run dev` in another.

## Architecture

- `src/lib/env.server.ts` validates environment variables with Zod on first use.
  `dbEnv()` and `authEnv()` report missing or invalid values in one error.
- `src/lib/auth.ts` configures Better Auth with MongoDB and username authentication.
- `src/routes/api/auth/$.ts` allows four auth operations. It rejects unsupported
  paths before dispatch so they cannot create rate-limit records.
- `src/lib/auth-client.ts` provides client-side auth calls.
- `src/lib/auth.server.ts` provides `requireUserId()`. It reads the session and
  redirects to `/login` when no user is signed in.
- `src/lib/auth.functions.ts` provides session reads for route guards.
  `src/lib/session.ts` caches them briefly and deduplicates concurrent reads.
  The login guard clears stale sessions. Sign-in and sign-out replace the
  document to discard private router data and pending preloads.
- `src/lib/db.server.ts` shares one MongoDB client, defines collection types,
  and waits for indexes before serving requests.
- `src/start.ts` sets private/no-store headers, protects RPCs against CSRF, and
  registers the error adapter from `src/lib/errors.serialization.ts`.
- `src/lib/habits.server.ts` contains habit and reset queries. It filters each
  query by `userId` and throws `UserFacingError` for expected errors.
- `src/lib/habits.functions.ts` wraps the data functions with `createServerFn`
  and validators from `src/lib/schemas.ts`.
- `src/lib/schemas.ts` shares validation rules and messages between forms and
  server functions. `parseForm()` throws the first issue as a `UserFacingError`.
- `src/lib/errors.ts` defines `UserFacingError` and `userMessage(err, fallback)`.
- `src/lib/streaks.ts`, `src/lib/format.ts`, and `src/lib/color.ts` calculate
  streaks, format values, and select readable habit colors. `dominantUnit()`
  selects the main streak number's unit. Unit tests live in `src/lib/*.test.ts`.
- `src/lib/hooks.ts` provides `useAsyncAction`, `useNow`, `useOnline`, and `haptic`.
- `src/lib/theme.ts` reads, applies, and persists the theme. `THEME_INIT_SCRIPT`
  derives from `applyTheme` and runs inline in `__root.tsx`.
- `src/routes/_app.tsx` provides the authenticated layout and login redirect.
- `src/routes/_app.index.tsx` is the dashboard.
  `src/routes/_app.habits.$habitId.tsx` shows a habit and its edit sheet.
  `src/routes/_app.you.tsx` contains appearance settings and sign-out.
- `src/components/` contains shared sheets, tabs, calendars, and charts.
  `HabitSheet` creates a habit or edits the supplied `habit` prop.

### Data model

- `habits` stores `_id`, `userId`, `name`, `icon`, `color`, `startDate`,
  optional `costPerUnit` and `unitsPerDay`, and `createdAt`.
- `resets` stores `_id`, `habitId`, `userId`, `timestamp`, optional `trigger`
  and `note`, and `createdAt`. `timestamp` records when the reset happened and
  may be backdated. `createdAt` records when the user logged it.
- Better Auth manages `user`, `session`, `account`, and its other collections.
  Raw `user` records have an ObjectId `_id`. The API returns its hex string as
  `user.id`, and app `userId` fields store that string.

### Authentication and validation

Better Auth requires an email. Signup generates
`u-<hex-encoded-normalized-username>@users.reset.internal` on the server.
Hex encoding supports usernames with leading or repeated dots. Existing accounts
keep their original synthetic emails and still sign in by username. The app
collects and sends no email. Email verification and password reset are out of scope.

Only signup, username sign-in, session read, and sign-out are exposed. MongoDB
stores rate limits and unique indexes on email, username, session token, and
rate-limit key.

`habits.server.ts` rejects future start dates, resets before the habit start or
latest reset, and future resets. A habit edit cannot move its start after the
first logged reset. Every query uses the session's `userId`. Each server function
must check authentication, even when a route guard has already checked it.

Forms validate with the shared Zod schemas before submitting so errors appear
inline. Server-function validators run the same schemas again. Validator failures
can return raw Zod issue JSON, so keep client validation as well as server validation.

The data layer throws `UserFacingError` for expected errors. The adapter in
`src/start.ts` preserves its identity and message without sending its stack.
The router's default Error adapter strips custom identity. The client calls
`userMessage(err, fallback)` to show expected errors and fallback copy for driver,
network, and other unexpected errors. Components use `useAsyncAction` for request
state and `useServerFn` for event-handler calls so an expired session redirects
to login.

### Time and rendering

Store timestamps as UTC `Date` values. Calculate streaks, calendar days, and
weekday/time-of-day patterns in the browser's local timezone.

The three `_app` child routes set `ssr: 'data-only'`. Loaders still run on the
server. Components render in the browser, while SSR emits `pendingComponent`.
This avoids hydration differences caused by clocks, locales, and `localStorage`.

The detail route updates its live counter every second. Derive reset history
with `summarizeHistory()` inside `useMemo`. Keep the broken-streak map, completed
segments, longest/average totals, calendar grouping, and pattern counts out of
per-tick work. Only the ongoing segment changes each tick. The chart copies at
most 24 segments. Give `MonthCalendar` and `PatternsCard` stable props. A local
day key refreshes the calendar at midnight. Key detail state by habit ID.

`JourneyTimeline` initially shows 7 resets and expands by 30. It supports
"Show more" and "Show fewer". Key it by habit ID so expansion state does not
carry across habits. Memoize its static history separately from the live counter.
The detail payload still contains all resets. Reassess this approach if histories
grow much larger than about 400 resets. Consider server pagination or aggregation.

### Sheets and feedback

`Sheet` moves focus in on open, traps Tab, handles Escape, and restores focus
on close. Its required `title` supplies `aria-labelledby`. Set
`dismissible={false}` during requests to block dismissal. `ConfirmSheet` renders
its `error` with `role="alert"`. Keep a failed mutation's sheet open so the user
can retry. Reset form state `SHEET_CLOSE_MS` after closing to avoid changing
fields during the close animation.

Use the Vibration API for key confirmations where supported.

`costPerUnit` and `unitsPerDay` must both be positive or both be null.
`habitFormSchema` enforces this for forms and server functions.

Use `onColor(color)` for text on a solid habit-color fill. It selects black or
white for WCAG AA contrast in both themes.

### Atomic history changes

`mutateHabit()` writes the habit's internal `revision` before reading or changing
history in a MongoDB transaction. This makes competing edits, logs, and deletes
conflict and retry. Snapshot reads alone cannot prevent concurrent insert races.
A cleanup error rolls back the entire deletion. Imports use the same parent-write
protocol. MongoDB must support transactions. Restart an old standalone `dev:mongo`
process after upgrading to the replica-set setup.

## Offline behavior and service worker

The service worker precaches public assets and `offline.html`. Never cache SSR
HTML, including data-only routes, because it contains private loader data.
Navigations use NetworkOnly. Activation removes legacy `pages` and `static-media`
caches. An open page keeps its counters running offline. Fresh loads require
reconnection. The offline banner explains why writes are disabled. Version 1
does not queue or sync writes.

`vite-plugin-pwa` did not emit `sw.js` with this TanStack Start multi-environment
build. The custom plugin in `vite.config.ts` calls Workbox `generateSW` after the
SSR build finishes. `src/routes/__root.tsx` registers the worker in production
and links the manifest, Apple web-app metadata, and splash screens. Assets live
in `public/icons`, `public/splash`, and `public/manifest.webmanifest`.
Regenerate them with `bun run generate:pwa-assets`.

## Deployment

Run `bun run build`, then `bun run start` or `bun run preview`. `server.ts` uses
`Bun.serve` and serves a `Bun.Glob` allowlist of `dist/client` files with `Bun.file`.
It delegates SSR, auth, and RPC requests to `dist/server/server.js`. Only
fingerprinted assets use immutable caching. Service-worker and public files
revalidate. Private responses remain no-store.

`PORT` defaults to 3000 and `HOST` to `0.0.0.0`. Deploy `server.ts`, `dist/`,
`package.json`, `bun.lock`, and production dependencies installed with
`bun install --production --frozen-lockfile`. Other hosts need their TanStack
Start adapter.

- Set `MONGODB_URI`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`. The URL must
  match the public origin for auth cookies and redirects to work.
- For Atlas, create a database user and allow the host's IP addresses in Network Access.
- Use a MongoDB replica set or sharded cluster with transaction support. The app
  creates unique auth indexes on first access. Resolve duplicate identities or
  conflicting index definitions before deployment. Do not drop data or uniqueness
  constraints to make startup succeed.
- The Bun server replaces `X-Forwarded-For` with the socket peer by default.
  Proxied requests then share the proxy's rate-limit bucket. Set `TRUST_PROXY=true`
  only when the proxy supplies one verified client IP and blocks direct untrusted
  access. Other adapters must define their own trusted IP policy.
- The Bun server caps JSON and form request bodies at 64 KiB before authentication
  or validation. The app has no file uploads.
- The host must support Bun and the Node-compatible APIs used by `mongodb`.
  Check driver compatibility before choosing Cloudflare Workers.

## Development tools

Use the installed Tailwind version's canonical classes, including fractional
spacing (`w-3.25`), numeric z-index (`z-60`), theme tokens (`rounded-3xl`), and
CSS-variable shorthand (`bg-(--fill-3)`). Check the full class set with Tailwind's
canonicalizer. Replacing a single syntax pattern is not a complete check.

`bun install --frozen-lockfile` reproduces `bun.lock`. `trustedDependencies` in
`package.json` limits install scripts to `esbuild`, `lightningcss`, `sharp`, and
`mongodb-memory-server`. The Seroval override is also in `package.json`.

Vite runs on Bun through `bun --bun vite`. Keep TanStack Start's framework
transforms and the Workbox build plugin. `bun run typecheck` uses `bun check`.
Keep TypeScript for editors and comparison with `bun --bun tsc --noEmit`.
Bun runs `.ts` and `.mjs` scripts directly without `tsx`.

Bun loads `.env` for app commands. Smoke subprocesses use `--no-env-file` and
isolated settings. `bun run smoke:data` starts its own temporary replica set
and random database without using configured MongoDB credentials. It covers CRUD,
user isolation, concurrency, rollback, imports, and auth. Cleanup drops only its
own database and stops only its own MongoDB process.

`scripts/smoke-app.mjs` shares the isolated server and replica-set setup for HTTP
and browser checks. HTTP checks call every data RPC to verify authentication,
ownership, CSRF protection, methods, and error serialization. Browser checks use
Playwright with a fresh profile. Install Chromium with
`bunx playwright install chromium`, or set `PLAYWRIGHT_EXECUTABLE_PATH` to an
existing Chromium or Edge executable. Checks cover sheets, focus, CRUD, long
text, busy dismissal, offline behavior, and service-worker caches.

Browser smoke checks use Chromium. Physical iPhone checks are still needed for
Safari, installed-PWA safe areas, the software keyboard, VoiceOver, and Dynamic Type.

`bun test` uses `bun:test` with `bunfig.toml` rooted in `src`, without Vite plugins.
Tests cover pure logic, session caching, theme fallback, environment validation,
and RPC error serialization. Put MongoDB checks in the smoke tests.

Router devtools load from `src/components/Devtools.tsx` in development through
`?tanstack-devtools`. Vite's `import.meta.env.DEV` check removes the module from
production. No stripping or source-injection plugin is needed.

Most `@tanstack/*` dependencies use caret ranges. `router-core` is pinned to
`react-router`'s version so serialization tests share its types. After changing
these versions, run typecheck and build. The Start override keeps optional
Better Auth peers on the patched Start release for GHSA-qx66-fv34-fjm8.
Bun 1.4.3 is required because BSON's V8 startup-snapshot check crashed with
Bun 1.3.14. The Seroval override keeps transitive serializer ranges on the
patched release used by Start. Run `bun audit` after dependency changes.

`scripts/import-resets.mjs` imports timestamps from exported JSON fields
`occurredAt.$date` and `createdAt.$date` into an existing habit. It deduplicates
exact timestamps and moves `startDate` back to the earliest imported reset.

```powershell
bun scripts/import-resets.mjs <uri> <db> <habitId> <userId> <json-file>
```

## Out of scope for version 1

Email verification, password reset, reminders and push notifications, offline
write queues and sync, social sharing, and a native app are out of scope.
