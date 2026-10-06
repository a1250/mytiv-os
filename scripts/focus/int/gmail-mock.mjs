// LOCAL TEST TOOLING ONLY — a Gmail API stand-in on 127.0.0.1 for the integration E2E (the app reaches it only via
// GMAIL_API_BASE_LOCAL, honoured only with a local database — lib/google/gmail.ts). Behaviour of drafts.send is
// switchable (ok | fail400 | err500 | hang) so the E2E can force a confirmed send, a known failure, and an UNKNOWN
// outcome (no answer). It counts every send per draft, so a double send would be visible.
import http from "node:http";

let mode = "ok", seq = 0;
const sends = {}; const drafts = {};
const json = (res, status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const server = http.createServer(async (req, res) => {
  let raw = ""; for await (const ch of req) raw += ch;
  const body = raw ? JSON.parse(raw) : {};
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__mode") { mode = body.mode; return json(res, 200, { mode }); }
  if (url.pathname === "/__state") return json(res, 200, { mode, sends, drafts });
  if (url.pathname === "/__reset") { mode = "ok"; for (const k of Object.keys(sends)) delete sends[k]; return json(res, 200, {}); }
  const p = url.pathname.replace(/^\/gmail\/v1\/users\/me/, "");
  if (req.method === "POST" && p === "/drafts") { const id = `d${++seq}`; drafts[id] = body; return json(res, 200, { id, message: { id: `m-${id}`, threadId: body.message?.threadId ?? `t${seq}` } }); }
  if (req.method === "POST" && p === "/drafts/send") {
    sends[body.id] = (sends[body.id] ?? 0) + 1;
    if (mode === "hang") return; // never answers: the caller cannot know whether it was sent
    if (mode === "fail400") return json(res, 400, { error: { message: "Invalid draft" } });
    if (mode === "err500") return json(res, 500, { error: { message: "backend error" } });
    return json(res, 200, { id: `sent-${body.id}-${sends[body.id]}`, threadId: drafts[body.id]?.message?.threadId ?? "t" });
  }
  return json(res, 404, { error: { message: "not found" } });
});
server.listen(Number(process.argv[2] ?? 4545), "127.0.0.1", () => console.log(`gmail-mock on ${process.argv[2] ?? 4545}`));
