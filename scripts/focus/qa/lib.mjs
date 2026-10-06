// Shared helpers for the Focus QA scripts. Playwright is not a dependency of this repo: point PLAYWRIGHT_MODULE at any
// installed copy (e.g. PLAYWRIGHT_MODULE=/path/to/node_modules/playwright) or install it locally. Browsers must be
// installed (npx playwright install chromium). BASE defaults to http://localhost:3200 (npx next dev -p 3200).
import { createRequire } from "node:module";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
export const BASE = process.env.BASE ?? "http://localhost:3200";
/**
 * Focus routes are tenant-scoped (/{businessSlug}/focus/...). QA runs on the fixture demo scope, which exists only in
 * development / Preview: SITE + "/focus/..." is a page; route lists stay scope-relative ("/focus/...").
 */
export const SCOPE = process.env.FOCUS_SCOPE ?? "/_demo";
export const SITE = BASE + SCOPE;
export const APP_FOCUS = "app/(focus)/[businessSlug]/focus";
export const ROOT = new URL("../../../", import.meta.url).pathname;

export function playwright() {
  const mod = process.env.PLAYWRIGHT_MODULE ?? "playwright";
  try { return require(mod); } catch {
    console.error(`Cannot load Playwright from "${mod}". Set PLAYWRIGHT_MODULE=/abs/path/to/node_modules/playwright.`);
    process.exit(2);
  }
}

export function axeSource() {
  return require("node:fs").readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
}

/** Every concrete scope-relative /focus route from the Focus route tree (dynamic segments expanded from known ids). */
export function focusRoutes() {
  const out = [];
  const walk = (dir, url) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, `${url}/${name}`);
      else if (name === "page.tsx") out.push(url || "/");
    }
  };
  walk(join(ROOT, APP_FOCUS), "/focus");
  const expand = {
    "/focus/approvals/[id]": ["proposal-noa", "promo-1plus1", "content-sushi-story", "plan-october"].map((x) => `/focus/approvals/${x}`),
    "/focus/m/[n]": [],
    "/focus/reference/[id]": [],
  };
  return out.flatMap((r) => (r in expand ? expand[r] : [r])).sort();
}

export const WIDTHS = [1440, 1280, 1024, 768, 390];

export async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(150);
}

export function report(name, rows) {
  const failed = rows.filter((r) => !r.ok);
  for (const r of rows) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  console.log(`\n${name}: ${rows.length - failed.length}/${rows.length} passed`);
  return failed.length === 0;
}
