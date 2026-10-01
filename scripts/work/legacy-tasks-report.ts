/**
 * Mytiv Work PR 2 — legacy `tasks` data report. READ-ONLY: every query runs inside one Neon HTTP transaction
 * opened READ ONLY, REPEATABLE READ (a consistent snapshot; the database itself refuses any write). Output is
 * PII-free JSON (counts; unknown vocabulary values only as hashes).
 *
 * Local:      DATABASE_URL=<local or shim> node --import tsx scripts/work/legacy-tasks-report.ts
 * Non-local:  refused unless LEGACY_REPORT_ALLOW_HOST equals the exact database host — running it on staging
 *             or production is an owner gate (plan §5, stage 0).
 */
import { neon } from '@neondatabase/serverless';
import { LEGACY_REPORT_QUERIES, summarizeLegacyReport, type LegacyReportQuery, type LegacyReportRows } from '../../lib/work/legacy-report';

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  let host = '';
  try { host = new URL(url).hostname; } catch { /* refused below */ }
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) || host.endsWith('.invalid');
  if (!local && (!host || process.env.LEGACY_REPORT_ALLOW_HOST !== host)) {
    console.error(`REFUSED: DATABASE_URL host "${host || '(none)'}" is not local. Set LEGACY_REPORT_ALLOW_HOST to that exact host only with owner approval.`);
    process.exit(2);
  }
  const sql = neon(url);
  const names = Object.keys(LEGACY_REPORT_QUERIES) as LegacyReportQuery[];
  const results = await sql.transaction((tx) => names.map((n) => tx.query(LEGACY_REPORT_QUERIES[n])), { readOnly: true, isolationLevel: 'RepeatableRead' });
  const rows = Object.fromEntries(names.map((n, i) => [n, results[i] as Record<string, unknown>[]])) as LegacyReportRows;
  const report = summarizeLegacyReport(rows);
  console.log(JSON.stringify({ generatedAt: new Date().toISOString(), databaseHost: host.split('.')[0], ...report }, null, 2));
  process.exit(report.findings.readyForValidate ? 0 : 3);
}
main().catch((e) => { console.error('REPORT ERROR:', e instanceof Error ? e.message : e); process.exit(1); });
