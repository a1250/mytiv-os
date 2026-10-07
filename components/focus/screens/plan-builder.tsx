"use client";

import Link from "@/components/focus/ui/link";
import { useId, useState } from "react";
import type { BuilderDecision, BuilderProposal, DecisionKey, Move, MoveState } from "@/lib/focus/contracts/plan";
import { BUILDERS, PLAN_OCTOBER, REQUIREMENTS } from "@/lib/focus/fixtures/plan";
import { CLIENTS } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { fmtMoney } from "@/lib/focus/format";
import { budgetOverflow, coverage, dailyBudget, expectedRange, isHttpsUrl, moveState, sendBlocked, unverifiedClaim } from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { Banner } from "@/components/focus/ui/feedback";
import { SelectField, TextAreaField, TextField } from "@/components/focus/ui/field";
import { cx } from "@/components/focus/ui/cx";
import { useToast } from "@/components/focus/ui/toast";
import { useNavGuard } from "@/components/focus/shell/nav-guard";
import { CoverOptions } from "@/components/focus/patterns/plan/cover-options";
import { DemoNote, Money, MoveStateTag, Num } from "@/components/focus/patterns/plan/plan-parts";
import { dayLabel, priorityOf } from "@/components/focus/patterns/plan/plan-view";
import { usePlan, type PlanApi } from "@/components/focus/patterns/plan/use-plan";

/**
 * Google / Meta Campaign Builder (design package #s9, #s9b, #s10): a review surface, not a platform form. The main
 * column holds five business decisions — what we promote, what result, who, how much, is the proposal acceptable — all
 * pre-filled from the Plan, the Business Brain, the Asset Library and earlier moves. Platform settings (structure,
 * keywords, bidding, placements, tracking…) sit behind "פרטים לבדיקה · לא חובה". "שנה" opens a side panel with the
 * current proposal, the change, the context and the impact; only low-risk fields edit inline. Builders never publish:
 * "שלח לאישור" → owner approval → ready; in V1 a person launches by hand and marks the move live with the platform link.
 */
const STEPS = ["צורך", "ערוץ", "הצעה", "בדיקה", "אישור", "מוכן"] as const;
const stepIndex = (s: MoveState) => (s === "building" || s === "idea" || s === "planned" ? 2 : s === "waiting_approval" ? 4 : s === "approved" ? 5 : 6);

