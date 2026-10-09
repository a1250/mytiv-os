"use client";

import Link from "@/components/focus/ui/link";
import { Suspense, useCallback, useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { Channel, DayItem, DayItemStatus, DayItemType, Move, MoveState, TimelineItem } from "@/lib/focus/contracts/plan";
import { PLAN_MONTH_DAYS, PLAN_OCTOBER, PLAN_TODAY, PLAN_WEEK, PLAN_WEEKS, PRODUCTION, TIMELINE } from "@/lib/focus/fixtures/plan";
import { PEOPLE } from "@/lib/focus/fixtures/people";
import { R } from "@/lib/focus/routes";
import {
  DAY_TYPE, DAY_WARNING_WORD, PRODUCTION_REASON, agendaWeek, canMoveDayItem, canReschedule, dayLoad, dayStatusWord, dayWarnings,
  productionVisibility, type DayWarning,
} from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { Chips } from "@/components/focus/ui/tabs";
import { SelectField, TextField } from "@/components/focus/ui/field";
import { cx } from "@/components/focus/ui/cx";
import { useToast } from "@/components/focus/ui/toast";
import { useNavGuard } from "@/components/focus/shell/nav-guard";
import { DemoNote, MOVE_STATE, MoveStateTag, PlanFrame, PriorityStatusChip, WeekNote, usePlanParams } from "@/components/focus/patterns/plan/plan-parts";
import { dayLabel, priorityOf, weekMoveIds } from "@/components/focus/patterns/plan/plan-view";
import { usePlan, type PlanApi } from "@/components/focus/patterns/plan/use-plan";

/**
 * Monthly Timeline — a day-by-day calendar (RTL: 1.10 on the right, later days to the left). Two layers that never share
 * a treatment: flight bars per move are period context (what is running / being built), and execution items sit on one
 * exact day in a "ביצוע" row per lane (posts, stories, sends, launches, creative and approval due dates, reviews…),
 * stacked as compact chips with "+N" when a day is full. Every scheduling action is a button or a side panel: a day
 * header opens the day (its items + add), an item opens its panel (exact day, status) — no drag needed. Warnings are
 * derived from the items. Mobile: a weekly agenda with every item on its exact date. Demo: browser session only.
 */
export default function PlanTimelineScreen() {
  return <Suspense fallback={null}><Timeline /></Suspense>;
}

const WEEKDAY = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const WEEKDAY_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
/** 1.10.2026 is a Thursday */
const wd = (d: number) => (4 + d - 1) % 7;
const weekday = (d: number) => WEEKDAY[wd(d)];
const isWeekend = (d: number) => wd(d) >= 5;
const inThisWeek = (d: number) => d >= PLAN_WEEK.from && d <= PLAN_WEEK.to;
const itemsWord = (n: number) => (n === 1 ? "פריט אחד" : `${n} פריטים`);
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const CHANNEL_WORD: Record<Channel, string> = { google: "Google", meta: "Meta", linkedin: "LinkedIn", instagram: "Instagram", whatsapp: "WhatsApp", email: "דוא״ל", website: "אתר", offline: "אופליין" };

type Family = "content" | "message" | "launch" | "prep" | "review" | "moment";
const FAMILY: Record<DayItemType, Family> = {
  post: "content", story: "content", reel: "content", email: "message", whatsapp: "message", launch: "launch",
  creative_due: "prep", approval_due: "prep", creative_refresh: "prep", campaign_review: "review", optimization_review: "review", milestone: "review", moment: "moment",
};
const TYPE_ORDER: DayItemType[] = ["launch", "approval_due", "creative_due", "creative_refresh", "post", "story", "reel", "email", "whatsapp", "campaign_review", "optimization_review", "milestone", "moment"];
const byType = (a: DayItem, b: DayItem) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
const ADDABLE: DayItemType[] = ["post", "story", "reel", "email", "whatsapp", "creative_due", "approval_due", "launch", "campaign_review", "optimization_review", "creative_refresh", "milestone", "moment"];
const PLAN_WIDE: DayItemType[] = ["moment", "milestone"];

const BAR_WORD: Record<TimelineItem["kind"], string> = { live: "פעיל", build: "בנייה", review: "בדיקה", planned: "מתוכנן", waiting_flight: "ממתין לאישור" };

type Lane = { key: string; label: string; title: ReactNode; moves: Move[]; items: DayItem[] };
type Sel = { kind: "bar"; it: TimelineItem; m: Move } | { kind: "item"; id: string } | null;
type DayOpen = { day: number; priorityId?: string | null; moveId?: string | null; add?: boolean } | null;

function Timeline() {
  const plan = usePlan();
  const { period, week } = usePlanParams();
  const [byChannel, setByChannel] = useState(false);
  const [production, setProduction] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState(false);
  const [fPriority, setFPriority] = useState<string>("all");
  const [fOwner, setFOwner] = useState<string>("all");
  const [allWarn, setAllWarn] = useState(false);
  const [sel, setSel] = useState<Sel>(null);
  const [dayOpen, setDayOpen] = useState<DayOpen>(null);
  const bars = useMemo(() => TIMELINE.map((it) => ({ ...it, ...plan.overlay.reschedules[it.id] })), [plan.overlay.reschedules]);
  const moveOf = useCallback((id: string | null) => (id ? plan.moves.find((m) => m.id === id) : undefined), [plan.moves]);
  const warnings = useMemo(() => dayWarnings(plan.dayItems, {
    today: PLAN_TODAY, overlay: plan.overlay, requirements: plan.f.requirements, builders: plan.f.builders, moveStateOf: (id) => moveOf(id)?.state ?? null,
  }), [plan.dayItems, plan.overlay, plan.f, moveOf]);
  const warnBy = useMemo(() => {
    const m = new Map<string, DayWarning[]>();
    for (const w of warnings) m.set(w.itemId, [...(m.get(w.itemId) ?? []), w]);
    return m;
  }, [warnings]);

  if (period.month !== "2026-10") return <PlanFrame view="timeline"><p className="f-pl-meta">לתוכנית של נובמבר עוד אין ציר זמן. <Link className="f-pl-link" href={`${R.plan}?period=2026-11`}>למה מקדמים בנובמבר ‹</Link></p></PlanFrame>;

  const days = week ? range(PLAN_WEEK.from, PLAN_WEEK.to) : range(1, PLAN_MONTH_DAYS);
  const weekIds = week ? weekMoveIds(plan.moves, plan.dayItems) : null;
  const moveVisible = (m: Move) => (fPriority === "all" || m.priorityId === fPriority) && (fOwner === "all" || m.ownerId === fOwner) && (!weekIds || weekIds.has(m.id));
  const itemVisible = (it: DayItem) => it.priorityId != null && (fPriority === "all" || it.priorityId === fPriority) && (fOwner === "all" || moveOf(it.moveId)?.ownerId === fOwner);
  const moves = plan.moves.filter(moveVisible);
  const items = plan.dayItems.filter(itemVisible);
  const planWide = plan.dayItems.filter((it) => it.priorityId == null);
  const lanes: Lane[] = byChannel
    ? [
      ...[...new Set([...moves.map((m) => m.channel), ...items.flatMap((it) => moveOf(it.moveId)?.channel ?? [])])].map((c) => ({
        key: c, label: CHANNEL_WORD[c], title: <b className="f-pl-lane__name">{CHANNEL_WORD[c]}</b>,
        moves: moves.filter((m) => m.channel === c), items: items.filter((it) => moveOf(it.moveId)?.channel === c),
      })),
      { key: "general", label: "כללי לנושא", title: <b className="f-pl-lane__name">כללי לנושא</b>, moves: [], items: items.filter((it) => !it.moveId) },
    ]
    : PLAN_OCTOBER.priorities.map((pp) => ({
      key: pp.priorityId,
      label: priorityOf(pp.priorityId).name,
      title: <><b className="f-pl-lane__name">{priorityOf(pp.priorityId).name}</b><PriorityStatusChip status={pp.status} size="sm" /></>,
      moves: moves.filter((m) => m.priorityId === pp.priorityId),
      items: items.filter((it) => it.priorityId === pp.priorityId),
    }));
  const shownLanes = lanes.filter((l) => l.moves.length || l.items.some((it) => days.includes(it.day)));

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
  const itemById = (id: string) => plan.dayItems.find((x) => x.id === id);
  const shownWarn = allWarn ? warnings : warnings.slice(0, 3);
  const openItem = (id: string) => { setDayOpen(null); setSel({ kind: "item", id }); };
  const style = { "--days": days.length } as CSSProperties;
  const col = (d: number) => d - days[0] + 2;

  return (
    <PlanFrame view="timeline" controls={controls}>
      {filters && (
        <div id="tl-filters" className="f-pl-filters">
          <Chips label="מה מקדמים" value={fPriority} onChange={setFPriority} items={[{ key: "all", label: "הכל" }, ...PLAN_OCTOBER.priorities.map((p) => ({ key: p.priorityId, label: priorityOf(p.priorityId).shortName }))]} />
          <Chips label="בעלים" value={fOwner} onChange={setFOwner} items={[{ key: "all", label: "כל הבעלים" }, { key: PEOPLE.dana.id, label: PEOPLE.dana.name }, { key: PEOPLE.yoav.id, label: PEOPLE.yoav.name }]} />
        </div>
      )}
      {week && <WeekNote>מוצגים ימי השבוע ({PLAN_WEEK.from}–{PLAN_WEEK.to}.10) והמהלכים שיש להם בנייה, בדיקה או פריט ביצוע השבוע.</WeekNote>}

      <section aria-labelledby="tl-warn" className="f-pl-warns">
        <h2 id="tl-warn" className="f-pl-h3">{warnings.length ? `${warnings.length} דברים על הקו` : "אין אזהרות על הקו"}</h2>
        {warnings.length > 0 && (
          <ul className="f-pl-warns__list">
            {shownWarn.map((w) => {
              const it = itemById(w.itemId)!;
              return (
                <li key={`${w.itemId}-${w.kind}`} className="f-pl-warn">
                  <span className={cx("f-pl-warn__glyph", w.severity === "high" && "f-pl-warn__glyph--high")} aria-hidden>▲</span>
                  <span className="f-pl-warn__text"><b>{DAY_WARNING_WORD[w.kind]} · {it.title}</b> <span className="f-pl-meta">{weekday(w.day)} {dayLabel(w.day)} · {w.text}</span></span>
                  <button type="button" className="f-pl-warn__open f-hit" onClick={() => openItem(w.itemId)} aria-label={`פתח · ${it.title}`}>פתח</button>
                </li>
              );
            })}
          </ul>
        )}
        {warnings.length > 3 && <button type="button" className="f-pl-linkbtn f-hit" aria-expanded={allWarn} onClick={() => setAllWarn((v) => !v)}>{allWarn ? "הצג פחות" : `הצג עוד ${warnings.length - 3}`}</button>}
      </section>

      {/* desktop / tablet: one column per calendar day (scrolls inside its card; the label column stays put) */}
      <div className="f-pl-grid-wrap">
        <div className={cx("f-pl-cal", week && "f-pl-cal--week")} style={style} role="group" aria-label={week ? `ציר זמן · ${PLAN_WEEK.from}–${PLAN_WEEK.to} באוקטובר` : "ציר זמן · אוקטובר 2026, יום אחר יום"}>
          <div className="f-pl-cal__row f-pl-cal__row--head">
            <span className="f-pl-cal__label f-pl-meta">אוקטובר 2026</span>
            {days.map((d) => {
              const load = dayLoad(items, d);
              return (
                <button key={d} type="button" className={cx("f-pl-cal__dayhead f-hit", isWeekend(d) && "f-pl-cal--weekend", inThisWeek(d) && "f-pl-cal--thisweek", d === PLAN_TODAY && "f-pl-cal--today")}
                  style={{ gridColumn: col(d) }} onClick={() => setDayOpen({ day: d })}
                  aria-label={`${weekday(d)} ${dayLabel(d)}${d === PLAN_TODAY ? " · היום" : ""} · ${load.count ? itemsWord(load.count) : "אין פריטים"}${load.overloaded ? " · עומס" : ""} · פתח את היום והוסף פריט`}>
                  <span className="f-pl-cal__dnum">{d}</span>
                  <span className="f-pl-cal__dwd">{d === PLAN_TODAY ? "היום" : WEEKDAY_SHORT[wd(d)]}</span>
                </button>
              );
            })}
          </div>

          <ExecRow label="רגעים ואבני דרך" muted days={days} col={col} items={planWide} warnBy={warnBy} wide={week} onOpen={openItem}
            onDay={(d) => setDayOpen({ day: d, priorityId: null })} onAdd={(d) => setDayOpen({ day: d, priorityId: null, add: true })} />

          {shownLanes.map((lane) => (
            <div key={lane.key} className="f-pl-cal__lane" role="group" aria-label={lane.label}>
              <div className="f-pl-cal__row f-pl-cal__row--lane"><span className="f-pl-cal__label f-pl-lane__title">{lane.title}</span></div>
              {lane.moves.map((m) => {
                const row = PRODUCTION.find((r) => r.moveId === m.id);
                const reason = row ? productionVisibility(row, { today: PLAN_TODAY, expanded: !!expanded[m.id], switchOn: production }) : null;
                return (
                  <FlightRow key={m.id} m={m} days={days} col={col} bars={bars.filter((b) => b.moveId === m.id)} expanded={!!expanded[m.id]}
                    onToggle={row ? () => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] })) : undefined}
                    production={row && reason ? { row, reason } : null} onOpen={(it) => setSel({ kind: "bar", it, m })} />
                );
              })}
              <ExecRow label={`ביצוע · ${lane.label}`} days={days} col={col} items={lane.items} warnBy={warnBy} wide={week} onOpen={openItem}
                onDay={(d) => setDayOpen({ day: d, priorityId: byChannel ? undefined : lane.key })}
                onAdd={(d) => setDayOpen({ day: d, priorityId: byChannel ? undefined : lane.key, add: true })} />
            </div>
          ))}

          <div className="f-pl-cal__row f-pl-cal__row--load" aria-hidden>
            <span className="f-pl-cal__label f-pl-meta">עומס יומי</span>
            {days.map((d) => {
              const l = dayLoad(items, d);
              return <span key={d} className={cx("f-pl-cal__load", l.overloaded && "f-pl-cal__load--over", isWeekend(d) && "f-pl-cal--weekend", d === PLAN_TODAY && "f-pl-cal--today")} style={{ gridColumn: col(d) }}>{l.overloaded ? `▲${l.count}` : l.count || "·"}</span>;
            })}
          </div>
        </div>
      </div>
      <Legend />

      <Agenda plan={plan} bars={bars} warnings={warnings} warnBy={warnBy} onOpen={openItem} onAdd={(d) => setDayOpen({ day: d, add: true })} />
      <DayPanel plan={plan} open={dayOpen} warnBy={warnBy} onClose={() => setDayOpen(null)} onOpen={openItem} />
      <ItemPanel plan={plan} sel={sel} warnBy={warnBy} onClose={() => setSel(null)} />
    </PlanFrame>
  );
}

