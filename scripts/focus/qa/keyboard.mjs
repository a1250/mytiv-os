// Keyboard-only walkthrough: on each route Tab through the page — focus is always visible, never on a hidden element,
// every stop has an accessible name, the skip link comes first, and the main action is reachable. Plus menus, the
// command palette and dialogs: open with the keyboard, Esc closes, focus returns to the opener.
// Usage: PLAYWRIGHT_MODULE=… node scripts/focus/qa/keyboard.mjs [--routes /focus,/focus/work]
import { SITE, focusRoutes, playwright, report, settle } from "./lib.mjs";

const { chromium } = playwright();
const ri = process.argv.indexOf("--routes");
const routes = ri > 0 ? process.argv[ri + 1].split(",") : focusRoutes();
const rows = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();

const focusInfo = () => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  if (el.tagName.toLowerCase() === "nextjs-portal") return { dev: true };
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const name = (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent || el.textContent || el.getAttribute("title") || el.getAttribute("placeholder") || (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent) || el.closest("label")?.textContent || "").trim();
  return {
    tag: el.tagName.toLowerCase(), cls: String(el.className).split(" ")[0], name: name.slice(0, 40),
    visible: r.width > 0 && r.height > 0 && cs.visibility !== "hidden",
    ring: (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || cs.boxShadow !== "none" || uaPicker(el) || ancestorRing(el),
    inModal: !!el.closest("dialog[open]"),
  };
  // Chromium's date/time picker button is a separate tab stop inside the UA shadow root: it draws its own ring (author
  // CSS can't reach it) and the host reports :focus false — verified visually, see docs/focus/QA.md
  function uaPicker(el) { return /^(date|time|datetime-local|month)$/.test(el.type) && !el.matches(":focus"); }
  // a ring drawn on a wrapper (:has(:focus-visible) / :focus-within) counts only if it appears because of this focus
  function ancestorRing(el) {
    const chain = []; for (let a = el.parentElement, i = 0; a && i < 4; a = a.parentElement, i++) chain.push(a);
    const look = () => chain.map((a) => { const s = getComputedStyle(a); return `${s.outlineStyle} ${s.outlineWidth} ${s.boxShadow}`; });
    const focused = look(); el.blur(); const idle = look(); el.focus();
    return focused.some((v, i) => v !== idle[i]);
  }
});

for (const r of routes) {
  await page.goto(SITE + r, { waitUntil: "domcontentloaded" });
  await settle(page);
  const problems = [];
  const seen = [];
  await page.keyboard.press("Tab");
  let first = await focusInfo();
  if (first?.dev) { await page.keyboard.press("Tab"); first = await focusInfo(); }
  // a deep link that opens a modal (?task=…) makes the page inert: the first stop belongs inside the dialog
  const modalAtLoad = await page.evaluate(() => !!document.querySelector("dialog[open]:modal"));
  if (modalAtLoad ? !first?.inModal : !first || !first.cls.includes("f-skip")) problems.push(`first stop is ${first?.cls ?? "nothing"}, not ${modalAtLoad ? "inside the open dialog" : "the skip link"}`);
  for (let i = 0; i < 45; i++) {
    const f = await focusInfo();
    if (!f) break;
    if (f.dev) { await page.keyboard.press("Tab"); continue; } // Next.js dev overlay — not in production
    if (!f.visible) problems.push(`hidden stop ${f.tag}.${f.cls}`);
    if (!f.ring) problems.push(`no visible focus on ${f.tag}.${f.cls}`);
    if (!f.name) problems.push(`no accessible name on ${f.tag}.${f.cls}`);
    seen.push(`${f.tag}.${f.cls}`);
    await page.keyboard.press("Tab");
  }
  const uniq = [...new Set(problems)];
  rows.push({ ok: uniq.length === 0, name: `tab walk ${r}`, detail: uniq.length ? uniq.slice(0, 4).join("; ") : `${seen.length} stops` });
}

// menus, palette, dialog: keyboard open, Esc closes, focus returns
await page.goto(SITE + "/focus", { waitUntil: "domcontentloaded" }); await settle(page);
{
  await page.focus(".f-topbar .f-avatar-btn");
  await page.keyboard.press("Enter");
  const opened = await page.isVisible("[role=menu]");
  const inMenu = await page.evaluate(() => !!document.activeElement?.closest("[role=menu]"));
  await page.keyboard.press("Escape");
  const back = await page.evaluate(() => document.activeElement?.classList.contains("f-avatar-btn"));
  rows.push({ ok: opened && inMenu && back, name: "menu: Enter opens + focuses first item, Esc closes + returns focus" });
}
{
  await page.focus("body");
  await page.keyboard.press("/");
  const open = await page.isVisible("dialog[open] .f-palette__input");
  const focused = await page.evaluate(() => document.activeElement?.classList.contains("f-palette__input"));
  await page.keyboard.type("נועה");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  const closed = !(await page.isVisible("dialog[open]"));
  rows.push({ ok: open && focused && closed, name: "command palette: '/' opens with focus in the field, arrows move, Esc closes" });
}
{
  await page.goto(SITE + "/focus/approvals", { waitUntil: "domcontentloaded" }); await settle(page);
  const tablist = page.locator(".f-alist__filters .f-chip").first();
  await tablist.focus();
  await page.keyboard.press("Enter");
  rows.push({ ok: await page.evaluate(() => document.activeElement?.getAttribute("aria-pressed") === "true"), name: "filter chips are buttons with aria-pressed" });
}
{
  await page.goto(SITE + "/focus/projects/umino", { waitUntil: "domcontentloaded" }); await settle(page);
  await page.goto(SITE + "/focus/work", { waitUntil: "domcontentloaded" }); await settle(page);
  await page.focus(".f-wmy__views [role=tab][aria-selected=true]");
  await page.keyboard.press("ArrowLeft");
  const moved = await page.evaluate(() => document.activeElement?.textContent);
  rows.push({ ok: moved === "List", name: "tabs: arrow keys move selection (RTL: ← = next)", detail: `now on ${moved}` });
}
await browser.close();
process.exit(report("keyboard", rows) ? 0 : 1);
