/**
 * Cross-tenant leak audit: create a resource in business A, then attempt every
 * read / update / delete against it while scoped to business B. Anything that
 * succeeds is a leak.
 */
import { db } from "../lib/db";
import { businesses, settings as settingsTable } from "../lib/db/schema";
import { and, eq } from "drizzle-orm";
import * as leads from "../lib/db/queries/leads";
import * as tasks from "../lib/db/queries/tasks";
import * as proposals from "../lib/db/queries/proposals";
import * as briefs from "../lib/db/queries/briefs";
import * as prompts from "../lib/db/queries/prompts";
import * as carousel from "../lib/db/queries/carousel";
import * as contacts from "../lib/db/queries/contacts";
import { leadContacts } from "../lib/db/schema";
import * as inspiration from "../lib/db/queries/inspiration";
import * as outreach from "../lib/db/queries/outreach";
import * as radar from "../lib/db/queries/radar";
import * as reviews from "../lib/db/queries/reviews";
import * as serviceTemplates from "../lib/db/queries/service-templates";
import * as settings from "../lib/db/queries/settings";
import * as secrets from "../lib/db/queries/secrets";

type Row = { id: string } & Record<string, any>;
const results: { module: string; check: string; ok: boolean; detail?: string }[] = [];
const record = (module: string, check: string, ok: boolean, detail?: string) =>
  results.push({ module, check, ok, detail });

/** read must return null/empty; update must return null; delete must not remove the row. */
async function probe(
  module: string,
  A: string, B: string, row: Row,
  ops: {
    read?: (biz: string, id: string) => Promise<any>;
    update?: (biz: string, id: string, patch: any) => Promise<any>;
    remove?: (biz: string, id: string) => Promise<any>;
    patch?: Record<string, unknown>;
  }
) {
  try {
  if (ops.read) {
    const asA = await ops.read(A, row.id);
    const asB = await ops.read(B, row.id);
    record(module, "read", asA !== null && asA !== undefined && (asB === null || asB === undefined),
      asB ? "B could READ A's row" : undefined);
  }
  if (ops.update) {
    const moved = await ops.update(B, row.id, ops.patch ?? { title: "hijacked-by-B" });
    record(module, "update", moved === null || moved === undefined, moved ? "B could UPDATE A's row" : undefined);
  }
  if (ops.remove) {
    await ops.remove(B, row.id);
    const still = ops.read ? await ops.read(A, row.id) : null;
    record(module, "delete", ops.read ? !!still : true, ops.read && !still ? "B could DELETE A's row" : undefined);
  }
  // tenant-injection on update: can B's id be written into A's row?
  if (ops.update) {
    await ops.update(A, row.id, { businessId: B } as any);
    const after = ops.read ? await ops.read(A, row.id) : null;
    record(module, "no tenant reassign", ops.read ? !!after : true,
      ops.read && !after ? "row was moved to another business" : undefined);
  }
  } catch (e: any) {
    record(module, "threw", false, `probe threw: ${e.message?.slice(0, 120)}`);
  }
}