/* ---------- desktop rows ---------- */

function Cells({ days, col }: { days: number[]; col: (d: number) => number }) {
  return <>{days.map((d) => <span key={d} aria-hidden className={cx("f-pl-cal__cell", isWeekend(d) && "f-pl-cal--weekend", inThisWeek(d) && "f-pl-cal--thisweek", d === PLAN_TODAY && "f-pl-cal--today")} style={{ gridColumn: col(d) }} />)}</>;
}

function FlightRow({ m, days, col, bars, expanded, onToggle, production, onOpen }: {
  m: Move; days: number[]; col: (d: number) => number; bars: TimelineItem[]; expanded: boolean; onToggle?: () => void;
  production: { row: (typeof PRODUCTION)[number]; reason: keyof typeof PRODUCTION_REASON } | null; onOpen: (it: TimelineItem) => void;
}) {
  const first = days[0], last = days[days.length - 1];
  const span = (s: number, e: number) => ({ gridColumn: `${col(Math.max(s, first))} / ${col(Math.min(e, last)) + 1}` });
  return (
    <>
      <div className="f-pl-cal__row f-pl-cal__row--bar">
        <span className="f-pl-cal__label f-pl-cal__label--move">
          {onToggle
            ? <button type="button" className="f-pl-expand f-hit" aria-expanded={expanded} onClick={onToggle}><span aria-hidden>{expanded ? "▾" : "▸"}</span> {m.longName}<span className="f-sr"> · הפקת תוכן</span></button>
            : <span className="f-pl-expand f-pl-expand--static">{m.longName}</span>}
          <span className="f-sr"> · {MOVE_STATE[m.state].word}</span>
        </span>
        <Cells days={days} col={col} />
        {bars.filter((b) => b.endDay >= first && b.startDay <= last).map((b) => {
          const label = `${m.longName} · ${b.label ?? BAR_WORD[b.kind]} · ${b.startDay}–${b.endDay}.10`;
          return (
            <button key={b.id} type="button" className={cx("f-pl-flight f-hit", `f-pl-flight--${b.kind}`)} style={span(b.startDay, b.endDay)} aria-label={label} title={label} onClick={() => onOpen(b)}>
              <span className="f-pl-flight__text">{b.label ?? BAR_WORD[b.kind]}</span>
            </button>
          );
        })}
      </div>
      {production && production.row.endDay >= first && production.row.startDay <= last && (
        <div className="f-pl-cal__row f-pl-cal__row--prod">
          <span className="f-pl-cal__label f-pl-cal__label--prod">↳ הפקה <span className="f-pl-reasonchip">{PRODUCTION_REASON[production.reason]}</span></span>
          <Cells days={days} col={col} />
          <span className={cx("f-pl-flight", "f-pl-flight--production", production.row.warning && "f-pl-flight--production-warn")} style={span(production.row.startDay, production.row.endDay)}>
            <span className="f-pl-flight__text">{production.row.warning ? "▲ " : ""}{production.row.label}</span>
          </span>
        </div>
      )}
    </>
  );
}

