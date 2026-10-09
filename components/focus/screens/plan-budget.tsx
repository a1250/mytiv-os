"use client";

import Link from "@/components/focus/ui/link";
import { Suspense, useId, useState } from "react";
import type { Channel, Move, PriorityPlan } from "@/lib/focus/contracts/plan";
import { PLAN_OCTOBER, PLAN_TODAY } from "@/lib/focus/fixtures/plan";
import { R } from "@/lib/focus/routes";
import { moveBudget, movesOf, priorityBudget, type BudgetLine } from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { TextField } from "@/components/focus/ui/field";
import { cx } from "@/components/focus/ui/cx";
import { useToast } from "@/components/focus/ui/toast";
import { Money, Num, PlanFrame, Unknown, WeekNote, usePlanParams } from "@/components/focus/patterns/plan/plan-parts";
import { dayLabel, priorityOf } from "@/components/focus/patterns/plan/plan-view";
import { usePlan, type PlanApi } from "@/components/focus/patterns/plan/use-plan";

/**
 * Budget (design package #s7): where the money goes and whether it runs out too fast — Plan total › Priority
 * allocation › move budget, planned / committed / spent / pace, with unallocated money and unknown spend said in
 * words (unknown is never ₪0). Agency hours are not here; they stay in Work. Moving money between moves of one
 * priority is a Marketing action; between priorities, or raising the total, is a Plan change that needs approval.
 */
export default function PlanBudgetScreen() {
  return <Suspense fallback={null}><Budget /></Suspense>;
}

type View = "priority" | "channel" | "move";
const CHANNEL_WORD: Record<Channel, string> = { google: "Google", meta: "Meta", linkedin: "LinkedIn", instagram: "Instagram", whatsapp: "WhatsApp", email: "דוא״ל", website: "אתר", offline: "אופליין" };

