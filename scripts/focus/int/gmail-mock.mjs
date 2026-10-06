// LOCAL TEST TOOLING ONLY — a Gmail API stand-in on 127.0.0.1 for the integration E2E (the app reaches it only via
// GMAIL_API_BASE_LOCAL, honoured only with a local database — lib/google/gmail.ts). Behaviour of drafts.send is
// switchable (ok | fail400 | err500 | hang) so the E2E can force a confirmed send, a known failure, and an UNKNOWN
// outcome (no answer). It counts every send per draft, so a double send would be visible. It also serves a small
// fictional inbox (messages.list / messages.get / threads.get); a confirmed send appears in its thread.
import http from "node:http";

let mode = "ok", seq = 0;
const sends = {}; const drafts = {};
const b64u = (t) => Buffer.from(t, "utf8").toString("base64url");
const msg = (id, threadId, from, subject, text, minutesAgo, labels = ["INBOX"]) => ({
  id, threadId, snippet: text.slice(0, 80), internalDate: String(Date.now() - minutesAgo * 60000), labelIds: labels,
  payload: { mimeType: "text/plain", headers: [{ name: "From", value: from }, { name: "To", value: "owner-a@staging.invalid" }, { name: "Subject", value: subject }], body: { data: b64u(text) } },
});
// fresh thread ids on every reset: attempts persisted by an earlier run never gate a new run
let gen = Date.now().toString(36);
const SEED = () => [
  msg(`m1${gen}`, `ti1${gen}`, "לקוח בדוי <client@demo-client.invalid>", "שאלה על ההזמנה לשבוע הבא", "שלום, אפשר להזיז את ההזמנה ליום רביעי?", 90, ["INBOX", "UNREAD"]),
  msg(`m2${gen}`, `ti2${gen}`, "ספק בדוי <supplier@demo-supplier.invalid>", "חשבונית אוקטובר", "מצורפת החשבונית לחודש אוקטובר.", 300),
];
let messages = SEED();
const decodeRaw = (raw) => { const text = Buffer.from(raw ?? "", "base64url").toString("utf8"); const body = text.split("\r\n\r\n")[1] ?? ""; return Buffer.from(body, "base64").toString("utf8"); };
const json = (res, status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const server = http.createServer(async (req, res) => {
  let raw = ""; for await (const ch of req) raw += ch;
  const body = raw ? JSON.parse(raw) : {};
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__mode") { mode = body.mode; return json(res, 200, { mode }); }
  if (url.pathname === "/__state") return json(res, 200, { mode, sends, drafts, threads: SEED().map((m) => m.threadId) });
  if (url.pathname === "/__reset") { mode = "ok"; for (const k of Object.keys(sends)) delete sends[k]; gen = Date.now().toString(36); messages = SEED(); return json(res, 200, {}); }
  const p = url.pathname.replace(/^\/gmail\/v1\/users\/me/, "");
  if (req.method === "GET" && p === "/messages") {
    const inbox = messages.filter((m) => m.labelIds.includes(url.searchParams.get("q") === "in:sent" ? "SENT" : "INBOX"));
    return json(res, 200, { messages: inbox.sort((a, b) => b.internalDate - a.internalDate).map((m) => ({ id: m.id, threadId: m.threadId })) });
  }
  if (req.method === "GET" && p.startsWith("/messages/")) { const m = messages.find((x) => x.id === p.slice(10)); return m ? json(res, 200, m) : json(res, 404, { error: { message: "not found" } }); }
  if (req.method === "GET" && p.startsWith("/threads/")) {
    const id = p.slice(9), ms = messages.filter((m) => m.threadId === id).sort((a, b) => a.internalDate - b.internalDate);
    return ms.length ? json(res, 200, { id, messages: ms }) : json(res, 404, { error: { message: "not found" } });
  }
  if (req.method === "POST" && p === "/drafts") { const id = `d${++seq}`; drafts[id] = body; return json(res, 200, { id, message: { id: `m-${id}`, threadId: body.message?.threadId ?? `t${seq}` } }); }
  if (req.method === "POST" && p === "/drafts/send") {
    sends[body.id] = (sends[body.id] ?? 0) + 1;
    if (mode === "hang") return; // never answers: the caller cannot know whether it was sent
    if (mode === "fail400") return json(res, 400, { error: { message: "Invalid draft" } });
    if (mode === "err500") return json(res, 500, { error: { message: "backend error" } });
    const sentId = `sent-${body.id}-${sends[body.id]}`, threadId = drafts[body.id]?.message?.threadId ?? "t";
    messages.push(msg(sentId, threadId, "owner-a@staging.invalid", "Re", decodeRaw(drafts[body.id]?.message?.raw), 0, ["SENT"]));
    return json(res, 200, { id: sentId, threadId });
  }
  return json(res, 404, { error: { message: "not found" } });
});
server.listen(Number(process.argv[2] ?? 4545), "127.0.0.1", () => console.log(`gmail-mock on ${process.argv[2] ?? 4545}`));
