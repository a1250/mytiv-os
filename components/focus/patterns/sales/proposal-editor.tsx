"use client";

import type { CSSProperties, ReactNode } from "react";
import type { ProposalDraft } from "@/lib/focus/contracts/sales";
import { personName } from "@/lib/focus/fixtures/people";
import { daysBetween, fmtDate, fmtDayMonth } from "@/lib/focus/format";
import { Button, IconButton } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { TextField } from "@/components/focus/ui/field";
import { fmtAmount } from "./sales-parts";

/**
 * Proposal editor parts (handoff F3): line items with real numeric inputs (quantity × unit price), live subtotal /
 * VAT / total (computed in agorot, total rounded to the shekel), the PDF preview that mirrors the form, and versions.
 * A field that does not parse is flagged and the totals say "—" instead of showing a wrong number.
 */
export type LineDraft = { id: string; name: string; note: string; qty: string; unit: string };

export type LineErrors = { name?: string; qty?: string; unit?: string };

const parseNum = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(/,/g, "").trim()));

export function lineErrors(l: LineDraft): LineErrors {
  const e: LineErrors = {};
  if (!l.name.trim()) e.name = "חסר שם לשירות.";
  const q = parseNum(l.qty);
  if (!Number.isInteger(q) || q < 1 || q > 9999) e.qty = "מספר שלם, 1 ומעלה.";
  const u = parseNum(l.unit);
  if (!Number.isFinite(u) || u < 0) e.unit = "מחיר בשקלים, 0 ומעלה.";
  else if (Math.abs(Math.round(u * 100) - u * 100) > 1e-6) e.unit = "עד שתי ספרות אחרי הנקודה.";
  return e;
}

export const lineValid = (l: LineDraft) => Object.keys(lineErrors(l)).length === 0;

/** Line total in agorot (integers — no floating drift); null when the line does not parse. */
export function lineAgorot(l: LineDraft): number | null {
  if (!lineValid(l)) return null;
  return parseNum(l.qty) * Math.round(parseNum(l.unit) * 100);
}

export type Totals = { subtotal: number; vat: number; total: number } | null;

/** Total (incl. VAT) of a *saved* proposal draft — same integer-agorot arithmetic as `computeTotals`. */
export function savedTotal(lines: { qty: number; unit: number }[], vatRate: number): number {
  const sub = lines.reduce((a, l) => a + l.qty * Math.round(l.unit * 100), 0);
  return Math.round((sub + Math.round(sub * vatRate)) / 100);
}

export function computeTotals(lines: LineDraft[], vatRate: number): Totals {
  const parts = lines.map(lineAgorot);
  if (parts.some((p) => p == null)) return null;
  const sub = parts.reduce<number>((a, b) => a + (b ?? 0), 0);
  const vat = Math.round(sub * vatRate);
  return { subtotal: sub / 100, vat: vat / 100, total: Math.round((sub + vat) / 100) };
}

export const toDraft = (lines: ProposalDraft["lines"]): LineDraft[] => lines.map((l) => ({ id: l.id, name: l.name, note: l.note, qty: String(l.qty), unit: String(l.unit) }));
export const fromDraft = (lines: LineDraft[]): ProposalDraft["lines"] => lines.map((l) => ({ id: l.id, name: l.name.trim(), note: l.note, qty: parseNum(l.qty), unit: parseNum(l.unit) }));

