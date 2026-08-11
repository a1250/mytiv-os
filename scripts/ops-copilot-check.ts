/**
 * Copilot smoke check — proves the context, the read tools, and (with --live)
 * the model call itself work, without a browser session.
 *
 * Offline by default: builds the real context from the database and ClickUp and
 * runs every tool deterministically. `--live` additionally sends one short
 * question to Claude, which spends tokens — hence the opt-in.
 *
 * Run: npm run ops:copilot-check -- [projectName] [--live]
 */
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { businesses } from "../lib/db/schema";
import { listProjects } from "../lib/db/queries/projects";
import { hasSecret } from "../lib/db/queries/secrets";
import { folderFromProject, stuckThresholdDays } from "../lib/ops-config";
import { getTasksByFolder, type OpsTask } from "../lib/clickup";
import { AI_KEY_SECRET } from "../lib/ai/claude";
import { buildCopilotSystem, runOpsTool, streamOpsChat, type OpsContext } from "../lib/ai/ops-copilot";

const SLUG = "mytiv";
const args = process.argv.slice(2);
const LIVE = args.includes("--live");
const WANTED = args.find((a) => !a.startsWith("--"));

async function main() {
  const [business] = await db.select().from(businesses).where(eq(businesses.slug, SLUG)).limit(1);
  if (!business) throw new Error(`No business "${SLUG}".`);

  const keyed = await hasSecret(business.id, AI_KEY_SECRET);
  console.log(`business: ${business.name}`);
  console.log(`claude key configured: ${keyed ? "yes" : "NO — the copilot will refuse to answer"}\n`);

  const projects = await listProjects(business.id);
  const project =
    (WANTED && projects.find((p) => p.name.toLowerCase().includes(WANTED.toLowerCase()))) ??
    projects.find((p) => p.clickupFolderId) ??
    projects[0];
  if (!project) throw new Error("No projects. Run npm run ops:backfill first.");

  const folder = folderFromProject(project);
  let rows: OpsTask[] = [];
  if (folder) rows = await getTasksByFolder(folder);

  const ctx: OpsContext = {
    project,
    folder,
    tasks: rows.filter((t) => t.listKind === "tasks" || t.listKind === "other"),
    bugs: rows.filter((t) => t.isBug),
    decisions: rows.filter((t) => t.isDecision).slice(0, 10),
    thresholdDays: stuckThresholdDays(),
  };

  const system = buildCopilotSystem(ctx, business.name);
  console.log(`project: ${project.name} (folder ${project.clickupFolderId ?? "none"})`);
  console.log(`context: ${ctx.tasks.length} tasks · ${ctx.bugs.length} bugs · ${ctx.decisions.length} decisions`);
  console.log(`spec: ${project.brief?.trim() ? `${project.brief.trim().length} chars` : "empty"}`);
  console.log(`system prompt: ${system.length} chars\n`);

  console.log("--- tools (deterministic, no model call) ---");
  for (const [label, name, input] of [
    ["check_blockers", "check_blockers", {}],
    ["fetch_tasks{list:bugs}", "fetch_tasks", { list: "bugs" }],
    ["get_decisions{limit:3}", "get_decisions", { limit: 3 }],
    ["get_time_summary", "get_time_summary", { from: "2026-07-01", to: "2026-08-11" }],
  ] as const) {
    const out = await runOpsTool(name, input as Record<string, unknown>, ctx);
    console.log(`\n[${label}]\n${out.split("\n").slice(0, 4).join("\n")}`);
  }

  if (!LIVE) {
    console.log("\n\n(offline check only — pass --live to send one real question)");
    return;
  }
  if (!keyed) {
    console.log("\n\nSkipping --live: no Claude API key configured for this business.");
    return;
  }

  console.log("\n\n--- live (one question) ---");
  const question = "What is currently blocked, and on whom? Answer in two sentences.";
  console.log(`> ${question}\n`);
  for await (const event of streamOpsChat(business.id, business.name, ctx, [
    { role: "user", content: question },
  ])) {
    if (event.type === "text") process.stdout.write(event.text);
    else if (event.type === "tool") process.stdout.write(`\n[tool: ${event.name}]\n`);
    else if (event.type === "error") console.error(`\nERROR: ${event.message}`);
  }
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
