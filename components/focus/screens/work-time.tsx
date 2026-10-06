"use client";

import Link from "@/components/focus/ui/link";
import { useState } from "react";
import type { TimeReportGroup } from "@/lib/focus/contracts/work";
import { PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { TIME_REPORT, TIME_REPORT_BY } from "@/lib/focus/fixtures/work";
import { fmtDayMonth, fmtTime } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { TimeReport } from "@/components/focus/patterns/work/time-report";
import { useDemo } from "@/components/focus/shell/demo-store";
import { TimerBar } from "@/components/focus/shell/timer-bar";
import { Button } from "@/components/focus/ui/button";
import { EmptyState } from "@/components/focus/ui/feedback";
import { PlannedTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Time (handoff W5): the persistent timer bar + the hours report with certainty, and the entries logged in this
 * session (timer and manual) — each removable with undo. Timer persistence and the report are "planned" in pkg1.
 */
export default function WorkTimeScreen() {
  const demo = useDemo();
  const toast = useToast();
  const [group, setGroup] = useState<TimeReportGroup>("employee");
  const rows = group === "employee" ? TIME_REPORT.rows : TIME_REPORT_BY[group];
  const entries = [...demo.state.timeEntries].sort((a, b) => b.start.localeCompare(a.start));
  return (
    <Page className="f-wtime">
      <PageHeader eyebrow="עבודה · זמן" title="זמן ודוח שעות" size="page" status="כל שעה נרשמת על משימה. ערך מוערך מסומן ≈ ולא נכנס לסיכום כידוע." aside={<PlannedTag />} />
      <div className="f-wtime__grid">
        <section className="f-panel f-wtime__timer" aria-labelledby="timer-h">
          <h2 id="timer-h" className="f-wtime__h">הטיימר</h2>
          <p className="f-meta">הפס קבוע בתחתית מסכי העבודה ונשמר בין מסכים ורענונים (בדמו: בדפדפן הזה).</p>
          {demo.state.timer ? <TimerBar variant="inline" /> : (
            <div className="f-timerbar f-timerbar--inline f-timerbar--idle" role="status">
              <span className="f-timerbar__ctx">אין טיימר פעיל · בחר משימה כדי להתחיל</span>
              <span className="f-timerbar__spacer" />
              <Link href={R.work} className="f-timerbar__stop">למשימות שלי</Link>
            </div>
          )}
          <h3 className="f-wtime__h3">רישומים אחרונים</h3>
          {entries.length === 0 ? <EmptyState title="אין רישומי זמן" hint="הפעל טיימר על משימה או הזן זמן ידנית במגירת המשימה." /> : (
            <ul className="f-wtime__entries">
              {entries.map((e) => {
                const task = demo.state.tasks.find((t) => t.id === e.taskId);
                return (
                  <li key={e.id} className="f-wtime__entry">
                    <span className="f-wtime__etitle"><Link href={R.task(e.taskId)} className="f-link">{task?.title ?? "משימה שנמחקה"}</Link></span>
                    <span className="f-meta-sm">{PEOPLE_BY_ID[e.personId]?.name} · {fmtDayMonth(e.start)} {fmtTime(e.start)} · {e.source === "timer" ? "טיימר" : "ידני"}</span>
                    <b className="f-mono" dir="ltr">{e.minutes}m</b>
                    <Button variant="quiet" size="sm" onClick={() => { demo.removeTimeEntry(e.id); toast.push({ title: "הרישום נמחק", detail: task?.title, undo: { onUndo: () => demo.restoreEntry(e) } }); }} aria-label={`מחק רישום ${e.minutes} דקות`}>מחק</Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <TimeReport data={TIME_REPORT} groupBy={group} onGroupBy={setGroup} rows={rows} />
      </div>
    </Page>
  );
}
