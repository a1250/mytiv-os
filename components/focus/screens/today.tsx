"use client";

import Link from "@/components/focus/ui/link";
import type { TimeColumn } from "@/lib/focus/contracts/today";
import { AGENDA, RESUME, STUCK, TODAY_METRICS, TODAY_PROJECTS } from "@/lib/focus/fixtures/today";
import { fmtLongDate, fmtShortLongDate, fmtWaiting } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { blockInfo, bucketsFor, canDo } from "@/lib/focus/state/work";
import { ActionCard, CompactActionCard } from "@/components/focus/patterns/action-card";
import { AgendaPanel } from "@/components/focus/patterns/agenda";
import { MetricGrid } from "@/components/focus/patterns/metrics";
import { Page, PageHeader, SectionHead } from "@/components/focus/patterns/page";
import { ProjectCardCompact } from "@/components/focus/patterns/project-card";
import { StuckPanel } from "@/components/focus/patterns/stuck-panel";
import { TimeBoard } from "@/components/focus/patterns/time-board";
import { TaskCard } from "@/components/focus/patterns/work/task-card";
import { useDemo } from "@/components/focus/shell/demo-store";
import { TimerBar } from "@/components/focus/shell/timer-bar";
import { useQueue } from "@/components/focus/shell/use-queue";
import { ButtonLink } from "@/components/focus/ui/button";
import { LoadableView } from "@/components/focus/ui/feedback";

/**
 * "היום שלי" (handoff D1, mobile M1). Composition only: data from fixtures + the demo store, UI from patterns.
 * Order on mobile follows M1: needs action → calendar → stuck → projects → metrics.
 */
const COLUMNS: { key: TimeColumn; title: string; short?: string; note?: string }[] = [
  { key: "now", title: "עכשיו", note: "לפני 12:00" },
  { key: "today", title: "עד סוף היום", short: "היום" },
  { key: "week", title: "השבוע" },
];

export default function TodayScreen() {
  const demo = useDemo();
  const { now, viewer, state } = demo;
  const q = useQueue();
  const buckets = bucketsFor(state.tasks, viewer.id, now);
  // the timer is a write (time entries): offered only to roles that may track time
  const timer = canDo(state.role, "trackTime") ? { activeTaskId: state.timer?.running ? state.timer.taskId : null, onStart: demo.timerStart, onPause: demo.timerPause } : undefined;
  const firstPrimary = q.items.find((x) => x.column === "now" && x.phase.kind === "default")?.item.id;

  const columns = COLUMNS.map((c) => {
    const items = q.items.filter((x) => x.column === c.key);
    return {
      ...c,
      count: items.length,
      content: (
        <div className="f-stack-12">
          {items.map(({ item, phase, quick }) =>
            c.key === "week" ? (
              <CompactActionCard key={item.id} title={item.title} context={item.context} risk={item.risk} waiting={fmtWaiting(item.waitingSince, now)} href={item.action.href} />
            ) : (
              <ActionCard
                key={item.id}
                title={item.title}
                context={item.context}
                why={item.why}
                waiting={item.risk === "high" || item.risk === "low" ? `ממתין ${fmtWaiting(item.waitingSince, now)}` : fmtWaiting(item.waitingSince, now)}
                risk={item.risk}
                action={item.action}
                primary={item.id === firstPrimary}
                phase={phase}
                onQuickApprove={quick}
              />
            ),
          )}
          {c.key === "week" && <StuckPanel stuck={STUCK} />}
        </div>
      ),
    };
  });

  const workSummary = `${buckets.today.length} להיום · ${buckets.overdue.length} באיחור · ${buckets.blocked.length} חסומה · ${buckets.waitingOnOthers.length} ממתינות לאחרים`;
  const firstPending = q.firstPending;

  return (
    <Page className="f-today">
      <PageHeader
        eyebrow={<><span className="f-only-desktop">{fmtLongDate(now)}</span><span className="f-only-mobile">{fmtShortLongDate(now)}</span></>}
        title={`בוקר טוב, ${viewer.name}`}
        status={`יש היום ${q.total - q.handled} פריטים שדורשים את תשומת ליבך.`}
        progress={{ done: q.handled, total: q.total }}
        actions={firstPending
          ? <ButtonLink variant="strong" size="lg" href={`${R.approval(firstPending)}?mode=focus`} className="f-today__start">התחל לטפל, אחד־אחד</ButtonLink>
          : <span className="f-meta">אין פריטים בתור. כל הכבוד.</span>}
      />

      <div className="f-today__main">
        <TimeBoard columns={columns} label="דורש ממך פעולה לפי זמן" />
        <AgendaPanel agenda={AGENDA} now={now} resume={RESUME} />
      </div>

      <section className="f-today__work" aria-labelledby="work-today">
        <SectionHead title={<span id="work-today">העבודה שלי להיום</span>} size="lg" note={workSummary}>
          <span className="f-grow" />
          <Link href={R.work} className="f-link f-hit">פתח את &quot;המשימות שלי&quot; ←</Link>
        </SectionHead>
        <div className="f-today__workgrid">
          {([
            ["היום", buckets.today, undefined],
            ["באיחור", buckets.overdue, "risk"],
            ["חסומות", buckets.blocked, undefined],
            ["ממתינות לאחרים", buckets.waitingOnOthers, undefined],
          ] as const).map(([title, list, tone]) => (
            <section key={title} className="f-stack-9" aria-label={title}>
              <SectionHead title={title} count={list.length} tone={tone} size="sm" level={3} />
              {list.slice(0, 2).map((t, i) => (
                <TaskCard key={t.id} task={t} compact={i > 0} now={now} size="sm" timer={timer} block={blockInfo(t, state.tasks)} />
              ))}
            </section>
          ))}
        </div>
        <TimerBar variant="inline" />
      </section>

      <div className="f-today__bottom">
        <LoadableView value={TODAY_PROJECTS} label="פרויקטים">
          {(ps) => <>{ps.map((p) => <ProjectCardCompact key={p.id} p={p} />)}</>}
        </LoadableView>
        <MetricGrid metrics={TODAY_METRICS} now={now} columns={3} />
      </div>
    </Page>
  );
}