function Budget() {
  const plan = usePlan();
  const { period, week } = usePlanParams();
  const [view, setView] = useState<View>("priority");
  const [entry, setEntry] = useState<Move | null>(null);
  if (period.month !== "2026-10") return <PlanFrame view="budget"><p className="f-pl-meta">לתוכנית של נובמבר עוד אין תקציב. <Link className="f-pl-link" href={`${R.plan}?period=2026-11`}>למה מקדמים בנובמבר ‹</Link></p></PlanFrame>;
  const b = plan.budget;
  const lines = plan.moves.map((m) => ({ m, l: moveBudget(m, plan.today, plan.monthDays) }));
  const fast = lines.filter((x) => x.l.pace === "fast").sort((a, c) => (c.l.pct ?? 0) - (a.l.pct ?? 0))[0];
  const unknownMove = lines.find((x) => x.l.spentUnknown);
  const sunsetNeed = PLAN_OCTOBER.priorities.flatMap((pp) => pp.needs).find((n) => n.kind === "coverage_gap");
  const tones = ["f-pl-alloc__seg--1", "f-pl-alloc__seg--2", "f-pl-alloc__seg--3"];

  const controls = (
    <div className="f-pl-seg" role="group" aria-label="פירוק התקציב">
      {([["priority", "לפי מה מקדמים"], ["channel", "לפי ערוץ"], ["move", "לפי מהלך"]] as const).map(([k, l]) => (
        <button key={k} type="button" className="f-hit" aria-pressed={view === k} onClick={() => setView(k)}>{l}</button>
      ))}
    </div>
  );

  return (
    <PlanFrame view="budget" controls={controls}>
      {week && <WeekNote>התקציב מתוכנן לחודש; הקצב מחושב לפי {b.elapsedPct}% מהחודש שעברו.</WeekNote>}
      <section className="f-pl-bcard" aria-label="תקציב התוכנית">
        <div className="f-pl-bcard__nums">
          <div className="f-pl-bnum"><span className="f-pl-meta">תקציב התוכנית · מדיה והפקה</span><b className="f-pl-bnum__total"><Num>{b.total.toLocaleString("en-US")} ₪</Num></b></div>
          <div className="f-pl-bnum"><span className="f-pl-meta">מחויב</span><Money v={b.committed} strong /></div>
          <div className="f-pl-bnum"><span className="f-pl-meta">נוצל</span><span><Money v={b.spentKnown} strong />{b.spentUnknown && " + לא ידוע"}</span></div>
          <div className="f-pl-bnum"><span className="f-pl-meta">עברו מהחודש</span><Num strong>{b.elapsedPct}%</Num></div>
          <span className="f-pl-bcard__spacer" />
          <Link href={R.workTime} className="f-pl-meta f-pl-hours">שעות סוכנות לא כאן · ב־עבודה ‹</Link>
        </div>
        <div className="f-pl-alloc" role="img" aria-label={`הקצאה: ${PLAN_OCTOBER.priorities.map((pp) => `${priorityOf(pp.priorityId).shortName} ${pp.allocation}`).join(", ")}, לא מוקצה ${b.unallocated}`}>
          {PLAN_OCTOBER.priorities.map((pp, i) => (
            <span key={pp.priorityId} className={cx("f-pl-alloc__seg", tones[i] ?? tones[2])} style={{ flexGrow: pp.allocation }}>
              {priorityOf(pp.priorityId).shortName}{pp.allocation >= 3000 && <> <Num>{pp.allocation.toLocaleString("en-US")} ₪</Num></>}
            </span>
          ))}
          {b.unallocated > 0 && <span className="f-pl-alloc__seg f-pl-alloc__seg--free" style={{ flexGrow: b.unallocated }}>לא מוקצה</span>}
        </div>
        <ul className="f-pl-btiles" aria-label="אזהרות תקציב">
          {fast && (
            <li className="f-pl-btile f-pl-btile--amber"><span aria-hidden>▲</span><span className="f-pl-btile__text"><b>{fast.m.longName} · {priorityOf(fast.m.priorityId).shortName}</b> ניצל <Num>{fast.l.pct}%</Num> אחרי <Num>{b.elapsedPct}%</Num> מהחודש</span><Link href={`${R.planMoves}#move-${fast.m.id}`} className="f-pl-link">פתח</Link></li>
          )}
          {b.unallocated > 0 && (
            <li className="f-pl-btile"><span aria-hidden>○</span><span className="f-pl-btile__text"><Money v={b.unallocated} strong /> לא מוקצים{sunsetNeed && b.pendingFromUnallocated === 0 ? " · מוצע: מהלך Google לשקיעה" : b.pendingFromUnallocated > 0 ? " · מוצעים למהלך Google, ממתין לאישור הלקוח" : ""}</span>{sunsetNeed && b.pendingFromUnallocated === 0 && <Link href={R.planCreateMove(sunsetNeed.id)} className="f-pl-link">הקצה</Link>}</li>
          )}
          {unknownMove && (
            <li className="f-pl-btile"><span aria-hidden>○</span><span className="f-pl-btile__text">הוצאה של {priorityOf(unknownMove.m.priorityId).name} <b>לא ידועה</b>: {unknownMove.m.channelLabel} לא מחובר</span><button type="button" className="f-pl-linkbtn f-hit" onClick={() => setEntry(unknownMove.m)}>הזן ידנית</button></li>
          )}
        </ul>
      </section>

      <section className="f-pl-btree" aria-label="פירוק התקציב">
        <table className="f-pl-btable">
          <caption className="f-sr">{view === "priority" ? "נושא › מהלך" : view === "channel" ? "ערוץ › מהלך" : "מהלכים"}</caption>
          <thead><tr><th scope="col">{view === "priority" ? "נושא › מהלך" : view === "channel" ? "ערוץ › מהלך" : "מהלך"}</th><th scope="col">מתוכנן</th><th scope="col">מחויב</th><th scope="col">נוצל</th><th scope="col">קצב</th></tr></thead>
          {view === "priority" && PLAN_OCTOBER.priorities.map((pp) => <PriorityRows key={pp.priorityId} pp={pp} plan={plan} onEnter={setEntry} />)}
          {view === "channel" && [...new Set(plan.moves.map((m) => m.channel))].map((c) => (
            <GroupRows key={c} title={CHANNEL_WORD[c]} moves={plan.moves.filter((m) => m.channel === c)} plan={plan} onEnter={setEntry} />
          ))}
          {view === "move" && <tbody>{[...plan.moves].sort((a, c) => c.budget.planned - a.budget.planned).map((m) => <MoveRow key={m.id} m={m} plan={plan} onEnter={setEntry} flat />)}</tbody>}
          <tbody><tr className="f-pl-brow f-pl-brow--free"><th scope="row" className="f-pl-faint">לא מוקצה</th><td><Money v={b.unallocated} /></td><td /><td /><td>{b.pendingFromUnallocated > 0 && <span className="f-pl-meta"><Money v={b.pendingFromUnallocated} /> ממתין לאישור</span>}</td></tr></tbody>
        </table>
      </section>
      <p className="f-pl-meta f-pl-bfoot">העברת כסף בין מהלכים של אותו נושא = פעולת שיווק בתוך ההקצאה · בין נושאים או הגדלת הסך = שינוי תוכנית, דורש אישור</p>
      <SpendDialog plan={plan} m={entry} onClose={() => setEntry(null)} />
    </PlanFrame>
  );
}

