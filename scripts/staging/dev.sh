#!/usr/bin/env bash
# Staging app server. Loads .env.staging on top of the process environment so its values beat
# .env.local (Next.js never overrides an existing process variable). Refuses to start if the
# staging DATABASE_URL is the production one from .env.local, or if the ClickUp base is real.
set -euo pipefail
cd "$(dirname "$0")/../.."
[ -f .env.staging ] || { echo "missing .env.staging"; exit 1; }
set -a; . ./.env.staging; set +a
PROD_URL=$(grep -E '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '"' || true)
[ -n "${DATABASE_URL:-}" ] || { echo "staging DATABASE_URL missing"; exit 1; }
[ "$DATABASE_URL" != "$PROD_URL" ] || { echo "REFUSED: staging DATABASE_URL equals production"; exit 1; }
case "${CLICKUP_API_BASE:-}" in http://127.0.0.1:*|http://localhost:*) ;; *) echo "REFUSED: CLICKUP_API_BASE must point at the local mock"; exit 1;; esac
export PORT="${PORT:-3100}"
echo "staging: db host $(echo "$DATABASE_URL" | sed -E 's#.*@([^/]+)/.*#\1#') · clickup $CLICKUP_API_BASE · port $PORT"
exec npx next dev -p "$PORT"
