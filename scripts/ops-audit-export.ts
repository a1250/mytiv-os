/**
 * OWNER-ONLY, PII-free export of a business's governed-write audit as JSONL (T-11.2 · MKT-GOV02, GOV07).
 * The named user must be an OWNER of the business. Every event detail is redacted (emails, phone numbers,
 * secret-named keys, token shapes) and the whole export is secret-scanned: if anything secret-shaped remains,
 * nothing is written and the script exits 1. Read-only: it never changes the audit.
 *
 *   node --env-file=.env.local --conditions=react-server --import tsx scripts/ops-audit-export.ts \
 *     --business <slug> --owner <email> [--out audit.jsonl]
 */
import { writeFileSync } from 'node:fs';
import { and, eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { businessMemberships, businesses, users } from '../lib/db/schema';
import { listBusinessAudit } from '../lib/db/queries/ops-audit';
import { buildAuditExport } from '../lib/ops-audit-export';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };

async function main() {
  const slug = arg('--business'), email = arg('--owner'), out = arg('--out');
  if (!slug || !email) throw new Error('usage: --business <slug> --owner <email> [--out file]');
  const [row] = await db.select({ businessId: businesses.id }).from(businesses)
    .innerJoin(businessMemberships, eq(businessMemberships.businessId, businesses.id))
    .innerJoin(users, eq(users.id, businessMemberships.userId))
    .where(and(eq(businesses.slug, slug), eq(users.email, email), eq(businessMemberships.role, 'owner'))).limit(1);
  if (!row) throw new Error(`${email} is not an owner of "${slug}" — export refused`);
  const result = buildAuditExport(await listBusinessAudit(row.businessId, 100000));
  if (!result.ok) throw new Error(`secret scan failed (${result.findings.join(', ')}) — nothing written`);
  if (out) { writeFileSync(out, result.jsonl, { mode: 0o600 }); console.error(`wrote ${result.lines} actions to ${out}`); }
  else process.stdout.write(result.jsonl);
}

main().then(() => process.exit(0), (error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