function PaceCell({ l, m, onEnter }: { l: BudgetLine; m?: Move; onEnter?: (m: Move) => void }) {
  if (l.pace === "not_started") return <span className="f-pl-meta">{m?.startDay ? `מתחיל ${dayLabel(m.startDay)}` : "מתוכנן"}</span>;
  if (l.pace === "unknown") return <span className="f-pl-meta">אין נתוני הוצאה{m && onEnter && <> · <button type="button" className="f-pl-linkbtn f-hit" onClick={() => onEnter(m)}>הזן ידנית</button></>}</span>;
  if (l.pace === "fast") return <span className="f-pl-amber"><Num>{l.pct}%</Num> · {l.runOutDay ? <>יגמר ב־~<Num>{dayLabel(l.runOutDay)}</Num></> : "מהיר"}{m?.recommendationId && <span className="f-pl-meta"> · <Link className="f-pl-link" href={`${R.planMoves}#move-${m.id}`}>ראה המלצה</Link></span>}</span>;
  return <span className="f-pl-meta"><Num>{l.pct}%</Num> · תקין</span>;
}

function SpentCell({ l, m }: { l: BudgetLine; m?: Move }) {
  if (l.spent != null) return <span><Money v={l.spent} />{l.spentUnknown && " + לא ידוע"}{m?.budget.manualAt && <span className="f-pl-est"> ידני {Number(m.budget.manualAt.slice(8))}.10</span>}</span>;
  if (l.spentUnknown) return <Unknown strong />;
  return <span className="f-pl-faint">—</span>;
}

function PaceBar({ l, elapsed }: { l: BudgetLine; elapsed: number }) {
  return (
    <span className="f-pl-pace">
      <span className="f-pl-pace__bar" aria-hidden><span className={cx("f-pl-pace__fill", l.pace === "fast" && "f-pl-pace__fill--fast")} style={{ width: `${Math.min(100, l.pct ?? 0)}%` }} /><span className="f-pl-pace__mark" style={{ insetInlineStart: `${elapsed}%` }} /></span>
      <span className={cx("f-pl-pace__word", l.pace === "fast" && "f-pl-amber")}>{l.pace === "fast" ? "מהיר" : l.pace === "ok" ? "תקין" : l.pace === "unknown" ? "לא ידוע" : "טרם התחיל"}</span>
    </span>
  );
}

function PriorityRows({ pp, plan, onEnter }: { pp: PriorityPlan; plan: PlanApi; onEnter: (m: Move) => void }) {
  const l = priorityBudget(pp, plan.moves, plan.today, plan.monthDays);
  const [open, setOpen] = useState(!l.spentUnknown || l.spent != null);
  const id = useId();
  const p = priorityOf(pp.priorityId);
  return (
    <tbody>
      <tr className="f-pl-brow f-pl-brow--group">
        <th scope="rowgroup"><button type="button" className="f-pl-btoggle f-hit" aria-expanded={open} aria-controls={open ? movesOf(pp, plan.moves).map((m) => `${id}-rows-${m.id}`).join(" ") : undefined} onClick={() => setOpen((v) => !v)}><span aria-hidden>{open ? "▾" : "›"}</span> {p.name}</button></th>
        <td><Money v={l.planned} strong /></td>
        <td>{l.committed != null ? <Money v={l.committed} /> : <span className="f-pl-faint">—</span>}</td>
        <td><SpentCell l={l} /></td>
        <td>{l.pace === "unknown" ? <span className="f-pl-meta">אין נתוני הוצאה</span> : <PaceBar l={l} elapsed={plan.budget.elapsedPct} />}</td>
      </tr>
      {open && movesOf(pp, plan.moves).map((m) => <MoveRow key={m.id} m={m} plan={plan} onEnter={onEnter} rowsId={`${id}-rows`} />)}
    </tbody>
  );
}

