import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { getMarketingBinding } from "@/lib/marketing/binding-store";
import { latestArtifact } from "@/lib/marketing/artifacts";
import { listRecords } from "@/lib/marketing/records";
import { marketingModuleEnabled } from "@/lib/marketing/module-flag";
import type { CampaignPlan, ContentEntry } from "@/lib/marketing/contract-rules/c9-c14";
import type { WorkboardTask } from "@/lib/marketing/contract-rules/c5-c8";

/**
 * Campaigns and execution state of a business in Focus, read through the canonical Marketing OS contracts already in
 * Mytiv — per project bound to a marketing tenant: the latest C12 campaign artifacts, the latest C7 workboard (the
 * engine's authoritative task status and four-state completion), and the evidence / execution receipts this app
 * recorded, with the engine's reconciliation. Each artifact is re-validated against its vendored contract on read
 * (latestArtifact). Read-only: nothing here writes.
 */
export type ExecutionRecord = { id: string; kind: string; targetId: string; approvalId: string | null; createdAt: string; exportedAt: string | null; reconciledState: string | null };
export type ProjectExecution = {
  projectId: string; projectName: string; client: string | null; marketingBusiness: string;
  campaigns: { asOf: string; items: CampaignPlan[]; calendar: ContentEntry[] } | null;
  workboard: { asOf: string; tasks: WorkboardTask[] } | null;
  records: ExecutionRecord[];
};

export async function readMarketingExecution(businessId: string): Promise<{ connected: boolean; projects: ProjectExecution[] }> {
  if (!marketingModuleEnabled()) return { connected: false, projects: [] };
  const rows = await db.select({ id: projects.id, name: projects.name, client: projects.client }).from(projects)
    .where(and(eq(projects.businessId, businessId), isNull(projects.archivedAt))).orderBy(asc(projects.name));
  const out: ProjectExecution[] = [];
  for (const p of rows) {
    const binding = await getMarketingBinding(businessId, p.id);
    if (!binding) continue;
    const [c12, c7, records] = await Promise.all([
      latestArtifact(businessId, p.id, binding, "C12"), latestArtifact(businessId, p.id, binding, "C7"), listRecords(businessId, p.id, binding),
    ]);
    out.push({
      projectId: p.id, projectName: p.name, client: p.client ?? null, marketingBusiness: binding.marketingBusiness,
      campaigns: c12 ? { asOf: c12.asOf, items: c12.payload.campaigns ?? [], calendar: c12.payload.content_calendar ?? [] } : null,
      workboard: c7 ? { asOf: c7.asOf, tasks: c7.payload.tasks } : null,
      records: records.evidence.map((e) => ({ id: e.id, kind: e.kind, targetId: e.targetId, approvalId: e.approvalId ?? null, createdAt: e.createdAt, exportedAt: e.exportedAt, reconciledState: e.reconciledState ?? null })),
    });
  }
  return { connected: out.length > 0, projects: out };
}
