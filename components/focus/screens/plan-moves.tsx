"use client";

import Link from "@/components/focus/ui/link";
import { Suspense, useId, useState } from "react";
import type { Move, PriorityPlan, Recommendation } from "@/lib/focus/contracts/plan";
import { PLAN_OCTOBER, RECOMMENDATIONS } from "@/lib/focus/fixtures/plan";
import { CLIENTS, PEOPLE, personName } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { ROUTE_WORD, coverage, movesOf, openNeeds, readingSpend } from "@/lib/focus/state/plan";
import { Button, ButtonLink } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { SelectField, TextAreaField } from "@/components/focus/ui/field";
import { cx } from "@/components/focus/ui/cx";
import { useToast } from "@/components/focus/ui/toast";
import { CoverageBar, HealthChip, Money, MoveStateTag, Num, OptimizingTag, PlanFrame, PriorityStatusChip, ReadingText, WeekNote, usePlanParams } from "@/components/focus/patterns/plan/plan-parts";
import { awaitingCreatives, dayLabel, expectedText, priorityOf, weekMoveIds } from "@/components/focus/patterns/plan/plan-view";
import { CreateMovePanel } from "@/components/focus/patterns/plan/create-move";
import { ReadinessLine } from "@/components/focus/patterns/plan/readiness";
import { usePlan, type PlanApi } from "@/components/focus/patterns/plan/use-plan";

/**
 * Moves / Campaign Map (design package #s5): do our moves cover the goal, and which one needs a hand? Per Priority:
 * planned contribution (stacked by move) and actual progress as two separate bars, one row per move with lifecycle,
 * budget, health in words, contribution (expected / actual), the main issue and one recommended change (accept /
 * dismiss — routed to the owner of what it changes), and the plan need with "+ צור מהלך". Platform metrics, health
 * scores and evidence stay in the drill-down.
 */
export default function PlanMovesScreen() {
  return <Suspense fallback={null}><Moves /></Suspense>;
}

function Moves() {
  const plan = usePlan();
  const { period, week } = usePlanParams();
  if (period.month !== "2026-10") return <PlanFrame view="moves"><p className="f-pl-meta">לתוכנית של נובמבר עוד אין מהלכים. <Link className="f-pl-link" href={`${R.plan}?period=2026-11`}>למה מקדמים בנובמבר ‹</Link></p></PlanFrame>;
  const pendingRecs = plan.moves.filter((m) => m.recommendationId).length;
  const alerts = PLAN_OCTOBER.priorities.reduce((n, pp) => n + openNeeds(pp, plan.moves).length, 0) + plan.moves.filter((m) => m.attention).length;
  const weekIds = week ? weekMoveIds(plan.moves, plan.dayItems) : null;
  return (
    <PlanFrame view="moves" controls={<span className="f-pl-meta">{alerts} התראות כיסוי · {pendingRecs} המלצות ממתינות</span>}>
      {week && <WeekNote>מוצגים מהלכים עם פעילות השבוע; הכיסוי נשאר חודשי.</WeekNote>}
      {PLAN_OCTOBER.priorities.map((pp) => <PriorityMap key={pp.priorityId} pp={pp} plan={plan} weekIds={weekIds} />)}
      <CreateMovePanel view="moves" />
    </PlanFrame>
  );
}