export default function PlanBuilderScreen({ builderId }: { builderId: string }) {
  const b = BUILDERS.find((x) => x.id === builderId)!;
  const plan = usePlan();
  const move = [...plan.f.moves, ...plan.f.proposed].find((m) => m.id === b.moveId)!;
  const state = moveState(move, plan.overlay);
  const toast = useToast();
  const [panel, setPanel] = useState<DecisionKey | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [liveDlg, setLiveDlg] = useState(false);
  const p = priorityOf(b.priorityId);
  const blocked = sendBlocked(b, state === "idea" ? "building" : state);
  const si = stepIndex(state);
  const awaiting = (b.creatives ?? []).filter((c) => (plan.overlay.creatives[c.id] ?? c.availability) === "awaiting_approval");

  const send = () => {
    if (blocked) return;
    if (!plan.setMoveState(move.id, "waiting_approval")) return;
    if (b.preLaunchTask) {
      const t = plan.demo.createTask({ title: b.preLaunchTask, dueDate: `2026-10-${String(Math.max(8, b.launchDay - 1)).padStart(2, "0")}`, priority: "high", assigneeId: move.ownerId, context: { client: CLIENTS.umino.name }, nextAction: "לבדוק את אירוע ההמרה לפני ההשקה" });
      toast.push({ kind: "success", title: "נשלח לאישור בעלים", detail: `נוצרה משימה בעבודה: ${t.title}` });
    } else {
      toast.push({ kind: "success", title: "נשלח לאישור בעלים", detail: awaiting.length ? `${awaiting.length} קריאייטיבים ממתינים נכללו בבקשה` : b.title });
    }
  };
  const approve = () => {
    if (!plan.setMoveState(move.id, "approved")) return;
    for (const c of awaiting) plan.setCreative(c.id, "approved");
    toast.push({ kind: "success", title: "אושר · מוכן להשקה", detail: "ב־V1 ההשקה ידנית: העלו בפלטפורמה וסמנו כאן \"פעיל\" עם הקישור." });
  };

  return (
    <div className="f-pl-builder">
      <header className="f-pl-bhead">
        <Link href={R.plan} className="f-pl-back f-hit" aria-label="חזרה לתוכנית">›</Link>
        <nav aria-label="פירורי לחם" className="f-pl-crumbs"><Link href={R.plan} className="f-pl-meta">תוכנית</Link><span className="f-pl-meta" aria-hidden>›</span><Link href={R.planMoves} className="f-pl-meta">{p.name}</Link><span className="f-pl-meta" aria-hidden>›</span></nav>
        <h1 className="f-pl-bhead__title">{b.title}</h1>
        <MoveStateTag state={state} chip />
        <span className="f-pl-bhead__spacer" />
        <ol className="f-pl-steps" aria-label="שלבי המהלך">
          {STEPS.map((s, i) => <li key={s} className={cx(i < si && "f-pl-steps__done", i === si && "f-pl-steps__now")} aria-current={i === si ? "step" : undefined}>{i < si && <span aria-hidden>✓ </span>}{s}{i < si && <span className="f-sr"> · הושלם</span>}</li>)}
        </ol>
      </header>

      <div className="f-pl-bbody">
        {b.blocked && <Banner kind="error" live={false} title={`חסום · ${b.blocked}`} detail={<>קידום ממומן לנושא חסום. &quot;שלח לאישור&quot; לא זמין עד אימות. <Link className="f-pl-link" href={R.clientBrain("umino")}>פתח במוח העסק ‹</Link></>} />}
        {state === "idea" && <Banner kind="processing" live={false} title="ההצעה מוכנה, המהלך עוד לא בתוכנית" detail="התחילו לבנות כדי שייכנס לתוכנית במצב &quot;בבנייה&quot;." action={<Button size="sm" variant="strong" onClick={() => plan.setMoveState(move.id, "building")}>הוסף לתוכנית ובנה</Button>} />}
        <div className={cx("f-pl-bgrid", b.channel === "meta" && "f-pl-bgrid--meta")}>
          <div className="f-pl-bmain">
            <p className="f-pl-meta f-pl-bintro">{b.intro}</p>
            {b.decisions.filter((d) => b.channel === "google" || d.key !== "acceptable").map((d) => (
              <DecisionCard key={d.key} b={b} d={d} plan={plan} move={move} onChange={() => setPanel(d.key)} editable={state === "building" || state === "idea"} />
            ))}
            {b.creatives && <CreativeStrip b={b} plan={plan} onReplace={setCover} editable={state === "building" || state === "idea"} />}
          </div>
          <aside className="f-pl-bside" aria-label="פרטי ההצעה">
            {b.channel === "meta" && <Summary b={b} plan={plan} dark />}
            {b.preview && (
              <section className="f-pl-preview" aria-label="תצוגת מודעה">
                <span className="f-pl-h3">כך תיראה המודעה · 1 מתוך 3</span>
                <div className="f-pl-ad" dir="rtl" lang="he">
                  <span className="f-pl-ad__top"><b>ממומן</b> · <bdi dir="ltr">{b.preview.url}</bdi></span>
                  <span className="f-pl-ad__headline">{b.preview.headline}</span>
                  <span className="f-pl-ad__body">{b.preview.body}</span>
                </div>
                <span className="f-pl-meta">{b.preview.footer}</span>
              </section>
            )}
            <Details b={b} />
            {b.sideNote && <p className="f-pl-meta f-pl-sidenote">{b.sideNote}</p>}
          </aside>
        </div>
      </div>

      <footer className="f-pl-bdfoot">
        <span className="f-pl-bdfoot__note">{state === "live" ? <>פעיל · הושק ידנית{plan.overlay.launchLinks[move.id] && <> · <bdi dir="ltr" className="f-pl-url">{plan.overlay.launchLinks[move.id]}</bdi></>}</> : b.footerNote}</span>
        {(state === "building" || state === "idea") && <>
          <Button variant="quiet" onClick={() => toast.push({ title: "הטיוטה נשמרה", detail: "שינויים בבונה נשמרים בדפדפן הזה (נתוני הדגמה)." })}>שמור טיוטה</Button>
          {state === "idea"
            ? <Button variant="strong" disabled disabledReason="קודם הוסיפו את המהלך לתוכנית">שלח לאישור</Button>
            : <Button variant="strong" onClick={send} disabled={!!blocked} disabledReason={blocked ?? undefined}>שלח לאישור</Button>}
        </>}
        {state === "planned" && <>
          <Button variant="quiet" disabled disabledReason="קודם מתחילים לבנות">שלח לאישור</Button>
          <Button variant="strong" onClick={() => plan.setMoveState(move.id, "building")}>התחל לבנות</Button>
        </>}
        {state === "waiting_approval" && <>
          <DemoNote>אתה הבעלים: האישור כאן מדגים את זרימת האישורים</DemoNote>
          <Button variant="quiet" onClick={() => plan.setMoveState(move.id, "building")}>החזר לבנייה</Button>
          <Button variant="strong" onClick={approve}>אשר כבעלים</Button>
        </>}
        {state === "approved" && <>
          <DemoNote>שום דבר לא נשלח ל־{b.channel === "google" ? "Google" : "Meta"} מכאן</DemoNote>
          <Button variant="strong" onClick={() => setLiveDlg(true)}>סמן כפעיל</Button>
        </>}
      </footer>

      {panel && <ChangePanel b={b} k={panel} plan={plan} move={move} onClose={() => setPanel(null)} />}
      <CoverDialog b={b} creativeId={cover} plan={plan} onClose={() => setCover(null)} />
      <LiveDialog open={liveDlg} b={b} move={move} plan={plan} onClose={() => setLiveDlg(false)} />
    </div>
  );
}

