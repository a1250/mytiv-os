#!/usr/bin/env bash
# Marketing data-layer integration suite against a LOCAL, THROWAWAY PostgreSQL (never Neon / staging / production).
#   ITEST_DB=<name> ITEST_CONFIRM_DROP=<name> PGHOST=<unix socket dir | localhost> PGPORT=<port> PGUSER=<user> \
#   [ITEST_PG_MODULE=/path/to/node_modules/pg] tests/db-integration/run.sh
# Drops and recreates $ITEST_DB, applies every migration in journal order, runs the SQL fixtures, the
# concurrency test, and the vitest *.itest.ts suite (app code on a node-postgres Drizzle instead of neon-http).
set -euo pipefail
cd "$(dirname "$0")/../.."
: "${ITEST_DB:?set ITEST_DB}"; : "${PGHOST:?set PGHOST}"
[ "${ITEST_CONFIRM_DROP:-}" = "$ITEST_DB" ] || { echo "refusing: set ITEST_CONFIRM_DROP=$ITEST_DB to confirm this database may be dropped"; exit 2; }
case "$PGHOST" in /*|localhost|127.0.0.1|::1) ;; *) echo "refusing: PGHOST=$PGHOST is not a local socket/localhost"; exit 2;; esac
P="psql -v ON_ERROR_STOP=1 -q"
$P -d postgres -c "DROP DATABASE IF EXISTS \"$ITEST_DB\"" && $P -d postgres -c "CREATE DATABASE \"$ITEST_DB\""
for tag in $(node -e "console.log(require('./drizzle/migrations/meta/_journal.json').entries.map(e=>e.tag).join(' '))"); do
  $P -d "$ITEST_DB" -f "drizzle/migrations/$tag.sql" >/dev/null 2>&1 || { echo "MIGRATION FAILED: $tag"; exit 1; }
done
echo "migrations applied: $(node -e "console.log(require('./drizzle/migrations/meta/_journal.json').entries.length)")"
for f in tests/ops-database.sql tests/marketing-*.sql; do $P -d "$ITEST_DB" -f "$f" >/dev/null 2>&1 && echo "SQL PASS  $f" || { echo "SQL FAIL  $f"; exit 1; }; done
for c in tests/marketing-*-concurrency.sh; do "$c" "-d $ITEST_DB"; done
for w in tests/work-*.sh; do ITEST_DB="$ITEST_DB" "$w"; done
node node_modules/vitest/vitest.mjs run --config tests/db-integration/vitest.config.mjs