function PriorityMap({ pp, plan, weekIds }: { pp: PriorityPlan; plan: PlanApi; weekIds: Set<string> | null }) {
  const p = priorityOf(pp.priorityId);
  const all = movesOf(pp, plan.moves);
  const moves = weekIds ? all.filter((m) => weekIds.has(m.id)) : all;
  const cov = coverage(pp, plan.moves);
  const needs = openNeeds(pp, plan.moves).filter((n) => n.kind === "coverage_gap");
  const nothingToDo = !needs.length && !all.some((m) => m.recommendationId || m.attention || awaitingCreatives(m, plan.overlay, plan.f.builders));
  const [open, setOpen] = useState(!nothingToDo);
  const headId = useId();
  const a = pp.goal.actual;
  const actualPct = a.kind === "known" || a.kind === "estimated" ? Math.min(100, (a.value / pp.goal.target) * 100) : null;

  if (!open) {
    return (
      <section className="f-pl-map f-pl-map--collapsed" aria-labelledby={headId}>
        <button type="button" className="f-pl-map__collapsed f-hit" aria-expanded={false} onClick={() => setOpen(true)}>
          <b id={headId} className="f-pl-map__cname">{p.name}</b>
          <span>יעד <Num>{expectedText(pp, pp.goal.target)}</Num></span>
          <PriorityStatusChip status={pp.status} size="sm" />
          <span className="f-pl-meta">{all.length} מהלכים · {pp.goal.actual.kind === "unknown" ? "אין מקור מדידה ליעד, אז אין \"בפועל\"" : "אין שינוי נדרש"}</span>
          <span className="f-pl-map__chev" aria-hidden>‹</span>
        </button>
      </section>
    );
  }

  return (
    <section className="f-pl-map" aria-labelledby={headId}>
      <div className="f-pl-map__head">
        <div className="f-pl-map__title">
          <h2 id={headId} className="f-pl-map__name">{p.name}</h2>
          <span>יעד <Num strong>{expectedText(pp, pp.goal.target)}</Num> · <PriorityStatusChip status={pp.status} size="sm" /></span>
          {nothingToDo && <button type="button" className="f-pl-linkbtn f-hit" onClick={() => setOpen(false)}>קפל</button>}
        </div>
        <div className="f-pl-map__bars">
          <CoverageBar pp={pp} moves={all} cov={cov} labels showActual={false} />
          <div className="f-pl-map__actual">
            <span className="f-pl-meta">בפועל עד היום: <ReadingText r={a} pp={pp} /></span>
            {actualPct != null
              ? <span className="f-pl-bar f-pl-bar--thin" role="meter" aria-label={`בפועל מתוך היעד · ${p.name}`} aria-valuemin={0} aria-valuemax={pp.goal.target} aria-valuenow={(a as { value: number }).value}><span className="f-pl-bar__fill" style={{ width: `${actualPct}%` }} /></span>
              : <span className="f-pl-bar f-pl-bar--thin f-pl-bar--unknown" aria-hidden />}
          </div>
        </div>
      </div>
      <div className="f-pl-tablewrap">
        <table className="f-pl-table">
          <caption className="f-sr">מהלכים · {p.name}</caption>
          <thead>
            <tr><th scope="col">מהלך</th><th scope="col">מצב</th><th scope="col">תקציב · מתוכנן / נוצל</th><th scope="col">בריאות</th><th scope="col">תרומה · צפוי / בפועל</th><th scope="col">הבעיה המרכזית</th><th scope="col">שינוי מומלץ</th></tr>
          </thead>
          <tbody>
            {moves.map((m) => <MoveRow key={m.id} m={m} pp={pp} plan={plan} />)}
          </tbody>
        </table>
      </div>
      {needs.map((n) => (
        <div key={n.id} className="f-pl-need">
          <span className="f-pl-chip f-pl-chip--need">צורך בתוכנית</span>
          <span className="f-pl-need__text"><b>{n.title}</b> <span className="f-pl-meta">{n.detail}</span></span>
          <ButtonLink href={R.planCreateMove(n.id, "moves")} variant="strong" size="sm">+ צור מהלך</ButtonLink>
        </div>
      ))}
      <Comparison pp={pp} moves={all} />
    </section>
  );
}

