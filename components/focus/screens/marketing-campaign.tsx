"use client";

import Link from "next/link";
import { useState } from "react";
import type { Approval } from "@/lib/focus/contracts/approvals";
import type { CampaignBrief, ContentPlanRow } from "@/lib/focus/contracts/marketing";
import type { ApprovalStatus } from "@/lib/focus/contracts/status";
import { CAMPAIGN_SUSHI } from "@/lib/focus/fixtures/marketing";
import { personName } from "@/lib/focus/fixtures/people";
import { daysBetween, fmtDate, fmtDayMonth, fmtRelativeDay, fmtTime, fmtWeekday } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { ContentThumb, PlannedAction } from "@/components/focus/patterns/marketing/marketing-parts";
import { ResultsCard } from "@/components/focus/patterns/project/project-parts";
import { PageHeader } from "@/components/focus/patterns/page";
import { useDemo } from "@/components/focus/shell/demo-store";
import { ButtonLink } from "@/components/focus/ui/button";
import { EmptyState, LoadableView } from "@/components/focus/ui/feedback";
import { APPROVAL, ApprovalPill, ReadingValue, VerificationTag, WorkStatusTag } from "@/components/focus/ui/status";
import { Tabs } from "@/components/focus/ui/tabs";

/**
 * Campaign (handoff E1): goal, audience and message with their certainty, the content plan (list built; Kanban and
 * calendar planned), results with source and certainty (unknown is "—", never 0), budget & assets and the change log.
 * Approval states are read live from the demo store, so a decision taken in focus mode shows here immediately.
 */
const c = CAMPAIGN_SUSHI;
type View = "list" | "kanban" | "calendar";

const fmtPublish = (iso: string | null) => (!iso ? "—" : iso.length === 10 ? `${fmtWeekday(iso)} ${fmtDayMonth(iso)}` : `${fmtWeekday(iso)} ${fmtDayMonth(iso)}, ${fmtTime(iso)}`);

