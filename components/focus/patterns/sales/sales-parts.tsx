"use client";

import type { ReactNode } from "react";
import type { Reading } from "@/lib/focus/contracts/common";
import type { Confidence, LeadNext, LeadStage, ProposalStatus } from "@/lib/focus/contracts/sales";
import { fmtDayMonth, fmtMoney, formatNumber } from "@/lib/focus/format";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Dialog } from "@/components/focus/ui/dialog";
import { PlannedTag, ReadingValue } from "@/components/focus/ui/status";

/**
 * Sales vocabulary (handoff F1–F4, H8, H9): lead stages, proposal status (outlined pill, symbol + word), match
 * confidence, a value with its certainty mark, and the dialog shell used by every sales form / planned capability.
 */
export const STAGE: Record<LeadStage, string> = {
  new: "חדש", in_progress: "בטיפול", waiting: "ממתין לתגובה", meeting: "פגישה", proposal_sent: "הצעה נשלחה", won: "זכה", lost: "לא רלוונטי",
};
export const OPEN_STAGES: LeadStage[] = ["new", "in_progress", "waiting", "meeting", "proposal_sent"];
export const isOpen = (s: LeadStage) => OPEN_STAGES.includes(s);

/** Pipeline stage — a plain tag with its word (not a status family). Closed stages get their own look + glyph. */
export function StageTag({ stage, size }: { stage: LeadStage; size?: "sm" }) {
  return (
    <span className={cx("f-sl-stage", `f-sl-stage--${stage}`, size === "sm" && "f-sl-stage--sm")}>
      {stage === "won" && <span aria-hidden>✓</span>}{STAGE[stage]}
    </span>
  );
}

const PSTATUS: Record<ProposalStatus, { glyph: string; word: string }> = {
  draft: { glyph: "✎", word: "טיוטה" },
  pending: { glyph: "…", word: "ממתינה לאישור" },
  sent: { glyph: "✉", word: "נשלחה" },
  accepted: { glyph: "✓", word: "התקבלה" },
  declined: { glyph: "✕", word: "נדחתה" },
  expired: { glyph: "⧗", word: "פג תוקף" },
};

/** Proposal status — outlined pill like ApprovalPill, with the proposal's own vocabulary. */
export function ProposalStatusPill({ status, label, size }: { status: ProposalStatus; label?: string; size?: "sm" }) {
  const p = PSTATUS[status];
  return (
    <span className={cx("f-sl-pstatus", `f-sl-pstatus--${status}`, size === "sm" && "f-sl-pstatus--sm")}>
      <span aria-hidden>{p.glyph}</span>{label ?? p.word}
    </span>
  );
}

const CONF: Record<Confidence, { glyph: string; word: string }> = {
  high: { glyph: "●", word: "גבוה" }, medium: { glyph: "◆", word: "בינוני" }, low: { glyph: "○", word: "נמוך" },
};

/** Match confidence of a search result. */
export function ConfidencePill({ level }: { level: Confidence }) {
  return (
    <span className={cx("f-sl-conf", `f-sl-conf--${level}`)}>
      <span aria-hidden>{CONF[level].glyph}</span>{CONF[level].word}<span className="f-sr"> ביטחון בהתאמה</span>
    </span>
  );
}
export const confidenceWord = (c: Confidence) => CONF[c].word;

/** A value with its certainty: "≈ 9,000 ₪" estimated · "6,200 ₪ ידוע" · "—" unknown (with the reason for AT). */
export function LeadValue({ reading, showKnown = true }: { reading: Reading; showKnown?: boolean }) {
  if (reading.kind === "unknown" || reading.kind === "unavailable") {
    return <span className="f-value--unavailable" title={reading.reason}><span aria-hidden>—</span><span className="f-sr">לא ידוע · {reading.reason}</span></span>;
  }
  return (
    <span className="f-sl-value">
      <ReadingValue reading={reading} unit="ils" />
      {reading.kind === "known" && showKnown && <span className="f-sl-value__known">ידוע</span>}
    </span>
  );
}

/** "שלח הצעה עד 4.10" · "אמת איש קשר". */
export const nextText = (n: LeadNext) => (n.due ? `${n.text} ${fmtDayMonth(n.due)}` : n.text);

/** Money with agorot when there are any: "6,525.40 ₪" · "8,750 ₪" (built on formatNumber / fmtMoney). */
export function fmtAmount(n: number) {
  const agorot = Math.round(n * 100);
  if (agorot % 100 === 0) return fmtMoney(agorot / 100);
  const whole = Math.trunc(agorot / 100);
  return `${formatNumber(whole)}.${String(Math.abs(agorot % 100)).padStart(2, "0")} ₪`;
}

/** Dialog shell for sales forms and confirmations: heading, body, actions row. */
export function SalesDialog({ open, onClose, title, id, children, actions, variant }: {
  open: boolean; onClose: () => void; title: ReactNode; id: string; children: ReactNode; actions?: ReactNode; variant?: "center" | "drawer";
}) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy={`${id}-h`} variant={variant} initialFocus="input, textarea, select">
      <div className="f-sl-dlg">
        <div className="f-sl-dlg__head">
          <h2 id={`${id}-h`} className="f-sl-dlg__h">{title}</h2>
          <button type="button" className="f-iconbtn f-iconbtn--sm" aria-label="סגור" onClick={onClose}><span aria-hidden>✕</span></button>
        </div>
        <div className="f-sl-dlg__body">{children}</div>
        {actions && <div className="f-sl-dlg__actions">{actions}</div>}
      </div>
    </Dialog>
  );
}

/**
 * A capability without a backend yet (handoff: planned = rendered in full, labelled "מתוכנן", never shown as working).
 * Says what it will do and what happens meanwhile; `children` offers the real alternative, if any.
 */
export function PlannedDialog({ open, onClose, id, title, what, meanwhile, children }: {
  open: boolean; onClose: () => void; id: string; title: string; what: ReactNode; meanwhile: ReactNode; children?: ReactNode;
}) {
  return (
    <SalesDialog open={open} onClose={onClose} id={id} title={<>{title} <PlannedTag /></>}
      actions={<>{children}<Button variant="neutral" onClick={onClose}>סגור</Button></>}>
      <p className="f-sl-dlg__text">{what}</p>
      <p className="f-sl-dlg__note"><b>בינתיים:</b> {meanwhile}</p>
    </SalesDialog>
  );
}
