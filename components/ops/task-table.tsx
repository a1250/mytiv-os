"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { parseRefKey, refKey, sameWorkRef, type StatusOptions, type TaskSourceCapabilities, type WorkItem, type WorkPerson } from "@/lib/work-source/types";
import { waitingOnLabel } from "@/lib/work-source/labels";
import { REVIEW_PROMPT, needsReviewConfirmation, statusChange } from "@/lib/ops-closure";

type Props = {
  businessSlug: string;
  projectId: string;
  tasks: WorkItem[];
  members: WorkPerson[];
  /** Allowed statuses per status scope (keyed by refKey) — the vocabulary can differ per scope. */
  statusOptions: StatusOptions;
  /** What the project's source supports (null: no source) — an action it does not declare is never offered. */
  capabilities: TaskSourceCapabilities | null;
  /** Members can look but not write; the server refuses anyway (403), this just says so up front. */
  readOnly?: boolean;
  emptyMessage: string;
};

/**
 * Live work rows (from whichever source holds the project) with inline status and assignee.
 *
 * Changes apply optimistically and roll back on rejection, because a work
 * board that pauses on every dropdown stops being used. Every outcome raises a
 * toast — a silent rollback is indistinguishable from a change that never
 * registered.
 */
/** An action is offered only if the source declares it AND the item belongs to that source (the write route is the source's own). */
function allowed(capabilities: TaskSourceCapabilities | null, task: WorkItem, action: "changeStatus" | "assign"): boolean {
  return Boolean(capabilities && capabilities.provider === task.ref.provider && capabilities[action]);
}

