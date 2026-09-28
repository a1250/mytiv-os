/**
 * Stand-in for the ClickUp v2 API, for staging verification only.
 *
 * Stateful and deterministic: two folders, each with Tasks/Bugs/Decisions lists and a few tasks.
 * Writes mutate the in-memory task and bump `date_updated`, exactly the semantics the audit and
 * rollback code depends on. Nothing here can touch a real workspace — it is a local HTTP server,
 * and the app is pointed at it with CLICKUP_API_BASE. State resets on restart; POST /__reset
 * resets it on demand; GET /__state dumps it for assertions.
 *
 * Run: node scripts/staging/clickup-mock.mjs [port=4545]
 */
import http from "node:http";

const PORT = Number(process.argv[2] ?? 4545);
const WORKSPACE = "90182347023";
const now = () => Date.now();

function makeState() {
  const t0 = now() - 5 * 86400000; // five days idle → "stuck" at the default threshold
  const lists = {
    "901816026303": [ // UMINO folder (on the allowlist for slug "mytiv")
      { id: "L-UM-T", name: "Tasks", folder: "901816026303", statuses: [{ status: "to do", type: "open" }, { status: "working", type: "custom" }, { status: "review", type: "custom" }, { status: "done", type: "closed" }] },
      { id: "L-UM-B", name: "Bugs", folder: "901816026303", statuses: [{ status: "open", type: "open" }, { status: "fixed", type: "closed" }] },
      { id: "L-UM-D", name: "Decisions", folder: "901816026303", statuses: [{ status: "recorded", type: "open" }] },
    ],
    "999000111": [ // NOT on any allowlist — must never be read by the app
      { id: "L-X-T", name: "Tasks", folder: "999000111", statuses: [{ status: "working", type: "custom" }] },
    ],
  };
  const tasks = {
    "STG-1": { id: "STG-1", name: "Staging fixture task 1", list: "L-UM-T", status: "working", assignees: [1001], due_date: null, date_updated: String(t0), time_estimate: 7200000, attachments: [{ title: "proof.mp4", url: "https://proof.example/stg-1.mp4", mimetype: "video/mp4" }], comments: [] },
    "STG-2": { id: "STG-2", name: "Staging fixture task 2", list: "L-UM-T", status: "to do", assignees: [], due_date: String(now() - 2 * 86400000), date_updated: String(now() - 86400000), time_estimate: null, attachments: [], comments: [] },
    "STG-B1": { id: "STG-B1", name: "Staging fixture bug", list: "L-UM-B", status: "open", assignees: [1002], due_date: null, date_updated: String(t0), time_estimate: null, attachments: [], comments: [] },
    "STG-D1": { id: "STG-D1", name: "Decision: fixture", list: "L-UM-D", status: "recorded", assignees: [], due_date: null, date_updated: String(t0), time_estimate: null, attachments: [], comments: [] },
    "X-1": { id: "X-1", name: "MUST NEVER BE READ", list: "L-X-T", status: "working", assignees: [], due_date: null, date_updated: String(t0), time_estimate: null, attachments: [], comments: [] },
  };
  return { lists, tasks, members: [{ id: 1001, username: "Staging Owner", email: "owner@stg.invalid" }, { id: 1002, username: "Staging Dev", email: "dev@stg.invalid" }], log: [], seq: 0 };
}
let state = makeState();
const listById = (id) => Object.values(state.lists).flat().find((l) => l.id === id);
const raw = (t) => {
  const l = listById(t.list);
  return { id: t.id, name: t.name, url: `https://app.clickup.com/t/${t.id}`, status: { status: t.status, type: l?.statuses.find((s) => s.status === t.status)?.type ?? "custom" },
    assignees: t.assignees.map((id) => state.members.find((m) => m.id === id) ?? { id }), due_date: t.due_date, date_updated: t.date_updated, time_estimate: t.time_estimate,
    list: { id: t.list, name: l?.name }, attachments: t.attachments, custom_fields: [] };
};
const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b ? JSON.parse(b) : {})); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname.replace(/^\/api\/v2/, "");
  state.log.push({ at: new Date().toISOString(), method: req.method, path: p + url.search });
  let m;
  if (req.method === "POST" && p === "/__reset") { state = makeState(); return json(res, 200, { ok: true }); }
  if (req.method === "GET" && p === "/__state") return json(res, 200, state);
  if (req.method === "GET" && p === "/team") return json(res, 200, { teams: [{ id: WORKSPACE, members: state.members.map((user) => ({ user })) }] });
  if (req.method === "GET" && (m = p.match(/^\/folder\/(\w+)\/list$/))) return json(res, 200, { lists: (state.lists[m[1]] ?? []).map((l) => ({ id: l.id, name: l.name, statuses: l.statuses })) });
  if (req.method === "GET" && p === `/team/${WORKSPACE}/task`) {
    const folder = url.searchParams.get("project_ids[]");
    const ids = new Set((state.lists[folder] ?? []).map((l) => l.id));
    return json(res, 200, { tasks: Object.values(state.tasks).filter((t) => ids.has(t.list)).map(raw), last_page: true });
  }
  if (req.method === "GET" && p === `/team/${WORKSPACE}/time_entries`) return json(res, 200, { data: [] });
  if (req.method === "GET" && p === `/team/${WORKSPACE}/space`) return json(res, 200, { spaces: [] });
  if ((m = p.match(/^\/task\/([\w-]+)\/comment$/))) {
    const t = state.tasks[m[1]]; if (!t) return json(res, 404, { err: "Task not found", ECODE: "ITEM_013" });
    if (req.method === "GET") return json(res, 200, { comments: t.comments });
    const body = await readBody(req); const id = `c${++state.seq}`; t.comments.push({ id, comment_text: body.comment_text, user: { username: "staging" } }); t.date_updated = String(now());
    return json(res, 200, { id });
  }
  if ((m = p.match(/^\/task\/([\w-]+)$/))) {
    const t = state.tasks[m[1]]; if (!t) return json(res, 404, { err: "Task not found", ECODE: "ITEM_013" });
    if (req.method === "GET") return json(res, 200, raw(t));
    if (req.method === "PUT") {
      const body = await readBody(req);
      if (body.status !== undefined) { const l = listById(t.list); if (!l.statuses.some((s) => s.status === body.status)) return json(res, 400, { err: "Status not found", ECODE: "ITEM_012" }); t.status = body.status; }
      if (body.assignees?.add) t.assignees = [...new Set([...t.assignees, ...body.assignees.add])];
      if (body.assignees?.rem) t.assignees = t.assignees.filter((id) => !body.assignees.rem.includes(id));
      if ("due_date" in body) t.due_date = body.due_date === null ? null : String(body.due_date);
      t.date_updated = String(Math.max(now(), Number(t.date_updated) + 1));
      return json(res, 200, raw(t));
    }
  }
  if (req.method === "POST" && (m = p.match(/^\/list\/([\w-]+)\/task$/))) {
    const l = listById(m[1]); if (!l) return json(res, 404, { err: "List not found" });
    const body = await readBody(req); const id = `STG-N${++state.seq}`;
    state.tasks[id] = { id, name: body.name, list: l.id, status: l.statuses[0].status, assignees: body.assignees ?? [], due_date: body.due_date ? String(body.due_date) : null, date_updated: String(now()), time_estimate: body.time_estimate ?? null, attachments: [], comments: [], description: body.markdown_description ?? "" };
    return json(res, 200, raw(state.tasks[id]));
  }
  json(res, 404, { err: `mock: no route for ${req.method} ${p}` });
}).listen(PORT, "127.0.0.1", () => console.log(`clickup-mock listening on http://127.0.0.1:${PORT} (workspace ${WORKSPACE})`));