function MoveRow({ m, pp, plan }: { m: Move; pp: PriorityPlan; plan: PlanApi }) {
  const toast = useToast();
  const rec = m.recommendationId ? RECOMMENDATIONS.find((r) => r.id === m.recommendationId) : undefined;
  const decided = Object.entries(plan.overlay.recs).find(([id]) => RECOMMENDATIONS.find((r) => r.id === id)?.moveId === m.id);
  const { spent, unknown } = readingSpend(m.budget.spent);
  const awaiting = awaitingCreatives(m, plan.overlay, plan.f.builders);
  const ready = m.state === "building" || m.state === "ready_for_review" || m.state === "approved" ? plan.readinessOf(m) : null;
  const [dlg, setDlg] = useState<"accept" | "dismiss" | null>(null);

  const start = () => {
    if (!plan.setMoveState(m.id, "building")) return;
    const t = plan.demo.createTask({ title: `בניית ${m.longName}`, dueDate: `2026-10-${String(m.startDay ?? 12).padStart(2, "0")}`, priority: "medium", assigneeId: m.ownerId, context: { client: CLIENTS.umino.name }, nextAction: "להכין את המהלך לבדיקה" });
    toast.push({ kind: "success", title: `${m.longName} עבר לבנייה`, detail: `נוצרה משימה בעבודה: ${t.title}` });
  };

  return (
    <tr id={`move-${m.id}`} className="f-pl-trow">
      <th scope="row"><b>{m.name}</b><span className="f-pl-meta">{m.sub}</span></th>
      <td><span className="f-pl-cellstack"><MoveStateTag state={m.state} />{m.optimizing && <OptimizingTag text={m.optimizing} />}</span></td>
      <td><bdi dir="ltr" className="f-pl-pair"><Money v={m.budget.planned} /> / {spent != null ? <Money v={spent} /> : unknown ? <b>לא ידוע</b> : <span className="f-pl-faint">—</span>}</bdi>{m.budget.manualAt && <span className="f-pl-est"> ידני {Number(m.budget.manualAt.slice(8))}.10</span>}</td>
      <td><HealthChip health={m.health} state={m.state} />{m.attention && <span className="f-sr"> · {m.attention}</span>}</td>
      <td><bdi dir="ltr" className="f-pl-pair"><Num>{pp.goal.unit === "ils" ? `₪${Math.round(m.expected / 1000)}K` : m.expected}</Num> / {m.actual && m.actual.kind !== "unknown" && m.actual.kind !== "unavailable" ? <Num>{m.actual.value}</Num> : m.actual ? <b>לא ידוע</b> : <span className="f-pl-faint">—</span>}</bdi>{m.actual?.kind === "estimated" && <span className="f-pl-est"> הערכה</span>}</td>
      <td className="f-pl-issue">{m.mainIssue ?? <span className="f-pl-faint">—</span>}</td>
      <td>
        {rec && (
          <div className="f-pl-rec">
            <span className="f-pl-rec__text">{rec.text}</span>
            <Button size="sm" variant="strong" onClick={() => setDlg("accept")}>קבל</Button>
            <Button size="sm" variant="quiet" onClick={() => setDlg("dismiss")}>דחה</Button>
            <RecDialog rec={rec} m={m} mode={dlg} onClose={() => setDlg(null)} plan={plan} />
          </div>
        )}
        {!rec && decided && (
          <span className="f-pl-meta">{decided[1].decision === "accepted" ? <>התקבל · נוצרו {decided[1].taskIds?.length ?? 0} משימות · <Link className="f-pl-link" href={R.work}>לעבודה</Link></> : <>נדחה · {decided[1].reason}</>}</span>
        )}
        {!rec && !decided && m.builderId && (m.state === "building" || m.state === "ready_for_review" || m.state === "approved") && (
          <div className="f-pl-rec">
            {ready ? <ReadinessLine r={ready} /> : <span className="f-pl-rec__text">{awaiting > 0 ? "אשר קריאייטיבים" : m.state === "approved" ? "השקה ידנית" : "המשך בנייה"}</span>}
            <ButtonLink size="sm" variant="secondary" href={`${R.planBuilder(m.builderId)}${awaiting > 0 ? "#creative" : ready && ready.overall !== "approved" ? "#readiness" : ""}`}>פתח בונה</ButtonLink>
          </div>
        )}
        {!rec && !decided && m.state === "planned" && (
          m.builderId
            ? <div className="f-pl-rec"><span className="f-pl-rec__text">בנה את המהלך{m.buildStartDay ? ` · מ־${dayLabel(m.buildStartDay)}` : ""}</span><ButtonLink size="sm" variant="secondary" href={R.planBuilder(m.builderId)}>פתח בונה</ButtonLink></div>
            : <div className="f-pl-rec"><span className="f-pl-rec__text">בנה את המהלך{m.buildStartDay ? ` · מ־${dayLabel(m.buildStartDay)}` : ""}</span><Button size="sm" variant="secondary" onClick={start}>התחל</Button></div>
        )}
        {!rec && !decided && m.state === "live" && !m.builderId && <span className="f-pl-meta">אין שינוי נדרש</span>}
      </td>
    </tr>
  );
}

