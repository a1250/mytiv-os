"use client";

import Link from "@/components/focus/ui/link";
import { Suspense, useId, useMemo, useState, type CSSProperties } from "react";
import type { Channel, Move, MoveState, TimelineItem } from "@/lib/focus/contracts/plan";
import { PLAN_MONTH_DAYS, PLAN_OCTOBER, PLAN_TODAY, PLAN_WEEK, PLAN_WEEKS, PRODUCTION, TIMELINE, WARNINGS } from "@/lib/focus/fixtures/plan";
import { PEOPLE } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import { PRODUCTION_REASON, agendaForWeek, canReschedule, productionVisibility } from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { Chips } from "@/components/focus/ui/tabs";
import { SelectField } from "@/components/focus/ui/field";
import { cx } from "@/components/focus/ui/cx";
import { useToast } from "@/components/focus/ui/toast";
import { DemoNote, MOVE_STATE, MoveStateTag, PlanFrame, PriorityStatusChip, WeekNote, usePlanParams } from "@/components/focus/patterns/plan/plan-parts";
import { dayLabel, priorityOf, weekMoveIds } from "@/components/focus/patterns/plan/plan-view";
import { usePlan, type PlanApi } from "@/components/focus/patterns/plan/use-plan";

/**
 * Monthly Timeline (design package #s3/#s4): what goes live when, what must be ready first, what is late — a light
 * RTL execution calendar (1.10 on the right edge), not a project-management Gantt: no dependencies, critical path or
 * hours. Up to three warnings sit above the grid. Content-production rows stay hidden until there is a reason
 * (approval due, warning, deadline near, an expanded move, or the switch). Mobile: a weekly agenda of changes only.
 */
export default function PlanTimelineScreen() {
  return <Suspense fallback={null}><Timeline /></Suspense>;
}

const DAYS = PLAN_MONTH_DAYS;
const pos = (start: number, end: number): CSSProperties => ({ insetInlineStart: `${((start - 1) / DAYS) * 100}%`, width: `${((end - start + 1) / DAYS) * 100}%` });
const point = (day: number): CSSProperties => ({ insetInlineStart: `${((day - 0.5) / DAYS) * 100}%` });
const WEEKDAY = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
/** 1.10.2026 is a Thursday */
const weekday = (d: number) => WEEKDAY[(4 + d - 1) % 7];
const CHANNEL_WORD: Record<Channel, string> = { google: "Google", meta: "Meta", linkedin: "LinkedIn", instagram: "Instagram", whatsapp: "WhatsApp", email: "דוא״ל", website: "אתר", offline: "אופליין" };

type Lane = { key: string; label: string; title: React.ReactNode; moves: Move[] };