function ExecRow({ label, muted, days, col, items, warnBy, wide, onOpen, onDay, onAdd }: {
  label: string; muted?: boolean; days: number[]; col: (d: number) => number; items: DayItem[]; warnBy: Map<string, DayWarning[]>; wide: boolean;
  onOpen: (id: string) => void; onDay: (d: number) => void; onAdd: (d: number) => void;
}) {
  const cap = wide ? 6 : 3;
  return (
    <div className={cx("f-pl-cal__row f-pl-cal__row--exec", muted && "f-pl-cal__row--plan")}>
      <span className="f-pl-cal__label f-pl-cal__label--exec">{label}</span>
      {days.map((d) => {
        const on = items.filter((it) => it.day === d).sort(byType);
        const shown = on.length > cap ? on.slice(0, cap - 1) : on;
        return (
          // a click on the empty part of a day adds an item there (a mouse shortcut; the keyboard path is the day header)
          <div key={d} className={cx("f-pl-cal__slot", isWeekend(d) && "f-pl-cal--weekend", inThisWeek(d) && "f-pl-cal--thisweek", d === PLAN_TODAY && "f-pl-cal--today")}
            style={{ gridColumn: col(d) }} onClick={(e) => { if (e.target === e.currentTarget) onAdd(d); }}>
            {shown.map((it) => <DayChip key={it.id} it={it} warns={warnBy.get(it.id) ?? []} wide={wide} onOpen={onOpen} />)}
            {on.length > shown.length && <button type="button" className="f-pl-dmore" onClick={() => onDay(d)} aria-label={`עוד ${on.length - shown.length} פריטים ב־${dayLabel(d)}`}>+{on.length - shown.length}</button>}
          </div>
        );
      })}
    </div>
  );
}

