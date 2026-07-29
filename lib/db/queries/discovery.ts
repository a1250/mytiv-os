import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { discoveryJobs, leads, leadContacts, contactSources } from "../schema";
import { discoverLeads } from "../../services/leadDiscovery";
import { discoverContactsForCompany } from "../../services/contactDiscovery";

export async function createDiscoveryJob(businessId: string, kind: "lead_discovery" | "contact_discovery", params: unknown) {
  const [job] = await db.insert(discoveryJobs).values({ businessId, kind, params, status: "queued" }).returning();
  return job;
}

export async function getDiscoveryJob(businessId: string, id: string) {
  const [job] = await db
    .select()
    .from(discoveryJobs)
    .where(and(eq(discoveryJobs.businessId, businessId), eq(discoveryJobs.id, id)))
    .limit(1);
  return job ?? null;
}

/** Called by the QStash worker route only — no business-scoping guard needed here (job already carries businessId). */
export async function getDiscoveryJobById(id: string) {
  const [job] = await db.select().from(discoveryJobs).where(eq(discoveryJobs.id, id)).limit(1);
  return job ?? null;
}

/** Runs the actual (slow) discovery work and writes the result. Called from the QStash worker route. */
export async function runDiscoveryJob(jobId: string) {
  const job = await getDiscoveryJobById(jobId);
  if (!job) return;

  await db.update(discoveryJobs).set({ status: "running" }).where(eq(discoveryJobs.id, jobId));

  try {
    let result: unknown;
    if (job.kind === "lead_discovery") {
      const params = job.params as { query: string; category?: string; limit?: number };
      const candidates = await discoverLeads(params);
      // Flag candidates whose domain already exists among this business's saved leads.
      const existingLeads = await db.select({ website: leads.website }).from(leads).where(eq(leads.businessId, job.businessId));
      const existingDomains = new Set(existingLeads.map((l) => (l.website || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")));
      result = candidates.map((c) => ({ ...c, existing: existingDomains.has(c.domain) }));
    } else {
      const params = job.params as { company: string; website?: string; roles?: string[]; location?: string; opportunityType?: string; leadId?: string };
      const discovered = await discoverContactsForCompany(params);
      if (params.leadId) {
        const existingContacts = await db
          .select({ fullName: leadContacts.fullName })
          .from(leadContacts)
          .where(eq(leadContacts.leadId, params.leadId));
        const existingNames = new Set(existingContacts.map((c) => c.fullName.toLowerCase()));
        discovered.candidates = discovered.candidates.map((c) => ({ ...c, existing: existingNames.has(c.full_name.toLowerCase()) })) as typeof discovered.candidates;
      }
      result = discovered;
    }

    await db.update(discoveryJobs).set({ status: "done", result, finishedAt: new Date() }).where(eq(discoveryJobs.id, jobId));
  } catch (err) {
    await db
      .update(discoveryJobs)
      .set({ status: "error", errorMessage: err instanceof Error ? err.message : "unknown error", finishedAt: new Date() })
      .where(eq(discoveryJobs.id, jobId));
  }
}

/** Insert a discovered (or manually added) contact — same shape a discovery candidate already has. */
export async function insertContact(
  businessId: string,
  leadId: string,
  data: {
    full_name: string;
    job_title?: string;
    department?: string;
    seniority?: string;
    linkedin_url?: string;
    email?: string;
    email_status?: string;
    source_url?: string;
    source_type?: string;
    confidence?: number;
    relevance?: number;
    why_relevant?: string;
    suggested_angle?: string;
    suggested_service?: string;
    extra_sources?: { source_url: string; source_type: string; raw_snippet: string }[];
  }
) {
  const [contact] = await db
    .insert(leadContacts)
    .values({
      businessId,
      leadId,
      fullName: data.full_name,
      jobTitle: data.job_title ?? "",
      department: data.department ?? "",
      seniority: data.seniority ?? "",
      linkedinUrl: data.linkedin_url ?? "",
      email: data.email ?? "",
      emailStatus: data.email_status ?? "missing",
      sourceUrl: data.source_url ?? "",
      sourceType: data.source_type ?? "",
      confidence: data.confidence ?? 3,
      relevance: data.relevance ?? 3,
      whyRelevant: data.why_relevant ?? "",
      suggestedAngle: data.suggested_angle ?? "",
      suggestedService: data.suggested_service ?? "",
    })
    .returning();

  if (data.extra_sources?.length) {
    await db.insert(contactSources).values(
      data.extra_sources.map((s) => ({
        businessId,
        contactId: contact.id,
        sourceUrl: s.source_url,
        sourceType: s.source_type,
        rawSnippet: s.raw_snippet,
      }))
    );
  }

  return contact;
}
