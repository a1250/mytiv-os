// Production-mode isolation (GPT review P1 + P2), against a real `next build` + `next start` — no browser needed.
//   --expect production : `next start` without VERCEL_ENV (or Vercel production). The fixture demo scope and every
//                         prototype surface 404; business routes fail closed (no session / forged session → /login);
//                         query parameters cannot create a scope; 404 bodies carry no prototype or fixture content.
//   --expect preview    : `VERCEL_ENV=preview next start`. The demo scope and its QA surfaces render (Preview QA).
// Usage: BASE=http://localhost:3300 node scripts/focus/qa/prod-surfaces.mjs --expect production [--json out.json]
import { writeFileSync } from "node:fs";
import { BASE, report } from "./lib.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const mode = arg("--expect");
if (mode !== "production" && mode !== "preview") { console.error("--expect production|preview"); process.exit(2); }

const rows = [];
const get = async (path, headers = {}) => {
  const res = await fetch(BASE + path, { redirect: "manual", headers });
  return { status: res.status, location: res.headers.get("location") ?? "", body: await res.text() };
};
const PROTOTYPE_MARKERS = ["מפת מסכים", "אפס נתוני דמו", "data-reference", "f-screenmap"];
const FIXTURE_MARKERS = ["UMINO", "נועה כהן", "השקת תפריט סתיו"];
const leaks = (body, markers) => markers.filter((m) => body.includes(m));

const DEMO = ["/_demo/focus", "/_demo/focus/work", "/_demo/focus/screens", "/_demo/focus/reference/D1", "/_demo/focus/m/1", "/_demo/focus/approvals/proposal-noa", "/_demo/focus/work/task"];
const BUSINESS = ["/acme/focus", "/acme/focus/screens", "/acme/focus/reference/D1", "/acme/focus/m/1", "/acme/focus/work/list?task=t-post45"];

if (mode === "production") {
  for (const p of DEMO) {
    const r = await get(p);
    const l = [...leaks(r.body, PROTOTYPE_MARKERS), ...leaks(r.body, FIXTURE_MARKERS)];
    rows.push({ ok: r.status === 404 && l.length === 0, name: `production: ${p} is absent (404, no prototype/fixture content)`, detail: `HTTP ${r.status}${l.length ? ` leaks: ${l.join(", ")}` : ""}` });
  }
  const loginOnly = (r) => (r.status === 307 || r.status === 302 || r.status === 303) && new URL(r.location, BASE).pathname === "/login";
  for (const p of BUSINESS) {
    const r = await get(p);
    rows.push({ ok: loginOnly(r), name: `production: ${p} without a session → /login`, detail: `HTTP ${r.status} → ${r.location}` });
  }
  for (const cookie of ["authjs.session-token=forged.not-a-jwt", "authjs.session-token=eyJhbGciOiJub25lIn0.eyJ1c2VySWQiOiJ1c2VyLTEifQ."]) {
    const r = await get("/acme/focus", { cookie });
    rows.push({ ok: loginOnly(r), name: `production: forged/unsigned session cookie → /login (${cookie.slice(21, 33)}…)`, detail: `HTTP ${r.status} → ${r.location}` });
  }
  for (const q of ["/acme/focus?businessSlug=_demo", "/acme/focus?scope=demo&businessId=biz-1", "/_demo/focus?businessSlug=acme"]) {
    const r = await get(q);
    const ok = q.startsWith("/_demo") ? r.status === 404 : loginOnly(r);
    rows.push({ ok, name: `production: query parameters cannot create a scope (${q})`, detail: `HTTP ${r.status}${r.location ? ` → ${r.location}` : ""}` });
  }
  const old = await get("/focus");
  rows.push({ ok: loginOnly(old) || old.status === 404, name: "production: the old unscoped /focus is not a product route (tenant layout → /login)", detail: `HTTP ${old.status} → ${old.location}` });
} else {
  for (const p of ["/_demo/focus", "/_demo/focus/screens", "/_demo/focus/reference/D1", "/_demo/focus/work"]) {
    const r = await get(p);
    rows.push({ ok: r.status === 200, name: `preview: ${p} renders for QA`, detail: `HTTP ${r.status}` });
  }
  const home = await get("/_demo/focus");
  rows.push({ ok: home.body.includes("f-screenmap"), name: "preview: the demo shell carries the screen-map affordance", detail: "" });
  const biz = await get("/acme/focus");
  rows.push({ ok: [302, 303, 307].includes(biz.status) && biz.location.includes("/login"), name: "preview: business routes still require a session", detail: `HTTP ${biz.status} → ${biz.location}` });
}

const j = arg("--json"); if (j) writeFileSync(j, JSON.stringify(rows, null, 1));
process.exit(report(`prod-surfaces (${mode})`, rows) ? 0 : 1);
