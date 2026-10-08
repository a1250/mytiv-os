"use client";

import Link from "@/components/focus/ui/link";
import { Suspense, useId, useState } from "react";
import type { Move, PriorityPlan } from "@/lib/focus/contracts/plan";
import { ASSET_SUMMARIES, PLAN_OCTOBER, REQUIREMENTS } from "@/lib/focus/fixtures/plan";
import { personName } from "@/lib/focus/fixtures/people";
import { NEED_RESOLVER, collapsedPriority, coverage, derivedNeeds, missingFor, movesOf, nextAction, openNeeds, priorityBudget, tooManyPriorities, type NextAction } from "@/lib/focus/state/plan";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { Banner, EmptyState } from "@/components/focus/ui/feedback";
import { TextAreaField, TextField } from "@/components/focus/ui/field";
import { cx } from "@/components/focus/ui/cx";
import { AttentionTag, CoverageBar, GoalLine, Money, MoveStateTag, Num, OptimizingTag, PlanFrame, PriorityStatusChip, Unknown, WeekNote, DemoNote, usePlanParams } from "@/components/focus/patterns/plan/plan-parts";
import { awaitingCreatives, expectedText, moveNote, priorityOf, weekMoveIds } from "@/components/focus/patterns/plan/plan-view";
import { PLAN_ROUTES, usePlan, type PlanApi } from "@/components/focus/patterns/plan/use-plan";
import { CreateMovePanel } from "@/components/focus/patterns/plan/create-move";
import { R } from "@/lib/focus/routes";

/**
 * Plan Overview (design package #s1/#s2): what are we promoting this month, and will it hit the goal? Seven things per
 * Priority — what we promote, goal, status, budget, moves + planned coverage, what is missing, what we do now — and
 * every other field in an in-place drill-down. At-risk and decision-waiting priorities lead; on-track priorities with
 * nothing to do collapse to one row once there are more than three.
 */
export default function PlanOverviewScreen() {
  return <Suspense fallback={null}><Overview /></Suspense>;
}

function Overview() {
  const plan = usePlan();
  const { period, week } = usePlanParams();
  if (period.month !== "2026-10") return <PlanFrame view="overview"><NextPeriod plan={plan} /></PlanFrame>;
  const pps = PLAN_OCTOBER.priorities;
  const actions = new Map(pps.map((pp) => [pp.priorityId, nextAction(pp, plan.moves, REQUIREMENTS, plan.overlay, plan.f, PLAN_ROUTES)]));
  const decisions = pps.filter((pp) => actions.get(pp.priorityId)!.kind === "decision");
  const gaps = pps.flatMap((pp) => openNeeds(pp, plan.moves).filter((n) => n.kind === "coverage_gap").map((n) => ({ pp, n })));
  const count = pps.length + plan.overlay.proposedPriorities.length;
  const weekIds = week ? weekMoveIds(plan.moves, plan.dayItems) : null;

  return (
    <PlanFrame view="overview" controls={<span className="f-pl-meta">{PLAN_OCTOBER.nextReview.label}</span>}>
      <div className="f-pl-summary">
        <span>תקציב <Money v={plan.budget.total} strong /></span><span className="f-pl-sep" aria-hidden>·</span>
        <span><Money v={plan.budget.unallocated} strong /> לא מוקצה{plan.budget.pendingFromUnallocated > 0 && <span className="f-pl-meta"> · <Money v={plan.budget.pendingFromUnallocated} /> מוצעים, ממתין לאישור בעלים</span>}</span>
        <span className="f-pl-summary__spacer" />
        {decisions.map((pp) => {
          const a = actions.get(pp.priorityId)!;
          const mv = movesOf(pp, plan.moves).find((m) => awaitingCreatives(m, plan.overlay, plan.f.builders) > 0);
          return (
            <Link key={pp.priorityId} href={a.href ?? R.plan} className="f-pl-alert f-pl-alert--wait">
              <b>ממתין לך</b> · {mv ? `${awaitingCreatives(mv, plan.overlay, plan.f.builders)} קריאייטיבים ל־${mv.channelLabel}` : a.label} · {priorityOf(pp.priorityId).shortName}
            </Link>
          );
        })}
        {gaps.map(({ pp, n }) => (
          <Link key={n.id} href={R.planCreateMove(n.id)} className="f-pl-alert f-pl-alert--gap"><b>פער כיסוי</b> · {n.short} {pp.goal.metricLabel} · {priorityOf(pp.priorityId).shortName}</Link>
        ))}
        <AddPriority plan={plan} />
      </div>
      {tooManyPriorities(count) && <Banner kind="warning" live={false} title={`${count} נושאים פעילים`} detail="מומלץ להתמקד ב־3–5 נושאים בכל תקופה; התקציב והתשומת לב מתפזרים." />}
      {week && <WeekNote>מוצגים רק מהלכים שיש להם פעילות, אישור או בנייה השבוע. הכיסוי והתקציב נשארים חודשיים.</WeekNote>}
      <span className="f-pl-mcount">{pps.length} נושאים · <Money v={plan.budget.total} strong /> · <Money v={plan.budget.unallocated} /> לא מוקצה</span>
      <ol className="f-pl-list" aria-label="מה מקדמים החודש">
        {pps.map((pp) => (
          <li key={pp.priorityId}>
            <PriorityBlock pp={pp} plan={plan} action={actions.get(pp.priorityId)!} collapsed={collapsedPriority(pp, count, actions.get(pp.priorityId)!)} weekIds={weekIds} />
          </li>
        ))}
        {plan.overlay.proposedPriorities.map((p) => (
          <li key={p.id}>
            <article className="f-pl-pri f-pl-pri--proposed" aria-label={`${p.name} · נושא מוצע`}>
              <div className="f-pl-proposed">
                <span className="f-pl-chip f-pl-chip--draft">מוצע</span>
                <b className="f-pl-pri__name">{p.name}</b>
                <span className="f-pl-meta">{p.description}</span>
                <span className="f-pl-proposed__spacer" />
                <span className="f-pl-meta">נכנס לתוכנית אחרי שבעלים קובע יעד ותקציב ומפעיל אותו</span>
              </div>
            </article>
          </li>
        ))}
      </ol>
      <CreateMovePanel view="overview" />
    </PlanFrame>
  );
}