function itemLabel(it: DayItem, warns: DayWarning[]) {
  return `${DAY_TYPE[it.type].word} · ${it.title} · ${weekday(it.day)} ${dayLabel(it.day)} · ${dayStatusWord(it.type, it.status)}${warns.length ? ` · ${[...new Set(warns.map((w) => DAY_WARNING_WORD[w.kind]))].join(", ")}` : ""}`;
}

function DayChip({ it, warns, wide, onOpen }: { it: DayItem; warns: DayWarning[]; wide: boolean; onOpen: (id: string) => void }) {
  const label = itemLabel(it, warns);
  const high = warns.some((w) => w.severity === "high");
  const moment = it.type === "moment";
  return (
    <button type="button" className={cx("f-pl-dchip", `f-pl-dchip--${FAMILY[it.type]}`, `f-pl-dchip--st-${it.status}`, warns.length > 0 && (high ? "f-pl-dchip--warn-high" : "f-pl-dchip--warn"), wide && "f-pl-dchip--wide")}
      aria-label={label} title={label} onClick={() => onOpen(it.id)}>
      <span className="f-pl-dchip__type">
        {warns.length > 0 && <span className="f-pl-dchip__glyph" aria-hidden>▲</span>}
        {it.status === "done" && <span aria-hidden>✓</span>}
        {moment ? it.title : DAY_TYPE[it.type].short}
      </span>
      {wide && !moment && <span className="f-pl-dchip__title">{it.title}</span>}
    </button>
  );
}

function Legend() {
  return (
    <ul className="f-pl-legend" aria-label="מקרא">
      <li className="f-pl-legend__group">פסים = תקופה:</li>
      <li><span className="f-pl-sw f-pl-sw--live" aria-hidden />פעיל</li>
      <li><span className="f-pl-sw f-pl-sw--build" aria-hidden />בנייה / בדיקה</li>
      <li><span className="f-pl-sw f-pl-sw--flight" aria-hidden />ממתין לאישור</li>
      <li><span className="f-pl-sw f-pl-sw--planned" aria-hidden />מתוכנן</li>
      <li className="f-pl-legend__group">פריטים = ביצוע ביום מדויק:</li>
      <li><span className="f-pl-sw f-pl-sw--content" aria-hidden />תוכן</li>
      <li><span className="f-pl-sw f-pl-sw--message" aria-hidden />דוא״ל / WhatsApp</li>
      <li><span className="f-pl-sw f-pl-sw--launch" aria-hidden />השקה</li>
      <li><span className="f-pl-sw f-pl-sw--prep" aria-hidden />יעד נכס / אישור / רענון</li>
      <li><span className="f-pl-sw f-pl-sw--review" aria-hidden />בדיקה / סקירה</li>
      <li><span className="f-pl-sw f-pl-sw--dashed" aria-hidden />מקווקו = מתוכנן · מלא = בעבודה/מוכן/מתוזמן · ✓ בוצע · ▲ אזהרה</li>
      <li><span className="f-pl-sw f-pl-sw--today" aria-hidden />היום · {dayLabel(PLAN_TODAY)}</li>
    </ul>
  );
}

