/**
 * Formatting for the Focus UI (handoff RTL rules): date d.m.yyyy, 24h time, money "8,750 ₪", tabular numbers.
 * Deterministic on server and client (explicit time zone + our own Hebrew names) so hydration never mismatches.
 * Screens never hard-code dates: they format fixture timestamps relative to the demo clock (lib/focus/fixtures/clock).
 */
export const TZ = "Asia/Jerusalem";

const WEEKDAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", weekday: "short", hourCycle: "h23",
});
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export type DateParts = { y: number; m: number; d: number; hh: number; mm: number; ss: number; wd: number };

export function parts(iso: string | Date): DateParts {
  const date = typeof iso === "string" ? new Date(iso.length === 10 ? `${iso}T12:00:00+03:00` : iso) : iso;
  const p = Object.fromEntries(partsFmt.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour % 24, mm: +p.minute, ss: +p.second, wd: WD[p.weekday] };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 8.10.2026 */
export const fmtDate = (iso: string) => { const p = parts(iso); return `${p.d}.${p.m}.${p.y}`; };
/** 8.10 */
export const fmtDayMonth = (iso: string) => { const p = parts(iso); return `${p.d}.${p.m}`; };
/** 08:10 */
export const fmtTime = (iso: string) => { const p = parts(iso); return `${pad(p.hh)}:${pad(p.mm)}`; };
/** יום חמישי, 1 באוקטובר 2026 */
export const fmtLongDate = (iso: string) => { const p = parts(iso); return `יום ${WEEKDAYS[p.wd]}, ${p.d} ב${MONTHS[p.m - 1]} ${p.y}`; };
/** חמישי, 1 באוקטובר */
export const fmtShortLongDate = (iso: string) => { const p = parts(iso); return `${WEEKDAYS[p.wd]}, ${p.d} ב${MONTHS[p.m - 1]}`; };
/** שישי */
export const fmtWeekday = (iso: string) => WEEKDAYS[parts(iso).wd];
/** אוקטובר 2026 */
export const fmtMonthYear = (iso: string) => { const p = parts(iso); return `${MONTHS[p.m - 1]} ${p.y}`; };

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
/** 8,750 · 6,525.42 */
export const formatNumber = (n: number) => nf.format(n);
/** 8,750 ₪ */
export const fmtMoney = (amount: number) => `${formatNumber(amount)} ₪`;

/** 00:42:18 */
export function fmtDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
/** 6h · 1.5h (time report) */
export const fmtHours = (minutes: number) => `${formatNumber(Math.round((minutes / 60) * 10) / 10)}h`;

const dayIndex = (iso: string) => { const p = parts(iso); return Date.UTC(p.y, p.m - 1, p.d) / 86_400_000; };
/** Whole calendar days from `a` to `b` (Asia/Jerusalem). */
export const daysBetween = (a: string, b: string) => dayIndex(b) - dayIndex(a);

/** "יום" · "יומיים" · "3 ימים" — how long something has been waiting. */
export function fmtDays(n: number) {
  if (n <= 0) return "היום";
  if (n === 1) return "יום";
  if (n === 2) return "יומיים";
  return `${n} ימים`;
}
/** "ממתין יום" — for action cards. */
export const fmtWaiting = (since: string, now: string) => fmtDays(daysBetween(since, now));

/** "לפני 2 דק׳" · "לפני שעה" · "לפני 3 שעות" · "אתמול" · "28.9" */
export function fmtAgo(at: string, now: string) {
  const diffMin = Math.round((new Date(now).getTime() - new Date(at).getTime()) / 60_000);
  if (diffMin < 1) return "לפני רגע";
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;
  const h = Math.round(diffMin / 60);
  const days = daysBetween(at, now);
  if (days === 0) return h === 1 ? "לפני שעה" : h === 2 ? "לפני שעתיים" : `לפני ${h} שעות`;
  if (days === 1) return "אתמול";
  return fmtDayMonth(at);
}

/** "היום" · "מחר" · "שישי 2.10" relative to now. */
export function fmtRelativeDay(iso: string, now: string) {
  const d = daysBetween(now, iso);
  if (d === 0) return "היום";
  if (d === 1) return "מחר";
  if (d === -1) return "אתמול";
  return `${fmtWeekday(iso)} ${fmtDayMonth(iso)}`;
}
