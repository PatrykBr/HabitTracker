# Reset

Reset tracks habits you're trying to quit. Each habit has a live streak counter,
reset history, stats, milestones, and a calendar. You can log a reset now or enter
when it happened earlier.

The app uses Bun, TanStack Start, MongoDB, and Better Auth. You can install it
as a PWA. The interface has a bottom tab bar, modal sheets, and light and dark
themes. The offline fallback contains no private data.

## Quick start

Install Bun 1.4.3 or newer. The tested version is pinned in `.bun-version`.
Upgrade an existing installation with `bun upgrade`.

```bash
bun install --frozen-lockfile
cp .env.example .env   # set MONGODB_URI, BETTER_AUTH_SECRET and BETTER_AUTH_URL
bun run dev           # http://localhost:3000
```

For local development, start a temporary MongoDB replica set in a separate terminal:

```bash
bun run dev:mongo     # single-node replica set on port 27017
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
bun run build:vercel         # Vercel functions and public assets in .vercel/output
bun run start                # Bun production server; build first
bun run preview              # same production server, for local preview
bun run generate-routes      # regenerate route tree after adding routes
bun run typecheck            # Bun's native TypeScript check
bun test                     # Bun unit tests
bun run test:watch            # rerun tests when files change
bun run test:coverage        # unit tests with Bun coverage
bun run smoke:data           # isolated Mongo/auth/import checks; starts its own DB
bun run smoke:server         # production HTTP/auth/PWA checks; build first
bun run smoke:vercel         # Vercel artifact, SSR and auth checks; build:vercel first
bun run smoke:ui             # browser flows, focus, offline/PWA; build first
bun run generate:pwa-assets  # regenerate PWA icons and splash screens
bun audit                    # check dependency advisories
```

For browser checks, install Chromium once with `bunx playwright install chromium`.
You can also set `PLAYWRIGHT_EXECUTABLE_PATH` to an installed Chromium or Edge
executable. Smoke checks use temporary replica sets and fresh
accounts; they never use the configured database or your browser profile.

Bun manages packages through `bun.lock`, runs the tooling and TypeScript scripts,
loads `.env`, and supplies the test runner, file I/O and subprocess APIs.
Vite remains the bundler for TanStack Start's routing, server-function and SSR
plugins. Bun's native `bun check` validates TypeScript. Sharp generates image
assets.
Router devtools are available in development at `?tanstack-devtools` and are
excluded from production through a conditional import.
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

### Vercel

Use the TanStack Start framework preset, `bun run build` as the build command,
and the default output directory setting. The Vercel build environment enables
Nitro, which writes the server function and routing config to `.vercel/output`.
Do not set the output directory to `dist/client`; it has no server function.
Nitro uses TanStack Start's SSR entry. The root `server.ts` starts the standalone
Bun server and must not be used as Nitro's server entry.

Vercel functions explicitly use Node.js 24. Nitro otherwise selects Bun when
the build runs on Bun, but Vercel's Bun runtime lacks the V8 snapshot API that
MongoDB's BSON dependency calls on import. Bun still manages packages, builds,
and tests. Install Node.js 24 locally to run `smoke:vercel`.

Set `MONGODB_URI`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` in the Vercel
environment. For this project, the production auth URL is
`https://habit-tracker-001-livid.vercel.app`. MongoDB must accept connections
from the deployment and support transactions. Vercel supplies the client IP
header for auth rate limits; `TRUST_PROXY` applies only to the standalone server.

Check the Vercel artifact locally before deploying:

```bash
bun run build:vercel
bun run smoke:vercel
```

The smoke check starts a temporary MongoDB replica set and calls the generated
function under Node.js 24. It checks the root redirect, login page, signup,
sign-in, session, dashboard, private cache headers, client asset links, and
public PWA files. It does not
contact the configured database. Push the changes and redeploy to update the
production site.

The Bun server limits request bodies to 64 KiB and uses the socket peer address
for auth rate limits. When deploying behind a reverse proxy, set
`TRUST_PROXY=true` only if that proxy sets `X-Forwarded-For` to one verified
client IP and the backend cannot be reached directly by untrusted clients.
Otherwise leave it `false`; requests through a proxy then share that proxy's
rate-limit bucket. Other server adapters must establish their own trusted
client-IP policy.

See [AGENTS.md](./AGENTS.md) for architecture, key decisions, deployment
notes, and project constraints.

MongoDB transactions require a replica set. Restart any older standalone
`bun run dev:mongo` process after upgrading. Auth indexes are created on first
access; an existing database with duplicate identities needs cleanup before
those unique indexes can be installed.