function GroupRows({ title, moves, plan, onEnter }: { title: string; moves: Move[]; plan: PlanApi; onEnter: (m: Move) => void }) {
  const planned = moves.reduce((s, m) => s + m.budget.planned, 0);
  return (
    <tbody>
      <tr className="f-pl-brow f-pl-brow--group"><th scope="rowgroup">{title}</th><td><Money v={planned} strong /></td><td /><td /><td /></tr>
      {moves.map((m) => <MoveRow key={m.id} m={m} plan={plan} onEnter={onEnter} />)}
    </tbody>
  );
}

function MoveRow({ m, plan, onEnter, flat, rowsId }: { m: Move; plan: PlanApi; onEnter: (m: Move) => void; flat?: boolean; rowsId?: string }) {
  const l = moveBudget(m, PLAN_TODAY, plan.monthDays);
  return (
    <tr className={cx("f-pl-brow", !flat && "f-pl-brow--child")} id={rowsId ? `${rowsId}-${m.id}` : undefined}>
      <th scope="row">{m.longName}{m.state !== "live" && <span className="f-pl-meta"> · {m.state === "building" ? "בבנייה" : m.state === "planned" ? "מתוכנן" : m.state === "ready_for_review" ? "מוכן לבדיקה" : m.state === "approved" ? "מוכן" : ""}</span>}{flat && <span className="f-pl-meta"> · {priorityOf(m.priorityId).shortName}</span>}</th>
      <td><Money v={m.budget.planned} /></td>
      <td>{m.budget.committed != null ? <Money v={m.budget.committed} /> : <span className="f-pl-faint">—</span>}</td>
      <td><SpentCell l={l} m={m} /></td>
      <td><PaceCell l={l} m={m} onEnter={onEnter} /></td>
    </tr>
  );
}

/** Manual spend (V1): replaces "unknown" with a known, dated amount — never invented, never zero by default. */
function SpendDialog({ plan, m, onClose }: { plan: PlanApi; m: Move | null; onClose: () => void }) {
  const toast = useToast();
  const id = useId();
  const [v, setV] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const close = () => { setV(""); setErr(null); onClose(); };
  return (
    <Dialog open={!!m} onClose={close} labelledBy={`${id}-t`} className="f-pl-dlg" initialFocus="input">
      {m && (
        <form className="f-pl-dlg__body" onSubmit={(e) => {
          e.preventDefault();
          const n = Number(v.replace(/[,\s₪]/g, ""));
          if (!v.trim() || !Number.isFinite(n) || n < 0) { setErr("סכום בשקלים, למשל 640"); return; }
          if (n > m.budget.planned * 2) { setErr("הסכום גבוה פי שניים מהמתוכנן; בדקו שוב"); return; }
          plan.enterSpend(m.id, Math.round(n), `2026-10-${String(PLAN_TODAY).padStart(2, "0")}`);
          toast.push({ kind: "success", title: "ההוצאה נרשמה ידנית", detail: `${m.longName} · ${Math.round(n).toLocaleString("en-US")} ₪ · נכון ל־${dayLabel(PLAN_TODAY)}` });
          close();
        }}>
          <h2 id={`${id}-t`} className="f-pl-dlg__title">הזנה ידנית · {m.longName}</h2>
          <p className="f-pl-meta">{m.channelLabel} לא מחובר, אז ההוצאה לא ידועה. סכום שתזינו יסומן &quot;ידני&quot; עם התאריך.</p>
          <TextField label="נוצל עד היום (₪)" inputMode="numeric" value={v} onChange={(e) => { setV(e.target.value); setErr(null); }} error={err} />
          <div className="f-pl-dlg__actions"><Button type="submit" variant="strong">שמור</Button><Button variant="quiet" onClick={close}>ביטול</Button></div>
        </form>
      )}
    </Dialog>
  );
}
