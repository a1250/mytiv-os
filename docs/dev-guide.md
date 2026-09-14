# Developer Guide

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without emitting files |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema changes directly (no migration file) |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:seed` | Seed the database with initial user and business |
| `npm run audit:leaks` | Audit for data leaks |
| `npm run ops:check` | Run ops delivery-health check |
| `npm run ops:backfill` | Backfill project data from ClickUp |
| `npm run ops:copilot-check` | Run ops copilot diagnostics |

> **Note:** No `test` script is currently configured in `package.json`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SECRETS_MASTER_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `BLOB_READ_WRITE_TOKEN`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `CRON_SECRET`
- `CLICKUP_API_TOKEN`
- `CLICKUP_WORKSPACE_ID`
- `STUCK_THRESHOLD_DAYS`
- `CONTRACTOR_HOURLY_COST`
- `SEED_OWNER_EMAIL`
- `SEED_OWNER_PASSWORD`