/** Accept → preview the tasks it creates (owner and date editable) · Dismiss → keep the reason. */
function RecDialog({ rec, m, mode, onClose, plan }: { rec: Recommendation; m: Move; mode: "accept" | "dismiss" | null; onClose: () => void; plan: PlanApi }) {
  const toast = useToast();
  const id = useId();
  const [tasks, setTasks] = useState(rec.tasks.map((t) => ({ ...t, ownerId: t.ownerId, dueDay: t.dueDay })));
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const accept = () => {
    const created = tasks.map((t) => plan.demo.createTask({ title: t.title, dueDate: `2026-10-${String(t.dueDay).padStart(2, "0")}`, priority: "high", assigneeId: t.ownerId, context: { client: CLIENTS.umino.name }, nextAction: rec.text }));
    plan.decideRec(rec.id, "accepted", { taskIds: created.map((t) => t.id) });
    toast.push({ kind: "success", title: "ההמלצה התקבלה", detail: `${created.length} משימות נוצרו בעבודה · ${ROUTE_WORD[rec.route]}` });
    onClose();
  };
  const dismiss = () => {
    if (!reason.trim()) { setErr("חובה לכתוב למה דוחים"); return; }
    plan.decideRec(rec.id, "dismissed", { reason: reason.trim() });
    toast.push({ title: "ההמלצה נדחתה", detail: "הסיבה נשמרה; היא לא תוצע שוב אלא אם הראיות ישתנו." });
    onClose();
  };
  const people = [PEOPLE.ron, PEOPLE.dana, PEOPLE.yoav].map((p) => ({ value: p.id, label: p.name }));
  const days = Array.from({ length: 24 }, (_, i) => ({ value: String(i + 8), label: `${i + 8}.10` }));
  return (
      <Dialog open={mode !== null} onClose={onClose} labelledBy={`${id}-t`} className="f-pl-dlg f-pl-dlg--wide">
        <div className="f-pl-dlg__body">
          <h2 id={`${id}-t`} className="f-pl-dlg__title">{mode === "accept" ? `לקבל: ${rec.text}?` : `לדחות: ${rec.text}?`}</h2>
          <p className="f-pl-meta">{m.longName} · {ROUTE_WORD[rec.route]}</p>
          <p className="f-pl-note"><b>ראיות · </b>{rec.evidence}</p>
          {mode === "accept" && (
            <fieldset className="f-pl-tasks">
              <legend className="f-pl-h3">המשימות שייווצרו בעבודה</legend>
              {tasks.map((t, i) => (
                <div key={t.title} className="f-pl-tasks__row">
                  <span className="f-pl-tasks__title">{t.title}</span>
                  <SelectField label="בעלים" value={t.ownerId} options={people} onChange={(e) => setTasks((ts) => ts.map((x, j) => (j === i ? { ...x, ownerId: e.target.value } : x)))} />
                  <SelectField label="יעד" value={String(t.dueDay)} options={days} onChange={(e) => setTasks((ts) => ts.map((x, j) => (j === i ? { ...x, dueDay: Number(e.target.value) } : x)))} />
                </div>
              ))}
              <p className="f-pl-meta">אף שינוי לא נשלח ל־{m.channelLabel} מכאן: ב־V1 המשימה מבוצעת ידנית בפלטפורמה.</p>
            </fieldset>
          )}
          {mode === "dismiss" && <TextAreaField label="למה דוחים" value={reason} onChange={(e) => { setReason(e.target.value); setErr(null); }} error={err} rows={2} />}
          <div className="f-pl-dlg__actions">
            {mode === "accept" ? <Button variant="strong" onClick={accept}>קבל וצור {tasks.length} משימות</Button> : <Button variant="strong" onClick={dismiss}>דחה</Button>}
            <Button variant="quiet" onClick={onClose}>ביטול</Button>
            <span className="f-pl-meta">{mode === "accept" ? `בעלים ברירת מחדל: ${personName(m.ownerId)}` : ""}</span>
          </div>
        </div>
      </Dialog>
  );
}

/** Channel comparison only when both readings are at least estimated; otherwise say why it can't be made. */
function Comparison({ pp, moves }: { pp: PriorityPlan; moves: Move[] }) {
  const paid = moves.filter((m) => m.state === "live" || m.state === "building" || m.state === "approved");
  if (paid.length < 2) return null;
  const cost = (m: Move) => {
    const { spent } = readingSpend(m.budget.spent);
    if (spent == null || !m.actual || (m.actual.kind !== "known" && m.actual.kind !== "estimated") || m.actual.value === 0) return null;
    return { value: Math.round(spent / m.actual.value), kind: m.actual.kind };
  };
  const rows = paid.map((m) => ({ m, c: cost(m) }));
  const missing = rows.filter((r) => !r.c);
  const unitWord = pp.goal.unit === "qualified_leads" ? "לליד מוסמך" : pp.goal.unit === "bookings" ? "להזמנה" : "ליחידה";
  return (
    <div className={cx("f-pl-compare")}>
      <b>השוואת ערוצים</b>
      {missing.length
        ? <span className="f-pl-meta">לא ניתן להשוות עדיין: ל־{missing.map((r) => r.m.name).join(", ")} אין נתונים. {rows.filter((r) => r.c).map((r) => <span key={r.m.id}>{r.m.name}: <Num>₪{r.c!.value}</Num> {unitWord} ({r.c!.kind === "known" ? "ידוע" : "הערכה"}). </span>)}</span>
        : <span className="f-pl-meta">{rows.map((r, i) => <span key={r.m.id}>{i > 0 && " · "}{r.m.name}: <Num>₪{r.c!.value}</Num> {unitWord} ({r.c!.kind === "known" ? "ידוע" : "הערכה"})</span>)}</span>}
    </div>
  );
}