function Timeline() {
  const plan = usePlan();
  const { period, week } = usePlanParams();
  const [byChannel, setByChannel] = useState(false);
  const [production, setProduction] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState(false);
  const [fPriority, setFPriority] = useState<string>("all");
  const [fOwner, setFOwner] = useState<string>("all");
  const [item, setItem] = useState<{ it: TimelineItem; m: Move } | null>(null);
  const items = useMemo(() => TIMELINE.map((it) => ({ ...it, ...plan.overlay.reschedules[it.id] })), [plan.overlay.reschedules]);

  if (period.month !== "2026-10") return <PlanFrame view="timeline"><p className="f-pl-meta">לתוכנית של נובמבר עוד אין ציר זמן. <Link className="f-pl-link" href={`${R.plan}?period=2026-11`}>למה מקדמים בנובמבר ‹</Link></p></PlanFrame>;

  const weekIds = week ? weekMoveIds(plan.moves) : null;
  const moves = plan.moves.filter((m) => (fPriority === "all" || m.priorityId === fPriority) && (fOwner === "all" || m.ownerId === fOwner) && (!weekIds || weekIds.has(m.id)));
  const lanes: Lane[] = byChannel
    ? [...new Set(moves.map((m) => m.channel))].map((c) => ({ key: c, label: CHANNEL_WORD[c], title: <b className="f-pl-lane__name">{CHANNEL_WORD[c]}</b>, moves: moves.filter((m) => m.channel === c) }))
    : PLAN_OCTOBER.priorities.map((pp) => ({
      key: pp.priorityId,
      label: priorityOf(pp.priorityId).name,
      title: <><b className="f-pl-lane__name">{priorityOf(pp.priorityId).name}</b><PriorityStatusChip status={pp.status} size="sm" /></>,
      moves: moves.filter((m) => m.priorityId === pp.priorityId),
    })).filter((l) => l.moves.length);

  const controls = (
    <>
      <div className="f-pl-seg" role="group" aria-label="קיבוץ השורות">
        <button type="button" className="f-hit" aria-pressed={!byChannel} onClick={() => setByChannel(false)}>לפי מה מקדמים</button>
        <button type="button" className="f-hit" aria-pressed={byChannel} onClick={() => setByChannel(true)}>לפי ערוץ</button>
      </div>
      <button type="button" role="switch" aria-checked={production} className="f-pl-switch f-hit" onClick={() => setProduction((v) => !v)}>
        <span className="f-pl-switch__track" aria-hidden><span className="f-pl-switch__thumb" /></span>הצג הפקת תוכן
      </button>
      <button type="button" className="f-pl-filterbtn f-hit" aria-expanded={filters} aria-controls={filters ? "tl-filters" : undefined} onClick={() => setFilters((v) => !v)}>סינון <span aria-hidden>▾</span></button>
    </>
  );

  return (
    <PlanFrame view="timeline" controls={controls}>
      {filters && (
        <div id="tl-filters" className="f-pl-filters">
          <Chips label="מה מקדמים" value={fPriority} onChange={setFPriority} items={[{ key: "all", label: "הכל" }, ...PLAN_OCTOBER.priorities.map((p) => ({ key: p.priorityId, label: priorityOf(p.priorityId).shortName }))]} />
          <Chips label="בעלים" value={fOwner} onChange={setFOwner} items={[{ key: "all", label: "כל הבעלים" }, { key: PEOPLE.dana.id, label: PEOPLE.dana.name }, { key: PEOPLE.yoav.id, label: PEOPLE.yoav.name }]} />
        </div>
      )}
      {week && <WeekNote>מוצגים מהלכים עם בנייה, בדיקה, אישור או פרסום השבוע.</WeekNote>}

      <section aria-labelledby="tl-warn" className="f-pl-warns">
        <h2 id="tl-warn" className="f-pl-h3">{WARNINGS.length} דברים על הקו</h2>
        <ul className="f-pl-warns__list">
          {WARNINGS.map((w) => (
            <li key={w.id} className="f-pl-warn">
              <span className={cx("f-pl-warn__glyph", w.severity === "high" && "f-pl-warn__glyph--high")} aria-hidden>▲</span>
              <span className="f-pl-warn__text"><b>{w.title}</b> {w.text}</span>
              <Link href={w.href} className="f-pl-warn__open" aria-label={`פתח · ${w.title}`}>פתח</Link>
            </li>
          ))}
        </ul>
      </section>

      {/* desktop / tablet: the month grid (scrolls inside its card when narrower than the month) */}
      <div className="f-pl-grid-wrap">
        <div className="f-pl-grid" role="group" aria-label="ציר זמן · אוקטובר 2026">
          <div className="f-pl-grid__overlay" aria-hidden>
            {PLAN_WEEKS.slice(1).map((w) => <span key={w.from} className="f-pl-grid__vline" style={{ insetInlineStart: `${((w.from - 1) / DAYS) * 100}%` }} />)}
            <span className="f-pl-grid__thisweek" style={pos(PLAN_WEEK.from, PLAN_WEEK.to)} />
            <span className="f-pl-grid__today" style={point(PLAN_TODAY)} />
          </div>
          <div className="f-pl-row f-pl-row--head">
            <span className="f-pl-row__label f-pl-meta">אוקטובר 2026</span>
            <div className="f-pl-row__track">
              {PLAN_WEEKS.map((w) => <span key={w.from} className="f-pl-weekhead" style={pos(w.from, w.to)}>{w.from}–{w.to}{w.from === PLAN_WEEK.from && " · השבוע"}</span>)}
            </div>
          </div>
          <div className="f-pl-row">
            <span className="f-pl-row__label f-pl-row__label--muted">רגעים</span>
            <div className="f-pl-row__track">
              {PLAN_OCTOBER.moments.map((mo) => <span key={mo.id} className={cx("f-pl-moment", mo.strong && "f-pl-moment--strong")} style={point(mo.day)}>{mo.strong && <span aria-hidden>◆ </span>}{mo.label}<span className="f-sr"> · {dayLabel(mo.day)}</span></span>)}
            </div>
          </div>
          {lanes.map((lane) => (
            <div key={lane.key} className="f-pl-lane" role="group" aria-label={lane.label}>
              <div className="f-pl-row f-pl-row--lane"><span className="f-pl-row__label f-pl-lane__title">{lane.title}</span><span className="f-pl-row__track" /></div>
              {lane.moves.map((m) => {
                const row = PRODUCTION.find((r) => r.moveId === m.id);
                const reason = row ? productionVisibility(row, { today: PLAN_TODAY, expanded: !!expanded[m.id], switchOn: production }) : null;
                return (
                  <MoveLane key={m.id} m={m} items={items.filter((it) => it.moveId === m.id)} expanded={!!expanded[m.id]}
                    onToggle={row ? () => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] })) : undefined}
                    production={row && reason ? { row, reason } : null} onOpen={(it) => setItem({ it, m })} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <Legend />

      <Agenda plan={plan} />
      <ItemPanel plan={plan} sel={item} onClose={() => setItem(null)} />
    </PlanFrame>
  );
}

const ITEM_WORD: Record<TimelineItem["kind"], string> = {
  live: "פעיל", build: "בנייה", review: "בדיקה", planned: "מתוכנן", waiting_flight: "ממתין לאישור", launch: "השקה", approval: "אישור",
  optimization: "בדיקת אופטימיזציה", post: "פוסט", send: "שליחה", warning: "אזהרה", production: "הפקת תוכן",
};

function MoveLane({ m, items, expanded, onToggle, production, onOpen }: {
  m: Move; items: TimelineItem[]; expanded: boolean; onToggle?: () => void;
  production: { row: (typeof PRODUCTION)[number]; reason: keyof typeof PRODUCTION_REASON } | null; onOpen: (it: TimelineItem) => void;
}) {
  const label = (it: TimelineItem) => `${m.longName} · ${it.label ?? ITEM_WORD[it.kind]} · ${it.startDay === it.endDay ? dayLabel(it.startDay) : `${it.startDay}–${it.endDay}.10`}${it.postState ? ` · ${it.postState === "published" ? "פורסם" : it.postState === "scheduled" ? "מתוזמן" : "מתוכנן"}` : ""}`;
  return (
    <>
      <div className="f-pl-row">
        <span className="f-pl-row__label f-pl-row__label--move">
          {onToggle
            ? <button type="button" className="f-pl-expand f-hit" aria-expanded={expanded} onClick={onToggle}><span aria-hidden>{expanded ? "▾" : "▸"}</span> {m.longName}<span className="f-sr"> · הפקת תוכן</span></button>
            : <span className="f-pl-expand f-pl-expand--static">{m.longName}</span>}
          <span className="f-sr"> · {MOVE_STATE[m.state].word}</span>
        </span>
        <div className="f-pl-row__track">
          {items.map((it) => {
            const span = it.startDay !== it.endDay || it.kind === "live" || it.kind === "build" || it.kind === "review" || it.kind === "planned" || it.kind === "waiting_flight";
            const kind = it.kind === "warning" && it.startDay === it.endDay ? "warnpoint" : it.kind;
            return (
              <button key={it.id} type="button" className={cx("f-pl-it", `f-pl-it--${kind}`, it.postState && `f-pl-it--post-${it.postState}`, !span && "f-pl-it--point")}
                style={span ? pos(it.startDay, it.endDay) : point(it.startDay)} aria-label={label(it)} title={label(it)} onClick={() => onOpen(it)}>
                {(span || kind === "warnpoint" || it.kind === "approval" || it.kind === "send") && <span className="f-pl-it__text">{it.kind === "warning" ? "▲ " : ""}{it.label ?? ITEM_WORD[it.kind]}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {production && (
        <div className="f-pl-row f-pl-row--prod">
          <span className="f-pl-row__label f-pl-row__label--prod">↳ קריאייטיב <span className="f-pl-reasonchip">{PRODUCTION_REASON[production.reason]}</span></span>
          <div className="f-pl-row__track">
            <span className={cx("f-pl-it", "f-pl-it--production", production.row.warning && "f-pl-it--production-warn")} style={pos(production.row.startDay, production.row.endDay)}>
              <span className="f-pl-it__text">{production.row.warning ? "▲ " : ""}{production.row.label}</span>
            </span>
          </div>
        </div>
      )}
    </>
  );
}

function Legend() {
  return (
    <ul className="f-pl-legend" aria-label="מקרא">
      <li><span className="f-pl-sw f-pl-sw--live" aria-hidden />פעיל</li>
      <li><span className="f-pl-sw f-pl-sw--build" aria-hidden />בנייה / בדיקה</li>
      <li><span className="f-pl-sw f-pl-sw--planned" aria-hidden />מתוכנן</li>
      <li><span className="f-pl-sw f-pl-sw--launch" aria-hidden />השקה</li>
      <li><span className="f-pl-sw f-pl-sw--opt" aria-hidden />בדיקת אופטימיזציה Google / Meta</li>
      <li><span className="f-pl-sw f-pl-sw--post" aria-hidden />פוסט (מלא = פורסם)</li>
      <li><span className="f-pl-sw f-pl-sw--today" aria-hidden />היום · {dayLabel(PLAN_TODAY)}</li>
      <li className="f-pl-legend__note">הפקת תוכן מוסתרת כברירת מחדל · מופיעה באזהרה, אישור ממתין, דדליין קרוב, הרחבת מהלך ▸ או &quot;הצג הפקת תוכן&quot;</li>
    </ul>
  );
}

/* ---------- mobile: weekly agenda ---------- */

function Agenda({ plan }: { plan: PlanApi }) {
  const [wi, setWi] = useState(1);
  const [showLive, setShowLive] = useState(false);
  const w = PLAN_WEEKS[wi];
  const live = plan.moves.filter((m) => m.state === "live");
  const a = agendaForWeek(TIMELINE, w, PLAN_TODAY, live.length);
  const warnWeek = (wk: { from: number; to: number }) => WARNINGS.some((x) => x.dueDay >= wk.from && x.dueDay <= wk.to);
  const banner = WARNINGS.filter((x) => x.dueDay >= w.from && x.dueDay <= w.to + 6).sort((x, y) => x.dueDay - y.dueDay)[0];
  const moveOf = (id: string) => plan.moves.find((m) => m.id === id);
  return (
    <section className="f-pl-agenda" aria-label="יומן שבועי">
      <div className="f-pl-agenda__weeks" role="group" aria-label="שבוע">
        {PLAN_WEEKS.map((wk, i) => (
          <button key={wk.from} type="button" className="f-pl-weekchip f-hit" aria-pressed={i === wi} onClick={() => setWi(i)}>
            {wk.from}–{wk.to}{warnWeek(wk) && <><span aria-hidden> ▲</span><span className="f-sr"> · יש אזהרה</span></>}
          </button>
        ))}
      </div>
      {banner && <p className="f-pl-agenda__banner"><span aria-hidden>▲ </span><b>{banner.title}</b> · {banner.text} <Link href={banner.href} className="f-pl-link">פתח</Link></p>}
      {a.days.length === 0 && <p className="f-pl-meta">אין שינויים בשבוע הזה.</p>}
      {a.days.map((d) => {
        // optimization reviews on the same day merge into one entry ("בדיקת Meta · Google")
        const opts = d.items.filter((it) => it.kind === "optimization");
        const rest = d.items.filter((it) => it.kind !== "optimization");
        return (
          <div key={d.day} className="f-pl-agenda__day">
            <h3 className="f-pl-agenda__date">{d.day === PLAN_TODAY ? `היום · ${weekday(d.day)} ${dayLabel(d.day)}` : `${weekday(d.day)} ${dayLabel(d.day)}`}</h3>
            {opts.length > 0 && (
              <div className="f-pl-agenda__item">
                <span className="f-pl-mk f-pl-mk--opt" aria-hidden />
                <div><b>{opts.length === 1 ? opts[0].agenda : `בדיקת ${[...new Set(opts.map((o) => moveOf(o.moveId)?.channelLabel))].join(" · ")}`}</b>
                  <span className="f-pl-meta">{[...new Set(opts.map((o) => priorityOf(moveOf(o.moveId)!.priorityId).shortName))].join(" · ")}</span></div>
              </div>
            )}
            {rest.map((it) => {
              const m = moveOf(it.moveId)!;
              const span = it.startDay !== it.endDay;
              return (
                <div key={it.id} className="f-pl-agenda__item">
                  <span className={cx("f-pl-mk", `f-pl-mk--${it.kind}`, it.postState && `f-pl-mk--post-${it.postState}`)} aria-hidden />
                  <div><b>{it.agenda}</b>
                    <span className="f-pl-meta">{span ? (it.startDay < d.day ? `${priorityOf(m.priorityId).name} · עד ${dayLabel(it.endDay)}` : `${it.startDay}–${it.endDay}.10`) : `${priorityOf(m.priorityId).name}${it.postState === "scheduled" ? " · מתוזמן" : ""}`}</span></div>
                </div>
              );
            })}
          </div>
        );
      })}
      <button type="button" className="f-pl-agenda__live f-hit" aria-expanded={showLive} onClick={() => setShowLive((v) => !v)}>{a.liveAllWeek} פעילים לאורך כל השבוע · <b>{showLive ? "הסתר" : "הצג"}</b></button>
      {showLive && <ul className="f-pl-agenda__livelist">{live.map((m) => <li key={m.id}>{m.longName} <span className="f-pl-meta">· {priorityOf(m.priorityId).shortName}</span></li>)}</ul>}
      <p className="f-pl-meta f-pl-agenda__note">גרירה לא זמינה בנייד. לגאנט המלא פתחו את התוכנית במסך רחב.</p>
    </section>
  );
}

/* ---------- an item: details, reschedule (not live) or a request (live / approval-gated) ---------- */

function ItemPanel({ plan, sel, onClose }: { plan: PlanApi; sel: { it: TimelineItem; m: Move } | null; onClose: () => void }) {
  return (
    <Dialog open={!!sel} onClose={onClose} variant="drawer" labelledBy="tl-item-t" className="f-pl-panel f-pl-panel--change">
      {sel && <ItemBody key={sel.it.id} plan={plan} it={sel.it} m={sel.m} onClose={onClose} />}
    </Dialog>
  );
}

function ItemBody({ plan, it, m, onClose }: { plan: PlanApi; it: TimelineItem; m: Move; onClose: () => void }) {
  const toast = useToast();
  const id = useId();
  const mode = canReschedule(it, m.state as MoveState);
  const len = it.endDay - it.startDay;
  const [start, setStart] = useState(String(it.startDay));
  const requested = plan.overlay.rescheduleRequests[it.id];
  const days = Array.from({ length: 31 - len }, (_, i) => ({ value: String(i + 1), label: `${i + 1}.10${i + 1 === PLAN_TODAY ? " · היום" : ""}` }));
  const href = m.builderId ? R.planBuilder(m.builderId) : `${R.planMoves}#move-${m.id}`;
  return (
    <div className="f-pl-panel__wrap">
      <div className="f-pl-panel__head">
        <div className="f-pl-panel__crumbrow"><span className="f-pl-meta">{priorityOf(m.priorityId).name} · {m.longName}</span><button type="button" className="f-pl-x f-hit" aria-label="סגירה" onClick={onClose}>×</button></div>
        <h2 id="tl-item-t" className="f-pl-panel__title">{it.label ?? ITEM_WORD[it.kind]}</h2>
        <span className="f-pl-meta">{it.startDay === it.endDay ? dayLabel(it.startDay) : `${it.startDay}–${it.endDay}.10`} · <MoveStateTag state={m.state} /></span>
      </div>
      <div className="f-pl-panel__body">
        {mode === "move" && (
          <form id={`${id}-f`} className="f-pl-form" onSubmit={(e) => { e.preventDefault(); const s = Number(start); plan.reschedule(it.id, s, s + len); toast.push({ kind: "success", title: "הפריט הוזז", detail: `${m.longName} · ${s === s + len ? dayLabel(s) : `${s}–${s + len}.10`}` }); onClose(); }}>
            <p className="f-pl-meta">הפריט עוד לא פעיל ואינו דורש אישור, אז אפשר להזיז אותו כאן.</p>
            <SelectField label="מתחיל ב־" value={start} onChange={(e) => setStart(e.target.value)} options={days} />
          </form>
        )}
        {mode === "approval" && (
          <div className="f-pl-form">
            <p className="f-pl-note f-pl-note--amber">הזזת פריט פעיל או כזה שדורש אישור פותחת בקשת אישור. שום דבר לא זז עד שבעלים מאשר.</p>
            {requested
              ? <p className="f-pl-note">בקשה להזזה ל־{dayLabel(requested)} ממתינה לאישור בעלים. <DemoNote>האישור מדומה באב טיפוס</DemoNote></p>
              : <SelectField label="להזיז ל־" value={start} onChange={(e) => setStart(e.target.value)} options={days} />}
          </div>
        )}
        {mode === "fixed" && <p className="f-pl-meta">הפריט כבר קרה ולא זז.</p>}
        <p className="f-pl-meta">אין תלויות, נתיב קריטי או שעות בציר הזמן; אלה נשארים בעבודה.</p>
        <Link href={href} className="f-pl-link">פתח את המהלך ‹</Link>
      </div>
      <div className="f-pl-panel__foot">
        <span className="f-pl-panel__footnote" />
        <Button variant="quiet" onClick={onClose}>ביטול</Button>
        {mode === "move" && <Button type="submit" form={`${id}-f`} variant="strong">החל</Button>}
        {mode === "approval" && !requested && <Button variant="strong" onClick={() => { plan.requestReschedule(it.id, Number(start)); toast.push({ title: "נשלחה בקשת אישור להזזה", detail: `${m.longName} · ${dayLabel(Number(start))}` }); }}>בקש אישור להזזה</Button>}
      </div>
    </div>
  );
}

