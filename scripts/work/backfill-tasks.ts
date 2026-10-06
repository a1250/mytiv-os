/**
 * Mytiv Work PR 4 — backfill the 0012 typed task columns. Idempotent, batched, fills NULLs only; prints a
 * JSON summary and what remains (task ids only). Exit 0 = nothing left, 3 = rows need an owner decision.
 *
 * Local:      DATABASE_URL=<local or shim> node --import tsx scripts/work/backfill-tasks.ts
 * Non-local:  refused unless BACKFILL_ALLOW_HOST equals the exact host AND BACKFILL_CONFIRM=write — running it on
 *             staging or production is an owner gate (plan §5, backfill stage), after the legacy report.
 */
import { neon } from '@neondatabase/serverless';
import { backfillRemaining, runBackfill } from '../../lib/work/backfill';

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  let host = '';
  try { host = new URL(url).hostname; } catch { /* refused below */ }
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) || host.endsWith('.invalid');
  if (!local && (!host || process.env.BACKFILL_ALLOW_HOST !== host || process.env.BACKFILL_CONFIRM !== 'write')) {
    console.error(`REFUSED: DATABASE_URL host "${host || '(none)'}" is not local. A shared database needs BACKFILL_ALLOW_HOST=<that host> and BACKFILL_CONFIRM=write, with owner approval.`);
    process.exit(2);
  }
  const sql = neon(url, { fullResults: true });
  const batch = Number(process.env.BACKFILL_BATCH ?? 500);
  const changed = await runBackfill(async (text, params) => ({ rowCount: (await sql.query(text, params)).rowCount ?? 0 }), batch);
  const remaining = await backfillRemaining(async (text) => (await sql.query(text)).rows as Record<string, unknown>[]);
  console.log(JSON.stringify({ ranAt: new Date().toISOString(), databaseHost: host.split('.')[0], batch, changed, remaining }, null, 2));
  const left = remaining.counts.unknown_status + remaining.counts.invalid_due_date + remaining.counts.done_without_done_at;
  process.exit(left === 0 ? 0 : 3);
}
main().catch((e) => { console.error('BACKFILL ERROR:', e instanceof Error ? e.message : e); process.exit(1); });
