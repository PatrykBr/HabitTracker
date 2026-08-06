# Reset

A supportive habit-quitting tracker PWA. Track a live streak since your last
reset (relapse), log resets when they happen — including backdated — and see
real history, stats, milestones, and a calendar per habit.

Built with TanStack Start, MongoDB, and Better Auth. Installable as a PWA
with an iOS-native feel: bottom tab bar, bottom sheets, safe areas, dark-first
Liquid-Glass styling, offline app shell.

## Quick start

```bash
pnpm install
cp .env.example .env   # fill in MONGODB_URI and BETTER_AUTH_SECRET
pnpm dev               # http://localhost:3000
```

No MongoDB handy? Run a throwaway in-memory one:

```bash
pnpm dev:mongo         # separate terminal; serves mongodb://127.0.0.1:27017/
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string (Atlas or local) |
| `MONGODB_DB` | no | Database name (default `reset-tracker`) |
| `BETTER_AUTH_SECRET` | yes | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | yes | Exact app origin, e.g. `http://localhost:3000` |

## Commands

```bash
pnpm dev                  # dev server
pnpm build                # production build (includes service worker)
pnpm preview              # preview the production build
pnpm generate-routes      # regenerate route tree after adding routes
pnpm smoke:data           # data-layer smoke test against local MongoDB
pnpm generate:pwa-assets  # regenerate PWA icons and splash screens
```

See [AGENTS.md](./AGENTS.md) for architecture, key decisions, deployment
notes, and known gotchas.
