#!/usr/bin/env bash
# GPT review P1-2 (round 2): an import readback is definitive under races. Run ONLY against an isolated, throwaway
# database with migrations 0000–0011 applied (fixture rows are committed — the tables are append-only by design).
#   usage: tests/marketing-import-fence-concurrency.sh "<psql connection args>"
# For R request ids, one import and K readbacks of the SAME request id race in parallel sessions. Invariant: a request
# id ends with EITHER its artifact (every readback said written or in_flight) OR a fence (the import was refused) —
# never both, never neither; and no readback ever said not_written for a request whose artifact exists.
set -euo pipefail
CONN=${1:?psql connection args required}
R=${R:-20}; K=${K:-6}
P="psql $CONN -v ON_ERROR_STOP=1 -qtA"
IDS=$($P -c "WITH b AS (INSERT INTO businesses(name,slug) VALUES ('Fence race','fence-'||gen_random_uuid()) RETURNING id),
  u AS (INSERT INTO users(email) VALUES ('fence-'||gen_random_uuid()||'@fixture.invalid') RETURNING id),
  m AS (INSERT INTO business_memberships(business_id,user_id,role) SELECT b.id,u.id,'owner' FROM b,u RETURNING business_id,user_id),
  p AS (INSERT INTO projects(business_id,name) SELECT id,'Fence race' FROM b RETURNING id,business_id)
  SELECT p.business_id||' '||p.id||' '||m.user_id FROM p,m")
read -r BIZ PROJ OWNER <<<"$IDS"
$P -c "SELECT marketing_bind('$BIZ','$PROJ','tenant-a','$OWNER',gen_random_uuid())" >/dev/null
OUT=$(mktemp -d)
pids=()
for r in $(seq 1 "$R"); do
  REQ=$($P -c "SELECT gen_random_uuid()")
  echo "$REQ" >> "$OUT/requests"
  # the import sleeps a little inside its transaction AFTER inserting (lock held, row uncommitted) to widen the window
  ( $P -c "BEGIN; SELECT marketing_import_artifact('$BIZ','$PROJ','C9',1,'rev-$r','2026-01-01T00:00:00Z',repeat('a',64),'{}','$OWNER','$REQ'); SELECT pg_sleep(random()*0.05); COMMIT;" >/dev/null 2>&1 && echo "$REQ imported" >> "$OUT/imports" || echo "$REQ refused" >> "$OUT/imports" ) & pids+=($!)
  for k in $(seq 1 "$K"); do
    ( sleep "0.0$((RANDOM % 5))"; echo "$REQ $($P -c "SELECT marketing_import_readback('$BIZ','$REQ','$OWNER')")" >> "$OUT/readbacks" ) & pids+=($!)
  done
done
for pid in "${pids[@]}"; do wait "$pid"; done
BAD=0
while read -r REQ; do
  A=$($P -c "SELECT count(*) FROM marketing_artifacts WHERE business_id='$BIZ' AND request_id='$REQ'")
  F=$($P -c "SELECT count(*) FROM marketing_import_fences WHERE business_id='$BIZ' AND request_id='$REQ'")
  NW=$(grep -c "^$REQ not_written$" "$OUT/readbacks" || true)
  if [ "$A$F" != "10" ] && [ "$A$F" != "01" ]; then echo "BAD $REQ artifact=$A fence=$F"; BAD=$((BAD+1)); fi
  if [ "$A" = 1 ] && [ "$NW" != 0 ]; then echo "BAD $REQ has an artifact but a readback said not_written"; BAD=$((BAD+1)); fi
done < "$OUT/requests"
SUMMARY="requests: $R · readbacks: $(wc -l < "$OUT/readbacks" | tr -d ' ') ($(cut -d' ' -f2 "$OUT/readbacks" | sort | uniq -c | tr -s ' ' | tr '\n' ',' )) · imports: $(cut -d' ' -f2 "$OUT/imports" | sort | uniq -c | tr -s ' ' | tr '\n' ',')"
rm -rf "$OUT"
echo "$SUMMARY"
[ "$BAD" = 0 ] && echo "PASS: import readback is definitive under races (artifact XOR fence)" && exit 0
echo "FAIL: $BAD request ids violate artifact XOR fence"; exit 1
