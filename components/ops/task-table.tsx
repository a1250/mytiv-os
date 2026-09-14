"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { OpsTask } from "@/lib/clickup";
import type { WorkspaceMember } from "@/lib/clickup";
import { REVIEW_PROMPT, needsReviewConfirmation, statusChange } from "@/lib/ops-closure";

type Props = {
  businessSlug: string;
  projectId: string;
  tasks: OpsTask[];
  members: WorkspaceMember[];
  /** Allowed statuses per ClickUp list id — the vocabulary differs per list. */
  statusesByList: Record<string, string[]>;
  emptyMessage: string;
};

/**
 * Live ClickUp rows with inline status and assignee.
 *
 * Changes apply optimistically and roll back on rejection, because a work
 * board that pauses on every dropdown stops being used. Every outcome raises a
 * toast — a silent rollback is indistinguishable from a change that never
 * registered.
 */
export function TaskTable({ businessSlug, projectId, tasks, members, statusesByList, emptyMessage }: Props) {
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

  async function patch(task: OpsTask, body: Record<string, unknown>, optimistic: Partial<OpsTask>, label: string) {
    if (activeRequests.current.has(task.id)) return;
    if (!window.confirm(`${label}? This will update ClickUp.`)) return;
    activeRequests.current.add(task.id);
    const before = task;
    setRows((prev) => prev.map((r) => (r.id === task.id ? { ...r, ...optimistic } : r)));
    setPending((p) => ({ ...p, [task.id]: true }));
    try {
      const res = await fetch(`/api/${businessSlug}/ops/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // The marker this row was rendered from: the server refuses the write if the task moved on since.
        body: JSON.stringify({ ...body, projectId, confirmed: true, requestId: crypto.randomUUID(), expectedUpdatedAt: task.updatedAt }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "unknown" }));
        if (error === "task_changed_since_read") throw new Error("the task changed in ClickUp since it was loaded — refresh and try again");
        throw new Error(error);
      }
      toast({ message: label, href: task.url, tone: "ok" });
    } catch (err) {
      setRows(prev => prev.map(row => row.id === task.id ? before : row));
      const reason = err instanceof Error ? err.message : "unknown";
      toast({
        message:
          reason === "clickup_rate_limited"
            ? "ClickUp rate limit — the change was not saved."
            : `Could not update in ClickUp (${reason}). Change reverted.`,
        tone: "error",
      });
    } finally {
      activeRequests.current.delete(task.id);
      setPending((p) => ({ ...p, [task.id]: false }));
    }
  }

  function onStatus(task: OpsTask, status: string) {
    if (status === task.status) return;
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
    patch(task, statusChange(status, evidenceUrl, reviewConfirmed), { status }, `Status set to “${status}”`);
  }

  function onAssignee(task: OpsTask, raw: string) {
    const nextId = raw ? Number(raw) : null;
    if (nextId === (task.assignee?.id ?? null)) return;
    const member = members.find((m) => m.id === nextId) ?? null;
    patch(
      task,
      { assignee: { add: nextId ? [nextId] : [], rem: task.assignee ? [task.assignee.id] : [] } },
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
        const statuses = statusesByList[task.listId] ?? (task.status ? [task.status] : []);
        const busy = pending[task.id];
        return (
          <div
            key={task.id}
            className={cn(
              "bg-card border-border rounded-xl border p-3.5 transition-opacity",
              busy && "opacity-60"
            )}
          >
            <div className="flex items-start gap-2">
              <span className="flex-1 text-sm leading-snug font-medium">{task.title}</span>
              <a
                href={task.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Open in ClickUp"
                className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={task.status}
                disabled={busy}
                onChange={(e) => onStatus(task, e.target.value)}
                aria-label="Status"
                className="border-border bg-muted text-foreground rounded-lg border px-2 py-1 text-xs"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={task.assignee?.id ?? ""}
                disabled={busy}
                onChange={(e) => onAssignee(task, e.target.value)}
                aria-label="Assignee"
                className="border-border bg-muted text-foreground rounded-lg border px-2 py-1 text-xs"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

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
              {task.blockedOn && <Badge variant="active">Blocked on {task.blockedOn}</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
