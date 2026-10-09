"use client";

import Link from "@/components/focus/ui/link";
import { useId, useState } from "react";
import type { ContentRequirement, RequestStatus } from "@/lib/focus/contracts/plan";
import { R } from "@/lib/focus/routes";
import { REQUEST_STATUS_WORD, clientRequestText, requestStatus, requestTooLate, uploadCompatible } from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { cx } from "@/components/focus/ui/cx";
import { useToast } from "@/components/focus/ui/toast";
import { DemoNote } from "./plan-parts";
import { dayLabel } from "./plan-view";
import type { PlanApi } from "./use-plan";

/**
 * Client Material Request (spec §9): exactly what the client must send and why — items, quantity, format, duration,
 * needed-by, the move and its launch, capture instructions and where to upload — linked to the content requirement
 * (or to the one creative it replaces). Its lifecycle: drafted → sent by hand → material received → in review →
 * approved (covers the requirement). One request and one Work task per requirement, ever: cancelling keeps the history
 * and the task, asking again re-opens the same request. Nothing is sent from here: a person copies the text into
 * WhatsApp or an email and marks it sent; the material is uploaded by hand when it arrives.
 */
const STEPS: { key: Exclude<RequestStatus, "cancelled">; word: string }[] = [
  { key: "drafted", word: "נוצרה" }, { key: "sent", word: "נשלחה ידנית" }, { key: "received", word: "החומר התקבל" }, { key: "in_review", word: "בבדיקה" }, { key: "approved", word: "אושר" },
];
const ORDER: Record<Exclude<RequestStatus, "cancelled">, number> = { drafted: 0, sent: 1, received: 2, in_review: 3, approved: 4 };

