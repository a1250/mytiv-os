/**
 * Ported from the Electron app's src/lib/utils.js — date/string helpers used
 * by outreachGenerator.js and (later) other ported UI pages.
 */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr: string | undefined, days: number) {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function firstName(fullName: string | undefined) {
  return (fullName || "").trim().split(/\s+/)[0] || "";
}
