"use client";

import type { Task } from "@/lib/focus/contracts/work";
import type { ServerCreate, ServerPatch, WorkPersonRow, WorkProjectRow } from "@/lib/focus/adapters/work";

/**
 * The business-scope link between the Focus store and the Mytiv Work API (`/api/[slug]/work/*`).
 * - Writes to one task run one after another; each sends the version the server last confirmed (never the UI's
 *   optimistic token), so the server's optimistic check sees exactly what this client last saw.
 * - Every write has its own request id. A network failure is retried with the SAME id — the server's ledger
 *   (`work_requests`) returns the recorded result if the first attempt did land, so a retry can never apply twice.
 *   If the outcome stays unknown, the task is read back and the user is told.
 * - The server is the truth: a success replaces the task with the server's copy; a conflict or a refusal puts the
 *   server's copy back and says why.
 */
export type RemoteNotice = { kind: "error" | "info"; title: string; detail?: string };
export type RemoteHandlers = {
  task: (task: Task) => void;
  created: (tempId: string, task: Task) => void;
  dropped: (tempId: string) => void;
  all: (data: { tasks: Task[]; people: WorkPersonRow[]; projects: WorkProjectRow[] }) => void;
  notice: (n: RemoteNotice) => void;
};

const REFUSAL: Record<string, string> = {
  blocked_by_dependency: "המשימה ממתינה למשימה שעוד פתוחה.", open_children: "יש לה תתי־משימות פתוחות.",
  parent_done: "משימת האב כבר הושלמה.", dependency_cycle: "התלות יוצרת מעגל.", dependency_self: "משימה לא יכולה לחכות לעצמה.",
  cross_project_dependency_not_supported: "תלות אפשרית רק בתוך אותו פרויקט.", cross_project_parent_not_supported: "תת־משימה חייבת להיות באותו פרויקט.",
  block_reason_required: "חסימה דורשת סיבה כתובה.", assignee_not_member: "האחראי אינו חבר פעיל בעסק.", start_after_due: "תאריך ההתחלה אחרי תאריך היעד.",
  not_member: "אין לך גישה לעסק הזה.", forbidden: "אין לך הרשאה לפעולה הזו.", not_found: "המשימה לא נמצאה.", nothing_to_update: "אין מה לעדכן.",
  request_conflict: "הבקשה כבר נרשמה עם תוכן אחר.", field_not_allowed: "השדה לא ניתן לעריכה כאן.", work_unavailable: "שירות המשימות לא זמין כרגע.",
};
export const refusalText = (code: string | undefined) => (code && REFUSAL[code]) ?? (code?.startsWith("invalid_") ? "ערך לא תקין." : "השרת סירב לשינוי.");

const RETRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class WorkRemote {
  private chains = new Map<string, Promise<unknown>>();
  private serverVersion = new Map<string, number>();
  private ids = new Map<string, string>(); // optimistic id → server id

  constructor(private slug: string, private h: RemoteHandlers, initial: Task[]) {
    for (const t of initial) this.serverVersion.set(t.id, Number(t.version));
  }

  private get base() { return `/api/${encodeURIComponent(this.slug)}/work/tasks`; }
  private realId(id: string) { return this.ids.get(id) ?? id; }
  private enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.chains.get(key) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    this.chains.set(key, next.catch(() => undefined));
    return next;
  }

  /** POST/PATCH with the same request id until the server answers (or the outcome stays unknown → null). */
  private async send(url: string, method: string, body: Record<string, unknown>): Promise<{ status: number; body: Record<string, unknown> } | null> {
    const payload = JSON.stringify({ ...body, requestId: crypto.randomUUID() });
    for (let i = 0; i < RETRIES; i++) {
      try {
        const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: payload });
        if (res.status >= 500 && i < RETRIES - 1) { await sleep(300 * (i + 1)); continue; }
        return { status: res.status, body: (await res.json().catch(() => ({}))) as Record<string, unknown> };
      } catch {
        await sleep(300 * (i + 1)); // network: the write may or may not have landed — the same id makes the retry safe
      }
    }
    return null;
  }

  private accept(task: Task) { this.serverVersion.set(task.id, Number(task.version)); this.h.task(task); }

  update(taskId: string, patch: ServerPatch): Promise<void> {
    return this.enqueue(taskId, async () => {
      const id = this.realId(taskId);
      const expectedVersion = this.serverVersion.get(id);
      if (!expectedVersion) { await this.refresh(); return; }
      const r = await this.send(`${this.base}/${id}`, "PATCH", { expectedVersion, patch });
      if (!r) { this.h.notice({ kind: "error", title: "לא ידוע אם השינוי נשמר", detail: "אין תשובה מהשרת. המשימה נטענת מחדש מהשרת." }); await this.refresh(); return; }
      const task = r.body.task as Task | undefined;
      if (r.status === 200 && task) { this.accept(task); return; }
      if (r.status === 409 && r.body.error === "version_conflict") {
        const current = r.body.current as Task | null | undefined;
        if (current) this.accept(current);
        this.h.notice({ kind: "error", title: "השינוי שלך לא נשמר", detail: "מישהו אחר עדכן את המשימה בינתיים. מוצגת הגרסה העדכנית — אפשר לנסות שוב." });
        return;
      }
      this.h.notice({ kind: "error", title: "השינוי לא נשמר", detail: refusalText(r.body.error as string | undefined) });
      await this.refresh();
    });
  }

  create(tempId: string, fields: ServerCreate): Promise<void> {
    return this.enqueue(tempId, async () => {
      const r = await this.send(this.base, "POST", { fields });
      const task = r?.body.task as Task | undefined;
      if (r && r.status === 200 && task) { this.ids.set(tempId, task.id); this.serverVersion.set(task.id, Number(task.version)); this.h.created(tempId, task); return; }
      if (!r) { this.h.notice({ kind: "error", title: "לא ידוע אם המשימה נוצרה", detail: "אין תשובה מהשרת. הרשימה נטענת מחדש." }); this.h.dropped(tempId); await this.refresh(); return; }
      this.h.notice({ kind: "error", title: "המשימה לא נוצרה", detail: refusalText(r.body.error as string | undefined) });
      this.h.dropped(tempId);
    });
  }

  /** Re-read everything (focus, interval, after an unknown outcome): others' changes appear, versions re-sync. */
  async refresh(): Promise<void> {
    try {
      const res = await fetch(this.base, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json() as { tasks: Task[]; people: WorkPersonRow[]; projects: WorkProjectRow[] };
      for (const t of data.tasks) this.serverVersion.set(t.id, Number(t.version));
      this.h.all(data);
    } catch { /* offline: keep what is shown; the next refresh re-syncs */ }
  }

  /** Writes still waiting for the server (the shell can say "שומר…"). */
  get pending() { return this.chains.size > 0; }
}
