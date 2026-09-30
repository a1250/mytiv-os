# Marketing data-layer integration suite (local Postgres only)

Proves the migrations and the DB-backed marketing code against a real PostgreSQL, which CI does not have.
`run.sh` drops/recreates a throwaway database, applies **every** migration in journal order, runs the SQL
fixtures (`tests/ops-database.sql`, `tests/marketing-*.sql`), the concurrency test and the `*.itest.ts`
vitest files (app code on a node-postgres Drizzle; production uses neon-http).

Safety: refuses any `PGHOST` that is not a unix-socket path or localhost, and requires
`ITEST_CONFIRM_DROP=<same name as ITEST_DB>`. Never point it at Neon, staging or production.

```bash
# a throwaway cluster (example)
initdb -D /tmp/pgdata -U postgres --auth=trust --locale=C && pg_ctl -D /tmp/pgdata -o "-p 55432 -k /tmp -c listen_addresses=''" start
PGHOST=/tmp PGPORT=55432 PGUSER=postgres ITEST_DB=itest ITEST_CONFIRM_DROP=itest \
  ITEST_PG_MODULE=/path/to/node_modules/pg tests/db-integration/run.sh   # `pg` is not a mytiv-os dependency
```

## Engine ↔ app round trip (`roundtrip.itest.ts`)

Skipped unless `RT_ENGINE_DIR` points at a **marketing-os checkout** (its `node_modules` installed). It seeds a
throwaway engine tenant `rt<random>` from the fictional `_fixture-demo` brain (`roundtrip-engine.ts`, run with
the engine's own `tsx`), exports it, imports every artifact into the local DB through the vendored contracts,
records C2b / C6 / C16 / C15 / C3b through the real app services, applies each exported record with the
engine's own CLIs (`apply-decisions --file`, `apply-evidence`, `apply-receipts`, `apply-outcomes`,
`apply-proposals`) and requires the next export to reconcile every record in the app. It also asserts the
refusals (C2b replay / conflict / tenant mismatch / stale) and that an approval's C2a `content_hash` is the
same pending → decided → applied (owner decision D13.1). The engine tenant is deleted afterwards.
Use a disposable engine worktree; the helper refuses to touch any tenant not named `rt…`.

```bash
RT_ENGINE_DIR=/path/to/marketing-os-worktree PGHOST=/tmp PGPORT=55432 PGUSER=postgres ITEST_DB=itest \
  ITEST_CONFIRM_DROP=itest ITEST_PG_MODULE=/path/to/node_modules/pg tests/db-integration/run.sh
```
