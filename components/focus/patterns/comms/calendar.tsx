"use client";

import Link from "next/link";
import { useState } from "react";
import type { CalendarEvent, CalendarEventKind } from "@/lib/focus/contracts/comms";
import { fmtMonthYear, fmtTime, fmtWeekday, parts } from "@/lib/focus/format";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Dialog } from "@/components/focus/ui/dialog";
import { EmptyState } from "@/components/focus/ui/feedback";
import { SelectField, TextField } from "@/components/focus/ui/field";
import { APPROVAL, PlannedTag } from "@/components/focus/ui/status";

/**
 * Calendar patterns (handoff H10): week grid (a real <table>: days × time slots), day timeline with a "now" line,
 * month grid, legend, and the validated "+ אירוע" form. Below 768px the week becomes a list of day cards.
 * Dates are calendar keys ("2026-10-01") in Asia/Jerusalem; formatting goes through lib/focus/format.
 */

/* ---------- date keys ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (iso: string) => { const p = parts(iso); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };
export const addDays = (key: string, n: number) => { const d = new Date(`${key}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const weekStart = (key: string) => addDays(key, -new Date(`${key}T12:00:00Z`).getUTCDay());
export const monthStart = (key: string) => `${key.slice(0, 8)}01`;
export const addMonths = (key: string, n: number) => { const d = new Date(`${monthStart(key)}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10); };
const minutesOf = (iso: string) => { const p = parts(iso); return p.hh * 60 + p.mm; };
const dayNum = (key: string) => Number(key.slice(8, 10));
const monthName = (key: string) => fmtMonthYear(key).replace(/ \d+$/, "");
const yearOf = (key: string) => key.slice(0, 4);

/** "27 בספטמבר – 3 באוקטובר 2026" · "4–10 באוקטובר 2026" */
export function weekRangeTitle(start: string) {
  const end = addDays(start, 6);
  if (start.slice(0, 7) === end.slice(0, 7)) return `${dayNum(start)}–${dayNum(end)} ב${monthName(end)} ${yearOf(end)}`;
  return `${dayNum(start)} ב${monthName(start)}${yearOf(start) !== yearOf(end) ? ` ${yearOf(start)}` : ""} – ${dayNum(end)} ב${monthName(end)} ${yearOf(end)}`;
}

export const KIND_WORD: Record<CalendarEventKind, string> = { meeting: "פגישה", internal: "פגישה פנימית", deadline: "משימה עם יעד", scheduled_post: "פרסום מתוזמן" };

/** An event with its live second line (task assignee / approval state already resolved by the screen). */
export type ShownEvent = CalendarEvent & { line: string };

export function eventLine(ev: CalendarEvent, assignee?: string) {
  if (ev.kind === "scheduled_post" && ev.approval) return `${APPROVAL[ev.approval].glyph} ${APPROVAL[ev.approval].word}`;
  if (ev.kind === "deadline" && assignee !== undefined) return `יעד · ${assignee}`;
  return ev.meta;
}

function EventChip({ ev, size = "md", showTime }: { ev: ShownEvent; size?: "md" | "sm"; showTime?: boolean }) {
  const time = ev.end ? `${fmtTime(ev.start)}–${fmtTime(ev.end)}` : fmtTime(ev.start);
  const body = (
    <>
      <b className="f-cm-ev__title">{ev.title}</b>
      {size === "md" && <span className="f-cm-ev__meta">{showTime && <span dir="ltr">{time}</span>}{showTime && " · "}{ev.line}</span>}
      <span className="f-sr"> · {KIND_WORD[ev.kind]}{showTime ? "" : ` · ${time}`}{size === "sm" ? ` · ${ev.line}` : ""}{ev.local ? " · נוסף עכשיו" : ""}</span>
    </>
  );
  const cls = cx("f-cm-ev", `f-cm-ev--${ev.kind}`, size === "sm" && "f-cm-ev--sm", ev.local && "f-cm-ev--local");
  return ev.href ? <Link href={ev.href} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
}

