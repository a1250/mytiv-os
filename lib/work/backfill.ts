/**
 * Mytiv Work PR 4 — backfill the typed columns added by 0012_work_expand from the legacy ones.
 *
 * Every statement fills only columns that are still NULL, one bounded batch at a time, so it is idempotent,
 * resumable, and safe next to the app's dual-write: a row the app has already written is skipped (the WHERE
 * is re-checked under the row lock in READ COMMITTED). Locks are taken in id order and waited for (never
 * skipped), so a batch never ends the run early while candidates remain; single-row app writes cannot deadlock it. It never changes a legacy value, never bumps
 * `version` (not a user edit), and never guesses: an unknown status or an impossible date stays NULL and is
 * reported by task id (no values) for the owner decision that must precede the validate step.
 */
export const BACKFILL_STEPS = {
  // The candidate set includes the mapping condition: a batch of unmappable rows must never end the loop early.
  status: `update tasks t set status_id = ws.id, status_category = ws.category
    from work_statuses ws
    where ws.business_id = t.business_id and ws.key = t.status and t.status_id is null
      and t.id in (select c.id from tasks c join work_statuses w on w.business_id = c.business_id and w.key = c.status
                   where c.status_id is null order by c.id limit $1 for update of c)`,
  dueOn: `update tasks set due_on = due_date::date
    where id in (select id from tasks where due_on is null and due_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and pg_input_is_valid(due_date, 'date')
                 order by id limit $1 for update)
      and due_on is null and due_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' and pg_input_is_valid(due_date, 'date')`,
  completedAt: `update tasks set completed_at = done_at
    where id in (select id from tasks where completed_at is null and status = 'done' and done_at is not null order by id limit $1 for update)
      and completed_at is null and status = 'done' and done_at is not null`,
  lastActivity: `update tasks set last_activity_at = updated_at
    where id in (select id from tasks where last_activity_at is null order by id limit $1 for update)
      and last_activity_at is null`,
} as const;
export type BackfillStep = keyof typeof BACKFILL_STEPS;

/** What could not be backfilled, by task id only — every class needs an owner decision before VALIDATE. */
export const BACKFILL_REMAINING = {
  unknownStatus: `select t.id from tasks t where t.status_id is null
    and not exists (select 1 from work_statuses w where w.business_id = t.business_id and w.key = t.status) order by t.id limit 1000`,
  invalidDueDate: `select id from tasks where due_on is null and due_date is not null and due_date <> '' order by id limit 1000`,
  doneWithoutDoneAt: `select id from tasks where status = 'done' and completed_at is null order by id limit 1000`,
  counts: `select count(*) filter (where status_id is null)::int as unknown_status,
    count(*) filter (where due_on is null and due_date is not null and due_date <> '')::int as invalid_due_date,
    count(*) filter (where status = 'done' and completed_at is null)::int as done_without_done_at,
    count(*)::int as tasks from tasks`,
} as const;

export type BackfillRunner = (text: string, params: unknown[]) => Promise<{ rowCount: number }>;
export type BackfillReader = (text: string) => Promise<Record<string, unknown>[]>;

/** Runs every step in batches until a batch changes nothing. Returns rows changed per step. */
export async function runBackfill(run: BackfillRunner, batchSize = 500, maxBatches = 100_000): Promise<Record<BackfillStep, number>> {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 10_000) throw new Error('invalid batch size');
  const changed = { status: 0, dueOn: 0, completedAt: 0, lastActivity: 0 } as Record<BackfillStep, number>;
  for (const step of Object.keys(BACKFILL_STEPS) as BackfillStep[]) {
    for (let i = 0; i < maxBatches; i++) {
      const { rowCount } = await run(BACKFILL_STEPS[step], [batchSize]);
      changed[step] += rowCount;
      if (rowCount === 0) break;
    }
  }
  return changed;
}

export async function backfillRemaining(read: BackfillReader) {
  const [counts] = await read(BACKFILL_REMAINING.counts);
  const ids = async (q: string) => (await read(q)).map((r) => String(r.id));
  return {
    counts: Object.fromEntries(Object.entries(counts ?? {}).map(([k, v]) => [k, Number(v)])),
    taskIds: {
      unknownStatus: await ids(BACKFILL_REMAINING.unknownStatus),
      invalidDueDate: await ids(BACKFILL_REMAINING.invalidDueDate),
      doneWithoutDoneAt: await ids(BACKFILL_REMAINING.doneWithoutDoneAt),
    },
  };
}
