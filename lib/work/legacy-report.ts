/**
 * Mytiv Work PR 2 — what the live `tasks` data looks like before any constraint touches it (ADR-0001 §3:
 * expand → backfill → validate → contract; nothing is validated before this report is read).
 *
 * Read-only and PII-free by construction: every query returns counts. The only values that leave the
 * database are the fixed vocabularies (status, priority, role); a value outside them is reported as a
 * sha256 prefix and its length, never as text, because a free-text column can hold anything.
 * Queries are plain SQL so the same list runs on Neon (scripts/work/legacy-tasks-report.ts, one READ ONLY
 * REPEATABLE READ transaction) and on a local Postgres (tests/db-integration/legacy-report.itest.ts).
 */
import { createHash } from 'node:crypto';
import { TASK_PRIORITIES, TASK_STATUSES } from '../tasks-policy';

export const LEGACY_REPORT_QUERIES = {
  server: `select current_setting('server_version_num')::int as version_num`,
  totals: `with per as (select business_id, count(*) as c from tasks group by business_id)
    select coalesce(sum(c), 0)::int as tasks, count(*)::int as businesses_with_tasks, coalesce(max(c), 0)::int as max_tasks_in_one_business from per`,
  businesses: `select count(*)::int as businesses from businesses`,
  status: `select status as value, count(*)::int as n from tasks group by status`,
  priority: `select priority as value, count(*)::int as n from tasks group by priority`,
  dueDate: `select count(*) filter (where due_date is null)::int as none,
    count(*) filter (where due_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and pg_input_is_valid(due_date, 'date'))::int as valid,
    count(*) filter (where due_date is not null and not (due_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and pg_input_is_valid(due_date, 'date')))::int as invalid
    from tasks`,
  projectLinks: `select count(*) filter (where t.project_id is null)::int as none,
    count(*) filter (where p.id is not null and p.business_id = t.business_id)::int as same_business,
    count(*) filter (where p.id is not null and p.business_id <> t.business_id)::int as other_business,
    count(*) filter (where t.project_id is not null and p.id is null)::int as missing
    from tasks t left join projects p on p.id = t.project_id`,
  leadLinks: `select count(*) filter (where t.lead_id is null)::int as none,
    count(*) filter (where l.id is not null and l.business_id = t.business_id)::int as same_business,
    count(*) filter (where l.id is not null and l.business_id <> t.business_id)::int as other_business,
    count(*) filter (where t.lead_id is not null and l.id is null)::int as missing
    from tasks t left join leads l on l.id = t.lead_id`,
  doneAt: `select count(*) filter (where status = 'done' and done_at is null)::int as done_without_done_at,
    count(*) filter (where status <> 'done' and done_at is not null)::int as done_at_without_done
    from tasks`,
  sizes: `select count(*) filter (where length(title) > 500)::int as title_over_500,
    count(*) filter (where length(btrim(title)) = 0)::int as title_blank,
    count(*) filter (where length(coalesce(notes, '')) > 20000)::int as notes_over_20000,
    count(*) filter (where length(coalesce(category, '')) > 100)::int as category_over_100,
    count(*) filter (where coalesce(category, '') <> '')::int as with_category,
    count(distinct nullif(category, ''))::int as distinct_categories
    from tasks`,
  inbound: `select
    (select count(*) from calendar_events c where c.linked_task_id is not null)::int as calendar_links,
    (select count(*) from calendar_events c join tasks t on t.id = c.linked_task_id where t.business_id <> c.business_id)::int as calendar_links_other_business,
    (select count(*) from weekly_review_action_items w where w.task_id is not null)::int as review_links,
    (select count(*) from weekly_review_action_items w join tasks t on t.id = w.task_id where t.business_id <> w.business_id)::int as review_links_other_business`,
  roles: `select role as value, count(*)::int as n, count(*) filter (where accepted_at is null)::int as not_accepted from business_memberships group by role`,
} as const;
export type LegacyReportQuery = keyof typeof LEGACY_REPORT_QUERIES;
export type LegacyReportRows = Record<LegacyReportQuery, Record<string, unknown>[]>;

