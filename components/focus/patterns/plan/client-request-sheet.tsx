"use client";

import Link from "@/components/focus/ui/link";
import { useId, useState } from "react";
import type { ContentRequirement } from "@/lib/focus/contracts/plan";
import { R } from "@/lib/focus/routes";
import { clientRequestText, requestTooLate } from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { useToast } from "@/components/focus/ui/toast";
import { DemoNote } from "./plan-parts";
import { dayLabel } from "./plan-view";
import type { PlanApi } from "./use-plan";

/**
 * Client Material Request (spec §9): exactly what the client must send and why — items, quantity, format, duration,
 * needed-by, the move and its launch, capture instructions and where to upload — linked to the content requirement.
 * Creating it makes one Work task (the notes carry the same text). Sending is manual in V1: a person copies the text
 * into WhatsApp or an email and marks it sent. Nothing is sent from here.
 */
export function ClientRequestSheet({ req, plan, open, onClose }: { req: ContentRequirement | null; plan: PlanApi; open: boolean; onClose: () => void }) {
  const id = useId();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  if (!req) return null;
  const existing = plan.overlay.requests[req.id];
  const late = requestTooLate(req, plan.today);
  const move = plan.moves.find((m) => m.id === req.moveId) ?? plan.f.proposed.find((m) => m.id === req.moveId);
  const create = () => {
    const r = plan.createClientRequest(req);
    toast.push({ kind: "success", title: "נוצרה בקשה ללקוח + משימה בעבודה", detail: `${r.items[0].what} · עד ${dayLabel(r.neededByDay)}` });
  };
  const copy = async () => {
    if (!existing) return;
    try { await navigator.clipboard.writeText(clientRequestText(existing)); setCopied(true); toast.push({ title: "הטקסט הועתק", detail: "הדביקו ב־WhatsApp או במייל ושלחו ידנית" }); }
    catch { toast.push({ kind: "error", title: "ההעתקה נכשלה", detail: "סמנו את הטקסט והעתיקו ידנית" }); }
  };
  return (
    <Dialog open={open} onClose={onClose} variant="drawer" labelledBy={`${id}-t`} className="f-pl-panel f-pl-panel--change">
      <div className="f-pl-panel__wrap">
        <div className="f-pl-panel__head">
          <div className="f-pl-panel__crumbrow"><span className="f-pl-meta">בקשת חומר מהלקוח · {move?.longName ?? req.forLabel}</span><button type="button" className="f-pl-x f-hit" aria-label="סגירה" onClick={onClose}>×</button></div>
          <h2 id={`${id}-t`} className="f-pl-panel__title">{req.title}</h2>
          <span className="f-pl-meta">דרישת תוכן מקושרת · {req.spec}</span>
        </div>
        <div className="f-pl-panel__body">
          {late && <p className="f-pl-note f-pl-note--amber"><b>בדיקת מועד:</b> {late}</p>}
          <dl className="f-pl-knows__grid f-pl-ctx f-pl-request">
            <dt>מה צריך</dt><dd>{req.quantity} × {req.title} · {req.format}{req.dimensions ? ` (${req.dimensions})` : ""}{req.duration ? ` · ${req.duration}` : ""}</dd>
            <dt>עד מתי</dt><dd>{req.neededByDay ? dayLabel(req.neededByDay) : "לפני ההשקה"}</dd>
            <dt>בשביל מה</dt><dd>{move?.longName ?? req.forLabel} · {req.purpose}{move?.startDay ? ` · ההשקה ${dayLabel(move.startDay)}` : ""}</dd>
            <dt>איך לצלם</dt><dd>{req.captureInstructions ?? "לצלם באור טבעי, בפורמט המבוקש, בלי פילטרים."}</dd>
            <dt>להעלות ל</dt><dd>תיקיית UMINO · חומרים לשיווק <span className="f-pl-meta">(קישור ידני; תיקיית Mytiv ב־Drive תחובר בהמשך)</span></dd>
          </dl>
          {existing ? (
            <>
              <div className="f-pl-covered" role="status">
                <b>הבקשה נוצרה{existing.sentAt ? " ונשלחה ידנית" : ""}</b>
                <span className="f-pl-meta">משימה בעבודה: <Link className="f-pl-link" href={R.task(existing.taskId)}>בקשה מהלקוח: {req.title}</Link>. הנכס נשאר חסר עד שהחומר יגיע ויאושר.</span>
              </div>
              <label className="f-pl-h3" htmlFor={`${id}-txt`}>הטקסט לשליחה</label>
              <textarea id={`${id}-txt`} className="f-pl-request__text" readOnly rows={9} value={clientRequestText(existing)} dir="rtl" />
              <DemoNote>Mytiv לא שולח הודעות ללקוח ב־V1: מעתיקים ושולחים ידנית</DemoNote>
            </>
          ) : (
            <p className="f-pl-meta">הבקשה תיווצר עם משימה בעבודה (בעלים: {move ? "אחראי המהלך" : "מנהלת התוכן"}). הנכס יישאר &quot;חסר&quot; עד שהחומר יגיע.</p>
          )}
        </div>
        <div className="f-pl-panel__foot">
          {!existing && <Button variant="strong" onClick={create}>צור בקשה ומשימה</Button>}
          {existing && !existing.sentAt && <>
            <Button variant="secondary" onClick={copy}>{copied ? "הועתק ✓" : "העתק טקסט"}</Button>
            <Button variant="strong" onClick={() => { plan.markRequestSent(req.id); toast.push({ kind: "success", title: "סומן כנשלח", detail: "הבקשה נשלחה ידנית ללקוח" }); }}>סמן כנשלח ידנית</Button>
          </>}
          {existing?.sentAt && <span className="f-pl-good">נשלח ידנית · ממתין לחומר מהלקוח</span>}
          <Button variant="quiet" onClick={onClose}>סגור חלון</Button>
        </div>
      </div>
    </Dialog>
  );
}
