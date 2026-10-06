import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { getMarketingBinding } from "@/lib/marketing/binding-store";
import { latestArtifact } from "@/lib/marketing/artifacts";
import { listRecords } from "@/lib/marketing/records";
import { marketingModuleEnabled } from "@/lib/marketing/module-flag";
import type { FocusMarketingApproval } from "@/lib/focus/adapters/marketing";

/**
 * The approvals a business sees in Focus, read through the canonical Marketing OS contracts already consumed by
 * Mytiv: for each project bound to a marketing tenant, the latest imported C2a approval queue (validated against the
 * vendored contract on every read), joined with the C2b decisions this app recorded (and their reconciliation with
 * the engine). Nothing here writes; a decision goes through the governed decisions route.
 */
export async function readMarketingApprovals(businessId: string): Promise<{ connected: boolean; items: FocusMarketingApproval[] }> {
  if (!marketingModuleEnabled()) return { connected: false, items: [] };
  const rows = await db.select({ id: projects.id, name: projects.name, client: projects.client }).from(projects)
    .where(and(eq(projects.businessId, businessId), isNull(projects.archivedAt))).orderBy(asc(projects.name));
  const items: FocusMarketingApproval[] = [];
  let connected = false;
  for (const p of rows) {
    const binding = await getMarketingBinding(businessId, p.id);
    if (!binding) continue;
    connected = true;
    const [queue, records] = await Promise.all([latestArtifact(businessId, p.id, binding, "C2a"), listRecords(businessId, p.id, binding)]);
    if (!queue) continue;
    for (const it of queue.payload.items) {
      const decision = records.decisions.find((d) => d.approvalId === it.approval_id && d.contentHash === it.content_hash);
      items.push({
        projectId: p.id, projectName: p.name, client: p.client ?? null, bindingVersion: binding.bindingVersion, sourceArtifactId: queue.id, asOf: queue.asOf,
        approvalId: it.approval_id, contentHash: it.content_hash, state: it.state, title: it.title, why: it.why, actionType: it.action_type,
        actionClass: it.action_class, qaVerdict: it.qa_verdict, rollbackNote: it.rollback_note, requestedChange: it.requested_change ?? null,
        diffSummary: it.diff_summary ?? null, factsCited: it.facts_cited ?? [],
        receipts: records.evidence.filter((e) => e.kind === "execution_receipt" && e.approvalId === it.approval_id)
          .map((e) => ({ id: e.id, createdAt: e.createdAt, reconciledState: e.reconciledState ?? null })),
        decision: decision ? { decision: decision.decision as "approved" | "rejected", note: decision.note, decidedAt: decision.decidedAt, reconciledState: decision.reconciledState ?? null } : null,
      });
    }
  }
  return { connected, items };
}
