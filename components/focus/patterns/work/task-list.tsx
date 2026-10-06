"use client";

import Link from "@/components/focus/ui/link";
import { Fragment } from "react";
import type { Task } from "@/lib/focus/contracts/work";
import type { WorkDisplayStatus } from "@/lib/focus/contracts/status";
import { daysBetween, fmtDayMonth, fmtDays } from "@/lib/focus/format";
import { PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { blocking, childrenOf, displayStatus, openBlockers } from "@/lib/focus/state/work";
import { cx } from "@/components/focus/ui/cx";
import { Icon } from "@/components/focus/ui/icon";
import { SourceDot, WORK, WorkStatusTag } from "@/components/focus/ui/status";

/**
 * TaskListView (Mytiv Work contract): `{ tasks, groupBy, expandedIds, onToggleExpand, onReorder? }` — a semantic table.
 * Parent rows expand to their child tasks; a blocked row gets a "חסום על ידי" line. Under 768px rows become cards.
 * Done is a real checkbox; the rules (dependencies, open children) are enforced by the caller's onToggleDone.
 */
export type ListColumn = "assignee" | "due" | "status" | "time" | "dependency";

export function hoursText(t: Task) {
  const est = t.estimateMinutes != null ? `${Math.round(t.estimateMinutes / 6) / 10}h` : "—";
  const spent = t.spentMinutes == null ? "—" : `${Math.round(t.spentMinutes / 6) / 10}`;
  return `${spent}/${est}`;
}

function Assignee({ id }: { id: string | null }) {
  if (!id) return <span className="f-tl__who f-tl__who--none"><span className="f-tl__av f-tl__av--none" aria-hidden>?</span>ללא אחראי</span>;
  const p = PEOPLE_BY_ID[id];
  return <span className="f-tl__who"><span className={cx("f-tl__av", `f-tl__av--${id}`)} aria-hidden>{p?.initial ?? "?"}</span>{p?.name ?? "—"}</span>;
}

export function TaskListView({
  tasks, all, now, groupBy = "none", expandedIds, onToggleExpand, onToggleDone, selectedId, view = "list", columns = ["assignee", "due", "status", "time"], groupOrder, canEdit = true, onOpen,
}: {
  tasks: Task[]; all: Task[]; now: string; groupBy?: "status" | "none"; expandedIds: string[]; onToggleExpand: (id: string) => void;
  onToggleDone: (t: Task) => void; selectedId?: string | null; view?: "list" | "board"; columns?: ListColumn[];
  groupOrder?: { key: string; title: string; statuses: WorkDisplayStatus[]; collapsed?: boolean }[]; canEdit?: boolean;
  /** open in place (e.g. a side panel) instead of navigating to the drawer route */
  onOpen?: (t: Task) => void;
}) {
  const ids = new Set(tasks.map((t) => t.id));
  const roots = tasks.filter((t) => !t.parentId || !ids.has(t.parentId));
  const head = (
    <thead>
      <tr>
        <th scope="col" className="f-tl__exp"><span className="f-sr">הרחבה</span></th>
        <th scope="col">משימה</th>
        {columns.includes("assignee") && <th scope="col">אחראי</th>}
        {columns.includes("due") && <th scope="col">יעד</th>}
        {columns.includes("status") && <th scope="col">סטטוס</th>}
        {columns.includes("dependency") && <th scope="col">תלות</th>}
        {columns.includes("time") && <th scope="col">זמן</th>}
      </tr>
    </thead>
  );
  const row = (t: Task, level: 0 | 1) => {
    const kids = childrenOf(t, all);
    const expanded = expandedIds.includes(t.id);
    const blockers = openBlockers(t, all);
    const shown = displayStatus(t, all);
    const blocks = blocking(t, all);
    const done = t.status === "done";
    const due = t.dueDate ? daysBetween(t.dueDate, now) : 0;
    return (
      <Fragment key={t.id}>
        <tr className={cx("f-tl__row", level === 1 && "f-tl__row--child", selectedId === t.id && "f-tl__row--sel", done && "f-tl__row--done", shown === "blocked" && "f-tl__row--blocked")}>
          <td className="f-tl__exp">
            {kids.length > 0 && (
              <button type="button" className="f-tl__toggle" aria-expanded={expanded} aria-label={`${expanded ? "כווץ" : "הרחב"} · ${kids.length} תת־משימות`} onClick={() => onToggleExpand(t.id)}>
                <Icon name={expanded ? "chevron-down" : "chevron-left"} size={16} />
              </button>
            )}
          </td>
          <th scope="row" className="f-tl__task">
            <span className="f-tl__taskin">
              {canEdit ? (
                <input type="checkbox" className={cx("f-check__box", "f-check__box--round", level === 1 && "f-check__box--sm")} checked={done} onChange={() => onToggleDone(t)} aria-label={`${done ? "סמן כלא בוצע" : "סמן כבוצע"}: ${t.title}`} />
              ) : <span className="f-tl__dot" aria-hidden />}
              {onOpen
                ? <button type="button" className="f-tl__title f-tl__titlebtn" aria-pressed={selectedId === t.id} onClick={() => onOpen(t)}>{t.title}</button>
                : <Link href={R.task(t.id, view)} className="f-tl__title" aria-current={selectedId === t.id ? "true" : undefined}>{t.title}</Link>}
              {kids.length > 0 && <span className="f-tl__meta">{kids.length} תת־משימות</span>}
              {t.subtasks.length > 0 && <span className="f-tl__meta f-num"><Icon name="list-checks" size={13} /> {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length}</span>}
              {shown === "blocked" && <span className="f-tl__blk">{WORK.blocked.glyph} חסום</span>}
              <SourceDot source={t.source} />
            </span>
          </th>
          {columns.includes("assignee") && <td><Assignee id={t.assigneeId} /></td>}
          {columns.includes("due") && <td className={cx("f-num", due > 0 && !done && "f-tl__late")}>{t.dueDate ? <>{fmtDayMonth(t.dueDate)}{due > 0 && !done ? <> · באיחור</> : null}</> : "—"}</td>}
          {columns.includes("status") && <td><WorkStatusTag status={shown} size="xs" /></td>}
          {columns.includes("dependency") && <td className="f-tl__depcell">{blockers.length ? `תלוי ב"${blockers[0].title}"` : blocks.length ? `חוסם: ${blocks.map((b) => b.title).join(", ")}` : t.waitingFor ? `ממתין ל${t.waitingFor}` : "—"}</td>}
          {columns.includes("time") && <td className="f-mono f-tl__time" dir="ltr"><span aria-label={t.spentMinutes == null ? "זמן שנרשם לא ידוע" : undefined}>{hoursText(t)}</span></td>}
        </tr>
        {blockers.length > 0 && (
          <tr className="f-tl__deprow">
            <td />
            <td colSpan={columns.length + 1}>
              <span className="f-tl__dep">
                <Icon name="link" size={14} className="f-tcard__depicon" /> חסום על ידי {onOpen
                  ? <button type="button" className="f-tl__deplink" onClick={() => onOpen(blockers[0])}>{blockers[0].title}</button>
                  : <Link href={R.task(blockers[0].id, view)} className="f-tl__deplink">{blockers[0].title}</Link>}
                {" · "}ממתין {fmtDays(daysBetween(blockers[0].updatedAt, now))}
              </span>
            </td>
          </tr>
        )}
        {expanded && kids.map((k) => row(k, 1))}
      </Fragment>
    );
  };

  if (groupBy === "status" && groupOrder) {
    return (
      <table className="f-tl f-tl--grouped">
        {head}
        {groupOrder.map((g) => {
          const list = roots.filter((t) => g.statuses.includes(displayStatus(t, all)));
          if (!list.length) return null;
          return (
            <tbody key={g.key} className="f-tl__group">
              <tr className="f-tl__ghead"><th colSpan={columns.length + 2} scope="rowgroup">{g.title} · {list.length}</th></tr>
              {g.collapsed ? null : list.map((t) => row(t, 0))}
            </tbody>
          );
        })}
      </table>
    );
  }
  return <table className="f-tl">{head}<tbody>{roots.map((t) => row(t, 0))}</tbody></table>;
}
