# Reset

A supportive habit-quitting tracker PWA. Track a live streak since your last
reset (relapse), log resets when they happen — including backdated — and see
real history, stats, milestones, and a calendar per habit.

Built with Bun, TanStack Start, MongoDB, and Better Auth. Installable as a PWA
with an iOS-native feel: bottom tab bar, bottom sheets, safe areas, dark-first
Liquid-Glass styling, and a private-data-free offline fallback.

## Quick start

Install Bun 1.4.3 or newer (the tested version is pinned in `.bun-version`).
Upgrade an existing installation with `bun upgrade`.

```bash
bun install --frozen-lockfile
cp .env.example .env   # fill in MONGODB_URI and BETTER_AUTH_SECRET
bun run dev           # http://localhost:3000
```

No MongoDB handy? Run a throwaway in-memory one:

```bash
bun run dev:mongo     # separate terminal; single-node replica set on port 27017
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB replica-set connection string (Atlas or local) |
| `MONGODB_DB` | no | Database name (default `reset-tracker`) |
| `BETTER_AUTH_SECRET` | yes | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | yes | Exact app origin, e.g. `http://localhost:3000` |
| `TRUST_PROXY` | no | Bun server only; default `false`. See proxy requirements below. |

## Commands

```bash
bun run dev                  # Vite dev server running on Bun
bun run build                # production build (includes service worker)
bun run start                # Bun production server; build first
bun run preview              # same production server, for local preview
bun run generate-routes      # regenerate route tree after adding routes
bun run typecheck            # Bun's native TypeScript check
bun test                     # Bun unit tests
bun run test:watch            # rerun tests when files change
bun run test:coverage        # unit tests with Bun coverage
bun run smoke:data           # isolated Mongo/auth/import checks; starts its own DB
bun run smoke:server         # production HTTP/auth/PWA checks; build first
bun run smoke:ui             # browser flows, focus, offline/PWA; build first
bun run generate:pwa-assets  # regenerate PWA icons and splash screens
bun audit                    # check dependency advisories
```

For browser checks, install Chromium once with `bunx playwright install chromium`.
Alternatively, set `PLAYWRIGHT_EXECUTABLE_PATH` in the shell to an installed
Chromium/Edge executable. Smoke checks use temporary replica sets and fresh
accounts; they never use the configured database or your browser profile.

Bun manages packages (`bun.lock`), runs the tooling and TypeScript scripts,
loads `.env`, and supplies the test runner, file I/O and subprocess APIs.
Vite remains the bundler for TanStack Start's routing, server-function and SSR
plugins. Bun's native `bun check` validates TypeScript; Sharp generates image
assets.
Dependency install scripts are limited to the packages listed in
`trustedDependencies` in `package.json`.

For production, run `bun run build` followed by `bun run start`. Deploy
`server.ts`, `dist/`, `package.json`, `bun.lock` and production dependencies
installed with `bun install --production --frozen-lockfile`. Set the app's
environment variables above; `PORT` defaults to 3000 and `HOST` to `0.0.0.0`.
The server uses `Bun.serve`, streams public files with `Bun.file`, and delegates
SSR/auth/RPC to TanStack Start. Hashed assets are immutable; service workers
and other public files revalidate. App responses retain `private, no-store`.
Platform-specific deployments need the corresponding TanStack adapter.

The Bun server limits request bodies to 64 KiB and uses the socket peer address
for auth rate limits. When deploying behind a reverse proxy, set
`TRUST_PROXY=true` only if that proxy sets `X-Forwarded-For` to one verified
client IP and the backend cannot be reached directly by untrusted clients.
Otherwise leave it `false`; requests through a proxy then share that proxy's
rate-limit bucket. Other server
adapters must establish their own trusted client-IP policy.

See [AGENTS.md](./AGENTS.md) for architecture, key decisions, deployment
notes, and known gotchas.

MongoDB transactions require a replica set. Restart any older standalone
`bun run dev:mongo` process after upgrading. Auth indexes are created on first
access; an existing database with duplicate identities needs cleanup before
those unique indexes can be installed.
