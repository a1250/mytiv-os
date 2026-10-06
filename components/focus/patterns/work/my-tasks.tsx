"use client";

import { useState, type ReactNode } from "react";
import type { MyTasksBuckets, Task } from "@/lib/focus/contracts/work";
import { cx } from "@/components/focus/ui/cx";
import { Chips } from "@/components/focus/ui/tabs";
import { SectionHead } from "../page";
import { TaskCard, type TaskCardProps } from "./task-card";

/**
 * MyTasks (Mytiv Work contract): `{ buckets, activeTimer }` → three time columns on desktop (W1); on mobile one list
 * with a filter row (M9). Ordered by time; each card shows the next step and its one action (timer / open).
 */
type BucketKey = keyof MyTasksBuckets;
const TITLES: Record<BucketKey, { title: string; tone?: "risk" }> = {
  today: { title: "היום" }, overdue: { title: "באיחור", tone: "risk" }, blocked: { title: "חסומות" }, soon: { title: "בקרוב" },
  waitingOnOthers: { title: "ממתינות לאחרים" }, noDate: { title: "ללא תאריך" }, unmapped: { title: "לא ממופה במקור" },
};
const COLS: BucketKey[][] = [["today"], ["overdue", "blocked"], ["soon", "waitingOnOthers", "noDate", "unmapped"]];
const MOBILE_ORDER: BucketKey[] = ["overdue", "today", "blocked", "soon", "waitingOnOthers", "noDate", "unmapped"];
type Filter = "time" | "overdue" | "blocked" | "waitingOnOthers";

export function MyTasksView({ buckets, now, timer, limit = 3 }: { buckets: MyTasksBuckets; now: string; timer: TaskCardProps["timer"]; limit?: number }) {
  const [filter, setFilter] = useState<Filter>("time");
  const [expanded, setExpanded] = useState<Partial<Record<BucketKey, boolean>>>({});
  const section = (k: BucketKey, first: boolean, extra?: ReactNode) => {
    const list = buckets[k];
    if (!list.length && (k === "unmapped" || k === "noDate")) return null;
    const shown = expanded[k] ? list : list.slice(0, k === "noDate" ? 1 : limit + 1);
    return (
      <section key={k} className={cx("f-mytasks__sec", !first && "f-mytasks__sec--gap", `f-mytasks__sec--${k}`)} aria-label={TITLES[k].title} data-bucket={k}>
        <SectionHead title={TITLES[k].title} count={list.length} tone={TITLES[k].tone} level={2} />
        {list.length === 0 && <p className="f-mytasks__none">אין כאן משימות.</p>}
        {shown.map((t: Task, i) => <TaskCard key={t.id} task={t} now={now} timer={timer} blocked={k === "blocked"} compact={k === "soon" || k === "noDate" || (k === "today" && i >= 2) || (k === "overdue" && i >= 1)} />)}
        {list.length > shown.length && (
          <button type="button" className="f-mytasks__more f-hit" onClick={() => setExpanded((e) => ({ ...e, [k]: true }))}>הצג עוד {list.length - shown.length}</button>
        )}
        {extra}
      </section>
    );
  };
  return (
    <div className="f-mytasks" data-filter={filter}>
      <Chips
        className="f-mytasks__filter"
        label="סינון משימות"
        value={filter}
        onChange={(f) => setFilter(f)}
        items={[
          { key: "time", label: "לפי זמן" },
          { key: "overdue", label: "באיחור", count: buckets.overdue.length },
          { key: "blocked", label: "חסומות", count: buckets.blocked.length },
          { key: "waitingOnOthers", label: "ממתינות", count: buckets.waitingOnOthers.length },
        ]}
      />
      <div className="f-mytasks__grid">
        {COLS.map((col, ci) => (
          <div key={ci} className="f-mytasks__col">
            {col.map((k, i) => section(k, i === 0))}
          </div>
        ))}
      </div>
      <div className="f-mytasks__mobile">
        {MOBILE_ORDER.filter((k) => filter === "time" || k === filter).map((k, i) => section(k, i === 0))}
      </div>
    </div>
  );
}