export function LineItems({ lines, touched, locked, onChange, onBlur, onRemove, onAdd, footer }: {
  lines: LineDraft[]; touched: Set<string>; locked: boolean; footer?: ReactNode;
  onChange: (id: string, patch: Partial<LineDraft>) => void; onBlur: (key: string) => void; onRemove: (id: string) => void; onAdd: () => void;
}) {
  return (
    <section className="f-sl-panel f-sl-lines" aria-labelledby="sl-lines-h">
      <div className="f-sl-lines__head">
        <h2 id="sl-lines-h" className="f-sl-panel__h">שירותים</h2>
        {!locked && <Button variant="link" size="sm" onClick={onAdd}>+ הוסף שירות</Button>}
      </div>
      <table className="f-sl-lines__table">
        <thead>
          <tr><th scope="col">שירות</th><th scope="col">כמות</th><th scope="col">מחיר ליחידה</th><th scope="col">סה״כ</th><th scope="col"><span className="f-sr">פעולות</span></th></tr>
        </thead>
        <tbody>
          {lines.map((l) => {
            const err = lineErrors(l);
            const show = (k: keyof LineErrors) => (touched.has(`${l.id}:${k}`) || k !== "name" ? err[k] : undefined) ?? null;
            const sum = lineAgorot(l);
            const label = l.name.trim() || "שירות חדש";
            return (
              <tr key={l.id} data-line={l.id}>
                <th scope="row" className="f-sl-lines__name">
                  {locked || !l.id.startsWith("ln-new") ? (
                    <span className="f-sl-who"><b>{l.name}</b><span className="f-sl-sub">{l.note}</span></span>
                  ) : (
                    <TextField label="שם השירות" labelClassName="f-sr" value={l.name} placeholder="שם השירות" inputClassName="f-input--sm"
                      onChange={(e) => onChange(l.id, { name: e.target.value })} onBlur={() => onBlur(`${l.id}:name`)} error={show("name")} help={l.note} maxLength={60} />
                  )}
                </th>
                <td className="f-sl-lines__num" data-label="כמות">
                  {locked ? <span className="f-num">{l.qty}</span> : (
                    <TextField label={`כמות · ${label}`} labelClassName="f-sr" value={l.qty} inputMode="numeric" dir="ltr" inputClassName="f-input--sm f-sl-numin"
                      onChange={(e) => onChange(l.id, { qty: e.target.value })} onBlur={() => onBlur(`${l.id}:qty`)} error={show("qty")} />
                  )}
                </td>
                <td className="f-sl-lines__num" data-label="מחיר ליחידה">
                  {locked ? <span className="f-num">{fmtAmount(parseNum(l.unit))}</span> : (
                    <span className="f-sl-money">
                      <TextField label={`מחיר ליחידה בשקלים · ${label}`} labelClassName="f-sr" value={l.unit} inputMode="decimal" dir="ltr" inputClassName="f-input--sm f-sl-numin"
                        onChange={(e) => onChange(l.id, { unit: e.target.value })} onBlur={() => onBlur(`${l.id}:unit`)} error={show("unit")} />
                      <span className="f-sl-money__cur" aria-hidden>₪</span>
                    </span>
                  )}
                </td>
                <td className="f-sl-lines__sum" data-label="סה״כ">
                  <b className="f-num" aria-live="polite">{sum == null ? <span className="f-value--unavailable" title="ממתין לתיקון">—</span> : fmtAmount(sum / 100)}</b>
                </td>
                <td className="f-sl-lines__x">
                  {!locked && <IconButton icon="x" small iconSize={15} label={`הסר ${label}`} onClick={() => onRemove(l.id)} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {lines.length === 0 && <p className="f-meta f-sl-lines__empty">אין שירותים בהצעה. הוסף שירות כדי לחשב סכום.</p>}
      {footer}
    </section>
  );
}

export function TotalsBox({ totals, vatRate }: { totals: Totals; vatRate: number }) {
  return (
    <div className="f-sl-totals" aria-live="polite">
      <div><span>לפני מע״מ</span><span className="f-num">{totals ? fmtAmount(totals.subtotal) : "—"}</span></div>
      <div><span>הנחה</span><span><span aria-hidden>—</span><span className="f-sr">ללא הנחה</span></span></div>
      <div><span>מע״מ {Math.round(vatRate * 100)}%</span><span className="f-num">{totals ? fmtAmount(totals.vat) : "—"}</span></div>
      <div className="f-sl-totals__sum"><span>סה״כ</span><span className="f-num">{totals ? fmtAmount(totals.total) : "—"}</span></div>
      <span className="f-sl-totals__note">{totals ? "מחושב אוטומטית · מעוגל לשקל" : "החישוב ממתין לתיקון השדות המסומנים."}</span>
    </div>
  );
}

export function PdfPreview({ draft, lines, notes, validUntil, totals }: {
  draft: ProposalDraft; lines: LineDraft[]; notes: string; validUntil: string; totals: Totals;
}) {
  const brand: CSSProperties = { background: draft.brand.bg, color: draft.brand.fg };
  return (
    <figure className="f-sl-pdf" aria-label="תצוגה מקדימה של ההצעה כפי שתופק ב־PDF">
      <div className="f-sl-pdf__top">
        <div className="f-sl-pdf__titles">
          <b className="f-sl-pdf__h">הצעת מחיר</b>
          <span className="f-sl-pdf__meta">מס׳ <bdi dir="ltr">{draft.number}</bdi> · {fmtDate(draft.createdAt)} · בתוקף עד {fmtDate(validUntil)}</span>
        </div>
        <span className="f-sl-pdf__brand" style={brand} aria-hidden>{draft.brand.label}</span>
      </div>
      <div className="f-sl-pdf__to"><span className="f-sl-pdf__muted">לכבוד</span><b>{draft.clientName}</b></div>
      <div className="f-sl-pdf__lines">
        {lines.map((l) => {
          const sum = lineAgorot(l);
          const q = parseNum(l.qty);
          return (
            <div key={l.id} className="f-sl-pdf__row">
              <span>{l.name.trim() || "—"}{q > 1 ? ` × ${q}` : ""}</span>
              <span className="f-num">{sum == null ? "—" : fmtAmount(sum / 100)}</span>
            </div>
          );
        })}
        <div className="f-sl-pdf__row f-sl-pdf__row--sum"><span>סה״כ כולל מע״מ</span><span className="f-num">{totals ? fmtAmount(totals.total) : "—"}</span></div>
      </div>
      {notes.trim() && <p className="f-sl-pdf__notes">{notes}</p>}
    </figure>
  );
}

export function VersionsCard({ draft, now, locked }: { draft: ProposalDraft; now: string; locked: boolean }) {
  return (
    <section className="f-sl-panel f-sl-side" aria-labelledby="sl-ver-h">
      <h2 id="sl-ver-h" className="f-sl-panel__h f-sl-panel__h--sm">גרסאות</h2>
      <ul className="f-sl-side__list">
        {draft.versions.map((v, i) => (
          <li key={v.n} className={cx("f-sl-ver", i === draft.versions.length - 1 && "f-sl-ver--current")}>
            <span><b>גרסה {v.n}</b> · {locked ? "נשלחה" : "טיוטה"} · {personName(v.byId)} · {daysBetween(v.at, now) === 0 ? "היום" : fmtDayMonth(v.at)}</span>
            {i === draft.versions.length - 1 && <span className="f-meta">נוכחית</span>}
          </li>
        ))}
      </ul>
      <span className="f-meta-sm">אחרי שליחה הגרסה ננעלת. שינוי יוצר גרסה {draft.versions.length + 1}, והקודמת נשמרת.</span>
    </section>
  );
}