function NowLine({ label, top }: { label: string; top?: string }) {
  return (
    <span className="f-cm-now" style={top ? { top } : undefined}>
      <span className="f-cm-now__dot" aria-hidden />
      <span className="f-sr">{label}</span>
    </span>
  );
}

/* ---------- week ---------- */

export function WeekView({ start, events, today, now }: { start: string; events: ShownEvent[]; today: string; now: string }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const inWeek = events.filter((e) => days.includes(dayKey(e.start)));
  const slots = [...new Set(inWeek.map((e) => fmtTime(e.start)))].sort();
  const nowHm = fmtTime(now);
  const nowSlot = days.includes(today) ? (slots.find((s) => s >= nowHm) ?? null) : null;
  const nowAfterAll = days.includes(today) && slots.length > 0 && nowSlot === null;
  const at = (day: string, slot: string) => inWeek.filter((e) => dayKey(e.start) === day && fmtTime(e.start) === slot);

  return (
    <>
      <div className="f-cm-week">
        <table className="f-cm-week__table">
          <caption className="f-sr">{weekRangeTitle(start)} · {inWeek.length} אירועים</caption>
          <thead>
            <tr>
              <td className="f-cm-week__corner" />
              {days.map((d) => (
                <th key={d} scope="col" className={cx("f-cm-week__day", d === today && "f-cm-week__day--today")} aria-current={d === today ? "date" : undefined}>
                  <span className="f-cm-week__wd">{fmtWeekday(d)}</span>
                  <b className="f-cm-week__dn">{dayNum(d)}</b>
                  {d === today && <span className="f-sr"> · היום</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((s, i) => (
              <tr key={s}>
                <th scope="row" className="f-cm-week__time" dir="ltr">{s}</th>
                {days.map((d) => (
                  <td key={d} className={cx("f-cm-week__cell", d === today && "f-cm-week__cell--today")}>
                    {d === today && (nowSlot === s || (nowAfterAll && i === slots.length - 1)) && <NowLine label={`עכשיו ${nowHm}`} top={nowAfterAll ? "100%" : undefined} />}
                    {at(d, s).map((e) => <EventChip key={e.id} ev={e} />)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {slots.length === 0 && <EmptyState className="f-cm-week__empty" title="אין אירועים בשבוע הזה" hint="פגישות מ־Google Calendar, יעדי משימות ומועדי פרסום יופיעו כאן." />}
      </div>

      <ol className="f-cm-weeklist" aria-label={weekRangeTitle(start)}>
        {days.map((d) => {
          const list = inWeek.filter((e) => dayKey(e.start) === d).sort((a, b) => a.start.localeCompare(b.start));
          return (
            <li key={d} className={cx("f-cm-weeklist__day", d === today && "f-cm-weeklist__day--today")} aria-current={d === today ? "date" : undefined}>
              <h2 className="f-cm-weeklist__h">{fmtWeekday(d)} {dayNum(d)}.{Number(d.slice(5, 7))}{d === today && <span className="f-cm-weeklist__today"> · היום</span>}</h2>
              {list.length === 0 ? <span className="f-meta-sm">אין אירועים</span> : (
                <ul className="f-cm-weeklist__events">
                  {list.map((e) => <li key={e.id}><EventChip ev={e} showTime /></li>)}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ---------- day ---------- */

const HOUR_PX = 56;
export function DayView({ day, events, today, now }: { day: string; events: ShownEvent[]; today: string; now: string }) {
  const list = events.filter((e) => dayKey(e.start) === day).sort((a, b) => a.start.localeCompare(b.start));
  const first = Math.min(8, ...list.map((e) => Math.floor(minutesOf(e.start) / 60)));
  const last = Math.max(20, ...list.map((e) => Math.ceil(minutesOf(e.end ?? e.start) / 60) + 1));
  const hours = Array.from({ length: last - first }, (_, i) => first + i);
  const y = (min: number) => ((min - first * 60) / 60) * HOUR_PX;
  const nowMin = minutesOf(now);
  const showNow = day === today && nowMin >= first * 60 && nowMin <= last * 60;
  return (
    <div className="f-cm-dayview">
      <div className="f-cm-dayview__grid" style={{ height: hours.length * HOUR_PX }}>
        <div className="f-cm-dayview__hours" aria-hidden>
          {hours.map((h) => <span key={h} className="f-cm-dayview__hour" style={{ top: y(h * 60) }} dir="ltr">{pad(h)}:00</span>)}
        </div>
        <div className="f-cm-dayview__track">
          {hours.map((h) => <span key={h} className="f-cm-dayview__line" style={{ top: y(h * 60) }} aria-hidden />)}
          {showNow && <NowLine label={`עכשיו ${fmtTime(now)}`} top={`${y(nowMin)}px`} />}
          <ul className="f-cm-dayview__events">
            {list.map((e) => {
              const s = minutesOf(e.start);
              const end = e.end ? minutesOf(e.end) : s + 30;
              return (
                <li key={e.id} className="f-cm-dayview__slot" style={{ top: y(s), height: Math.max(40, y(end) - y(s)) }}>
                  <EventChip ev={e} showTime />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {list.length === 0 && <p className="f-cm-dayview__empty">אין אירועים ביום הזה.</p>}
    </div>
  );
}

/* ---------- month ---------- */

export function MonthView({ month, events, today, onOpenDay }: { month: string; events: ShownEvent[]; today: string; onOpenDay: (day: string) => void }) {
  const first = monthStart(month);
  const gridStart = weekStart(first);
  const nextMonth = addMonths(first, 1);
  const weeks: string[][] = [];
  for (let w = gridStart; w < nextMonth; w = addDays(w, 7)) weeks.push(Array.from({ length: 7 }, (_, i) => addDays(w, i)));
  const on = (d: string) => events.filter((e) => dayKey(e.start) === d).sort((a, b) => a.start.localeCompare(b.start));
  return (
    <table className="f-cm-month">
      <caption className="f-sr">{fmtMonthYear(first)}</caption>
      <thead>
        <tr>{weeks[0].map((d) => <th key={d} scope="col" className="f-cm-month__wd">{fmtWeekday(d)}</th>)}</tr>
      </thead>
      <tbody>
        {weeks.map((w) => (
          <tr key={w[0]}>
            {w.map((d) => {
              const list = on(d);
              const out = d.slice(0, 7) !== first.slice(0, 7);
              return (
                <td key={d} className={cx("f-cm-month__cell", out && "f-cm-month__cell--out", d === today && "f-cm-month__cell--today")} aria-current={d === today ? "date" : undefined}>
                  <button type="button" className="f-cm-month__num f-hit" onClick={() => onOpenDay(d)} aria-label={`${fmtWeekday(d)} ${dayNum(d)}.${Number(d.slice(5, 7))} · ${list.length ? `${list.length} אירועים` : "אין אירועים"} · פתח ביום`}>
                    {dayNum(d)}
                    {list.length > 0 && <span className="f-cm-month__count" aria-hidden>{list.length}</span>}
                  </button>
                  <div className="f-cm-month__events">
                    {list.slice(0, 2).map((e) => <EventChip key={e.id} ev={e} size="sm" />)}
                    {list.length > 2 && <button type="button" className="f-cm-month__more f-hit" onClick={() => onOpenDay(d)}>+{list.length - 2} נוספים</button>}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CalendarLegend() {
  return (
    <ul className="f-cm-calkey" aria-label="מקרא">
      <li><span className="f-cm-calkey__sw f-cm-calkey__sw--meeting" aria-hidden /> פגישה</li>
      <li><span className="f-cm-calkey__sw f-cm-calkey__sw--scheduled_post" aria-hidden /> פרסום מתוזמן (מסגרת מקווקוות)</li>
      <li><span className="f-cm-calkey__sw f-cm-calkey__sw--deadline" aria-hidden /> משימה עם יעד</li>
    </ul>
  );
}

/* ---------- "+ אירוע" ---------- */

type Draft = { title: string; date: string; start: string; end: string; kind: "meeting" | "internal" | "deadline" };
type Errors = Partial<Record<keyof Draft, string>>;

export function validateEvent(d: Draft): Errors {
  const e: Errors = {};
  if (!d.title.trim()) e.title = "יש לכתוב שם לאירוע.";
  else if (d.title.trim().length > 80) e.title = "עד 80 תווים.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) e.date = "יש לבחור תאריך.";
  if (!/^\d{2}:\d{2}$/.test(d.start)) e.start = "יש לבחור שעת התחלה.";
  if (d.end && /^\d{2}:\d{2}$/.test(d.start) && d.end <= d.start) e.end = "שעת הסיום צריכה להיות אחרי שעת ההתחלה.";
  return e;
}

export function AddEventDialog({ open, defaultDate, onClose, onAdd }: { open: boolean; defaultDate: string; onClose: () => void; onAdd: (ev: CalendarEvent) => void }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="cm-addev-title" className="f-cm-modal" initialFocus="input">
      {open && <AddEventForm defaultDate={defaultDate} onClose={onClose} onAdd={onAdd} />}
    </Dialog>
  );
}

function AddEventForm({ defaultDate, onClose, onAdd }: { defaultDate: string; onClose: () => void; onAdd: (ev: CalendarEvent) => void }) {
  const [d, setD] = useState<Draft>({ title: "", date: defaultDate, start: "", end: "", kind: "meeting" });
  const [errors, setErrors] = useState<Errors>({});
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((x) => ({ ...x, [k]: v })); if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };
  const submit = () => {
    const e = validateEvent(d);
    setErrors(e);
    if (Object.keys(e).length) return;
    onAdd({
      id: `ev-local-${d.date}-${d.start}-${d.title.trim()}`, title: d.title.trim(), meta: d.kind === "deadline" ? "יעד" : "נוסף ב־Mytiv",
      start: `${d.date}T${d.start}:00+03:00`, end: d.end ? `${d.date}T${d.end}:00+03:00` : undefined, kind: d.kind, source: "mytiv", local: true,
    });
  };
  return (
    <form className="f-cm-dlg" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <h2 id="cm-addev-title" className="f-cm-dlg__title">אירוע חדש</h2>
      <TextField label="שם האירוע" required value={d.title} onChange={(e) => set("title", e.target.value)} error={errors.title} help="למשל: שיחת היכרות עם לקוח" maxLength={120} />
      <div className="f-cm-dlg__row">
        <TextField label="תאריך" type="date" required value={d.date} onChange={(e) => set("date", e.target.value)} error={errors.date} />
        <SelectField label="סוג" value={d.kind} onChange={(e) => set("kind", e.target.value as Draft["kind"])}
          options={[{ value: "meeting", label: "פגישה" }, { value: "internal", label: "פגישה פנימית" }, { value: "deadline", label: "יעד" }]} />
      </div>
      <div className="f-cm-dlg__row">
        <TextField label="שעת התחלה" type="time" required value={d.start} onChange={(e) => set("start", e.target.value)} error={errors.start} />
        <TextField label="שעת סיום" note="(לא חובה)" type="time" value={d.end} onChange={(e) => set("end", e.target.value)} error={errors.end} />
      </div>
      <p className="f-cm-dlg__note"><PlannedTag /> סנכרון ל־Google Calendar ושליחת הזמנות למשתתפים. בינתיים האירוע נשמר ב־Mytiv בלבד.</p>
      <div className="f-cm-dlg__actions">
        <Button type="submit" variant="primary">הוסף ליומן</Button>
        <Button variant="neutral" onClick={onClose}>ביטול</Button>
      </div>
    </form>
  );
}
