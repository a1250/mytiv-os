"use client";

import Link from "next/link";
import { HOURS_SYNC, MEDIA_BUDGET, PROJECT_UMINO } from "@/lib/focus/fixtures/projects";
import { R } from "@/lib/focus/routes";
import { BlockersCard, DecisionsCard, HoursRing, Milestones, NextActionHero, ProjectHeader, ResultsCard } from "@/components/focus/patterns/project/project-parts";
import { useDemo } from "@/components/focus/shell/demo-store";

/**
 * Project environment · overview (handoff D2, mobile M5). Pending decisions are read live from the demo store, so a
 * decision taken in focus mode disappears here too.
 */
export default function ProjectScreen() {
  const { now, approval } = useDemo();
  const p = PROJECT_UMINO;
  const decisions = p.decisions.state === "ready"
    ? { ...p.decisions, data: p.decisions.data.filter((d) => approval(d.id)?.status === "pending") }
    : p.decisions;
  return (
    <div className="f-proj f-own-mhead">
      <ProjectHeader
        p={{ ...p, areaCounts: { ...p.areaCounts, marketing: decisions.state === "ready" ? decisions.data.length : p.areaCounts.marketing } }}
        area="overview"
        now={now}
        actions={<div className="f-proj-head__actions">
          <Link href={R.activity} className="f-btn f-btn--neutral">הוסף עדכון</Link>
          <Link href={`${R.projectExecution(p.id)}?create=1`} className="f-btn f-btn--neutral">+ משימה</Link>
        </div>}
      />
      <div className="f-proj__body">
        <Milestones milestones={p.milestones} now={now} launchDate={p.dueDate} />
        <div className="f-proj__grid">
          {p.nextAction && <NextActionHero next={p.nextAction} />}
          <HoursRing
            spent={p.hours.spent} budget={p.hours.budget ?? 0} sourceLabel={HOURS_SYNC.source} updatedAt={HOURS_SYNC.at} now={now}
            extra={<span className="f-hours__media">תקציב מדיה: <span className="f-value--unavailable f-hours__na">— {MEDIA_BUDGET.reason}</span></span>}
          />
          <BlockersCard blockers={p.blockers} />
          <DecisionsCard decisions={decisions} compactTitle="ממתין לאישור" />
          <ResultsCard results={p.results} now={now} />
        </div>
      </div>
    </div>
  );
}