async function main() {
  const [A, B] = await db.select().from(businesses);
  console.log(`A=${A.slug}  B=${B.slug}\n`);
  const a = A.id, b = B.id;

  // The probe key is written to both businesses during the run, so clear it up
  // front — a leftover from a previous run would look exactly like a leak.
  await db.delete(settingsTable).where(eq(settingsTable.key, "audit_probe"));

  // A separate lead hosts the child-record probes, so the leads probe deleting
  // its own subject can't cascade and abort unrelated modules.
  const hostLead = await leads.createLead(a, { company: "Audit Host" });
  const lead = await leads.createLead(a, { company: "Audit Co" });
  await probe("leads", a, b, lead, { read: leads.getLead, update: leads.updateLead, remove: leads.removeLead, patch: { company: "hijacked-by-B" } });

  const task = await tasks.createTask(a, { title: "Audit task" });
  await probe("tasks", a, b, task, {
    read: async (biz, id) => (await tasks.listTasks(biz)).find((t: any) => t.id === id) ?? null,
    update: tasks.updateTask, remove: tasks.removeTask, patch: { title: "hijacked-by-B" },
  });

  const prop = await proposals.createProposal(a, { title: "Audit proposal" });
  await probe("proposals", a, b, prop, { read: proposals.getProposal, update: proposals.updateProposal, remove: proposals.removeProposal });

  const brief = await briefs.createBrief(a, { title: "Audit brief", analysis: {} });
  await probe("briefs", a, b, brief, { read: briefs.getBrief, update: briefs.updateBrief, remove: briefs.removeBrief });

  const prompt = await prompts.createSavedPrompt(a, { title: "Audit prompt" });
  await probe("prompts", a, b, prompt, { read: prompts.getSavedPrompt, update: prompts.updateSavedPrompt, remove: prompts.removeSavedPrompt });

  const car = await carousel.createCarousel(a, { title: "Audit carousel", sourceType: "manual_topic", sourcePayload: { title: "x" } });
  await probe("carousel", a, b, (car as any).project ?? car, {
    read: carousel.getCarousel, update: carousel.updateCarousel, remove: carousel.removeCarousel, patch: { title: "hijacked" },
  });

  const [contact] = await db.insert(leadContacts).values({ businessId: a, leadId: hostLead.id, fullName: "Audit Person" }).returning();
  await probe("contacts", a, b, contact, {
    read: async (biz, id) => (await contacts.listContactsByLead(biz, hostLead.id)).find((c: any) => c.id === id) ?? null,
    update: contacts.updateContact, remove: contacts.removeContact, patch: { fullName: "hijacked-by-B" },
  });

  const insp = await inspiration.createInspiration(a, { title: "Audit inspo" });
  await probe("inspiration", a, b, insp, {
    read: async (biz, id) => (await inspiration.listInspiration(biz)).find((i: any) => i.id === id) ?? null,
    update: inspiration.updateInspiration, remove: inspiration.removeInspiration, patch: { title: "hijacked-by-B" },
  });

  const board = await inspiration.createMoodboard(a, "Audit board");
  await probe("moodboards", a, b, board, { read: inspiration.getMoodboard, remove: inspiration.removeMoodboard });

  const msg = await outreach.createOutreach(a, { leadId: hostLead.id, kind: "cold_email_en", body: "hi" });
  await probe("outreach", a, b, msg, {
    read: async (biz, id) => (await outreach.listOutreach(biz)).find((m: any) => m.id === id) ?? null,
    update: outreach.updateOutreach, remove: outreach.removeOutreach, patch: { body: "hijacked-by-B" },
  });

  const news = await radar.createNews(a, { title: "Audit item" });
  await probe("radar", a, b, news, {
    read: async (biz, id) => (await radar.listNews(biz)).find((n: any) => n.id === id) ?? null,
    update: radar.updateNews, remove: radar.removeNews, patch: { title: "hijacked-by-B" },
  });

  const review = await reviews.createReview(a, { title: "Audit review", payload: {} });
  await probe("reviews", a, b, review, { read: reviews.getReview, remove: reviews.removeReview });

  const tpl = await serviceTemplates.createServiceTemplate(a, { label: "Audit svc" });
  await probe("serviceTemplates", a, b, tpl, {
    read: async (biz, id) => (await serviceTemplates.listServiceTemplates(biz)).find((s: any) => s.id === id) ?? null,
    update: serviceTemplates.updateServiceTemplate, remove: serviceTemplates.removeServiceTemplate, patch: { label: "hijacked" },
  });

  // settings + secrets are key-value, not id-addressed
  await settings.setSettingForBusiness(a, "audit_probe", "A-value");
  const bSettings = await settings.getSettingsForBusiness(b);
  record("settings", "read", bSettings.audit_probe === undefined, bSettings.audit_probe ? "B read A's setting" : undefined);
  await settings.setSettingForBusiness(b, "audit_probe", "B-value");
  const aSettings = await settings.getSettingsForBusiness(a);
  record("settings", "no overwrite", aSettings.audit_probe === "A-value", aSettings.audit_probe !== "A-value" ? "B overwrote A's setting" : undefined);

  await secrets.setSecret(a, "audit_probe", "A-secret");
  record("secrets", "read", (await secrets.getSecret(b, "audit_probe")) === null);
  await secrets.removeSecret(b, "audit_probe");
  record("secrets", "delete", (await secrets.getSecret(a, "audit_probe")) === "A-secret");

  // ---- report ----
  const byModule = new Map<string, typeof results>();
  for (const r of results) {
    if (!byModule.has(r.module)) byModule.set(r.module, []);
    byModule.get(r.module)!.push(r);
  }
  for (const [mod, rs] of byModule) {
    const bad = rs.filter((r) => !r.ok);
    const label = bad.length === 0 ? "PASS" : "LEAK";
    console.log(`${label.padEnd(5)} ${mod.padEnd(18)} ${rs.map((r) => `${r.check}${r.ok ? "✓" : "✗"}`).join("  ")}`);
    bad.forEach((r) => console.log(`      ↳ ${r.detail ?? r.check}`));
  }
  const leaks = results.filter((r) => !r.ok);
  console.log(`\n${results.length} checks across ${byModule.size} modules — ${leaks.length === 0 ? "NO LEAKS" : `${leaks.length} LEAK(S)`}`);

  // cleanup
  await leads.removeLead(a, lead.id).catch(() => {});
  await leads.removeLead(a, hostLead.id).catch(() => {});
  for (const [m, id] of [[proposals.removeProposal, prop.id], [briefs.removeBrief, brief.id], [prompts.removeSavedPrompt, prompt.id],
                          [reviews.removeReview, review.id], [serviceTemplates.removeServiceTemplate, tpl.id]] as any[]) {
    await m(a, id).catch(() => {});
  }
  await tasks.removeTask(a, task.id).catch(() => {});
  await radar.removeNews(a, news.id).catch(() => {});
  await inspiration.removeInspiration(a, insp.id).catch(() => {});
  await inspiration.removeMoodboard(a, board.id).catch(() => {});
  await carousel.removeCarousel(a, ((car as any).project ?? car).id).catch(() => {});
  await secrets.removeSecret(a, "audit_probe").catch(() => {});
  await db.delete(settingsTable).where(eq(settingsTable.key, "audit_probe")).catch(() => {});
}
main().then(() => process.exit(0)).catch((e) => { console.error("AUDIT ERROR:", e.message); process.exit(1); });
