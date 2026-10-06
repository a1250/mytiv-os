"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { approvalPhase, DECISION_REFUSAL, riskOf, type FocusMarketingApproval } from "@/lib/focus/adapters/marketing";
import { fmtDayMonth, fmtTime } from "@/lib/focus/format";
import { reconciledLabel } from "@/lib/marketing/view";
import { Page, PageHeader } from "@/components/focus/patterns/page";
import { Button } from "@/components/focus/ui/button";
import { Banner, EmptyState } from "@/components/focus/ui/feedback";
import { TextAreaField } from "@/components/focus/ui/field";
import { RiskPill } from "@/components/focus/ui/status";
import { useFocusScope } from "@/components/focus/shell/scope";
import { useNavGuard } from "@/components/focus/shell/nav-guard";

/**
 * Approvals of a real business (Marketing OS C2a queue, as imported into Mytiv). Deciding records a C2b decision
 * through the governed route (owner/admin, same origin, confirmation, request id, the content hash the user saw);
 * the engine applies it and its next export closes the item — until then it shows "awaiting the engine".
 */
export default function BusinessApprovalsScreen({ items, canDecide }: { items: FocusMarketingApproval[]; canDecide: boolean }) {
  const pending = items.filter((a) => approvalPhase(a) === "pending");
  const rest = items.filter((a) => approvalPhase(a) !== "pending");
  return (
    <Page className="f-alist">
      <PageHeader title="אישורים" size="page"
        status={pending.length ? `${pending.length} פריטים ממתינים להחלטה.` : "אין פריטים שממתינים להחלטה."} />
      {!canDecide && pending.length > 0 && <Banner kind="unavailable" live={false} title="צפייה בלבד" detail="רק בעלים או מנהל יכולים להחליט על פריטים של מנוע השיווק." />}
      {items.length === 0 ? <EmptyState glyph="✓" title="אין פריטים לאישור" hint="פריטים יופיעו כאן אחרי שמנוע השיווק ייצא תור אישורים לפרויקט מחובר." /> : (
        <div className="f-stack-12">
          {pending.map((a) => <ApprovalCard key={`${a.projectId}:${a.approvalId}`} a={a} canDecide={canDecide} />)}
          {rest.length > 0 && <h2 className="f-alist__h2">הוחלטו · {rest.length}</h2>}
          {rest.map((a) => <ApprovalCard key={`${a.projectId}:${a.approvalId}`} a={a} canDecide={false} />)}
        </div>
      )}
    </Page>
  );
}

const PHASE: Record<ReturnType<typeof approvalPhase>, string> = {
  pending: "ממתין להחלטה", decided_awaiting_engine: "ההחלטה נרשמה · ממתינה להחלה במנוע", approved: "אושר", rejected: "נדחה", expired: "פג תוקף", applied: "בוצע",
};

function ApprovalCard({ a, canDecide }: { a: FocusMarketingApproval; canDecide: boolean }) {
  const router = useRouter();
  const { base } = useFocusScope();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  // one request id per decision attempt: a retry after a lost answer re-sends the SAME id (the server's audit claim
  // returns 409 request_already_claimed rather than recording twice)
  const requestId = useRef<string | null>(null);
  const phase = approvalPhase(a);
  useNavGuard({ dirty: phase === "pending" && note.trim().length > 0, what: `הנימוק שכתבת ל"${a.title}" עוד לא נשלח.` });
  const slug = base.split("/")[1];

  const decide = async (decision: "approved" | "rejected") => {
    if (!note.trim()) { setError("חובה לכתוב נימוק לפני החלטה."); return; }
    setBusy(decision); setError(null);
    requestId.current ??= crypto.randomUUID();
    try {
      const res = await fetch(`/api/${slug}/ops/projects/${a.projectId}/marketing/decisions`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmed: true, requestId: requestId.current, bindingVersion: a.bindingVersion, sourceArtifactId: a.sourceArtifactId, approvalId: a.approvalId, contentHash: a.contentHash, decision, note: note.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) { requestId.current = null; setNote(""); router.refresh(); return; }
      setError(DECISION_REFUSAL[body.error as string] ?? "ההחלטה לא נרשמה.");
      if (body.error !== "request_already_claimed_check_audit_before_retry") requestId.current = null;
    } catch {
      setError("אין תשובה מהשרת. לא ידוע אם ההחלטה נרשמה — נסו שוב (הבקשה תישלח עם אותו מזהה ולא תירשם פעמיים).");
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="f-panel f-mkt-appr" aria-labelledby={`ap-${a.approvalId}`}>
      <div className="f-mkt-appr__head">
        <RiskPill level={riskOf(a.actionClass)} />
        <span className="f-meta-sm">{a.projectName}{a.client ? ` · ${a.client}` : ""} · {a.actionType}</span>
        <span className="f-grow" />
        <span className="f-meta-sm">{PHASE[phase]}</span>
      </div>
      <h3 id={`ap-${a.approvalId}`} className="f-mkt-appr__title">{a.title}</h3>
      <p className="f-mkt-appr__why">{a.why}</p>
      {a.requestedChange && <p className="f-meta">שינוי מבוקש: {a.requestedChange}</p>}
      {a.diffSummary && <p className="f-meta">מה משתנה: {a.diffSummary}</p>}
      <dl className="f-mkt-appr__facts">
        <div><dt>בדיקת איכות</dt><dd>{a.qaVerdict === "PASS" ? "עברה" : a.qaVerdict === "BLOCKED" ? "חסומה" : "לא הורצה"}</dd></div>
        <div><dt>איך מבטלים</dt><dd>{a.rollbackNote}</dd></div>
        {a.factsCited.length > 0 && <div><dt>מקורות</dt><dd><bdi>{a.factsCited.join(" · ")}</bdi></dd></div>}
        <div><dt>נכון ל־</dt><dd>{fmtDayMonth(a.asOf)} {fmtTime(a.asOf)}</dd></div>
      </dl>
      {a.decision && (
        <p className="f-meta">{a.decision.decision === "approved" ? "אושר" : "נדחה"} · {fmtDayMonth(a.decision.decidedAt)} {fmtTime(a.decision.decidedAt)} · נימוק: {a.decision.note} · <span data-reconciled={a.decision.reconciledState ?? "none"}>{reconciledLabel(a.decision.reconciledState)}</span></p>
      )}
      {a.receipts.map((r) => (
        <p key={r.id} className="f-meta" data-receipt={r.id}>קבלת ביצוע נרשמה · {fmtDayMonth(r.createdAt)} {fmtTime(r.createdAt)} · {reconciledLabel(r.reconciledState)}</p>
      ))}
      {phase === "pending" && canDecide && (
        <div className="f-mkt-appr__decide">
          <TextAreaField label="נימוק (חובה)" rows={2} maxLength={2000} value={note} error={error ?? undefined}
            onChange={(e) => { setNote(e.target.value); setError(null); }} />
          <div className="f-mkt-appr__actions">
            <Button variant="primary" loading={busy === "approved"} loadingLabel="רושם…" onClick={() => decide("approved")}>אשר</Button>
            <Button variant="neutral" loading={busy === "rejected"} loadingLabel="רושם…" onClick={() => decide("rejected")}>דחה</Button>
            <span className="f-meta-sm">ההחלטה נרשמת ביומן הפעולות ונשלחת למנוע השיווק</span>
          </div>
        </div>
      )}
    </article>
  );
}
