#!/usr/bin/env bash
# Mytiv Work 0012_work_expand on LEGACY data (ADR-0001 decision 3: expand never touches a legacy value).
# Builds a throwaway database "<ITEST_DB>_expand" at migration 0011, fills it with every kind of legacy row the old
# unvalidated API could store (unknown statuses, impossible dates, cross-tenant and dangling links, odd roles,
# done without done_at), fingerprints all legacy columns, applies 0012, and asserts:
#   the fingerprint is identical · every business (and a new one) has the 7 system statuses with revisions ·
#   a contradictory (status, category) pair, a cross-business status and a self-parent are refused ·
#   status key/category are immutable · statuses cannot be deleted · revisions are append-only ·
#   a business can still be deleted (cascade).
#   usage: ITEST_DB=… PGHOST=… [PGPORT PGUSER] tests/work-expand-on-legacy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ITEST_DB:?}"; : "${PGHOST:?}"
case "$PGHOST" in /*|localhost|127.0.0.1|::1) ;; *) echo "refusing: PGHOST=$PGHOST is not local"; exit 2;; esac
DB="${ITEST_DB}_expand"
P="psql -v ON_ERROR_STOP=1 -qtA"
$P -d postgres -c "DROP DATABASE IF EXISTS \"$DB\"" -c "CREATE DATABASE \"$DB\"" >/dev/null
for tag in $(node -e "console.log(require('./drizzle/migrations/meta/_journal.json').entries.map(e=>e.tag).filter(t=>t<'0012').join(' '))"); do
  $P -d "$DB" -f "drizzle/migrations/$tag.sql" >/dev/null 2>&1 || { echo "FAIL: migration $tag"; exit 1; }
done
$P -d "$DB" >/dev/null <<'SQL'
INSERT INTO businesses(id,name,slug) VALUES ('aaaaaaaa-0000-4000-8000-00000000000a','A','legacy-a'),('bbbbbbbb-0000-4000-8000-00000000000b','B','legacy-b');
INSERT INTO users(id,email) VALUES ('aaaaaaaa-0000-4000-8000-0000000000a1','a1@x.invalid'),('bbbbbbbb-0000-4000-8000-0000000000b1','b1@x.invalid');
INSERT INTO business_memberships(business_id,user_id,role,accepted_at) VALUES ('aaaaaaaa-0000-4000-8000-00000000000a','aaaaaaaa-0000-4000-8000-0000000000a1','superuser',null),
  ('bbbbbbbb-0000-4000-8000-00000000000b','bbbbbbbb-0000-4000-8000-0000000000b1','owner',now());
INSERT INTO projects(id,business_id,name) VALUES ('aaaaaaaa-0000-4000-8000-0000000000f1','aaaaaaaa-0000-4000-8000-00000000000a','PA'),('bbbbbbbb-0000-4000-8000-0000000000f1','bbbbbbbb-0000-4000-8000-00000000000b','PB');
INSERT INTO leads(id,business_id,company) VALUES ('bbbbbbbb-0000-4000-8000-0000000000e1','bbbbbbbb-0000-4000-8000-00000000000b','LB');
INSERT INTO tasks(id,business_id,title,status,priority,due_date,project_id,lead_id,done_at,category,notes) VALUES
  ('aaaaaaaa-0000-4000-8000-0000000000c1','aaaaaaaa-0000-4000-8000-00000000000a','ok','todo','medium','2026-10-08','aaaaaaaa-0000-4000-8000-0000000000f1',null,null,'sales','n'),
  ('aaaaaaaa-0000-4000-8000-0000000000c2','aaaaaaaa-0000-4000-8000-00000000000a','cross project','In Progress!!','p0','2026-02-30','bbbbbbbb-0000-4000-8000-0000000000f1','bbbbbbbb-0000-4000-8000-0000000000e1',null,repeat('x',300),repeat('y',30000)),
  ('aaaaaaaa-0000-4000-8000-0000000000c3','aaaaaaaa-0000-4000-8000-00000000000a','dangling','done','low','08/10/2026','99999999-0000-4000-8000-000000000001','99999999-0000-4000-8000-000000000002',null,null,null),
  ('bbbbbbbb-0000-4000-8000-0000000000c1','bbbbbbbb-0000-4000-8000-00000000000b',repeat('t',800),'waiting','urgent',null,null,null,now(),'',''),
  ('bbbbbbbb-0000-4000-8000-0000000000c2','bbbbbbbb-0000-4000-8000-00000000000b','B task','todo','medium','',null,null,'2020-01-01T00:00:00Z',null,null);
SQL
FP="SELECT md5(string_agg(concat_ws('|',id,business_id,title,notes,status,priority,category,due_date,lead_id,project_id,done_at,created_at,updated_at),'#' ORDER BY id)) FROM tasks"
FPX="SELECT md5(string_agg(concat_ws('|',b.id,b.name,b.slug,m.role,m.accepted_at,p.id,p.name),'#' ORDER BY b.id,m.id,p.id)) FROM businesses b JOIN business_memberships m ON m.business_id=b.id JOIN projects p ON p.business_id=b.id"
BEFORE=$($P -d "$DB" -c "$FP"); BEFOREX=$($P -d "$DB" -c "$FPX")
$P -d "$DB" -f drizzle/migrations/0012_work_expand.sql >/dev/null 2>&1 || { echo "FAIL: 0012 did not apply on legacy data"; $P -d "$DB" -f drizzle/migrations/0012_work_expand.sql 2>&1 | grep -i error | head -3; exit 1; }
ok() { echo "PASS: $1"; }; fail() { echo "FAIL: $1"; exit 1; }
[ "$BEFORE" = "$($P -d "$DB" -c "$FP")" ] && ok "every legacy task column byte-identical after 0012" || fail "legacy task values changed"
[ "$BEFOREX" = "$($P -d "$DB" -c "$FPX")" ] && ok "businesses/memberships/projects untouched" || fail "legacy rows changed"
[ "$($P -d "$DB" -c "SELECT count(*) FROM tasks WHERE status_id IS NOT NULL OR due_on IS NOT NULL OR completed_at IS NOT NULL OR source <> 'legacy' OR type <> 'task' OR version <> 1")" = 0 ] && ok "new task columns empty/default (backfill is a separate step)" || fail "expand wrote new task columns"
[ "$($P -d "$DB" -c "SELECT string_agg(n::text,',') FROM (SELECT count(*) n FROM work_statuses GROUP BY business_id ORDER BY business_id) x")" = "7,7" ] && ok "each business has its 7 system statuses" || fail "status copy"
[ "$($P -d "$DB" -c "SELECT count(*) FROM work_status_revisions")" = 14 ] && ok "each status has its first revision" || fail "revisions"
$P -d "$DB" -c "INSERT INTO businesses(id,name,slug) VALUES ('cccccccc-0000-4000-8000-00000000000c','C','new-c')" >/dev/null
[ "$($P -d "$DB" -c "SELECT count(*) FROM work_statuses WHERE business_id='cccccccc-0000-4000-8000-00000000000c'")" = 7 ] && ok "a new business gets its statuses (trigger)" || fail "new business statuses"
refused() { if $P -d "$DB" -c "$2" >/dev/null 2>&1; then fail "$1 was accepted"; else ok "$1 refused"; fi; }
SA="(SELECT id FROM work_statuses WHERE business_id='aaaaaaaa-0000-4000-8000-00000000000a' AND key='done')"
SB="(SELECT id FROM work_statuses WHERE business_id='bbbbbbbb-0000-4000-8000-00000000000b' AND key='done')"
refused "a status with a contradictory category" "UPDATE tasks SET status_id=$SA, status_category='open' WHERE id='aaaaaaaa-0000-4000-8000-0000000000c1'"
refused "another business's status" "UPDATE tasks SET status_id=$SB, status_category='done' WHERE id='aaaaaaaa-0000-4000-8000-0000000000c1'"
refused "a status id without its category" "UPDATE tasks SET status_id=$SA WHERE id='aaaaaaaa-0000-4000-8000-0000000000c1'"
refused "a task as its own parent" "UPDATE tasks SET parent_id=id WHERE id='aaaaaaaa-0000-4000-8000-0000000000c1'"
refused "a parent in another business" "UPDATE tasks SET parent_id='bbbbbbbb-0000-4000-8000-0000000000c1' WHERE id='aaaaaaaa-0000-4000-8000-0000000000c1'"
refused "an owner who is not a member of the business" "UPDATE tasks SET owner_user_id='bbbbbbbb-0000-4000-8000-0000000000b1' WHERE id='aaaaaaaa-0000-4000-8000-0000000000c1'"
refused "changing a status's category" "UPDATE work_statuses SET category='open' WHERE id=$SA"
refused "changing a status's key" "UPDATE work_statuses SET key='finished' WHERE id=$SA"
# Two independent guards: the trigger (asserted by its message) and the revisions FK behind it.
OUT=$($P -d "$DB" -c "DELETE FROM work_statuses WHERE id=$SA" 2>&1 || true); echo "$OUT" | grep -q "retired, never deleted" && ok "deleting a status refused by the retire-only trigger" || fail "status delete not refused by the trigger: $OUT"
refused "editing a revision" "UPDATE work_status_revisions SET label_he='x'"
refused "deleting a revision" "DELETE FROM work_status_revisions"
refused "an unknown work_source" "UPDATE projects SET work_source='jira'"
$P -d "$DB" -c "UPDATE tasks SET status_id=$SA, status_category='done' WHERE id='aaaaaaaa-0000-4000-8000-0000000000c1'" >/dev/null && ok "a consistent same-business status is accepted"
$P -d "$DB" -c "UPDATE work_statuses SET label_he='גמור' WHERE id=$SA" >/dev/null
[ "$($P -d "$DB" -c "SELECT string_agg(label_he,'>' ORDER BY changed_at, id) FROM work_status_revisions WHERE status_id=$SA")" = "הושלם>גמור" ] && ok "a rename keeps the old label in the revisions" || fail "rename history"
$P -d "$DB" -c "UPDATE tasks SET status_id=NULL, status_category=NULL" >/dev/null
$P -d "$DB" -c "DELETE FROM tasks WHERE business_id='cccccccc-0000-4000-8000-00000000000c'; DELETE FROM businesses WHERE id='cccccccc-0000-4000-8000-00000000000c'" >/dev/null && ok "a business can still be deleted (statuses + revisions cascade)" || fail "business delete blocked"
$P -d postgres -c "DROP DATABASE \"$DB\"" >/dev/null