export function TaskTable({ businessSlug, projectId, tasks, members, statusOptions, capabilities, emptyMessage, readOnly = false }: Props) {
  const { toast } = useToast();
  const [rows, setRows] = React.useState(tasks);
  const activeRequests = React.useRef(new Set<string>());
  const [pending, setPending] = React.useState<Record<string, boolean>>({});

  // Adjust during render rather than in an effect: when the server sends a
  // fresh list after router.refresh(), the optimistic copy must be replaced
  // before paint, not one frame later.
  const [renderedFrom, setRenderedFrom] = React.useState(tasks);
  if (renderedFrom !== tasks) {
    setRenderedFrom(tasks);
    setRows(tasks);
  }

  async function patch(task: WorkItem, body: Record<string, unknown>, optimistic: Partial<WorkItem>, label: string) {
    // Rows, requests and pending state are keyed by provider+id; the write URL takes the source's own id.
    const key = refKey(task.ref), id = task.ref.id;
    if (activeRequests.current.has(key)) return;
    if (!window.confirm(`${label}? This will update ${task.sourceLabel}.`)) return;
    activeRequests.current.add(key);
    const before = task;
    setRows((prev) => prev.map((r) => (sameWorkRef(r.ref, task.ref) ? { ...r, ...optimistic } : r)));
    setPending((p) => ({ ...p, [key]: true }));
    try {
      const res = await fetch(`/api/${businessSlug}/ops/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // The marker this row was rendered from: the server refuses the write if the task moved on since.
        body: JSON.stringify({ ...body, projectId, confirmed: true, requestId: crypto.randomUUID(), expectedUpdatedAt: task.concurrencyToken }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "unknown" }));
        if (error === "task_changed_since_read") throw new Error(`the task changed in ${task.sourceLabel} since it was loaded — refresh and try again`);
        throw new Error(error);
      }
      toast({ message: label, href: task.sourceLink?.href, tone: "ok" });
    } catch (err) {
      setRows(prev => prev.map(row => sameWorkRef(row.ref, task.ref) ? before : row));
      const reason = err instanceof Error ? err.message : "unknown";
      toast({
        message:
          reason === `${task.ref.provider}_rate_limited`
            ? `${task.sourceLabel} rate limit — the change was not saved.`
            : `Could not update in ${task.sourceLabel} (${reason}). Change reverted.`,
        tone: "error",
      });
    } finally {
      activeRequests.current.delete(key);
      setPending((p) => ({ ...p, [key]: false }));
    }
  }

  function onStatus(task: WorkItem, status: string) {
    if (!allowed(capabilities, task, "changeStatus") || status === task.statusLabel) return;
    const evidenceUrl = window.prompt('For closing: paste the exact attached recording URL you have reviewed. Otherwise leave blank.', '');
    if (evidenceUrl === null) return;
    // A URL is not a review. The reviewed flag comes only from this second, explicit answer;
    // declining aborts here, and the server refuses a closing status without it regardless.
    let reviewConfirmed = false;
    if (needsReviewConfirmation(evidenceUrl)) {
      reviewConfirmed = window.confirm(REVIEW_PROMPT);
      if (!reviewConfirmed) {
        toast({ message: "Not sent — closing needs the recording to be reviewed first.", tone: "error" });
        return;
      }
    }
    // The new status's meaning comes from the source's own options for this scope; absent there, it is unknown.
    const category = statusOptions[refKey(task.statusScope)]?.find((s) => s.label === status)?.category ?? "unknown";
    patch(task, statusChange(status, evidenceUrl, reviewConfirmed), { statusLabel: status, statusCategory: category }, `Status set to “${status}”`);
  }

  function onAssignee(task: WorkItem, raw: string) {
    if (!allowed(capabilities, task, "assign")) return;
    const nextRef = raw ? parseRefKey(raw) : null;
    if (raw && !nextRef) return;
    if (nextRef ? sameWorkRef(nextRef, task.assignee?.ref) : !task.assignee) return;
    const member = nextRef ? members.find((m) => sameWorkRef(m.ref, nextRef)) ?? null : null;
    if (nextRef && !member) return;
    patch(
      task,
      // Neutral person refs ({provider, id}); the source's own route turns them back into its ids.
      { assignee: { add: nextRef ? [nextRef] : [], rem: task.assignee ? [task.assignee.ref] : [] } },
      { assignee: member },
      member ? `Assigned to ${member.name}` : "Assignee cleared"
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-card border-border text-muted-foreground rounded-xl border px-6 py-10 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((task) => {
        const statuses = statusOptions[refKey(task.statusScope)] ?? (task.statusLabel ? [{ label: task.statusLabel, category: task.statusCategory }] : []);
        const busy = pending[refKey(task.ref)];
        return (
          <div
            key={refKey(task.ref)}
            className={cn(
              "bg-card border-border rounded-xl border p-3.5 transition-opacity",
              busy && "opacity-60"
            )}
          >
            <div className="flex items-start gap-2">
              <span className="flex-1 text-sm leading-snug font-medium">{task.title}</span>
              {task.sourceLink && (
                <a
                  href={task.sourceLink.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open in ${task.sourceLink.label}`}
                  className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={task.statusLabel}
                disabled={busy || readOnly || !allowed(capabilities, task, "changeStatus")}
                title={readOnly ? "Owners and admins only" : undefined}
                onChange={(e) => onStatus(task, e.target.value)}
                aria-label="Status"
                className="border-border bg-muted text-foreground rounded-lg border px-2 py-1 text-xs"
              >
                {statuses.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                value={task.assignee ? refKey(task.assignee.ref) : ""}
                disabled={busy || readOnly || !allowed(capabilities, task, "assign")}
                title={readOnly ? "Owners and admins only" : undefined}
                onChange={(e) => onAssignee(task, e.target.value)}
                aria-label="Assignee"
                className="border-border bg-muted text-foreground rounded-lg border px-2 py-1 text-xs"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={refKey(m.ref)} value={refKey(m.ref)}>
                    {m.name}
                  </option>
                ))}
              </select>

              {task.statusCategory === "unknown" && (
                <Badge title="This status has no agreed meaning yet — it is not counted as done or as active work">Unmapped status</Badge>
              )}
              {task.daysIdle >= 3 && <Badge variant="stuck">{task.daysIdle}d idle</Badge>}
              {task.dueDate ? (
                task.overdue ? (
                  <Badge variant="overdue">Due {task.dueDate}</Badge>
                ) : (
                  <Badge>Due {task.dueDate}</Badge>
                )
              ) : (
                <Badge>No date</Badge>
              )}
              {task.waitingOn && <Badge variant="active">Blocked on {waitingOnLabel(task.waitingOn)}</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
