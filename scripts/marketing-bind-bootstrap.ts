/**
 * One-time, OWNER-RUN bootstrap of the DB-backed marketing tenant binding (owner decision D2) from the
 * legacy `OPS_MARKETING_BINDINGS` variable. It is the ONLY place that variable is still read: requests
 * never fall back to it. Each entry becomes an audited version-1 `bind` event (actor = the named owner,
 * fresh request id) through the same `marketing_bind` function the owner editor uses.
 *
 *   - dry-run by default: prints what it would bind and changes nothing;
 *   - `--apply` writes; a (business, project) that already has a binding row (bound OR revoked) is
 *     skipped, never overwritten — a later change goes through the owner editor;
 *   - the actor must be an OWNER of each business (the database refuses anyone else).
 *
 * Requires migration 0008 on the target database (a separate owner gate). Run only against the
 * database you intend to change:
 *   node --env-file=.env.local --conditions=react-server --import tsx scripts/marketing-bind-bootstrap.ts --owner <email> [--apply]
 */
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { businesses, marketingBindings, projects, users } from '../lib/db/schema';
import { parseBootstrapBindings } from '../lib/marketing/binding';
import { bindMarketing } from '../lib/marketing/binding-store';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const ownerEmail = arg('--owner');
  if (!ownerEmail) throw new Error('--owner <email> is required (the owner recorded as the actor of each bind)');
  const entries = parseBootstrapBindings(process.env.OPS_MARKETING_BINDINGS);
  if (entries.length === 0) { console.log('OPS_MARKETING_BINDINGS is empty — nothing to bootstrap.'); return; }
  const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.email, ownerEmail)).limit(1);
  if (!owner) throw new Error(`no user with email ${ownerEmail}`);

  for (const e of entries) {
    const label = `${e.businessSlug}:${e.projectId} → ${e.marketingBusiness}`;
    const [business] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, e.businessSlug)).limit(1);
    if (!business) { console.log(`skip   ${label} — no business "${e.businessSlug}"`); continue; }
    const [project] = await db.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.businessId, business.id), eq(projects.id, e.projectId))).limit(1);
    if (!project) { console.log(`skip   ${label} — project not in business "${e.businessSlug}"`); continue; }
    const [existing] = await db.select({ v: marketingBindings.bindingVersion, revoked: marketingBindings.revoked }).from(marketingBindings)
      .where(and(eq(marketingBindings.businessId, business.id), eq(marketingBindings.projectId, project.id))).limit(1);
    if (existing) { console.log(`skip   ${label} — already has binding v${existing.v}${existing.revoked ? ' (revoked)' : ''}; use the owner editor`); continue; }
    if (!apply) { console.log(`would  ${label} (dry-run; pass --apply to write)`); continue; }
    const result = await bindMarketing({ businessId: business.id, userId: owner.id }, project.id, e.marketingBusiness, randomUUID());
    console.log(`bound  ${label} — v${result.bindingVersion}`);
  }
}

main().then(() => process.exit(0), (error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