const ROLES = ['owner', 'admin', 'member'];
/** A value outside a fixed vocabulary, without its text. */
function opaque(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `sha256:${createHash('sha256').update(text).digest('hex').slice(0, 12)} (length ${text.length}${value === null ? ', NULL' : ''})`;
}
function vocabulary(rows: Record<string, unknown>[], known: readonly string[]) {
  const counts: Record<string, number> = {};
  const unknown: { value: string; n: number }[] = [];
  for (const r of rows) {
    const n = Number(r.n);
    if (typeof r.value === 'string' && known.includes(r.value)) counts[r.value] = n;
    else unknown.push({ value: opaque(r.value), n });
  }
  return { counts, unknown, unknownTotal: unknown.reduce((s, u) => s + u.n, 0) };
}
const one = (rows: Record<string, unknown>[]) => Object.fromEntries(Object.entries(rows[0] ?? {}).map(([k, v]) => [k, Number(v)]));

/** Turns the raw rows into the report: counts, opaque unknowns, and the findings that block or warn. */
export function summarizeLegacyReport(rows: LegacyReportRows) {
  const status = vocabulary(rows.status, TASK_STATUSES);
  const priority = vocabulary(rows.priority, TASK_PRIORITIES);
  const roleRows = rows.roles.map((r) => ({ value: r.value, n: r.n }));
  const roles = vocabulary(roleRows, ROLES);
  const report = {
    serverVersionNum: Number(rows.server[0]?.version_num),
    totals: { ...one(rows.totals), ...one(rows.businesses) },
    status, priority,
    dueDate: one(rows.dueDate),
    projectLinks: one(rows.projectLinks),
    leadLinks: one(rows.leadLinks),
    doneAt: one(rows.doneAt),
    sizes: one(rows.sizes),
    inbound: one(rows.inbound),
    memberships: { ...roles, notAccepted: rows.roles.reduce((s, r) => s + Number(r.not_accepted), 0) },
  };
  const blocking: string[] = [];
  const warnings: string[] = [];
  if (status.unknownTotal) blocking.push(`${status.unknownTotal} task(s) with a status outside ${TASK_STATUSES.join('|')} — map before status_id NOT NULL`);
  if (priority.unknownTotal) blocking.push(`${priority.unknownTotal} task(s) with an unknown priority`);
  if (report.dueDate.invalid) blocking.push(`${report.dueDate.invalid} task(s) with a due_date that is not a real YYYY-MM-DD date — quarantine before due_on`);
  if (report.projectLinks.other_business) blocking.push(`${report.projectLinks.other_business} task(s) linked to ANOTHER business's project (tenant leak) — owner decides`);
  if (report.leadLinks.other_business) blocking.push(`${report.leadLinks.other_business} task(s) linked to ANOTHER business's lead (tenant leak) — owner decides`);
  if (report.projectLinks.missing) blocking.push(`${report.projectLinks.missing} task(s) with a project_id that does not exist — owner decides (null it or quarantine)`);
  if (report.leadLinks.missing) blocking.push(`${report.leadLinks.missing} task(s) with a lead_id that does not exist (deleted lead) — owner decides`);
  if (report.inbound.calendar_links_other_business || report.inbound.review_links_other_business) blocking.push('calendar/review rows linked to another business\'s task');
  if (roles.unknownTotal) blocking.push(`${roles.unknownTotal} membership(s) with a role outside owner|admin|member — map before the role CHECK`);
  if (report.doneAt.done_without_done_at || report.doneAt.done_at_without_done) warnings.push('done_at disagrees with status on some rows (backfill derives completed_at from status)');
  if (report.sizes.title_over_500 || report.sizes.notes_over_20000 || report.sizes.category_over_100 || report.sizes.title_blank) warnings.push('rows exceed today\'s write limits (kept as they are; editing them will require shortening)');
  if (report.memberships.notAccepted) warnings.push(`${report.memberships.notAccepted} membership(s) never accepted — they count as inactive for Work authorization`);
  if (report.serverVersionNum < 160000) blocking.push('server older than PostgreSQL 16 (pg_input_is_valid, NULLS handling assumed by the plan)');
  return { ...report, findings: { blocking, warnings, readyForValidate: blocking.length === 0 } };
}