function ActionButton({ a, block }: { a: NextAction; block?: boolean }) {
  if (!a.href) return <span className="f-pl-noaction">{a.label}</span>;
  return <ButtonLink href={a.href} variant={a.emphasis === "primary" ? "strong" : "secondary"} block={block} className="f-pl-act">{a.label}</ButtonLink>;
}

function PriorityBlock({ pp, plan, action, collapsed, weekIds }: { pp: PriorityPlan; plan: PlanApi; action: NextAction; collapsed: boolean; weekIds: Set<string> | null }) {
  const p = priorityOf(pp.priorityId);
  const all = movesOf(pp, plan.moves);
  const shown = weekIds ? all.filter((m) => weekIds.has(m.id)) : all;
  const cov = coverage(pp, plan.moves);
  const b = priorityBudget(pp, plan.moves, plan.today, plan.monthDays);
  const missing = missingFor(pp, plan.moves, REQUIREMENTS, plan.overlay, plan.f.builders);
  const [drill, setDrill] = useState(false);
  const [open, setOpen] = useState(false);
  const id = useId();
  const nameId = `${id}-name`;
  const compactFact = cov.gap > 0
    ? `${pp.goal.actual.kind === "unknown" ? "לא ידוע" : (pp.goal.actual as { value: number }).value}/${pp.goal.target} · ${all.length} מהלכים · חסרות ${cov.gap} בכיסוי`
    : pp.statusReasonShort ?? pp.statusReason;
  const rank = pp.rank;
  return (
    <article className={cx("f-pl-pri", collapsed && !open && "f-pl-pri--collapsed", rank > 1 && !open && "f-pl-pri--mcompact")} aria-labelledby={nameId}>
      {/* one-line form: mobile for priorities after the first; desktop when collapsed (on track, nothing to do, > 3 priorities) */}
      <div className="f-pl-pri__compact">
        <button type="button" className="f-pl-pri__compactbtn f-hit" aria-expanded={false} onClick={() => setOpen(true)}>
          <b className="f-pl-pri__cname">{p.name}</b>
          <PriorityStatusChip status={pp.status} size="sm" />
          <span className="f-pl-pri__cfact">{compactFact}</span>
        </button>
        {action.href && <Link href={action.href} className="f-pl-pri__clink">{action.label} <span aria-hidden>‹</span></Link>}
      </div>

      <div className="f-pl-pri__full">
        <div className="f-pl-pri__col f-pl-pri__what">
          <div className="f-pl-pri__head">
            <span className="f-pl-label">מה מקדמים · {rank}</span>
            <h2 id={nameId} className="f-pl-pri__name">{p.name}</h2>
            <span className="f-pl-meta">{p.description}</span>
          </div>
          <GoalLine pp={pp} />
          <div className="f-pl-pri__status">
            <PriorityStatusChip status={pp.status} />
            <span className="f-pl-reason">{pp.statusReason}</span>
          </div>
          <button type="button" className="f-pl-drillbtn f-hit" aria-expanded={drill} aria-controls={drill ? `${id}-drill` : undefined} onClick={() => setDrill((v) => !v)}>
            {drill ? "הסתר פרטים" : "פרטים"} <span aria-hidden>{drill ? "▴" : "▾"}</span>
          </button>
        </div>

        <div className="f-pl-pri__col f-pl-pri__moves">
          <span className="f-pl-label">מהלכים וכיסוי</span>
          {shown.length ? (
            <ul className="f-pl-mrows" aria-label={`מהלכים · ${p.name}`}>
              {shown.map((m) => <MoveRow key={m.id} m={m} pp={pp} plan={plan} />)}
            </ul>
          ) : <p className="f-pl-meta">אין פעילות השבוע במהלכים של הנושא.</p>}
          <CoverageBar pp={pp} moves={all} cov={cov} />
        </div>

        <aside className="f-pl-pri__col f-pl-pri__side" aria-label={`מצב · ${p.name}`}>
          <div className="f-pl-kv">
            <span className="f-pl-label">תקציב</span>
            <span className="f-pl-kv__v"><Money v={pp.allocation} strong /> · נוצל {b.spent != null ? <Money v={b.spent} /> : <Unknown strong />}{b.spent != null && b.spentUnknown && " + לא ידוע"}</span>
          </div>
          <div className="f-pl-kv">
            <span className="f-pl-label">מה חסר</span>
            {missing.missing.length
              ? <span className="f-pl-kv__v">{missing.missing[0].text}{missing.missing[0].day != null && `, עד ${missing.missing[0].day}.10`}{missing.missing.length > 1 && <span className="f-pl-meta"> · ועוד {missing.missing.length - 1}</span>}</span>
              : <span className="f-pl-kv__v f-pl-meta">אין</span>}
            {missing.awaiting.length > 0 && <span className="f-pl-awaiting">ממתין לאישור (קיים): {missing.awaiting.join(" · ")}</span>}
          </div>
          <div className="f-pl-kv f-pl-kv--act">
            <span className="f-pl-label">מה עושים עכשיו</span>
            <ActionButton a={action} block />
          </div>
        </aside>
      </div>

      <div id={`${id}-drill`} className="f-pl-drill" hidden={!drill}>
        <Drill pp={pp} moves={all} plan={plan} />
      </div>
      {rank > 1 && open && <button type="button" className="f-pl-pri__fold f-hit" onClick={() => setOpen(false)}>קפל</button>}
    </article>
  );
}

