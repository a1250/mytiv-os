#!/usr/bin/env bash
# T-3.1: concurrent imports of one artifact kind serialize. Run ONLY against an isolated, throwaway database
# with migrations 0000–0010 applied (fixture rows are committed — the tables are append-only by design).
#   usage: tests/marketing-artifact-concurrency.sh "<psql connection args>"
# N parallel sessions import the same kind under the same binding version: every import must succeed and be
# numbered exactly 1..N by the database.
set -euo pipefail
CONN=${1:?psql connection args required}
N=${N:-40}
P="psql $CONN -v ON_ERROR_STOP=1 -qtA"
IDS=$($P -c "WITH b AS (INSERT INTO businesses(name,slug) VALUES ('Concurrency','conc-'||gen_random_uuid()) RETURNING id),
  u AS (INSERT INTO users(email) VALUES ('conc-'||gen_random_uuid()||'@fixture.invalid') RETURNING id),
  m AS (INSERT INTO business_memberships(business_id,user_id,role) SELECT b.id,u.id,'owner' FROM b,u RETURNING business_id,user_id),
  p AS (INSERT INTO projects(business_id,name) SELECT id,'Concurrency' FROM b RETURNING id,business_id)
  SELECT p.business_id||' '||p.id||' '||m.user_id FROM p,m")
read -r BIZ PROJ OWNER <<<"$IDS"
$P -c "SELECT marketing_bind('$BIZ','$PROJ','tenant-a','$OWNER',gen_random_uuid())" >/dev/null
FAILED=0; pids=()
for i in $(seq 1 "$N"); do
  $P -c "SELECT marketing_import_artifact('$BIZ','$PROJ','C9',1,'rev-$i','2026-01-01T00:00:00Z',repeat('a',64),'{}','$OWNER',gen_random_uuid())" >/dev/null 2>&1 & pids+=($!)
done
for pid in "${pids[@]}"; do wait "$pid" || FAILED=$((FAILED+1)); done
RESULT=$($P -c "SELECT count(*), min(revision), max(revision), count(DISTINCT revision) FROM marketing_artifacts WHERE business_id='$BIZ' AND project_id='$PROJ' AND kind='C9'")
echo "parallel imports: $N · failed: $FAILED · revisions(count|min|max|distinct): $RESULT"
[ "$FAILED" = 0 ] && [ "$RESULT" = "$N|1|$N|$N" ] && echo "PASS: concurrent imports serialized" && exit 0
echo "FAIL: concurrent imports did not serialize"; exit 1