/* ---------- mobile: weekly agenda, every item on its exact date ---------- */

function Agenda({ plan, bars, warnings, warnBy, onOpen, onAdd }: {
  plan: PlanApi; bars: TimelineItem[]; warnings: DayWarning[]; warnBy: Map<string, DayWarning[]>; onOpen: (id: string) => void; onAdd: (d: number) => void;
}) {
  const [wi, setWi] = useState(1);
  const [showLive, setShowLive] = useState(false);
  const w = PLAN_WEEKS[wi];
  const live = plan.moves.filter((m) => m.state === "live");
  const a = agendaWeek(plan.dayItems, bars, w, live.length);
  const warnWeek = (wk: { from: number; to: number }) => warnings.some((x) => x.day >= wk.from && x.day <= wk.to);
  const banner = warnings.find((x) => x.severity === "high" && x.day >= w.from && x.day <= w.to);
  const moveOf = (id: string | null) => (id ? plan.moves.find((m) => m.id === id) : undefined);
  return (
    <section className="f-pl-agenda" aria-label="יומן שבועי">
      <div className="f-pl-agenda__weeks" role="group" aria-label="שבוע">
        {PLAN_WEEKS.map((wk, i) => (
          <button key={wk.from} type="button" className="f-pl-weekchip f-hit" aria-pressed={i === wi} onClick={() => setWi(i)}>
            {wk.from}–{wk.to}{warnWeek(wk) && <><span aria-hidden> ▲</span><span className="f-sr"> · יש אזהרה</span></>}
          </button>
        ))}
      </div>
      {banner && (
        <p className="f-pl-agenda__banner"><span aria-hidden>▲ </span><b>{DAY_WARNING_WORD[banner.kind]}</b> · {plan.dayItems.find((x) => x.id === banner.itemId)?.title} · {dayLabel(banner.day)}{" "}
          <button type="button" className="f-pl-agenda__bannerbtn f-hit" onClick={() => onOpen(banner.itemId)}>פתח</button></p>
      )}
      {a.days.map((d) => (
        <section key={d.day} className="f-pl-agenda__day" aria-labelledby={`ag-${d.day}`}>
          <div className="f-pl-agenda__dayhead">
            <h3 id={`ag-${d.day}`} className={cx("f-pl-agenda__date", d.day === PLAN_TODAY && "f-pl-agenda__date--today")}>{d.day === PLAN_TODAY ? "היום · " : ""}{weekday(d.day)} {dayLabel(d.day)}</h3>
            <button type="button" className="f-pl-agenda__add f-hit" onClick={() => onAdd(d.day)} aria-label={`הוסף פריט ל־${weekday(d.day)} ${dayLabel(d.day)}`}>+ הוסף</button>
          </div>
          {d.starts.map((b) => <p key={b.id} className="f-pl-agenda__ctx"><span aria-hidden>▬ </span>{b.agenda}</p>)}
          {d.items.length === 0 && d.starts.length === 0 && <p className="f-pl-agenda__empty">אין פריטים ביום הזה</p>}
          {[...d.items].sort(byType).map((it) => {
            const warns = warnBy.get(it.id) ?? [];
            const m = moveOf(it.moveId);
            return (
              <button key={it.id} type="button" className={cx("f-pl-agenda__item", warns.length > 0 && "f-pl-agenda__item--warn")} onClick={() => onOpen(it.id)} aria-label={itemLabel(it, warns)}>
                <span className={cx("f-pl-mk", `f-pl-mk--${FAMILY[it.type]}`)} aria-hidden />
                <span className="f-pl-agenda__body">
                  <b>{it.title}</b>
                  <span className="f-pl-meta">{DAY_TYPE[it.type].word} · {it.priorityId ? priorityOf(it.priorityId).shortName : "כל התוכנית"}{m ? ` · ${m.name}` : ""} · {dayStatusWord(it.type, it.status)}</span>
                  {warns.length > 0 && <span className="f-pl-agenda__warn"><span aria-hidden>▲ </span>{DAY_WARNING_WORD[warns[0].kind]} · {warns[0].text}</span>}
                </span>
              </button>
            );
          })}
        </section>
      ))}
      <button type="button" className="f-pl-agenda__live f-hit" aria-expanded={showLive} onClick={() => setShowLive((v) => !v)}>{a.liveAllWeek} פעילים לאורך כל השבוע · <b>{showLive ? "הסתר" : "הצג"}</b></button>
      {showLive && <ul className="f-pl-agenda__livelist">{live.map((m) => <li key={m.id}>{m.longName} <span className="f-pl-meta">· {priorityOf(m.priorityId).shortName}</span></li>)}</ul>}
      <p className="f-pl-meta f-pl-agenda__note">כל פריט אפשר להזיז ליום אחר מתוך הפריט עצמו. לחודש המלא פתחו את התוכנית במסך רחב.</p>
    </section>
  );
}

/* ---------- a day: its items + add ---------- */

