// Accessibility of the BUSINESS-scope Focus screens (real session, local stack): axe-core WCAG 2.x A/AA on Work,
// all tasks with the drawer open, approvals, mail and marketing — light and dark, desktop and mobile. Serious or
// critical violations fail (same bar as scripts/focus/qa/axe.mjs for the demo routes).
// Usage: INT_PW=<fixture password> PLAYWRIGHT_MODULE=… BASE=http://localhost:3200 node scripts/focus/int/axe-business.mjs
import { axeSource, playwright, report, settle } from "../qa/lib.mjs";
import { Session } from "./session.mjs";

const BASE = process.env.BASE ?? "http://localhost:3200";
const PW = process.env.INT_PW; if (!PW) throw new Error("INT_PW is required");
const owner = await new Session("owner").login("owner-a@staging.invalid", PW);
const tasks = (await owner.json("/api/mytiv/work/tasks")).body.tasks ?? [];
const ROUTES = ["/mytiv/focus/work", "/mytiv/focus/work/all-tasks", ...(tasks[0] ? [`/mytiv/focus/work/all-tasks?task=${tasks[0].id}`] : []),
  "/mytiv/focus/approvals", "/mytiv/focus/comms", "/mytiv/focus/marketing/board", "/mytiv/focus/reports"];
const axe = axeSource();
const { chromium } = playwright();
const browser = await chromium.launch();
const rows = [];
for (const theme of ["light", "dark"]) {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: "reduce" });
    await ctx.addCookies([...owner.jar].map(([name, value]) => ({ name, value, url: BASE })));
    const page = await ctx.newPage();
    for (const r of ROUTES) {
      await page.goto(BASE + r, { waitUntil: "domcontentloaded" }); await settle(page);
      await page.addScriptTag({ content: axe });
      const res = await page.evaluate(async () => {
        // @ts-expect-error axe is injected
        const out = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        return out.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(" ")) }));
      });
      const serious = res.filter((v) => v.impact === "serious" || v.impact === "critical");
      rows.push({ ok: serious.length === 0, name: `${theme} ${width}px ${r.replace(/task=[^&]+/, "task=…")}`, detail: res.length ? res.map((v) => `${v.impact}:${v.id}×${v.nodes} ${v.sample.join(" | ")}`).join(", ") : "" });
    }
    await ctx.close();
  }
}
await browser.close();
process.exit(report("axe — business scope (serious/critical fail)", rows) ? 0 : 1);
