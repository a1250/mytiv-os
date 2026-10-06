"use client";

import Link from "@/components/focus/ui/link";
import { Suspense, useState, type ReactNode } from "react";
import type { Task, TaskPatch } from "@/lib/focus/contracts/work";
import { HOURS_SYNC } from "@/lib/focus/fixtures/projects";
import { PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { daysBetween, fmtAgo, fmtDayMonth } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { bucketsFor, canComplete, canDo, displayStatus } from "@/lib/focus/state/work";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { useTaskUndo } from "@/components/focus/shell/task-actions";
import { TaskDrawerHost } from "@/components/focus/shell/task-drawer-host";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { EmptyState } from "@/components/focus/ui/feedback";
import { SourceDot, WorkStatusTag } from "@/components/focus/ui/status";
import { Chips, Tabs } from "@/components/focus/ui/tabs";
import { useToast } from "@/components/focus/ui/toast";

/**
 * All my tasks across projects (handoff F5, mobile M6): real filters, grouping, the source of truth per task and ONE
 * quick action per row, chosen from the task's state (assign me / open the editor / open the proposal / change date /
 * mark done / remind). Under 768px rows become cards.
 */
type Filter = "mine" | "today" | "overdue" | "blocked" | "waiting";

function Inner() {
  const demo = useDemo();
  const toast = useToast();
  const undo = useTaskUndo();
  const { state, now, viewer } = demo;
  const [filter, setFilter] = useState<Filter>("mine");
  const [group, setGroup] = useState<"project" | "owner">("project");
  const b = bucketsFor(state.tasks, viewer.id, now);
  const sets: Record<Filter, Task[]> = {
    // every open task of mine — including no-date and unmapped-status ones (never silently dropped from "שלי")
    mine: [...b.overdue, ...b.today, ...b.blocked, ...b.waitingOnOthers, ...b.soon, ...b.noDate, ...b.unmapped],
    today: b.today, overdue: b.overdue, blocked: b.blocked, waiting: b.waitingOnOthers,
  };
  const list = sets[filter];
  const groups = list.reduce<Record<string, Task[]>>((acc, t) => {
    const k = group === "project" ? [t.context.client, t.context.project].filter(Boolean).join(" · ") || "ללא פרויקט" : (t.assigneeId ? PEOPLE_BY_ID[t.assigneeId]?.name : "ללא אחראי") ?? "—";
    (acc[k] ??= []).push(t);
    return acc;
  }, {});

  /** one write path for the quick actions: the row's token, refusals explained, undo as a compensating write */
  const write = (t: Task, patch: TaskPatch, title: string, detail: string) => {
    const r = demo.patchTask(t.id, patch, t.version);
    if (!r.ok) { toast.push({ kind: "error", title: "לא נשמר", detail: "refused" in r ? r.refused : "המשימה עודכנה בינתיים. רעננו ונסו שוב." }); return; }
    toast.push({ title, detail, undo: { onUndo: undo(r.previous!, r.task.version) } });
  };

  const action = (t: Task): ReactNode => {
    if (!canDo(state.role, "edit")) return <Link href={R.task(t.id)} className="f-link">פתח</Link>;
    if (displayStatus(t, state.tasks) === "blocked" && !t.assigneeId) {
      return <Button variant="link" size="sm" onClick={() => write(t, { assigneeId: viewer.id }, "הוקצה לך", t.title)}>הקצה לי</Button>;
    }
    if (t.links.campaignId && t.status === "in_progress") return <Link href={R.designEdit(t.links.campaignId)} className="f-link">פתח בעורך</Link>;
    if (t.links.proposalId) return <Link href={R.proposal(t.links.proposalId)} className="f-link">פתח הצעה</Link>;
    if (t.dueDate && daysBetween(t.dueDate, now) > 0) return <Link href={R.task(t.id)} className="f-link">שנה תאריך</Link>;
    if (t.status === "waiting") {
      const tomorrow = new Date(new Date(now).getTime() + 86_400_000).toISOString().slice(0, 10);
      return t.followUp ? <span className="f-meta-sm">מעקב {fmtDayMonth(t.followUp)}</span> : (
        <Button variant="link" size="sm" onClick={() => write(t, { followUp: tomorrow }, "נקבע מעקב למחר", `מול ${t.waitingFor ?? "הגורם הממתין"} · יופיע בהיום שלי`)}>קבע מעקב</Button>
      );
    }
    const gate = canComplete(t, state.tasks);
    return gate.ok
      ? <Button variant="link" size="sm" onClick={() => write(t, { status: "done" }, "סומן כהושלם", t.title)}>סמן כהושלם</Button>
      : <Link href={R.task(t.id)} className="f-link">פתח</Link>;
  };

  return (
    <Page className="f-alltasks">
      <PageHeader
        eyebrow={<nav aria-label="נתיב" className="f-crumbs"><Link href={R.work}>עבודה</Link> <span aria-hidden>›</span> משימות</nav>}
        title="משימות" size="page"
        status={`${b.today.length} משימות שלך היום. ${b.overdue.length === 1 ? "אחת באיחור" : `${b.overdue.length} באיחור`}.`}
        actions={canDo(state.role, "create") ? <ButtonLink variant="primary" href={`${R.work}?create=1`}>+ משימה</ButtonLink> : undefined}
      />
      <div className="f-alltasks__bar">
        <Chips label="סינון" value={filter} onChange={setFilter} items={[
          { key: "mine", label: "שלי", count: sets.mine.length }, { key: "today", label: "היום", count: b.today.length },
          { key: "overdue", label: "באיחור", count: b.overdue.length }, { key: "blocked", label: "חסומות", count: b.blocked.length },
          { key: "waiting", label: "ממתינות לאחרים", count: b.waitingOnOthers.length },
        ]} />
        <span className="f-grow" />
        <Tabs label="קיבוץ" value={group} onChange={setGroup} size="sm" items={[{ key: "project", label: "לפי פרויקט" }, { key: "owner", label: "לפי אחראי" }]} />
        <span className="f-meta-sm">ClickUp · {fmtAgo(HOURS_SYNC.at, now)}</span>
      </div>
      {list.length === 0 ? <EmptyState glyph="✓" title="אין משימות בסינון הזה" hint="נסה סינון אחר." /> : (
        <table className="f-tl f-alltasks__table">
          <thead><tr><th scope="col">משימה</th><th scope="col">פרויקט</th><th scope="col">מצב</th><th scope="col">יעד</th><th scope="col">מקור האמת</th><th scope="col">פעולה מהירה</th></tr></thead>
          {Object.entries(groups).map(([g, ts]) => (
            <tbody key={g}>
              <tr className="f-tl__ghead"><th colSpan={6} scope="rowgroup">{g} · {ts.length}</th></tr>
              {ts.map((t) => {
                const late = t.dueDate ? daysBetween(t.dueDate, now) > 0 : false;
                return (
                  <tr key={t.id} className="f-tl__row">
                    <th scope="row" className="f-tl__task">
                      <span className="f-alltasks__t">
                        <Link href={R.task(t.id)} className="f-tl__title">{t.title}</Link>
                        <span className="f-meta-sm">{t.nextAction ?? (t.waitingFor ? `ממתין ל${t.waitingFor}` : t.assigneeId ? PEOPLE_BY_ID[t.assigneeId]?.name : "ללא אחראי")}</span>
                      </span>
                    </th>
                    <td className="f-alltasks__proj">{[t.context.client, t.context.project].filter(Boolean).join(" · ") || "—"}</td>
                    <td><WorkStatusTag status={displayStatus(t, state.tasks)} size="xs" /></td>
                    <td className={cx("f-num", late && "f-tl__late")}>{t.dueDate ? `${fmtDayMonth(t.dueDate)}${late ? " · באיחור" : ""}` : "—"}</td>
                    <td><SourceDot source={t.source} />{t.source === "mytiv" ? <span className="f-meta-sm"> בלבד</span> : null}</td>
                    <td className="f-alltasks__act">{action(t)}</td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      )}
      <p className="f-meta-sm">משימה ש־ClickUp הוא מקור האמת שלה מתעדכנת שם. משימה מקומית מסומנת &quot;Mytiv&quot; ואינה מסונכרנת.</p>
      <TaskDrawerHost />
    </Page>
  );
}

export default function AllTasksScreen() {
  return <Suspense><Inner /></Suspense>;
}