function DayPanel({ plan, open, warnBy, onClose, onOpen }: { plan: PlanApi; open: DayOpen; warnBy: Map<string, DayWarning[]>; onClose: () => void; onOpen: (id: string) => void }) {
  return (
    <Dialog open={!!open} onClose={onClose} variant="drawer" labelledBy="tl-day-t" className="f-pl-panel f-pl-panel--change">
      {open && <DayBody key={`${open.day}-${open.add ? 1 : 0}`} plan={plan} open={open} warnBy={warnBy} onClose={onClose} onOpen={onOpen} />}
    </Dialog>
  );
}

function DayBody({ plan, open, warnBy, onClose, onOpen }: { plan: PlanApi; open: NonNullable<DayOpen>; warnBy: Map<string, DayWarning[]>; onClose: () => void; onOpen: (id: string) => void }) {
  const [adding, setAdding] = useState(!!open.add);
  const its = plan.dayItems.filter((it) => it.day === open.day).sort(byType);
  const load = dayLoad(its, open.day);
  return (
    <div className="f-pl-panel__wrap">
      <div className="f-pl-panel__head">
        <div className="f-pl-panel__crumbrow"><span className="f-pl-meta">ציר זמן · אוקטובר 2026</span><button type="button" className="f-pl-x f-hit" aria-label="סגירה" onClick={onClose}>×</button></div>
        <h2 id="tl-day-t" className="f-pl-panel__title">{weekday(open.day)} {dayLabel(open.day)}{open.day === PLAN_TODAY ? " · היום" : ""}</h2>
        <span className="f-pl-meta">{its.length ? itemsWord(its.length) : "אין פריטים"}{load.launches > 0 ? ` · ${load.launches} השקות` : ""}{load.overloaded ? " · עומס: כדאי לפזר" : ""}</span>
      </div>
      {adding ? (
        <AddItemForm plan={plan} day={open.day} priorityId={open.priorityId} moveId={open.moveId} onDone={() => setAdding(false)} onCancel={() => (open.add ? onClose() : setAdding(false))} />
      ) : (
        <>
          <div className="f-pl-panel__body">
            {its.length > 0 && (
              <ul className="f-pl-daylist" aria-label={`פריטים ב־${dayLabel(open.day)}`}>
                {its.map((it) => {
                  const warns = warnBy.get(it.id) ?? [];
                  return (
                    <li key={it.id}>
                      <button type="button" className={cx("f-pl-dayrow f-hit", warns.length > 0 && "f-pl-dayrow--warn")} onClick={() => onOpen(it.id)} aria-label={itemLabel(it, warns)}>
                        <span className={cx("f-pl-mk", `f-pl-mk--${FAMILY[it.type]}`)} aria-hidden />
                        <span className="f-pl-agenda__body">
                          <b>{it.title}</b>
                          <span className="f-pl-meta">{DAY_TYPE[it.type].word} · {it.priorityId ? priorityOf(it.priorityId).shortName : "כל התוכנית"} · {dayStatusWord(it.type, it.status)}</span>
                          {warns.map((w) => <span key={w.kind} className="f-pl-agenda__warn"><span aria-hidden>▲ </span>{DAY_WARNING_WORD[w.kind]} · {w.text}</span>)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <DemoNote>פריטים שמוסיפים או מזיזים נשמרים בדפדפן הזה בלבד</DemoNote>
          </div>
          <div className="f-pl-panel__foot">
            <span className="f-pl-panel__footnote" />
            <Button variant="quiet" onClick={onClose}>סגירה</Button>
            <Button variant="strong" onClick={() => setAdding(true)}>+ הוסף פריט ל־{dayLabel(open.day)}</Button>
          </div>
        </>
      )}
    </div>
  );
}

const STATUS_OPTIONS: { value: DayItemStatus; label: string }[] = [
  { value: "planned", label: "מתוכנן" }, { value: "in_progress", label: "בעבודה" }, { value: "ready", label: "מוכן" }, { value: "scheduled", label: "מתוזמן" },
];

function AddItemForm({ plan, day, priorityId, moveId, onDone, onCancel }: {
  plan: PlanApi; day: number; priorityId?: string | null; moveId?: string | null; onDone: () => void; onCancel: () => void;
}) {
  const toast = useToast();
  const id = useId();
  const [type, setType] = useState<DayItemType>(priorityId === null ? "milestone" : "post");
  const [pri, setPri] = useState<string>(priorityId === null ? "" : priorityId ?? PLAN_OCTOBER.priorities[0].priorityId);
  const [move, setMove] = useState<string>(moveId ?? "");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<DayItemStatus>("planned");
  const [d, setD] = useState(String(day));
  const [tried, setTried] = useState(false);
  useNavGuard({ dirty: title.trim().length > 0, what: "הפריט החדש עוד לא נשמר." });
  const priErr = !pri && !PLAN_WIDE.includes(type) ? "בחרו נושא · רק רגע עסקי או אבן דרך שייכים לכל התוכנית" : null;
  const titleErr = !title.trim() ? "כתבו כותרת קצרה" : null;
  const moves = plan.moves.filter((m) => m.priorityId === pri);
  const save = () => {
    setTried(true);
    if (priErr || titleErr) return;
    const created = plan.addDayItem({ day: Number(d), type, title: title.trim(), priorityId: pri || null, moveId: pri && move ? move : null, status });
    toast.push({ kind: "success", title: "הפריט נוסף לציר הזמן", detail: `${DAY_TYPE[created.type].word} · ${created.title} · ${weekday(created.day)} ${dayLabel(created.day)}` });
    onDone();
  };
  return (
    <>
      <form id={`${id}-f`} className="f-pl-panel__body f-pl-form" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <span className="f-pl-h3">פריט חדש</span>
        <SelectField label="סוג" value={type} onChange={(e) => setType(e.target.value as DayItemType)} options={ADDABLE.map((t) => ({ value: t, label: DAY_TYPE[t].word }))} />
        <SelectField label="נושא (מה מקדמים)" value={pri} onChange={(e) => { setPri(e.target.value); setMove(""); }} error={tried ? priErr : null}
          options={[...PLAN_OCTOBER.priorities.map((p) => ({ value: p.priorityId, label: priorityOf(p.priorityId).name })), { value: "", label: "כל התוכנית" }]} />
        {pri && <SelectField label="קמפיין / מהלך" value={move} onChange={(e) => setMove(e.target.value)} options={[{ value: "", label: "כללי לנושא" }, ...moves.map((m) => ({ value: m.id, label: m.longName }))]} />}
        <TextField label="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} error={tried ? titleErr : null} placeholder="למשל: פוסט שקיעה עם התפריט החדש" />
        <div className="f-pl-2col">
          <SelectField label="יום" value={d} onChange={(e) => setD(e.target.value)} options={range(1, PLAN_MONTH_DAYS).map((x) => ({ value: String(x), label: `${weekday(x)} ${dayLabel(x)}${x === PLAN_TODAY ? " · היום" : ""}` }))} />
          <SelectField label="סטטוס" value={status} onChange={(e) => setStatus(e.target.value as DayItemStatus)} options={STATUS_OPTIONS} />
        </div>
      </form>
      <div className="f-pl-panel__foot">
        <span className="f-pl-meta f-pl-panel__footnote">נשמר בדפדפן הזה · שום דבר לא מתפרסם</span>
        <Button variant="quiet" onClick={onCancel}>ביטול</Button>
        <Button type="submit" form={`${id}-f`} variant="strong">שמור</Button>
      </div>
    </>
  );
}

/* ---------- an item: details, exact day, status (or an approval request) ---------- */

function ItemPanel({ plan, sel, warnBy, onClose }: { plan: PlanApi; sel: Sel; warnBy: Map<string, DayWarning[]>; onClose: () => void }) {
  const it = sel?.kind === "item" ? plan.dayItems.find((x) => x.id === sel.id) : undefined;
  return (
    <Dialog open={!!sel} onClose={onClose} variant="drawer" labelledBy="tl-item-t" className="f-pl-panel f-pl-panel--change">
      {sel?.kind === "bar" && <BarBody key={sel.it.id} plan={plan} it={sel.it} m={sel.m} onClose={onClose} />}
      {it && <DayItemBody key={it.id} plan={plan} it={it} warns={warnBy.get(it.id) ?? []} onClose={onClose} />}
    </Dialog>
  );
}

function PanelHead({ crumb, title, sub, onClose }: { crumb: string; title: string; sub: ReactNode; onClose: () => void }) {
  return (
    <div className="f-pl-panel__head">
      <div className="f-pl-panel__crumbrow"><span className="f-pl-meta">{crumb}</span><button type="button" className="f-pl-x f-hit" aria-label="סגירה" onClick={onClose}>×</button></div>
      <h2 id="tl-item-t" className="f-pl-panel__title">{title}</h2>
      <span className="f-pl-meta">{sub}</span>
    </div>
  );
}

function DayItemBody({ plan, it, warns, onClose }: { plan: PlanApi; it: DayItem; warns: DayWarning[]; onClose: () => void }) {
  const toast = useToast();
  const id = useId();
  const m = it.moveId ? plan.moves.find((x) => x.id === it.moveId) : undefined;
  const mode = canMoveDayItem(it, (m?.state as MoveState | undefined) ?? null);
  const [d, setD] = useState(String(it.day));
  const [st, setSt] = useState<DayItemStatus>(it.status);
  const requested = plan.overlay.rescheduleRequests[it.id];
  const dayChanged = Number(d) !== it.day;
  const dirty = dayChanged || st !== it.status;
  const days = range(1, PLAN_MONTH_DAYS).map((x) => ({ value: String(x), label: `${weekday(x)} ${dayLabel(x)}${x === PLAN_TODAY ? " · היום" : ""}` }));
  const statusOptions = [...STATUS_OPTIONS, { value: "done" as const, label: dayStatusWord(it.type, "done") }, ...(it.status === "blocked" ? [{ value: "blocked" as const, label: "חסום" }] : [])];
  const req = it.needs?.requirementId;
  const href = m?.builderId ? R.planBuilder(m.builderId) : m ? `${R.planMoves}#move-${m.id}` : null;
  const apply = () => {
    if (dayChanged && mode === "move") plan.moveDayItem(it.id, Number(d));
    if (dayChanged && mode === "approval") plan.requestReschedule(it.id, Number(d));
    if (st !== it.status) plan.setDayStatus(it.id, st);
    toast.push({
      kind: "success",
      title: dayChanged && mode === "approval" ? "נשלחה בקשת אישור להזזה" : dayChanged ? "הפריט הוזז" : "הפריט עודכן",
      detail: `${it.title} · ${weekday(Number(d))} ${dayLabel(Number(d))} · ${dayStatusWord(it.type, st)}`,
    });
    onClose();
  };
  return (
    <div className="f-pl-panel__wrap">
      <PanelHead crumb={`${it.priorityId ? priorityOf(it.priorityId).name : "כל התוכנית"}${m ? ` · ${m.longName}` : ""}`} title={it.title}
        sub={<>{DAY_TYPE[it.type].word} · {weekday(it.day)} {dayLabel(it.day)} · {dayStatusWord(it.type, it.status)}{it.added ? " · נוסף כאן" : ""}</>} onClose={onClose} />
      <form id={`${id}-f`} className="f-pl-panel__body f-pl-form" onSubmit={(e) => { e.preventDefault(); if (dirty) apply(); }}>
        {warns.length > 0 && (
          <ul className="f-pl-itemwarns">
            {warns.map((w) => (
              <li key={w.kind} className={cx("f-pl-note", w.severity === "high" ? "f-pl-note--red" : "f-pl-note--amber")}>
                <b>{DAY_WARNING_WORD[w.kind]}</b> · {w.text}
                {req && (w.kind === "missing_asset" || w.kind === "approval_incomplete" || w.kind === "refresh_due") && <> · <Link className="f-pl-link" href={`${R.planAssets}?req=${encodeURIComponent(req)}`}>לדרישת התוכן ‹</Link></>}
                {w.kind === "blocked" && m?.builderId && <> · <Link className="f-pl-link" href={R.planBuilder(m.builderId)}>לבונה ‹</Link></>}
              </li>
            ))}
          </ul>
        )}
        {mode === "move" && <SelectField label="תאריך מדויק" value={d} onChange={(e) => setD(e.target.value)} options={days} />}
        {mode === "approval" && (requested
          ? <p className="f-pl-note">בקשה להזזה ל־{dayLabel(requested)} ממתינה לאישור הלקוח. <DemoNote>האישור מדומה באב טיפוס</DemoNote></p>
          : <>
            <p className="f-pl-note f-pl-note--amber">{DAY_TYPE[it.type].word} של מהלך במצב &quot;{m ? MOVE_STATE[m.state].word : ""}&quot; הוא שינוי תוכנית: הזזה פותחת בקשת אישור, ושום דבר לא זז עד שבעלים מאשר.</p>
            <SelectField label="להזיז ל־" value={d} onChange={(e) => setD(e.target.value)} options={days} />
          </>)}
        {mode === "fixed" && <p className="f-pl-meta">{it.type === "moment" ? "רגע עסקי הוא עובדה בלוח השנה ולא זז." : "הפריט כבר בוצע ולא זז."}</p>}
        {it.type !== "moment" && <SelectField label="סטטוס" value={st} onChange={(e) => setSt(e.target.value as DayItemStatus)} options={statusOptions} />}
        {it.blockedReason && <p className="f-pl-meta">סיבת החסימה: {it.blockedReason}</p>}
        {m && <span className="f-pl-meta">המהלך: {m.longName} · <MoveStateTag state={m.state} /></span>}
        {href && <Link href={href} className="f-pl-link">פתח את המהלך ‹</Link>}
      </form>
      <div className="f-pl-panel__foot">
        <span className="f-pl-meta f-pl-panel__footnote">נשמר בדפדפן הזה · שום דבר לא מתפרסם</span>
        <Button variant="quiet" onClick={onClose}>ביטול</Button>
        <Button type="submit" form={`${id}-f`} variant="strong" disabled={!dirty} disabledReason={!dirty ? "לא שונה דבר" : undefined}>
          {dayChanged && mode === "approval" ? "בקש אישור להזזה" : "שמור"}
        </Button>
      </div>
    </div>
  );
}

function BarBody({ plan, it, m, onClose }: { plan: PlanApi; it: TimelineItem; m: Move; onClose: () => void }) {
  const toast = useToast();
  const id = useId();
  const mode = canReschedule(it, m.state as MoveState);
  const len = it.endDay - it.startDay;
  const [start, setStart] = useState(String(it.startDay));
  const requested = plan.overlay.rescheduleRequests[it.id];
  const days = Array.from({ length: PLAN_MONTH_DAYS - len }, (_, i) => ({ value: String(i + 1), label: `${weekday(i + 1)} ${dayLabel(i + 1)}${i + 1 === PLAN_TODAY ? " · היום" : ""}` }));
  const href = m.builderId ? R.planBuilder(m.builderId) : `${R.planMoves}#move-${m.id}`;
  return (
    <div className="f-pl-panel__wrap">
      <PanelHead crumb={`${priorityOf(m.priorityId).name} · ${m.longName}`} title={it.label ?? BAR_WORD[it.kind]} sub={<>{it.startDay}–{it.endDay}.10 · <MoveStateTag state={m.state} /></>} onClose={onClose} />
      <div className="f-pl-panel__body">
        {mode === "move" && (
          <form id={`${id}-f`} className="f-pl-form" onSubmit={(e) => { e.preventDefault(); const s = Number(start); plan.reschedule(it.id, s, s + len); toast.push({ kind: "success", title: "התקופה הוזזה", detail: `${m.longName} · ${s}–${s + len}.10` }); onClose(); }}>
            <p className="f-pl-meta">המהלך עוד לא פעיל ואינו דורש אישור, אז אפשר להזיז את התקופה כאן.</p>
            <SelectField label="מתחיל ב־" value={start} onChange={(e) => setStart(e.target.value)} options={days} />
          </form>
        )}
        {mode === "approval" && (
          <div className="f-pl-form">
            <p className="f-pl-note f-pl-note--amber">הזזת תקופה של מהלך פעיל או כזה שדורש אישור פותחת בקשת אישור. שום דבר לא זז עד שבעלים מאשר.</p>
            {requested
              ? <p className="f-pl-note">בקשה להזזה ל־{dayLabel(requested)} ממתינה לאישור הלקוח. <DemoNote>האישור מדומה באב טיפוס</DemoNote></p>
              : <SelectField label="להזיז ל־" value={start} onChange={(e) => setStart(e.target.value)} options={days} />}
          </div>
        )}
        {mode === "fixed" && <p className="f-pl-meta">התקופה כבר התחילה ולא זזה.</p>}
        <p className="f-pl-meta">פסים הם הקשר של תקופה. פוסטים, שליחות, השקות ויעדים יושבים על יום מדויק בשורת &quot;ביצוע&quot;.</p>
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
