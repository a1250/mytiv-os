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
import {
  BLOCKED_ON_FIELD,
  BLOCKED_ON_VALUES,
  classifyList,
  type BlockedOn,
  type ClientFolder,
} from "./ops-config";

const API = "https://api.clickup.com/api/v2";
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
  /** YYYY-MM-DD, or null when nobody committed to a date. */
  dueDate: string | null;
  overdue: boolean;
  /** ISO timestamp of the last ClickUp update. */
  updatedAt: string;
  daysIdle: number;
  blockedOn: BlockedOn | null;
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
async function get<T>(path: string, params?: URLSearchParams): Promise<T> {
  const url = `${API}${path}${params && [...params].length ? `?${params}` : ""}`;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as T;

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

type RawTask = {
  id: string;
  name: string;
  url?: string;
  status?: { status?: string; type?: string };
  priority?: { priority?: string } | null;
  assignees?: { id: number; username?: string; email?: string }[];
  due_date?: string | null;
  date_updated?: string | null;
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
    dueDate,
    overdue: Boolean(dueDate && dueDate < today),
    updatedAt: updatedMs ? new Date(updatedMs).toISOString() : "",
    daysIdle: updatedMs ? Math.floor((now - updatedMs) / DAY_MS) : 0,
    blockedOn: readBlockedOn(raw.custom_fields),
    isBug: kind === "bugs",
    isDecision: kind === "decisions",
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Every open task in one folder, following pagination to the end. */
export async function getTasksByFolder(
  folder: ClientFolder,
  filters: { includeClosed?: boolean } = {}
): Promise<OpsTask[]> {
  const now = Date.now();
  const out: OpsTask[] = [];

  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({
      page: String(page),
      subtasks: "true",
      include_closed: String(Boolean(filters.includeClosed)),
    });
    params.append("project_ids[]", folder.clickupFolderId);

    const data = await get<{ tasks?: RawTask[]; last_page?: boolean }>(`/team/${workspaceId()}/task`, params);
    for (const raw of data.tasks ?? []) out.push(normalise(raw, folder, now));
    if (data.last_page !== false || !data.tasks?.length) break;
  }

  return out;
}

/**
 * Open *work* across every configured client folder — one fetch per folder.
 * Decision-log entries are excluded: see `OpsTask.isDecision`.
 */
export async function getOpenTasks(folders: ClientFolder[]): Promise<OpsTask[]> {
  const perFolder = await Promise.all(folders.map((f) => getTasksByFolder(f)));
  return perFolder.flat().filter((t) => !t.isDecision);
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
  return get<RawTask>(`/task/${taskId}`);
}

export async function getWorkspaceHierarchy() {
  return get<{ spaces?: unknown[] }>(`/team/${workspaceId()}/space`, new URLSearchParams({ archived: "false" }));
}

/** Phase 4 input. Returns zero hours until the contractors actually log time. */
export async function getTimeEntries(
  folder: ClientFolder,
  range: { from: Date; to: Date }
): Promise<TimeEntrySummary> {
  const params = new URLSearchParams({
    start_date: String(range.from.getTime()),
    end_date: String(range.to.getTime()),
    folder_id: folder.clickupFolderId,
  });
  const data = await get<{ data?: { duration?: string | number }[] }>(
    `/team/${workspaceId()}/time_entries`,
    params
  );
  const ms = (data.data ?? []).reduce((sum, e) => sum + Number(e.duration ?? 0), 0);
  return { clientKey: folder.key, hours: ms / 3_600_000 };
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

export async function updateTask(
  taskId: string,
  patch: { status?: string; assignees?: { add?: number[]; rem?: number[] }; due_date?: number }
) {
  const res = await send<RawTask>("PUT", `${API}/task/${taskId}`, patch);
  invalidate();
  return res;
}

export async function addComment(taskId: string, text: string) {
  const res = await send<{ id: string }>("POST", `${API}/task/${taskId}/comment`, {
    comment_text: text,
    notify_all: false,
  });
  invalidate();
  return res;
}
