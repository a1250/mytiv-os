#!/usr/bin/env bash
# LOCAL integration stack for Focus × Mytiv (never Neon / staging / production):
#   1. drops and recreates $INT_DB on a LOCAL PostgreSQL and applies every migration in journal order;
#   2. seeds the fictional staging fixtures (scripts/staging/seed-staging.mjs) with a random password;
#   3. (with `serve`) starts the local SQL endpoint (scripts/focus/int/neon-local-sql.mjs) and `next dev` against it;
#      the app reaches it only through lib/db/local-endpoint.ts (both URLs must be localhost).
# Usage:
#   PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres INT_DB=focus_int INT_CONFIRM_DROP=focus_int \
#   ITEST_PG_MODULE=/path/to/node_modules/pg scripts/focus/int/stack.sh db|serve [port]
# The fixture password is written to $INT_SECRETS_DIR/int-password (default: a temp dir), never to the repo.
set -euo pipefail
cd "$(dirname "$0")/../../.."
: "${INT_DB:?set INT_DB}"; : "${PGHOST:?set PGHOST}"; : "${PGPORT:?set PGPORT}"; : "${PGUSER:?set PGUSER}"
case "$PGHOST" in 127.0.0.1|localhost|::1) ;; *) echo "refusing: PGHOST=$PGHOST is not localhost"; exit 2;; esac
SECRETS="${INT_SECRETS_DIR:-${TMPDIR:-/tmp}/focus-int}"; mkdir -p "$SECRETS"; chmod 700 "$SECRETS"
export DATABASE_URL="postgresql://$PGUSER@$PGHOST:$PGPORT/$INT_DB"
export DATABASE_URL_UNPOOLED="$DATABASE_URL"

if [ "${1:-}" = "db" ]; then
  [ "${INT_CONFIRM_DROP:-}" = "$INT_DB" ] || { echo "refusing: set INT_CONFIRM_DROP=$INT_DB to confirm this database may be dropped"; exit 2; }
  P="psql -v ON_ERROR_STOP=1 -q -h $PGHOST -p $PGPORT -U $PGUSER"
  $P -d postgres -c "DROP DATABASE IF EXISTS \"$INT_DB\"" && $P -d postgres -c "CREATE DATABASE \"$INT_DB\""
  for tag in $(node -e "console.log(require('./drizzle/migrations/meta/_journal.json').entries.map(e=>e.tag).join(' '))"); do
    $P -d "$INT_DB" -f "drizzle/migrations/$tag.sql" >/dev/null || { echo "MIGRATION FAILED: $tag"; exit 1; }
  done
  echo "migrations applied: $(node -e "console.log(require('./drizzle/migrations/meta/_journal.json').entries.length)")"
  PW="$(node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))")"
  printf '%s' "$PW" > "$SECRETS/int-password"; chmod 600 "$SECRETS/int-password"
  STAGING_PASSWORD="$PW" node scripts/staging/seed-staging.mjs | $P -d "$INT_DB" >/dev/null
  echo "seeded fixtures (password in $SECRETS/int-password)"
elif [ "${1:-}" = "serve" ]; then
  : "${ITEST_PG_MODULE:?set ITEST_PG_MODULE}"
  export AUTH_SECRET="${AUTH_SECRET:-$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")}"
  export SECRETS_MASTER_KEY="${SECRETS_MASTER_KEY:-$(printf '0%.0s' {1..64})}"
  SQLPORT="${INT_SQL_PORT:-4444}"
  node scripts/focus/int/neon-local-sql.mjs "$SQLPORT" & SQLPID=$!
  trap 'kill $SQLPID 2>/dev/null' EXIT
  export NEON_LOCAL_SQL_ENDPOINT="http://127.0.0.1:$SQLPORT/sql"
  npx next dev -p "${2:-3300}"
else
  echo "usage: stack.sh db|serve [port]"; exit 2
fi