export default function MarketingCampaignScreen() {
  const { now, approval, state } = useDemo();
  const [view, setView] = useState<View>("list");

  const liveStatus = (r: ContentPlanRow): ApprovalStatus | null =>
    r.approvalId ? approval(r.approvalId)?.status ?? null : r.state.kind === "approval" ? r.state.status : null;
  const rows = c.plan.state === "ready" ? c.plan.data : [];
  const pendingRows = rows.filter((r) => liveStatus(r) === "pending").length;
  const approvedRows = rows.filter((r) => liveStatus(r) === "approved").length;
  const campaignApprovals = [...new Set([c.message.approvalId, ...rows.map((r) => r.approvalId)].filter(Boolean) as string[])]
    .map((id) => approval(id)).filter((a): a is Approval => !!a);
  const openApprovals = campaignApprovals.filter((a) => a.status === "pending").length;

  // change log: fixture history + decisions taken in this session
  const live = campaignApprovals.flatMap((a) => {
    const d = state.decisions[a.id];
    if (!d) return [];
    return [{ id: `d-${a.id}`, when: fmtTime(d.decidedAt), text: `${a.title} · ${APPROVAL[a.status].word} ע״י ${personName(d.decidedBy)}` }];
  });
  const log = [...live, ...c.log.map((l) => ({ id: l.id, when: daysBetween(l.at, now) === 0 ? `היום ${fmtTime(l.at)}` : fmtDayMonth(l.at), text: l.text }))];

  return (
    <div className="f-mk-camp">
      <div className="f-mk-camp__band">
        <PageHeader
          className="f-mk-camp__head"
          size="entity"
          eyebrow={<nav aria-label="מיקום" className="f-mk-crumb">
            <Link href={R.marketingPlan}>שיווק ותוכן</Link> › <span>קמפיינים</span> › <Link href={R.client("umino")}>{c.client.name}</Link>
          </nav>}
          title={c.name}
          status={<span className="f-mk-camp__meta">
            {c.client.name} · <Link href={R.project(c.projectId)} className="f-mk-camp__proj">{c.projectName}</Link> · {fmtDayMonth(c.start)}–{fmtDate(c.end)} · {c.channels.join(", ")} · אחראית: {personName(c.ownerId)}
          </span>}
          aside={<WorkStatusTag status="in_progress" size="md" className="f-mk-camp__state" />}
          actions={<>
            <PlannedAction className="f-mk-planned--pill">ערוך קמפיין</PlannedAction>
            <ButtonLink href={`${R.studioNew}?campaign=${c.id}`} size="lg"><span aria-hidden>✦</span> צור תוכן לקמפיין</ButtonLink>
          </>}
        />
      </div>

      <div className="f-mk-camp__grid">
        <div className="f-mk-camp__main">
          <div className="f-mk-camp__briefs">
            <BriefCard b={c.goal} />
            <BriefCard b={c.audience} />
            <BriefCard b={c.message} approval={c.message.approvalId ? approval(c.message.approvalId) : undefined} />
          </div>

          <section className="f-panel f-mk-plan" aria-labelledby="plan-h">
            <div className="f-mk-plan__head">
              <h2 id="plan-h" className="f-mk-plan__h">תוכנית תוכן</h2>
              <span className="f-meta">{rows.length} תכנים · {pendingRows} לאישור</span>
              <span className="f-grow" />
              <Tabs label="תצוגת תוכנית התוכן" size="sm" idBase="plan" value={view} onChange={setView}
                items={[{ key: "list", label: "רשימה" }, { key: "kanban", label: "Kanban" }, { key: "calendar", label: "לוח שנה" }]} />
            </div>
            <div role="tabpanel" id={`plan-panel-${view}`} aria-labelledby={`plan-tab-${view}`}>
              {view === "list" ? (
                <LoadableView value={c.plan} label="תוכנית תוכן">
                  {(data) => (
                    <table className="f-mk-plan__table">
                      <caption className="f-sr">תוכנית התוכן של הקמפיין</caption>
                      <thead>
                        <tr><th scope="col"><span className="f-sr">תצוגה מקדימה</span></th><th scope="col">תוכן</th><th scope="col">פרסום</th><th scope="col">מצב</th><th scope="col"><span className="f-sr">פעולה</span></th></tr>
                      </thead>
                      <tbody>
                        {data.map((r) => <PlanRow key={r.id} r={r} status={liveStatus(r)} />)}
                      </tbody>
                    </table>
                  )}
                </LoadableView>
              ) : (
                <EmptyState
                  glyph="⧗"
                  title={view === "kanban" ? "תצוגת Kanban לקמפיין מתוכננת" : "לוח שנה לקמפיין מתוכנן"}
                  hint={view === "kanban" ? "בינתיים אפשר לראות את כל תוכן השיווק בלוח השיווק." : "בינתיים מועדי הפרסום מופיעים ברשימה."}
                  action={view === "kanban" ? <ButtonLink href={R.marketingBoard} variant="secondary" size="sm">פתח את לוח השיווק</ButtonLink> : undefined}
                />
              )}
            </div>
          </section>
        </div>

        <aside className="f-mk-camp__aside" aria-label="תוצאות, תקציב ויומן">
          <div className="f-mk-camp__results">
            <ResultsCard results={c.results} now={now} title="תוצאות" footer={
              <p className="f-meta f-mk-camp__resnote">
                מתחילת הקמפיין. הקמפיין התחיל {fmtRelativeDay(c.start, now)}, נתון ראשון צפוי {fmtRelativeDay(c.firstDataAt, now)}.
              </p>} />
          </div>
          <section className="f-panel f-mk-camp__card" aria-labelledby="budget-h">
            <h2 id="budget-h" className="f-mk-camp__cardh">תקציב ונכסים</h2>
            <dl className="f-mk-camp__dl">
              <div><dt>תקציב מדיה</dt><dd className={c.mediaBudget.kind === "unknown" ? "f-value--unavailable" : undefined}>
                <ReadingValue reading={c.mediaBudget} unit="ils" />{c.mediaBudget.kind === "unknown" && <> {c.mediaBudget.reason}</>}
              </dd></div>
              <div><dt>נכסים מאושרים</dt><dd>{approvedRows} מתוך {rows.length}</dd></div>
              <div><dt>אישורים פתוחים</dt><dd>{openApprovals > 0 ? <Link href={R.approvals} className="f-link">{openApprovals}</Link> : 0}</dd></div>
            </dl>
          </section>
          <section className="f-panel f-mk-camp__card" aria-labelledby="log-h">
            <h2 id="log-h" className="f-mk-camp__cardh">יומן שינויים</h2>
            <ul className="f-mk-camp__log">
              {log.map((l) => <li key={l.id}>{l.when} · {l.text}</li>)}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function BriefCard({ b, approval }: { b: CampaignBrief; approval?: Approval }) {
  return (
    <section className="f-panel f-mk-brief" aria-label={b.label}>
      <span className="f-meta">{b.label}</span>
      <b className="f-mk-brief__value">{b.value}</b>
      <span className="f-mk-brief__note">
        {b.note}
        {b.verification && <> · <VerificationTag state={b.verification} /></>}
        {approval && <> · {approval.status === "pending"
          ? <><ApprovalPill status="pending" size="sm" /> <Link href={R.approval(approval.id)} className="f-link">לאישור</Link></>
          : <ApprovalPill status={approval.status} size="sm" />}</>}
      </span>
    </section>
  );
}

function PlanRow({ r, status }: { r: ContentPlanRow; status: ApprovalStatus | null }) {
  const idea = r.state.kind === "idea";
  return (
    <tr className={idea ? "f-mk-plan__row f-mk-plan__row--idea" : "f-mk-plan__row"}>
      <td className="f-mk-plan__thumb"><ContentThumb thumb={r.thumb} label={r.title} /></td>
      <td className="f-mk-plan__what">
        <b>{r.title}</b>
        <span className="f-meta">{idea ? r.channels : `${r.channels} · ${personName(r.ownerId)}${r.version ? ` · גרסה ${r.version}` : ""}${r.state.kind === "blocked" ? ` · חסום ע״י ${r.state.blockedBy}` : ""}`}</span>
      </td>
      <td className="f-mk-plan__when"><span className="f-mk-plan__label" aria-hidden>פרסום: </span>{fmtPublish(r.publishAt)}</td>
      <td className="f-mk-plan__state">
        {r.state.kind === "blocked" ? <WorkStatusTag status="blocked" />
          : idea ? <WorkStatusTag status="todo" label="רעיון" />
          : status && <ApprovalPill status={status} size="sm" />}
        {status === "pending" && r.approvalId && <Link href={R.approval(r.approvalId)} className="f-link f-mk-plan__appr">לאישור</Link>}
      </td>
      <td className="f-mk-plan__act">
        <Link href={r.href} className="f-mk-plan__open" aria-label={idea ? `צור: ${r.title}` : `פתח: ${r.title}`}>{idea ? <><span aria-hidden>✦</span> צור</> : "פתח"}</Link>
      </td>
    </tr>
  );
}
