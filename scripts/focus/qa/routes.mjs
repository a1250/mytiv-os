// Every /focus route: loads (2xx), no console/page errors, no unintended horizontal scroll at 1440/1280/1024/768/390,
// no placeholder links (href="#"), every internal link resolves, and product routes never import reference screens.
// Usage: PLAYWRIGHT_MODULE=… node scripts/focus/qa/routes.mjs [--json out.json]
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP_FOCUS, BASE, ROOT, SCOPE, SITE, WIDTHS, focusRoutes, playwright, report, settle } from "./lib.mjs";

const { chromium } = playwright();
const rows = [];
const routes = focusRoutes();

// static: product pages must not import components/focus/reference
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const f of walk(join(ROOT, APP_FOCUS)).filter((f) => f.endsWith(".tsx") && !f.includes("/focus/reference/"))) {
  const src = readFileSync(f, "utf8");
  if (src.includes("components/focus/reference")) rows.push({ ok: false, name: `no reference import ${f.replace(ROOT, "")}` });
}
for (const f of walk(join(ROOT, "components/focus")).filter((f) => !f.includes("/reference/") && /\.(tsx|ts)$/.test(f))) {
  const src = readFileSync(f, "utf8");
  if (/href=["']#["']/.test(src)) rows.push({ ok: false, name: `no href="#" in ${f.replace(ROOT, "")}` });
}
rows.push({ ok: true, name: "static: product routes do not import reference screens; no href=\"#\" in product code" });

const browser = await chromium.launch();
const links = new Set();
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const r of routes) {
    const errors = [];
    page.removeAllListeners("console"); page.removeAllListeners("pageerror");
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
    const res = await page.goto(SITE + r, { waitUntil: "domcontentloaded" });
    await settle(page);
    const info = await page.evaluate(() => {
      const doc = document.documentElement;
      const over = doc.scrollWidth - doc.clientWidth;
      const culprits = over > 1 ? [...document.querySelectorAll("body *")].filter((el) => { const b = el.getBoundingClientRect(); return b.left < -1 || b.right > doc.clientWidth + 1; }).slice(0, 3).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`) : [];
      const hrefs = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
      return { over, culprits, hrefs };
    });
    if (w === 1440) for (const h of info.hrefs) if (h && h.startsWith("/")) links.add(h.split("#")[0]);
    const placeholder = info.hrefs.filter((h) => h === "#" || h === "").length;
    const ok = res && res.status() < 400 && errors.length === 0 && info.over <= 1 && placeholder === 0;
    if (!ok || w === 1440) rows.push({ ok, name: `${w}px ${r}`, detail: [res && res.status() >= 400 ? `HTTP ${res.status()}` : "", errors.length ? `errors: ${errors.join(" | ")}` : "", info.over > 1 ? `h-scroll ${info.over}px (${info.culprits.join(", ")})` : "", placeholder ? `${placeholder} placeholder links` : ""].filter(Boolean).join("; ") });
  }
  await ctx.close();
}
// every internal link resolves
const ctx = await browser.newContext();
for (const h of [...links].sort()) {
  const res = await ctx.request.get(BASE + h, { maxRedirects: 3 }).catch(() => null);
  if (!res || res.status() >= 400) rows.push({ ok: false, name: `link ${h}`, detail: res ? `HTTP ${res.status()}` : "no response" });
}
// tenant containment: every internal link a Focus page renders stays inside the scope it was rendered for
const escaped = [...links].filter((h) => !(h === `${SCOPE}/focus` || h.startsWith(`${SCOPE}/focus/`) || h.startsWith(`${SCOPE}/focus?`)) && !h.startsWith("/_next/") && !h.startsWith("/favicon"));
rows.push({ ok: escaped.length === 0, name: "every Focus link stays inside its scope", detail: escaped.length ? escaped.slice(0, 5).join(", ") : `${SCOPE}/focus/…` });
rows.push({ ok: true, name: `${links.size} distinct internal links checked` });
await browser.close();
const i = process.argv.indexOf("--json");
if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(rows, null, 1));
process.exit(report("routes", rows) ? 0 : 1);
