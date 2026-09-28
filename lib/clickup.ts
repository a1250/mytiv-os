/**
 * The only place in the app that talks to ClickUp.
 *
 * ClickUp is the source of truth for tasks — nothing is mirrored locally and
 * there is no sync job. Everything above this file works with the normalised
 * `OpsTask` type below and never sees a ClickUp field name.
 *
 * Reads are cached for 60 seconds. ClickUp's rate limit is real and its reset
 * window is measured in hours, not seconds, so a 429 is surfaced as a typed
 * error for the UI to explain rather than retried into the ground.
 */
import "server-only";
import { OpsPolicyError } from "./ops-policy";
import {
  BLOCKED_ON_FIELD,
  BLOCKED_ON_VALUES,
  classifyList,
  type BlockedOn,
  type ClientFolder,
  type ListKind,
} from "./ops-config";

/**
 * Staging only: point the whole transport at a local stand-in (scripts/staging/clickup-mock.mjs)
 * so a full HTTP/browser verification never reaches a real client task. Unset = the real API.
 */
const API = process.env.CLICKUP_API_BASE?.replace(/\/$/, "") || "https://api.clickup.com/api/v2";
const CACHE_TTL_MS = 60_000;
const DAY_MS = 86_400_000;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ClickUpConfigError extends Error {}

export class ClickUpRateLimitError extends Error {
  constructor(public retryAfterSeconds: number | null) {
    super("ClickUp rate limit reached");
  }
}

export class ClickUpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * The PUT was sent — and may well have landed — but the read-back did not confirm it. This is
 * the one failure the audit log must distinguish from "nothing was written": the caller records
 * it as unknown-after-write, and rollback refuses it because there is no verified post-state.
 */
export class ClickUpWriteUnverifiedError extends ClickUpError {
  constructor(message: string) { super(502, message); }
}

// ---------------------------------------------------------------------------
// Normalised types — the app's vocabulary, not ClickUp's
// ---------------------------------------------------------------------------

export type TaskPriority = "urgent" | "high" | "normal" | "low" | null;

export type OpsTask = {
  id: string;
  url: string;
  title: string;
  /** Raw ClickUp status name, e.g. "to do", "submit for review". */
  status: string;
  /** ClickUp's own classification: "open" | "closed" | "custom" | "done". */
  statusType: string;
  priority: TaskPriority;
  assignee: { id: number; name: string } | null;
  clientKey: string;
  clientLabel: string;
  listId: string;
  listName: string;
  /** What the list means: work, a production bug, a decision, or unrecognised. */
  listKind: ListKind;
  /** YYYY-MM-DD, or null when nobody committed to a date. */
  dueDate: string | null;
  overdue: boolean;
  /** ISO timestamp of the last ClickUp update. */
  updatedAt: string;
  daysIdle: number;
  blockedOn: BlockedOn | null;
  /** Estimate in hours, or null when nobody set one. */
  estimateHours: number | null;
  /** True when the task lives in the folder's תקלות list. */
  isBug: boolean;
  /**
   * True when the row is a decision-log entry rather than work.
   *
   * A decision is a record, not a task: it has no owner and no due date, and
   * it is never "touched" again. Counted as work it would inflate the open
   * count and — worse — every decision would turn up as stuck a few days
   * after it was written. Filtered out of the Ops view by getOpenTasks.
   */
  isDecision: boolean;
};

export type OpsStats = {
  stuck: number;
  overdue: number;
  openTasks: number;
  openBugs: number;
};

/**
 * A folder's tasks plus whether the read stopped at the 20-page cap before ClickUp
 * signalled the last page. `incomplete: true` means the list is short by an unknown
 * amount — callers must show "—", never a partial count (MKT-INT06).
 */
export type FolderTasks = { tasks: OpsTask[]; incomplete: boolean };

export type TimeEntrySummary = {
  clientKey: string;
  hours: number;
};

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

function token(): string {
  const t = process.env.CLICKUP_API_TOKEN;
  if (!t) {
    throw new ClickUpConfigError(
      "CLICKUP_API_TOKEN is not set. Add it to .env.local — server-side only, never NEXT_PUBLIC_*."
    );
  }
  return t;
}

function workspaceId(): string {
  const id = process.env.CLICKUP_WORKSPACE_ID;
  if (!id) throw new ClickUpConfigError("CLICKUP_WORKSPACE_ID is not set.");
  return id;
}

type CacheEntry = { at: number; value: unknown };
const cache = new Map<string, CacheEntry>();

