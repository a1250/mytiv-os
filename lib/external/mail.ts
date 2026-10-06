import "server-only";
import { listMessages } from "@/lib/google/gmail";
import { status } from "@/lib/google/oauth";

/** One inbox thread as Focus lists it (newest message of the thread). */
export type InboxThread = { threadId: string; subject: string; fromName: string; fromEmail: string; snippet: string; date: string | null; unread: boolean; count: number };
export type Inbox =
  | { state: "not_connected" }
  | { state: "error" }
  | { state: "ok"; account: string; threads: InboxThread[] };

/**
 * The business's Gmail inbox, read on the server with the business's own Google connection (google_accounts,
 * tenant-scoped). Read-only. A business without a Gmail connection gets `not_connected`, never another business's mail.
 */
export async function readInbox(businessId: string): Promise<Inbox> {
  const s = await status(businessId);
  if (!s.connected || !s.gmail) return { state: "not_connected" };
  try {
    const messages = await listMessages(businessId, "in:inbox", 25);
    const byThread = new Map<string, InboxThread>();
    for (const m of messages) {
      const t = byThread.get(m.googleThreadId);
      if (t) { t.count += 1; t.unread ||= m.unread; continue; }
      byThread.set(m.googleThreadId, { threadId: m.googleThreadId, subject: m.subject, fromName: m.fromName, fromEmail: m.fromEmail, snippet: m.snippet, date: m.date, unread: m.unread, count: 1 });
    }
    return { state: "ok", account: s.email, threads: [...byThread.values()] };
  } catch (e) {
    if (e instanceof Error && e.message === "not_connected") return { state: "not_connected" };
    console.error("inbox read failed", e);
    return { state: "error" };
  }
}