export function ClientRequestSheet({ req, plan, open, onClose, creativeId }: { req: ContentRequirement | null; plan: PlanApi; open: boolean; onClose: () => void; creativeId?: string }) {
  const id = useId();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<{ name: string; type: string } | null>(null);
  if (!req) return null;
  const existing = plan.overlay.requests[req.id];
  const status = existing ? requestStatus(existing) : null;
  const late = requestTooLate(req, plan.today);
  const move = plan.moves.find((m) => m.id === req.moveId) ?? plan.f.proposed.find((m) => m.id === req.moveId);
  const approver = plan.approverName(req.approval);
  const fileProblem = file ? uploadCompatible(req, file) : null;
  const create = () => {
    const r = plan.createClientRequest(req, { creativeId });
    if (r) toast.push({ kind: "success", title: status === "cancelled" ? "הבקשה נפתחה מחדש" : "נוצרה בקשה ללקוח + משימה בעבודה", detail: `${r.items[0].quantity} × ${r.items[0].what} · עד ${dayLabel(r.neededByDay)}` });
  };
  const copy = async () => {
    if (!existing) return;
    try { await navigator.clipboard.writeText(clientRequestText(existing)); setCopied(true); toast.push({ title: "הטקסט הועתק", detail: "הדביקו ב־WhatsApp או במייל ושלחו ידנית" }); }
    catch { toast.push({ kind: "error", title: "ההעתקה נכשלה", detail: "סמנו את הטקסט והעתיקו ידנית" }); }
  };
  const receive = () => {
    if (!file || fileProblem) return;
    plan.receiveMaterial(req.id, file.name);
    setFile(null);
    toast.push({ kind: "success", title: "החומר התקבל · בבדיקה", detail: `${file.name} · ממתין לאישור ${approver}` });
  };
  return (
    <Dialog open={open} onClose={onClose} variant="drawer" labelledBy={`${id}-t`} className="f-pl-panel f-pl-panel--change">
      <div className="f-pl-panel__wrap">
        <div className="f-pl-panel__head">
          <div className="f-pl-panel__crumbrow"><span className="f-pl-meta">בקשת חומר מהלקוח · {move?.longName ?? req.forLabel}</span><button type="button" className="f-pl-x f-hit" aria-label="סגירה" onClick={onClose}>×</button></div>
          <h2 id={`${id}-t`} className="f-pl-panel__title">{req.title}</h2>
          <span className="f-pl-meta">{creativeId ? "מחליף קריאייטיב אחד בבונה" : "דרישת תוכן מקושרת"} · {req.spec}</span>
        </div>
        <div className="f-pl-panel__body">
          {existing && status !== "cancelled" && (
            <ol className="f-pl-reqsteps" aria-label="מצב הבקשה">
              {STEPS.map((st) => {
                const done = ORDER[st.key] <= ORDER[status as Exclude<RequestStatus, "cancelled">] || (st.key === "received" && status === "in_review");
                return <li key={st.key} className={cx(done && "f-pl-reqsteps__done")} aria-current={st.key === status ? "step" : undefined}>{done && <span aria-hidden>✓ </span>}{st.word}</li>;
              })}
            </ol>
          )}
          {late && !existing && <p className="f-pl-note f-pl-note--amber"><b>בדיקת מועד:</b> {late}</p>}
          <dl className="f-pl-knows__grid f-pl-ctx f-pl-request">
            <dt>מה צריך</dt><dd>{req.quantity} × {req.title} · {req.format}{req.dimensions ? ` (${req.dimensions})` : ""}{req.duration ? ` · ${req.duration}` : ""}</dd>
            <dt>עד מתי</dt><dd>{req.neededByDay ? dayLabel(req.neededByDay) : "לפני ההשקה"}</dd>
            <dt>בשביל מה</dt><dd>{move?.longName ?? req.forLabel} · {req.purpose}{move?.startDay ? ` · ההשקה ${dayLabel(move.startDay)}` : ""}</dd>
            <dt>איך לצלם</dt><dd>{req.captureInstructions ?? "לצלם באור טבעי, בפורמט המבוקש, בלי פילטרים."}</dd>
            <dt>להעלות ל</dt><dd>תיקיית UMINO · חומרים לשיווק <span className="f-pl-meta">(קישור ידני; תיקיית Mytiv ב־Drive תחובר בהמשך)</span></dd>
            <dt>מאשר את החומר</dt><dd>{approver}</dd>
          </dl>
          {existing && status !== "cancelled" ? (
            <>
              <div className="f-pl-covered" role="status">
                <b>{REQUEST_STATUS_WORD[status!]}{existing.fileName ? ` · ${existing.fileName}` : ""}</b>
                <span className="f-pl-meta">משימה בעבודה: <Link className="f-pl-link" href={R.task(existing.taskId)}>בקשה מהלקוח: {req.title}</Link>.{status === "approved" ? " החומר מכסה את הדרישה." : status === "in_review" ? ` ממתין לאישור ${approver}.` : " הנכס נשאר חסר עד שהחומר יגיע."}</span>
              </div>
              {status === "drafted" && <>
                <label className="f-pl-h3" htmlFor={`${id}-txt`}>הטקסט לשליחה</label>
                <textarea id={`${id}-txt`} className="f-pl-request__text" readOnly rows={8} value={clientRequestText(existing)} dir="rtl" />
              </>}
              {status === "sent" && (
                <div className="f-pl-cover__upload">
                  <span className="f-pl-h3">החומר הגיע?</span>
                  <span className="f-pl-meta">העלו את הקובץ שהתקבל מהלקוח (מהמחשב; Drive יחובר בהמשך). הוא נכנס לספרייה וממתין לאישור.</span>
                  <input id={`${id}-file`} type="file" className="f-sr f-pl-file" accept={req.assetType === "video" || req.assetType === "testimonial" ? "video/*" : "image/*"} onChange={(e) => { const f = e.target.files?.[0]; setFile(f ? { name: f.name, type: f.type } : null); }} />
                  <label htmlFor={`${id}-file`} className="f-pl-filebtn">{file ? `נבחר: ${file.name}` : "בחר קובץ"}</label>
                  {fileProblem && <span className="f-pl-red" role="alert">{fileProblem}</span>}
                </div>
              )}
              <details className="f-pl-reqhist"><summary>היסטוריית הבקשה · {existing.history.length}</summary><ul>{existing.history.map((h, k) => <li key={k}><bdi dir="ltr" className="f-pl-num">{Number(h.at.slice(8))}.{Number(h.at.slice(5, 7))}</bdi> · {h.text}</li>)}</ul></details>
              <DemoNote>Mytiv לא שולח הודעות ללקוח ב־V1: מעתיקים ושולחים ידנית</DemoNote>
            </>
          ) : (
            <p className="f-pl-meta">{status === "cancelled" ? "הבקשה בוטלה; ההיסטוריה והמשימה נשמרו. פתיחה מחדש משתמשת באותה משימה." : <>הבקשה תיווצר עם משימה בעבודה (בעלים: אחראי המהלך). הנכס יישאר &quot;חסר&quot; עד שהחומר יגיע.</>}</p>
          )}
        </div>
        <div className="f-pl-panel__foot">
          {(!existing || status === "cancelled") && <Button variant="strong" onClick={create}>{status === "cancelled" ? "פתח את הבקשה מחדש" : "צור בקשה ומשימה"}</Button>}
          {status === "drafted" && <>
            <Button variant="secondary" onClick={copy}>{copied ? "הועתק ✓" : "העתק טקסט"}</Button>
            <Button variant="strong" onClick={() => { plan.markRequestSent(req.id); toast.push({ kind: "success", title: "סומן כנשלח", detail: "הבקשה נשלחה ידנית ללקוח" }); }}>סמן כנשלח ידנית</Button>
          </>}
          {status === "sent" && <Button variant="strong" onClick={receive} disabled={!file || !!fileProblem} disabledReason={!file ? "בחרו את הקובץ שהתקבל" : fileProblem ?? undefined}>סמן שהחומר התקבל</Button>}
          {status === "in_review" && <Button variant="strong" onClick={() => { plan.approveMaterial(req.id, approver); toast.push({ kind: "success", title: "החומר אושר", detail: "מכסה את הדרישה · המוכנות התעדכנה" }); }}>אשר את החומר · כ{approver}</Button>}
          {status === "approved" && <span className="f-pl-good">אושר · מכסה את הדרישה</span>}
          {existing && status !== "cancelled" && status !== "approved" && <Button variant="quiet" onClick={() => plan.cancelRequest(req.id)}>בטל בקשה</Button>}
          <Button variant="quiet" onClick={onClose}>סגור חלון</Button>
        </div>
      </div>
    </Dialog>
  );
}