/** Cached GET. Writes bypass this entirely — see `send`. */
async function get<T>(path: string, params?: URLSearchParams, fresh = false): Promise<T> {
  const url = `${API}${path}${params && [...params].length ? `?${params}` : ""}`;
  const hit = cache.get(url);
  if (!fresh && hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as T;

  const value = await send<T>("GET", url);
  cache.set(url, { at: Date.now(), value });
  return value;
}

async function send<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: token(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (res.status === 429) {
    const retry = res.headers.get("retry-after") ?? res.headers.get("x-ratelimit-reset");
    throw new ClickUpRateLimitError(retry ? Number(retry) : null);
  }
  if (!res.ok) {
    throw new ClickUpError(res.status, `ClickUp ${method} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

/** Any write invalidates the read cache — a stale board after a write is worse than a slow one. */
function invalidate() {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Raw ClickUp shapes (only this file knows them)
// ---------------------------------------------------------------------------

type RawCustomField = {
  name?: string;
  type?: string;
  value?: unknown;
  type_config?: { options?: { id?: string; name?: string; orderindex?: number }[] };
};

export type RawTask = {
  id: string;
  name: string;
  url?: string;
  status?: { status?: string; type?: string };
  priority?: { priority?: string } | null;
  assignees?: { id: number; username?: string; email?: string }[];
  due_date?: string | null;
  date_updated?: string | null;
  /** Milliseconds, per the v2 API — not minutes. */
  time_estimate?: number | string | null;
  list?: { id?: string; name?: string };
  custom_fields?: RawCustomField[];
};

function readBlockedOn(fields: RawCustomField[] | undefined): BlockedOn | null {
  const field = fields?.find((f) => f.name?.trim().toLowerCase() === BLOCKED_ON_FIELD.toLowerCase());
  if (!field || field.value === undefined || field.value === null || field.value === "") return null;

  const options = field.type_config?.options ?? [];
  const match =
    options.find((o) => o.id === field.value) ??
    options.find((o) => String(o.orderindex) === String(field.value));

  const label = (match?.name ?? String(field.value)).trim();
  return BLOCKED_ON_VALUES.find((v) => v.toLowerCase() === label.toLowerCase()) ?? null;
}

function toIsoDate(ms: string | null | undefined): string | null {
  if (!ms) return null;
  const n = Number(ms);
  if (!Number.isFinite(n)) return null;
  return new Date(n).toISOString().slice(0, 10);
}

function normalise(raw: RawTask, folder: ClientFolder, now: number): OpsTask {
  const updatedMs = Number(raw.date_updated ?? 0);
  const dueDate = toIsoDate(raw.due_date);
  const today = new Date(now).toISOString().slice(0, 10);
  const listName = raw.list?.name?.trim() ?? "";
  const kind = classifyList(listName);
  const first = raw.assignees?.[0];

  return {
    id: raw.id,
    url: raw.url ?? `https://app.clickup.com/t/${raw.id}`,
    title: raw.name,
    status: raw.status?.status ?? "",
    statusType: raw.status?.type ?? "open",
    priority: (raw.priority?.priority as TaskPriority) ?? null,
    assignee: first ? { id: first.id, name: first.username ?? first.email ?? String(first.id) } : null,
    clientKey: folder.key,
    clientLabel: folder.label,
    listId: raw.list?.id ?? "",
    listName,
    listKind: kind,
    dueDate,
    overdue: Boolean(dueDate && dueDate < today),
    updatedAt: updatedMs ? new Date(updatedMs).toISOString() : "",
    daysIdle: updatedMs ? Math.floor((now - updatedMs) / DAY_MS) : 0,
    blockedOn: readBlockedOn(raw.custom_fields),
    estimateHours: Number(raw.time_estimate) > 0 ? Number(raw.time_estimate) / 3_600_000 : null,
    isBug: kind === "bugs",
    isDecision: kind === "decisions",
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Every open task in one folder, following pagination to the end. */
/**
 * `fresh` bypasses the 60s read cache. The cache is per process: a write handled by one
 * instance does not invalidate another's copy, so the one screen that writes (the client
 * workspace) reads fresh — otherwise a reload right after a write can show the old status,
 * and the next write would be refused as "changed since read" against a marker that was
 * never current. Dashboards that only read keep the cache.
 */
export async function getTasksByFolderWithCompleteness(
  folder: ClientFolder,
  filters: { includeClosed?: boolean; fresh?: boolean } = {}
): Promise<FolderTasks> {
  const now = Date.now();
  const out: OpsTask[] = [];
  // Stays true only if the loop exhausts the 20-page cap without ClickUp ever
  // signalling a last page — i.e. there was more we did not read.
  let incomplete = true;

  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({
      page: String(page),
      subtasks: "true",
      include_closed: String(Boolean(filters.includeClosed)),
    });
    params.append("project_ids[]", folder.clickupFolderId);

    const data = await get<{ tasks?: RawTask[]; last_page?: boolean }>(`/team/${workspaceId()}/task`, params, Boolean(filters.fresh));
    for (const raw of data.tasks ?? []) out.push(normalise(raw, folder, now));
    if (data.last_page !== false || !data.tasks?.length) { incomplete = false; break; }
  }

  return { tasks: out, incomplete };
}

/**
 * Backward-compatible array form for callers that do not surface completeness
 * (the AI copilot and CLI checks). Screens that show counts use
 * `getTasksByFolderWithCompleteness` so they can render "—" when truncated.
 */
export async function getTasksByFolder(
  folder: ClientFolder,
  filters: { includeClosed?: boolean; fresh?: boolean } = {}
): Promise<OpsTask[]> {
  return (await getTasksByFolderWithCompleteness(folder, filters)).tasks;
}

/**
 * Open *work* across every configured client folder — one fetch per folder.
 * Decision-log entries are excluded: see `OpsTask.isDecision`.
 */
export async function getOpenTasksWithCompleteness(folders: ClientFolder[]): Promise<FolderTasks> {
  const perFolder = await Promise.all(folders.map((f) => getTasksByFolderWithCompleteness(f)));
  return {
    tasks: perFolder.flatMap((r) => r.tasks).filter((t) => !t.isDecision),
    incomplete: perFolder.some((r) => r.incomplete),
  };
}

export async function getOpenTasks(folders: ClientFolder[]): Promise<OpsTask[]> {
  return (await getOpenTasksWithCompleteness(folders)).tasks;
}

/**
 * Tasks nobody has touched in `thresholdDays`, worst first.
 *
 * Idleness is measured by ClickUp's `date_updated`, which is why "blocked" is a
 * status and not a separate list: moving a task between lists counts as an
 * update, so a parked task would look freshly touched and quietly drop off
 * this screen — the exact opposite of what it is for.
 *
 * Phase 1 backlog — a signal that survives bulk moves. The 2026-08-11
 * migration into the client folders reset `date_updated` on every task at
 * once: rows created in June read as minutes old, and this screen was blind
 * for three days. GET /task/{id}/time_in_status is not affected by a move,
 * but costs one request per task instead of one per folder, so it needs a
 * cheaper shape than the current fan-out before it can replace this.
 */
export async function getStuckTasks(folders: ClientFolder[], thresholdDays: number): Promise<OpsTask[]> {
  const open = await getOpenTasks(folders);
  return open.filter((t) => t.daysIdle >= thresholdDays).sort((a, b) => b.daysIdle - a.daysIdle);
}

export function statsFor(open: OpsTask[], thresholdDays: number): OpsStats {
  return {
    stuck: open.filter((t) => t.daysIdle >= thresholdDays).length,
    overdue: open.filter((t) => t.overdue).length,
    openTasks: open.filter((t) => !t.isBug).length,
    openBugs: open.filter((t) => t.isBug).length,
  };
}

export async function getTask(taskId: string): Promise<RawTask> {
  return get<RawTask>(`/task/${encodeURIComponent(taskId)}`, undefined, true);
}

export type TaskEvidence = {
  taskId: string;
  title: string;
  status: string;
  comments: { author: string; text: string }[];
  attachments: { title: string; url: string; mimetype: string }[];
  /** Links that look like a screen recording, from either comments or attachments. */
  recordings: string[];
};

/** Anything that plausibly *is* a screen recording, rather than a link to a doc. */
const RECORDING_PATTERNS = [
  /https?:\/\/[^\s)>"']*loom\.com\/[^\s)>"']+/gi,
  /https?:\/\/[^\s)>"']*(?:youtube\.com|youtu\.be)\/[^\s)>"']+/gi,
  /https?:\/\/[^\s)>"']*drive\.google\.com\/[^\s)>"']+/gi,
  /https?:\/\/[^\s)>"']*(?:vimeo\.com|screen\.studio|veed\.io|awesomescreenshot\.com)\/[^\s)>"']+/gi,
  /https?:\/\/[^\s)>"']+\.(?:mp4|mov|webm|m4v)(?:\?[^\s)>"']*)?/gi,
];

function findRecordings(text: string): string[] {
  const out: string[] = [];
  for (const pattern of RECORDING_PATTERNS) {
    for (const match of text.matchAll(pattern)) out.push(match[0]);
  }
  return out;
}

/**
 * Everything attached to a task that could serve as proof a fix actually works.
 *
 * The standing rule is that nothing closes without a screen recording, so this
 * gathers the raw material and lets the caller judge — it deliberately does not
 * decide "verified", because a link that merely looks like a recording is not
 * the same as one that shows the fix.
 */
export async function getTaskEvidence(taskId: string): Promise<TaskEvidence> {
  const [task, commentData] = await Promise.all([
    get<RawTask & { attachments?: { title?: string; url?: string; mimetype?: string }[] }>(`/task/${encodeURIComponent(taskId)}`, undefined, true),
    get<{ comments?: { comment_text?: string; user?: { username?: string } }[] }>(`/task/${encodeURIComponent(taskId)}/comment`, undefined, true),
  ]);

  const comments = (commentData.comments ?? []).map((c) => ({
    author: c.user?.username ?? "unknown",
    text: (c.comment_text ?? "").trim(),
  }));

  const attachments = (task.attachments ?? []).map((a) => ({
    title: a.title ?? "",
    url: a.url ?? "",
    mimetype: a.mimetype ?? "",
  }));

  const recordings = [
    ...comments.flatMap((c) => findRecordings(c.text)),
    ...attachments.filter((a) => a.mimetype.startsWith("video/")).map((a) => a.url),
    ...attachments.flatMap((a) => findRecordings(a.url)),
  ].filter((url, i, all) => url && all.indexOf(url) === i);

  return {
    taskId,
    title: task.name,
    status: task.status?.status ?? "",
    comments,
    attachments,
    recordings,
  };
}

/** The lists inside a folder, keyed by kind — where a new task or decision goes. */
export async function resolveListId(folder: ClientFolder, kind: "tasks" | "bugs" | "decisions") {
  const lists = await getFolderLists(folder);
  return lists.find((l) => l.kind === kind)?.id ?? null;
}

export type FolderList = { id: string; name: string; kind: ListKind; statuses: string[]; statusTypes: Record<string, string> };

/**
 * The lists inside a client folder, with the statuses each one allows.
 * One request per folder — the Tasks tab needs the status vocabulary before it
 * can offer a dropdown, and ClickUp defines statuses per list, not globally.
 */
export async function getFolderLists(folder: ClientFolder): Promise<FolderList[]> {
  const data = await get<{
    lists?: { id: string; name: string; statuses?: { status?: string; type?: string }[] }[];
  }>(`/folder/${folder.clickupFolderId}/list`, new URLSearchParams({ archived: "false" }), true);

  return (data.lists ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    kind: classifyList(l.name),
    statuses: (l.statuses ?? []).map((s) => s.status ?? "").filter(Boolean),
    statusTypes: Object.fromEntries((l.statuses ?? []).map((s) => [s.status ?? "", s.type ?? "unknown"])),
  }));
}

export type WorkspaceMember = { id: number; name: string };

/** Assignee options for the Tasks tab. Cached like every other read. */
export async function getWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const data = await get<{
    teams?: { id: string; members?: { user?: { id: number; username?: string; email?: string } }[] }[];
  }>("/team");
  const team = data.teams?.find((t) => t.id === workspaceId());
  return (team?.members ?? [])
    .map((m) => m.user)
    .filter((u): u is { id: number; username?: string; email?: string } => Boolean(u?.id))
    .map((u) => ({ id: u.id, name: u.username ?? u.email ?? String(u.id) }));
}

