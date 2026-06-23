# Relapse Ledger

A mobile-first full-stack bad habit tracker for logging resets, backdating slips, seeing calendar history, and measuring progress.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS 4
- Better Auth email/password auth
- MongoDB Atlas via the native MongoDB driver
- date-fns and Zod

## Local setup

1. Install dependencies:

   ```bash
   npm install --legacy-peer-deps
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in:

   - `MONGODB_URI` with your MongoDB Atlas connection string
   - `MONGODB_DB` with the database name
   - `MONGODB_ENABLE_TRANSACTIONS` set to `true` for Atlas/replica set deployments or `false` for standalone local MongoDB
   - `BETTER_AUTH_SECRET` with a real 32+ character secret
   - `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` with the app origin
   - `RESEND_API_KEY` and `EMAIL_FROM` for password reset and verification emails

4. Create MongoDB indexes:

   ```bash
   npm run db:indexes
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

For production builds, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` must be set.
Password reset and email verification require `RESEND_API_KEY` and `EMAIL_FROM` in production.
