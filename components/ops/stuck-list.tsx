import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { refKey, type WorkItem } from "@/lib/work-source/types";
import { waitingOnLabel } from "@/lib/work-source/labels";

function IdleCell({ days }: { days: number }) {
  return (
    <span className="text-warning font-semibold tabular-nums">
      {days}d
    </span>
  );
}

function DueCell({ task }: { task: WorkItem }) {
  if (!task.dueDate) return <span className="text-muted-foreground">No date</span>;
  return task.overdue ? (
    <span className="text-danger font-medium tabular-nums">{task.dueDate}</span>
  ) : (
    <span className="tabular-nums">{task.dueDate}</span>
  );
}

function BlockedCell({ task }: { task: WorkItem }) {
  if (!task.waitingOn) return <span className="text-muted-foreground">—</span>;
  return <Badge variant={task.waitingOn === "internal" ? "active" : "neutral"}>{waitingOnLabel(task.waitingOn)}</Badge>;
}

/**
 * Desktop: a compact table. Phone: one card per task — a six-column table on a
 * 375px screen is not a work tool, and this screen is read on a phone daily.
 */
export function StuckList({ tasks }: { tasks: WorkItem[] }) {
  return (
    <>
      {/* Desktop */}
      <div className="border-border bg-card hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border text-muted-foreground border-b text-left text-xs">
              <th className="px-4 py-2.5 font-medium">Task</th>
              <th className="px-3 py-2.5 font-medium">Client</th>
              <th className="px-3 py-2.5 font-medium">Assignee</th>
              <th className="px-3 py-2.5 font-medium">Idle</th>
              <th className="px-3 py-2.5 font-medium">Blocked on</th>
              <th className="px-3 py-2.5 font-medium">Due</th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={refKey(task.ref)} className="border-border/60 hover:bg-muted/40 border-b transition-colors last:border-0">
                <td className="max-w-md px-4 py-3">
                  <div className="truncate font-medium" title={task.title}>
                    {task.title}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {task.groupLabel} · {task.statusLabel}
                    {task.statusCategory === "unknown" && " (unmapped status)"}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">{task.projectLabel}</td>
                <td className="text-muted-foreground px-3 py-3 whitespace-nowrap">
                  {task.assignee?.name ?? "Unassigned"}
                </td>
                <td className="px-3 py-3">
                  <IdleCell days={task.daysIdle} />
                </td>
                <td className="px-3 py-3">
                  <BlockedCell task={task} />
                </td>
                <td className="px-3 py-3 text-xs whitespace-nowrap">
                  <DueCell task={task} />
                </td>
                <td className="px-3 py-3">
                  {task.sourceLink && (
                    <a
                      href={task.sourceLink.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground inline-flex transition-colors"
                      aria-label={`Open ${task.title} in ${task.sourceLink.label}`}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone */}
      <ul className="flex flex-col gap-2 md:hidden">
        {tasks.map((task) => (
          <li key={refKey(task.ref)} className="bg-card border-border rounded-xl border p-3.5">
            <a href={task.sourceLink?.href} target="_blank" rel="noreferrer" className="flex items-start gap-2">
              <span className="flex-1 text-sm leading-snug font-medium">{task.title}</span>
              <ExternalLink className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            </a>
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="text-foreground">{task.projectLabel}</span>
              <span>·</span>
              <span>{task.assignee?.name ?? "Unassigned"}</span>
              <span>·</span>
              <IdleCell days={task.daysIdle} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <BlockedCell task={task} />
              <DueCell task={task} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