export async function getWorkspaceHierarchy() {
  return get<{ spaces?: unknown[] }>(`/team/${workspaceId()}/space`, new URLSearchParams({ archived: "false" }));
}

/** Returns zero hours until the contractors actually log time. */
export async function getTimeEntries(
  folder: ClientFolder,
  range: { from: Date; to: Date }
): Promise<TimeEntrySummary> {
  const { totalHours } = await getTimeByTask(folder, range);
  return { clientKey: folder.key, hours: totalHours };
}

export type TaskTime = { taskId: string; taskName: string; hours: number };

/**
 * Logged time for one folder, rolled up per task.
 *
 * Per-task is what makes systematic under-estimation visible; the total alone
 * only tells you the bill. Returns zeros — not an error — when nobody has
 * tracked time, which is the current state of this workspace.
 */
export async function getTimeByTask(
  folder: ClientFolder,
  range: { from: Date; to: Date }
): Promise<{ totalHours: number; perTask: TaskTime[] }> {
  const members = await getWorkspaceMembers();
  if (!members.length) throw new ClickUpConfigError("Workspace members unavailable; time coverage is unknown.");
  const params = new URLSearchParams({
    assignee: members.map(m => m.id).join(","),
    start_date: String(range.from.getTime()),
    end_date: String(range.to.getTime()),
    folder_id: folder.clickupFolderId,
  });
  const data = await get<{
    data?: { duration?: string | number; task?: { id?: string; name?: string } }[];
  }>(`/team/${workspaceId()}/time_entries`, params);

  const byTask = new Map<string, TaskTime>();
  let totalMs = 0;

  for (const entry of data.data ?? []) {
    const ms = Number(entry.duration ?? 0);
    if (!Number.isFinite(ms) || ms <= 0) continue;
    totalMs += ms;
    const id = entry.task?.id ?? "(no task)";
    const existing = byTask.get(id);
    if (existing) existing.hours += ms / 3_600_000;
    else byTask.set(id, { taskId: id, taskName: entry.task?.name ?? "(not attached to a task)", hours: ms / 3_600_000 });
  }

  return {
    totalHours: totalMs / 3_600_000,
    perTask: [...byTask.values()].sort((a, b) => b.hours - a.hours),
  };
}

