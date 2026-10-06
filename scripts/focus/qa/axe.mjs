// Accessibility: axe-core (WCAG 2.0/2.1/2.2 A + AA) on every /focus route, in light and dark, desktop and mobile.
// Usage: PLAYWRIGHT_MODULE=… node scripts/focus/qa/axe.mjs [--json out.json] [--routes /focus,/focus/work]
import { writeFileSync } from "node:fs";
import { SITE, axeSource, focusRoutes, playwright, report, settle } from "./lib.mjs";

const { chromium } = playwright();
const ri = process.argv.indexOf("--routes");
const routes = ri > 0 ? process.argv[ri + 1].split(",") : focusRoutes();
const axe = axeSource();
const rows = [];
const all = [];
const browser = await chromium.launch();
for (const [theme, width] of [["light", 1440], ["dark", 1440], ["light", 390]]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const r of routes) {
    await page.goto(SITE + r, { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.addScriptTag({ content: axe });
    const res = await page.evaluate(async () => {
      // @ts-expect-error axe is injected
      const out = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      return out.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(" ")) }));
    });
    // the prototype's reference frames are excluded on purpose; product screens only
    const serious = res.filter((v) => v.impact === "serious" || v.impact === "critical");
    all.push({ route: r, theme, width, violations: res });
    rows.push({ ok: serious.length === 0, name: `${theme} ${width}px ${r}`, detail: res.length ? res.map((v) => `${v.impact}:${v.id}×${v.nodes}`).join(", ") : "" });
  }
  await ctx.close();
}
await browser.close();
const i = process.argv.indexOf("--json");
if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(all, null, 1));
process.exit(report("axe (serious/critical fail)", rows) ? 0 : 1);
