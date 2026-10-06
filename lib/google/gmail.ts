/**
 * Ported from electron/services/gmail.cjs — dependency-free HTTPS logic,
 * only the token source changed (googleApi(businessId, ...) instead of a
 * module-level singleton). SAFETY: nothing here sends mail on its own;
 * sendDraft is only reachable from an explicit confirm step in the UI.
 */
import { googleApi } from "./oauth";
import { localApiBase } from "@/lib/db/local-endpoint";

// Local integration tests only: a localhost Gmail stand-in (scripts/focus/int/gmail-mock.mjs). Ignored unless the
// override itself is a localhost http URL AND the database is local — a deployed environment always talks to Google.
const BASE = localApiBase(process.env.DATABASE_URL, process.env.GMAIL_API_BASE_LOCAL) ?? "https://gmail.googleapis.com/gmail/v1/users/me";

const b64urlDecode = (s: string) => Buffer.from(String(s || "").replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const b64urlEncode = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

type GmailHeader = { name: string; value: string };
type GmailPayload = { mimeType?: string; body?: { data?: string }; parts?: GmailPayload[]; headers?: GmailHeader[] };
type GmailMessage = { id: string; threadId: string; snippet?: string; internalDate?: string; labelIds?: string[]; payload?: GmailPayload };

const header = (payload: GmailPayload | undefined, name: string) =>
  (payload?.headers || []).find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

function extractBody(payload: GmailPayload | undefined): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) return b64urlDecode(payload.body.data);
  if (payload.parts) {
    for (const p of payload.parts) {
      const plain = extractBody(p);
      if (plain) return plain;
    }
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return b64urlDecode(payload.body.data)
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  }
  return "";
}

function parseMessage(msg: GmailMessage) {
  const p = msg.payload || {};
  const from = header(p, "From");
  const fromEmail = (from.match(/<([^>]+)>/) || [, from])[1]?.trim().toLowerCase() || "";
  return {
    googleMessageId: msg.id,
    googleThreadId: msg.threadId,
    fromEmail,
    fromName: from.replace(/<[^>]+>/, "").replace(/"/g, "").trim(),
    toEmails: header(p, "To"),
    ccEmails: header(p, "Cc"),
    subject: header(p, "Subject"),
    snippet: msg.snippet || "",
    bodyPreview: extractBody(p).slice(0, 4000),
    date: header(p, "Date") ? new Date(header(p, "Date")).toISOString() : msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : null,
    unread: (msg.labelIds || []).includes("UNREAD"),
    isSent: (msg.labelIds || []).includes("SENT"),
  };
}

export async function listMessages(businessId: string, q = "in:inbox", maxResults = 15) {
  const list = await googleApi(businessId, "GET", `${BASE}/messages?q=${encodeURIComponent(q)}&maxResults=${maxResults}`);
  const out = [];
  for (const m of list.messages || []) {
    try {
      const full = await googleApi(
        businessId,
        "GET",
        `${BASE}/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`
      );
      out.push(parseMessage(full));
    } catch {
      /* skip individual failures */
    }
  }
  return out;
}

export async function readThread(businessId: string, googleThreadId: string) {
  const thread = await googleApi(businessId, "GET", `${BASE}/threads/${googleThreadId}?format=full`);
  return { googleThreadId: thread.id, messages: (thread.messages || []).map(parseMessage) };
}

function buildRaw({ to, cc = "", subject, body, fromEmail, inReplyTo = "" }: { to: string; cc?: string; subject: string; body: string; fromEmail: string; inReplyTo?: string }) {
  const encSubject = /[^\x20-\x7E]/.test(subject) ? `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=` : subject;
  const lines = [
    `From: ${fromEmail || "me"}`,
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    `Subject: ${encSubject}`,
    ...(inReplyTo ? [`In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`] : []),
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body, "utf8").toString("base64"),
  ];
  return b64urlEncode(Buffer.from(lines.join("\r\n"), "utf8"));
}

export async function createDraft(
  businessId: string,
  data: { to: string; cc?: string; subject: string; body: string; fromEmail: string; googleThreadId?: string }
) {
  const payload: { message: { raw: string; threadId?: string } } = { message: { raw: buildRaw(data) } };
  if (data.googleThreadId) payload.message.threadId = data.googleThreadId;
  const res = await googleApi(businessId, "POST", `${BASE}/drafts`, payload);
  return { googleDraftId: res.id, googleMessageId: res.message?.id || "", googleThreadId: res.message?.threadId || data.googleThreadId || "" };
}

export async function updateDraft(
  businessId: string,
  googleDraftId: string,
  data: { to: string; cc?: string; subject: string; body: string; fromEmail: string; googleThreadId?: string }
) {
  const payload: { message: { raw: string; threadId?: string } } = { message: { raw: buildRaw(data) } };
  if (data.googleThreadId) payload.message.threadId = data.googleThreadId;
  const res = await googleApi(businessId, "PUT", `${BASE}/drafts/${googleDraftId}`, payload);
  return { googleDraftId: res.id, googleMessageId: res.message?.id || "" };
}

/** EXPLICIT-CONFIRMATION-ONLY. Only called after the UI's confirm dialog. */
export async function sendDraft(businessId: string, googleDraftId: string) {
  const res = await googleApi(businessId, "POST", `${BASE}/drafts/send`, { id: googleDraftId });
  return { googleMessageId: res.id, googleThreadId: res.threadId };
}

export async function deleteDraft(businessId: string, googleDraftId: string) {
  await googleApi(businessId, "DELETE", `${BASE}/drafts/${googleDraftId}`);
  return true;
}

export const archiveMessage = (businessId: string, id: string) =>
  googleApi(businessId, "POST", `${BASE}/messages/${id}/modify`, { removeLabelIds: ["INBOX"] });

export const markRead = (businessId: string, id: string, unread = false) =>
  googleApi(businessId, "POST", `${BASE}/messages/${id}/modify`, unread ? { addLabelIds: ["UNREAD"] } : { removeLabelIds: ["UNREAD"] });