/* ---------- decisions ---------- */

function useBudget(b: BuilderProposal, plan: PlanApi) {
  const e = plan.overlay.builders[b.id] ?? {};
  const amount = e.amount ?? b.budget.amount;
  const from = e.fromDay ?? b.budget.fromDay;
  const to = e.toDay ?? b.budget.toDay;
  return { amount, from, to, daily: dailyBudget(amount, from, to), range: expectedRange(amount, b.budget.costPerResult), source: e.budgetSource };
}

function decisionValue(b: BuilderProposal, d: BuilderDecision, plan: PlanApi) {
  const e = plan.overlay.builders[b.id]?.decisions?.[d.key];
  return { value: e?.value ?? d.value, detail: e?.detail ?? d.detail };
}

function DecisionCard({ b, d, plan, move, onChange, editable }: { b: BuilderProposal; d: BuilderDecision; plan: PlanApi; move: Move; onChange: () => void; editable: boolean }) {
  if (d.key === "acceptable") return <Summary b={b} plan={plan} />;
  return <DecisionBody b={b} d={d} plan={plan} move={move} onChange={onChange} editable={editable} />;
}

function DecisionBody({ b, d, plan, move, onChange, editable }: { b: BuilderProposal; d: BuilderDecision; plan: PlanApi; move: Move; onChange: () => void; editable: boolean }) {
  const id = useId();
  const v = decisionValue(b, d, plan);
  const bud = useBudget(b, plan);
  const overflow = budgetOverflow(bud.amount, b, plan.budget.unallocated);
  return (
    <section className="f-pl-dcard" aria-labelledby={`${id}-l`}>
      <h2 id={`${id}-l`} className="f-pl-dcard__label">{d.label}</h2>
      <div className="f-pl-dcard__value">
        {d.key === "budget" ? (
          <>
            <b><Money v={bud.amount} /> · <Num>{bud.from}–{bud.to}.10</Num> · כ־<Money v={bud.daily} /> ליום</b>
            {b.budget.fromUnallocated
              ? <span className="f-pl-amber">{overflow > 0 && bud.source ? `${fmtMoney(plan.budget.unallocated)} מהלא מוקצה + ${fmtMoney(overflow)} ${bud.source === "same_priority" ? "מ־Meta חשיפה (פעולת שיווק)" : "מנושא אחר (דורש אישור בעלים)"}` : "מהתקציב הלא מוקצה"} · יעבור לאישור תוכנית</span>
              : <span className="f-pl-meta">{b.budgetNote}</span>}
          </>
        ) : (
          <>
            <b>{v.value}</b>
            {d.chips && <span className="f-pl-chips">{d.chips.map((c) => <span key={c} className="f-pl-kw">{c}</span>)}<span className="f-pl-kw f-pl-kw--more">+21</span></span>}
            {d.key === "audience" && b.channel === "google" ? <HoursInline b={b} plan={plan} editable={editable} /> : v.detail && <span className={cx(d.warn ? "f-pl-red" : "f-pl-meta")}>{v.detail}</span>}
          </>
        )}
      </div>
      {editable && <button type="button" className="f-pl-change f-hit" onClick={onChange} aria-label={`שנה · ${d.label}`}>שנה</button>}
      <span className="f-sr">{move.longName}</span>
    </section>
  );
}

