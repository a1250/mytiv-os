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
