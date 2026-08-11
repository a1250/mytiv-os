/**
 * Ported from electron/ipc/proposals.cjs. update() snapshots the pre-update
 * row into proposal_versions before applying the patch, keeping only the
 * last 10 versions — same undo-history behavior as the Electron app.
 */
import { and, desc, eq, notInArray } from "drizzle-orm";
import { db } from "../index";
import { proposals, proposalVersions } from "../schema";
import { sanitizePatch } from "./_patch";

export async function listProposals(businessId: string) {
  return db.select().from(proposals).where(eq(proposals.businessId, businessId)).orderBy(desc(proposals.updatedAt));
}

/**
 * Proposals attached to one client project — the revenue side of the Ops money
 * view. Accepted ones only: a draft or a declined proposal is not income.
 */
export async function listAcceptedProposalsForProject(businessId: string, projectId: string) {
  return db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.businessId, businessId),
        eq(proposals.projectId, projectId),
        eq(proposals.status, "accepted")
      )
    )
    .orderBy(desc(proposals.date));
}

/** Proposals attached to one lead — powers the Proposals block on the lead page. */
export async function listProposalsByLead(businessId: string, leadId: string) {
  return db
    .select()
    .from(proposals)
    .where(and(eq(proposals.businessId, businessId), eq(proposals.leadId, leadId)))
    .orderBy(desc(proposals.updatedAt));
}

export async function getProposal(businessId: string, id: string) {
  const [row] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.businessId, businessId), eq(proposals.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createProposal(businessId: string, data: { title: string; [key: string]: unknown }) {
  const [row] = await db.insert(proposals).values({ ...sanitizePatch(data), businessId } as typeof proposals.$inferInsert).returning();
  return row;
}

export async function updateProposal(businessId: string, id: string, patch: Record<string, unknown>) {
  const existing = await getProposal(businessId, id);
  if (!existing) return null;

  await db.insert(proposalVersions).values({ businessId, proposalId: id, payload: existing });

  const keep = (
    await db
      .select({ id: proposalVersions.id })
      .from(proposalVersions)
      .where(and(eq(proposalVersions.businessId, businessId), eq(proposalVersions.proposalId, id)))
      .orderBy(desc(proposalVersions.createdAt))
      .limit(10)
  ).map((v) => v.id);
  if (keep.length > 0) {
    await db
      .delete(proposalVersions)
      .where(and(eq(proposalVersions.businessId, businessId), eq(proposalVersions.proposalId, id), notInArray(proposalVersions.id, keep)));
  }

  const [row] = await db
    .update(proposals)
    .set({ ...sanitizePatch(patch), updatedAt: new Date() })
    .where(and(eq(proposals.businessId, businessId), eq(proposals.id, id)))
    .returning();
  return row;
}

export async function duplicateProposal(businessId: string, id: string) {
  const existing = await getProposal(businessId, id);
  if (!existing) return null;
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = existing;
  const [row] = await db
    .insert(proposals)
    .values({ ...rest, businessId, title: `${existing.title} (copy)`, status: "draft" } as typeof proposals.$inferInsert)
    .returning();
  return row;
}

export async function listProposalVersions(businessId: string, proposalId: string) {
  return db
    .select()
    .from(proposalVersions)
    .where(and(eq(proposalVersions.businessId, businessId), eq(proposalVersions.proposalId, proposalId)))
    .orderBy(desc(proposalVersions.createdAt));
}

export async function removeProposal(businessId: string, id: string) {
  await db.delete(proposals).where(and(eq(proposals.businessId, businessId), eq(proposals.id, id)));
}