/** Low-risk inline edit: display hours (no money, audience or claim involved). */
function HoursInline({ b, plan, editable }: { b: BuilderProposal; plan: PlanApi; editable: boolean }) {
  const h = plan.overlay.builders[b.id]?.hours ?? { from: "14:00", to: "19:00" };
  const [edit, setEdit] = useState(false);
  const hours = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`).map((x) => ({ value: x, label: x }));
  if (!edit) return <span className="f-pl-meta">מוצג <Num>{h.from}–{h.to}</Num>, כל הימים {editable && <button type="button" className="f-pl-linkbtn f-hit" onClick={() => setEdit(true)}>ערוך שעות</button>}</span>;
  return (
    <span className="f-pl-hours-edit">
      <SelectField label="מ־" value={h.from} options={hours} onChange={(e) => plan.editBuilder(b.id, { hours: { ...h, from: e.target.value } })} />
      <SelectField label="עד" value={h.to} options={hours} onChange={(e) => plan.editBuilder(b.id, { hours: { ...h, to: e.target.value } })} />
      <Button size="sm" variant="secondary" onClick={() => setEdit(false)}>סיום</Button>
    </span>
  );
}

function Summary({ b, plan, dark }: { b: BuilderProposal; plan: PlanApi; dark?: boolean }) {
  const bud = useBudget(b, plan);
  return (
    <section className={cx("f-pl-dcard", "f-pl-dcard--accept", dark && "f-pl-dcard--dark")} aria-label="ההצעה מקובלת?">
      <h2 className="f-pl-dcard__label">ההצעה מקובלת?</h2>
      <div className="f-pl-dcard__value">
        <span>{b.summary} {bud.range ? <>צפי <b><Num>{bud.range.low}–{bud.range.high}</Num></b> {b.budget.resultWord}.</> : "צפי: לא ידוע (אין מקור מדידה)."}</span>
        {b.removedClaim && <span className={dark ? "f-pl-dark-meta" : "f-pl-meta"}>הוסר מההצעה: &quot;{b.removedClaim}&quot; · טענה שלא אושרה במוח העסק</span>}
      </div>
    </section>
  );
}

function Details({ b }: { b: BuilderProposal }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="f-pl-details" aria-label="פרטים לבדיקה">
      <h2 className="f-pl-details__head">פרטים לבדיקה · לא חובה</h2>
      <ul>
        {b.details.map((d) => (
          <li key={d.key} className={cx(d.problem && "f-pl-details__problem")}>
            <button type="button" className="f-pl-details__row f-hit" aria-expanded={open === d.key} onClick={() => setOpen(open === d.key ? null : d.key)}>
              <span>{d.problem ? <b>{d.label}</b> : d.label}</span>
              <span className={d.problem ? "f-pl-amber" : "f-pl-meta"}>{d.summary} <span aria-hidden>{open === d.key ? "▾" : "›"}</span></span>
            </button>
            {open === d.key && <ul className="f-pl-details__lines">{d.lines.map((l) => <li key={l}>{l}</li>)}</ul>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Meta creative strip ---------- */

function CreativeStrip({ b, plan, onReplace, editable }: { b: BuilderProposal; plan: PlanApi; onReplace: (id: string) => void; editable: boolean }) {
  const list = (b.creatives ?? []).map((c) => ({ ...c, a: plan.overlay.creatives[c.id] ?? c.availability }));
  const awaiting = list.filter((c) => c.a === "awaiting_approval").length;
  return (
    <section id="creative" className="f-pl-dcard f-pl-dcard--creative" aria-labelledby="creative-h" tabIndex={-1}>
      <div className="f-pl-creative__head"><h2 id="creative-h" className="f-pl-dcard__label">קריאייטיב · {list.length} אנכיים 9:16</h2>{awaiting > 0 && <span className="f-pl-amber">{awaiting} ממתינים לאישורך</span>}</div>
      <ul className="f-pl-creative">
        {list.map((c) => (
          <li key={c.id} className="f-pl-creative__item">
            <span className={cx("f-pl-creative__tile", c.origin !== "original" && "f-pl-creative__tile--ai")} role="img" aria-label={`${c.label} · ${c.origin === "original" ? "אמיתי" : "משופר AI"}`}>
              <span>{c.label} · {c.origin === "original" ? "אמיתי" : "משופר AI"}</span>
            </span>
            {c.a === "approved" && <span className="f-pl-good">✓ מאושר</span>}
            {c.a === "awaiting_approval" && (
              <span className="f-pl-creative__acts">
                <Button size="sm" variant="strong" block onClick={() => plan.setCreative(c.id, "approved")} aria-label={`אשר · ${c.label}`}>אשר</Button>
                {editable && <Button size="sm" variant="quiet" onClick={() => onReplace(c.id)} aria-label={`החלף · ${c.label}`}>החלף</Button>}
              </span>
            )}
            {c.a === "missing" && <span className="f-pl-red">חסר</span>}
          </li>
        ))}
      </ul>
      <span className="f-pl-meta">{b.creativeNote}</span>
    </section>
  );
}

function CoverDialog({ b, creativeId, plan, onClose }: { b: BuilderProposal; creativeId: string | null; plan: PlanApi; onClose: () => void }) {
  const toast = useToast();
  const c = b.creatives?.find((x) => x.id === creativeId);
  const base = REQUIREMENTS.find((r) => r.creativeIds?.includes(creativeId ?? ""));
  return (
    <Dialog open={!!c} onClose={onClose} variant="drawer" labelledBy="cv-t" className="f-pl-panel f-pl-panel--change">
      {c && base && (
        <div className="f-pl-panel__wrap">
          <div className="f-pl-panel__head">
            <div className="f-pl-panel__crumbrow"><span className="f-pl-meta">{b.title} · קריאייטיב</span><button type="button" className="f-pl-x f-hit" aria-label="סגירה" onClick={onClose}>×</button></div>
            <h2 id="cv-t" className="f-pl-panel__title">החלף · {c.label}</h2>
            <span className="f-pl-meta">{base.spec}</span>
          </div>
          <div className="f-pl-panel__body">
            <CoverOptions
              req={{ ...base, title: c.label, existingCandidates: [{ id: "as-hall-3", label: "אולם ערוך, ספטמבר", format: "4:5", note: "צריך התאמה ל־9:16" }], recommended: "ai_client", aiClientNote: "גרסה אנכית חדשה מנכס קיים של הלקוח. מסומן \"משופר AI\".", requestNote: "יוצר משימה עם בריף מוכן. בעלים: מנהלת התוכן" }}
              onChoose={(choice) => {
                if (choice === "request") {
                  plan.demo.createTask({ title: `בקשה מהלקוח: קריאייטיב חלופי · ${c.label}`, dueDate: "2026-10-10", priority: "high", context: { client: CLIENTS.umino.name } });
                  toast.push({ kind: "success", title: "נוצרה משימה בעבודה", detail: `קריאייטיב חלופי · ${c.label}` });
                } else {
                  plan.setCreative(c.id, "awaiting_approval");
                  toast.push({ title: "גרסה חלופית ממתינה לאישור", detail: `${c.label} · נשאר בבונה` });
                }
                onClose();
              }}
              onClear={() => undefined}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}

/* ---------- change panel ---------- */

function ChangePanel({ b, k, plan, move, onClose }: { b: BuilderProposal; k: DecisionKey; plan: PlanApi; move: Move; onClose: () => void }) {
  const d = b.decisions.find((x) => x.key === k)!;
  return (
    <Dialog open onClose={onClose} variant="drawer" labelledBy="chg-t" className="f-pl-panel f-pl-panel--change">
      {k === "budget" ? <BudgetChange b={b} plan={plan} move={move} onClose={onClose} /> : <TextChange b={b} d={d} plan={plan} onClose={onClose} />}
    </Dialog>
  );
}

function PanelHead({ b, title, onClose }: { b: BuilderProposal; title: string; onClose: () => void }) {
  return (
    <div className="f-pl-panel__head">
      <div className="f-pl-panel__crumbrow"><span className="f-pl-meta">{b.title}</span><button type="button" className="f-pl-x f-hit" aria-label="סגירה" onClick={onClose}>×</button></div>
      <h2 id="chg-t" className="f-pl-panel__title">{title}</h2>
    </div>
  );
}

function Context({ b }: { b: BuilderProposal }) {
  return (
    <dl className="f-pl-knows__grid f-pl-ctx">
      <dt>תוכנית</dt><dd>{b.context.plan}</dd>
      <dt>מוח העסק</dt><dd>{b.context.brain}</dd>
      <dt>מהלך קודם</dt><dd>{b.context.earlier}</dd>
    </dl>
  );
}

function BudgetChange({ b, plan, move, onClose }: { b: BuilderProposal; plan: PlanApi; move: Move; onClose: () => void }) {
  const cur = useBudget(b, plan);
  const [amount, setAmount] = useState(String(cur.amount));
  const [from, setFrom] = useState(String(cur.from));
  const [to, setTo] = useState(String(cur.to));
  const [source, setSource] = useState<"same_priority" | "other_priority" | undefined>(cur.source);
  const n = Number(amount.replace(/[,\s₪]/g, ""));
  const valid = Number.isFinite(n) && n > 0 && Number(from) <= Number(to);
  const overflow = valid ? budgetOverflow(n, b, plan.budget.unallocated) : 0;
  const range = valid ? expectedRange(n, b.budget.costPerResult) : null;
  const pp = PLAN_OCTOBER.priorities.find((x) => x.priorityId === b.priorityId)!;
  const cov = coverage(pp, plan.moves);
  const dirty = String(cur.amount) !== amount || String(cur.from) !== from || String(cur.to) !== to;
  useNavGuard({ dirty, what: `השינוי בתקציב של ${b.title} עוד לא הוחל.` });
  const days = Array.from({ length: 23 }, (_, i) => ({ value: String(i + 9), label: dayLabel(i + 9) }));
  const apply = () => {
    if (!valid || (overflow > 0 && !source)) return;
    plan.editBuilder(b.id, { amount: n, fromDay: Number(from), toDay: Number(to), budgetSource: overflow > 0 ? source : undefined });
    onClose();
  };
  // coverage without this move's own current contribution (it counts once it is in the plan)
  const plannedWithout = cov.planned - (moveState(move, plan.overlay) === "idea" ? 0 : move.expected);
  return (
    <div className="f-pl-panel__wrap">
      <PanelHead b={b} title="שנה · כמה משקיעים" onClose={onClose} />
      <div className="f-pl-panel__body">
        <div className="f-pl-kv"><span className="f-pl-h3">ההצעה הנוכחית</span><span><Money v={cur.amount} /> · <Num>{cur.from}–{cur.to}.10</Num> · כ־<Money v={cur.daily} /> ליום{cur.range && <> · צפי <Num>{cur.range.low}–{cur.range.high}</Num> {b.budget.resultWord}</>}</span></div>
        <div className="f-pl-form">
          <span className="f-pl-h3">מה משנים</span>
          <TextField label="סכום (₪)" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} error={amount && !(Number.isFinite(n) && n > 0) ? "סכום בשקלים" : null} />
          <div className="f-pl-2col">
            <SelectField label="מתאריך" value={from} options={days} onChange={(e) => setFrom(e.target.value)} />
            <SelectField label="עד תאריך" value={to} options={days} onChange={(e) => setTo(e.target.value)} error={Number(from) > Number(to) ? "תאריך הסיום לפני ההתחלה" : null} />
          </div>
        </div>
        <Context b={b} />
        <div className="f-pl-kv"><span className="f-pl-h3">השפעה</span>
          <span>{range ? <>צפי <b><Num>{range.low}–{range.high}</Num></b> {b.budget.resultWord}{cur.range && range.low !== cur.range.low && <> (<Num>{range.low - cur.range.low > 0 ? "+" : ""}{range.low - cur.range.low}</Num>)</>}. הכיסוי המתוכנן של {priorityOf(b.priorityId).shortName} יעלה ל־<Num>{plannedWithout + range.low} / {pp.goal.target}</Num>{plannedWithout + range.low >= pp.goal.target ? " או יותר" : ""}.</> : "צפי: לא ידוע (אין מקור מדידה ליעד)."}</span>
        </div>
        {overflow > 0 && (
          <fieldset className="f-pl-note f-pl-note--amber f-pl-source">
            <legend><b><Money v={overflow} /> מעל הלא מוקצה.</b> מאיפה להביא אותם?</legend>
            <label><input type="radio" name="src" checked={source === "same_priority"} onChange={() => setSource("same_priority")} /> מ־Meta חשיפה · שקיעה <span className="f-pl-meta">· בתוך הנושא, פעולת שיווק</span></label>
            <label><input type="radio" name="src" checked={source === "other_priority"} onChange={() => setSource("other_priority")} /> מנושא אחר <span className="f-pl-meta">· שינוי תוכנית, דורש אישור בעלים</span></label>
          </fieldset>
        )}
      </div>
      <div className="f-pl-panel__foot">
        <span className="f-pl-meta f-pl-panel__footnote">ההצעה תתעדכן; עדיין נשלחת לאישור</span>
        <Button variant="quiet" onClick={onClose}>ביטול</Button>
        <Button variant="strong" onClick={apply} disabled={!valid || (overflow > 0 && !source)} disabledReason={overflow > 0 && !source ? "בחרו מאיפה להביא את ההפרש" : !valid ? "סכום ותאריכים תקינים" : undefined}>החל</Button>
      </div>
    </div>
  );
}

function TextChange({ b, d, plan, onClose }: { b: BuilderProposal; d: BuilderDecision; plan: PlanApi; onClose: () => void }) {
  const cur = decisionValue(b, d, plan);
  const [value, setValue] = useState(cur.value);
  const [detail, setDetail] = useState(cur.detail ?? "");
  const claim = unverifiedClaim(`${value} ${detail}`);
  const dirty = value !== cur.value || detail !== (cur.detail ?? "");
  useNavGuard({ dirty, what: `השינוי ב"${d.label}" של ${b.title} עוד לא הוחל.` });
  const apply = () => {
    if (claim || !value.trim()) return;
    plan.editBuilder(b.id, { decisions: { [d.key]: { value: value.trim(), detail: detail.trim() || undefined } } });
    onClose();
  };
  return (
    <div className="f-pl-panel__wrap">
      <PanelHead b={b} title={`שנה · ${d.label}`} onClose={onClose} />
      <div className="f-pl-panel__body">
        <div className="f-pl-kv"><span className="f-pl-h3">ההצעה הנוכחית</span><span>{cur.value}{cur.detail && <span className="f-pl-meta"> · {cur.detail}</span>}</span></div>
        <div className="f-pl-form">
          <span className="f-pl-h3">מה משנים</span>
          <TextField label={d.label} value={value} onChange={(e) => setValue(e.target.value)} error={!value.trim() ? "חובה למלא" : claim ? `טענה שלא אושרה במוח העסק: "${claim}"` : null} />
          <TextAreaField label="פירוט" value={detail} onChange={(e) => setDetail(e.target.value)} rows={2} />
        </div>
        <Context b={b} />
        <div className="f-pl-kv"><span className="f-pl-h3">השפעה</span><span>{d.key === "result" ? "שינוי התוצאה משנה את התרומה הצפויה ליעד ואת הכיסוי המתוכנן." : d.key === "audience" ? "שינוי הקהל משנה את הצפי; הבונה יחשב אותו מחדש אחרי ההחלה." : "שינוי במה שמקדמים נבדק מול מוח העסק לפני שליחה לאישור."}</span></div>
      </div>
      <div className="f-pl-panel__foot">
        <span className="f-pl-meta f-pl-panel__footnote">ההצעה תתעדכן; עדיין נשלחת לאישור</span>
        <Button variant="quiet" onClick={onClose}>ביטול</Button>
        <Button variant="strong" onClick={apply} disabled={!!claim || !value.trim()} disabledReason={claim ? "הסירו את הטענה שלא אושרה" : !value.trim() ? "חובה למלא" : undefined}>החל</Button>
      </div>
    </div>
  );
}

/* ---------- V1 manual launch ---------- */

function LiveDialog({ open, b, move, plan, onClose }: { open: boolean; b: BuilderProposal; move: Move; plan: PlanApi; onClose: () => void }) {
  const toast = useToast();
  const id = useId();
  const [url, setUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <Dialog open={open} onClose={onClose} labelledBy={`${id}-t`} className="f-pl-dlg" initialFocus="input">
      <form className="f-pl-dlg__body" onSubmit={(e) => {
        e.preventDefault();
        if (!isHttpsUrl(url)) { setErr("קישור https מלא לקמפיין בפלטפורמה"); return; }
        plan.markLive(move.id, url.trim());
        toast.push({ kind: "success", title: `${move.longName} מסומן פעיל`, detail: "התוכנית עודכנה. התוצאות יוזנו ידנית עד שהחיבור יגיע." });
        onClose();
      }}>
        <h2 id={`${id}-t`} className="f-pl-dlg__title">סמן כפעיל · {b.title}</h2>
        <p className="f-pl-meta">ב־V1 ההשקה ידנית: העלו את הקמפיין בעצמכם ב־{b.channel === "google" ? "Google Ads" : "Meta Ads Manager"} והדביקו כאן את הקישור. Mytiv לא שולח דבר לפלטפורמה.</p>
        <TextField label="קישור לקמפיין" dir="ltr" value={url} onChange={(e) => { setUrl(e.target.value); setErr(null); }} error={err} placeholder="https://" />
        <div className="f-pl-dlg__actions"><Button type="submit" variant="strong">סמן כפעיל</Button><Button variant="quiet" onClick={onClose}>ביטול</Button></div>
      </form>
    </Dialog>
  );
}

export type { MoveState };