// ---------------------------------------------------------------------------
// Writes — unused in Phase 0, and never called without a confirmed preview
// ---------------------------------------------------------------------------

export async function createTask(
  listId: string,
  payload: { name: string; assignees?: number[]; due_date?: number; time_estimate?: number; markdown_description?: string }
) {
  const res = await send<RawTask>("POST", `${API}/list/${listId}/task`, payload);
  invalidate();
  return res;
}

export type UpdateTaskPatch = { status?: string; assignees?: { add?: number[]; rem?: number[] }; due_date?: number | null };

/**
 * A governed write, bracketed by two fresh reads.
 *
 * `pre` is the task as it stood the instant before the PUT; `post` is the verification read
 * after it. Both are returned so the audit log can keep them. When the caller says which
 * `date_updated` it looked at (`expectedDateUpdated`), a task that has moved on since is
 * refused before anything is written — nobody's newer work gets overwritten on the strength
 * of a stale screen. `undefined` means the caller made no such claim; `null` means "I saw a
 * task with no marker".
 */
export async function updateTask(
  taskId: string,
  patch: UpdateTaskPatch,
  opts: { expectedDateUpdated?: string | null; onPre?: (pre: RawTask) => void } = {}
): Promise<{ raw: RawTask; pre: RawTask; post: RawTask }> {
  const pre = await getTask(taskId);
  opts.onPre?.(pre);
  if (opts.expectedDateUpdated !== undefined) {
    const now = pre.date_updated == null ? null : String(pre.date_updated);
    if (now !== opts.expectedDateUpdated) throw new OpsPolicyError("task_changed_since_read", 409);
  }
  const res = await send<RawTask>("PUT", `${API}/task/${encodeURIComponent(taskId)}`, patch);
  invalidate();
  let post: RawTask;
  try { post = await getTask(taskId); }
  catch (err) { throw new ClickUpWriteUnverifiedError(err instanceof Error ? err.message : "verification read failed"); }
  if (patch.status && post.status?.status !== patch.status) throw new ClickUpWriteUnverifiedError('Update outcome could not be verified; check ClickUp before retry.');
  const assigned = new Set((post.assignees ?? []).map(a => a.id));
  if (patch.assignees?.add?.some(id => !assigned.has(id)) || patch.assignees?.rem?.some(id => assigned.has(id))) throw new ClickUpWriteUnverifiedError('Assignee outcome could not be verified; check ClickUp before retry.');
  if (patch.due_date !== undefined) {
    const landed = post.due_date == null || post.due_date === "" ? null : Number(post.due_date);
    if (landed !== patch.due_date) throw new ClickUpWriteUnverifiedError('Due date outcome could not be verified; check ClickUp before retry.');
  }
  return { raw: res, pre, post };
}

export async function addComment(taskId: string, text: string) {
  const res = await send<{ id: string }>("POST", `${API}/task/${taskId}/comment`, {
    comment_text: text,
    notify_all: false,
  });
  invalidate();
  return res;
}