function MoveRow({ m, pp, plan }: { m: Move; pp: PriorityPlan; plan: PlanApi }) {
  const note = moveNote(m, plan.overlay, plan.f.builders, REQUIREMENTS, plan.readinessOf(m));
  return (
    <li className="f-pl-mrow">
      <b className="f-pl-mrow__name">{m.longName}</b>
      <span className="f-pl-mrow__state">
        <MoveStateTag state={m.state} />
        {m.attention && <AttentionTag reason={m.attention} short />}
        {m.optimizing && <OptimizingTag text={m.optimizing} />}
      </span>
      <span className="f-pl-mrow__exp"><Num>{expectedText(pp, m.expected)}</Num></span>
      <span className={cx("f-pl-mrow__note", note.tone === "amber" && "f-pl-amber", note.tone !== "amber" && "f-pl-meta")}>{note.text}</span>
    </li>
  );
}

function Drill({ pp, moves, plan }: { pp: PriorityPlan; moves: Move[]; plan: PlanApi }) {
  const p = priorityOf(pp.priorityId);
  const assets = ASSET_SUMMARIES.find((a) => a.priorityId === pp.priorityId);
  // every open need of the priority: the planning kinds the Plan resolves, the build-level kinds it only surfaces
  const needs = [...openNeeds(pp, plan.moves), ...derivedNeeds(pp, plan.moves, REQUIREMENTS, plan.overlay, plan.f.builders)];
  return (
    <dl className="f-pl-drill__grid">
      <div><dt>בעלים</dt><dd>{personName(p.ownerId)}</dd></div>
      <div><dt>תקופה</dt><dd>אוקטובר 2026 · חודש קלנדרי</dd></div>
      <div><dt>ערוצים</dt><dd>{[...new Set(moves.map((m) => m.channelLabel))].join(" · ")}</dd></div>
      <div><dt>נכסים</dt><dd>{assets ? `${assets.total} נכסים, ${assets.active} פעילים` : "—"}</dd></div>
      <div className="f-pl-drill__wide"><dt>למה עכשיו</dt><dd>{p.whyNow}</dd></div>
      <div><dt>מקור מדידה</dt><dd>{pp.goal.source ? `${pp.goal.source.label} · ${pp.goal.source.directness === "direct" ? "ישיר" : pp.goal.source.directness === "assisted" ? "בשיוך" : "הערכה"}` : <Unknown>אין מקור מדידה</Unknown>}</dd></div>
      <div><dt>יעדים משניים</dt><dd>{pp.secondaryGoals.length ? pp.secondaryGoals.join(" · ") : "—"}</dd></div>
      <div className="f-pl-drill__wide"><dt>בריאות (0–100)</dt><dd>{moves.map((m) => `${m.name}: ${m.healthScore ?? "לא ידוע"}`).join(" · ")}</dd></div>
      <div className="f-pl-drill__wide"><dt>צרכים פתוחים</dt><dd>{needs.length ? needs.map((n) => `${n.title} (${n.resolver ?? NEED_RESOLVER[n.kind]})`).join(" · ") : "אין"}</dd></div>
      <div className="f-pl-drill__wide"><dt>יומן שינויים</dt><dd>{pp.changeLog.map((c) => `${Number(c.at.slice(8))}.${Number(c.at.slice(5, 7))} · ${c.text}`).join(" · ")}</dd></div>
    </dl>
  );
}

