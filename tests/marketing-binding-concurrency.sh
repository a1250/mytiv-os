#!/usr/bin/env bash
# T-2.1: concurrent binds on ONE (business, project) serialize. Run ONLY against an isolated, throwaway
# database that already has migrations 0000–0008 applied (fixture rows are committed and not cleaned up —
# the binding log is append-only by design).
#   usage: tests/marketing-binding-concurrency.sh "<psql connection args>"   e.g. "-h /tmp/pgs -p 55432 -U postgres -d scratch"
# Each of N parallel sessions rebinds the same fresh project to a different tenant. With correct
# serialization every call succeeds and the log holds versions exactly 1..N, in order, with the current
# row mirroring the last event.
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
FAILED=0
pids=()
for i in $(seq 1 "$N"); do
  $P -c "SELECT marketing_bind('$BIZ','$PROJ','tenant-$i','$OWNER',gen_random_uuid())" >/dev/null 2>&1 & pids+=($!)
done
for pid in "${pids[@]}"; do wait "$pid" || FAILED=$((FAILED+1)); done
RESULT=$($P -c "SELECT count(*), min(binding_version), max(binding_version), count(DISTINCT binding_version),
  bool_and(event='bind') FROM marketing_binding_events WHERE business_id='$BIZ' AND project_id='$PROJ'")
CUR=$($P -c "SELECT c.binding_version = e.binding_version AND c.marketing_business = e.marketing_business AND NOT c.revoked
  FROM marketing_bindings c JOIN LATERAL (SELECT * FROM marketing_binding_events WHERE business_id=c.business_id AND project_id=c.project_id
  ORDER BY binding_version DESC LIMIT 1) e ON true WHERE c.business_id='$BIZ' AND c.project_id='$PROJ'")
echo "parallel binds: $N · failed: $FAILED · events(count|min|max|distinct|all-bind): $RESULT · current mirrors latest: $CUR"
[ "$FAILED" = 0 ] && [ "$RESULT" = "$N|1|$N|$N|t" ] && [ "$CUR" = "t" ] && echo "PASS: concurrent rebinds serialized" && exit 0
echo "FAIL: concurrent rebinds did not serialize"; exit 1