function AddPriority({ plan }: { plan: PlanApi }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const id = useId();
  const close = () => { setOpen(false); setName(""); setDesc(""); setErr(null); };
  return (
    <>
      <button type="button" className="f-pl-addpri f-hit" onClick={() => setOpen(true)}>+ נושא לקידום</button>
      <Dialog open={open} onClose={close} labelledBy={`${id}-t`} className="f-pl-dlg" initialFocus="input">
        <form className="f-pl-dlg__body" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) { setErr("חובה לכתוב מה מקדמים"); return; } plan.addPriority(name.trim(), desc.trim()); close(); }}>
          <h2 id={`${id}-t`} className="f-pl-dlg__title">נושא חדש לקידום</h2>
          <p className="f-pl-meta">נושא מוצע נכנס לתוכנית במצב &quot;מוצע&quot;. יעד, תקציב ומהלכים נקבעים לפני שבעלים מפעיל אותו.</p>
          <TextField label="מה מקדמים" value={name} onChange={(e) => { setName(e.target.value); setErr(null); }} error={err} />
          <TextAreaField label="תיאור קצר" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          <div className="f-pl-dlg__actions">
            <Button type="submit" variant="strong">הוסף כמוצע</Button>
            <Button variant="quiet" onClick={close}>ביטול</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

/** Next period (November): empty until copied; a copy is a draft with goals and no moves yet. */
function NextPeriod({ plan }: { plan: PlanApi }) {
  const copied = plan.overlay.copiedPeriods.includes("2026-11");
  if (!copied) {
    return (
      <EmptyState
        className="f-pl-empty"
        glyph="○"
        title="עוד אין נושאים לקידום בנובמבר"
        hint={<>תובנות מציעה: &quot;אירועים עסקיים&quot; (פער ₪24K, הערכה). העתק מאוקטובר או בחר.</>}
        action={<Button variant="strong" onClick={() => plan.copyPeriod("2026-11")}>העתק מאוקטובר</Button>}
      />
    );
  }
  return (
    <div className="f-pl-copied">
      <Banner kind="done" live title="הועתק מאוקטובר כטיוטה" detail="היעדים הועתקו; מהלכים ותקציב נקבעים מחדש. שום דבר לא פעיל עד שבעלים מאשר את התוכנית." />
      <ol className="f-pl-list" aria-label="מה מקדמים בנובמבר (טיוטה)">
        {PLAN_OCTOBER.priorities.map((pp) => (
          <li key={pp.priorityId}>
            <article className="f-pl-pri f-pl-pri--proposed" aria-label={`${priorityOf(pp.priorityId).name} · טיוטה`}>
              <div className="f-pl-proposed">
                <span className="f-pl-chip f-pl-chip--draft">טיוטה</span>
                <b className="f-pl-pri__name">{priorityOf(pp.priorityId).name}</b>
                <span className="f-pl-meta">יעד מאוקטובר: <Num>{pp.goal.unit === "ils" ? `₪${pp.goal.target.toLocaleString("en-US")}` : pp.goal.target}</Num> {pp.goal.unit === "ils" ? "" : pp.goal.metricLabel}</span>
                <span className="f-pl-proposed__spacer" />
                <span className="f-pl-meta">תקציב: <Unknown /> · מהלכים: 0</span>
              </div>
            </article>
          </li>
        ))}
      </ol>
      <DemoNote>טיוטת נובמבר נשמרת רק בדפדפן הזה (נתוני הדגמה)</DemoNote>
      <Link href={R.plan} className="f-pl-link">חזרה לאוקטובר ‹</Link>
    </div>
  );
}
