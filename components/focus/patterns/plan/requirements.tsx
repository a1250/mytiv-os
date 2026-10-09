"use client";

import { useId, useState } from "react";
import type { ApproverKind, ContentRequirement, CoverOption } from "@/lib/focus/contracts/plan";
import { AUTHENTICITY_WORD, REQUIREMENT_STATUS_WORD, countSlots, requirementSlots, requirementStatus } from "@/lib/focus/state/plan";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { cx } from "@/components/focus/ui/cx";
import { useToast } from "@/components/focus/ui/toast";
import { ClientRequestSheet } from "./client-request-sheet";
import { COVER_WORD, CoverOptions } from "./cover-options";
import { dayLabel } from "./plan-view";
import type { PlanApi } from "./use-plan";

/** The structured spec of a requirement (spec §9) — the typed fields, never only the one-line text. */
export function RequirementSpec({ req, approverName }: { req: ContentRequirement; approverName: (k: ApproverKind) => string }) {
  return (
    <dl className="f-pl-knows__grid f-pl-spec">
      <dt>סוג</dt><dd>{ASSET_WORD[req.assetType]} · {req.quantity}</dd>
      <dt>פורמט</dt><dd>{req.format}{req.dimensions ? ` · ${req.dimensions}` : ""}{req.duration ? ` · ${req.duration}` : ""}</dd>
      <dt>תפקיד</dt><dd>{req.purpose}</dd>
      <dt>ערוץ</dt><dd>{req.placement}</dd>
      <dt>עד מתי</dt><dd>{req.live ? "פעיל" : req.neededByDay ? dayLabel(req.neededByDay) : "—"}</dd>
      <dt>אותנטיות</dt><dd>{AUTHENTICITY_WORD[req.authenticity]}</dd>
      <dt>אישור</dt><dd>{approverName(req.approval)}</dd>
    </dl>
  );
}
const ASSET_WORD: Record<ContentRequirement["assetType"], string> = { photo: "תמונה", video: "סרטון", testimonial: "המלצה", logo: "לוגו", copy: "טקסט", landing_page: "דף נחיתה", graphic: "גרפיקה" };

/** One requirement's status word (open / partly covered / covered / approved) with its slots. */
export function RequirementStatusWord({ req, plan }: { req: ContentRequirement; plan: PlanApi }) {
  const slots = requirementSlots(req, plan.overlay, plan.f.builders);
  const st = requirementStatus(slots);
  const c = countSlots(slots);
  const tone = st === "approved" ? "good" : st === "open" ? "red" : "amber";
  const requested = plan.overlay.requirements[req.id]?.choice === "request";
  return <span className={cx("f-pl-req__word", `f-pl-tone--${tone}`)}>{REQUIREMENT_STATUS_WORD[st]}{c.missing > 0 && requested ? " · ממתין ללקוח" : ""}{slots.length > 1 ? ` · ${slots.length - c.missing}/${slots.length}` : ""}</span>;
}

/**
 * The move's content requirements inside the builder (spec §8 — "what content is required, what exists, what is
 * missing"): every requirement with its status, and "כסה" opening the allowed paths without leaving the builder.
 */
export function RequirementsSection({ moveId, plan, editable }: { moveId: string; plan: PlanApi; editable: boolean }) {
  const id = useId();
  const reqs = plan.f.requirements.filter((r) => r.moveId === moveId && !r.creativeIds);
  const [cover, setCover] = useState<ContentRequirement | null>(null);
  const [request, setRequest] = useState<ContentRequirement | null>(null);
  if (!reqs.length) return null;
  const open = reqs.filter((r) => countSlots(requirementSlots(r, plan.overlay, plan.f.builders)).missing > 0).length;
  return (
    <section id="requirements" className="f-pl-dcard f-pl-dcard--creative" aria-labelledby={`${id}-h`} tabIndex={-1}>
      <div className="f-pl-creative__head"><h2 id={`${id}-h`} className="f-pl-dcard__label">דרישות תוכן · {reqs.length}</h2>{open > 0 && <span className="f-pl-amber">{open} עדיין לא מכוסות</span>}</div>
      <ul className="f-pl-reqlist">
        {reqs.map((r) => {
          const chosen = plan.overlay.requirements[r.id];
          const slots = requirementSlots(r, plan.overlay, plan.f.builders);
          const missing = countSlots(slots).missing > 0;
          return (
            <li key={r.id} className="f-pl-reqlist__item">
              <div className="f-pl-reqlist__main">
                <b>{r.title}</b>
                <span className="f-pl-meta">{r.format}{r.duration ? ` · ${r.duration}` : ""} · {r.purpose} · {AUTHENTICITY_WORD[r.authenticity]}{r.neededByDay ? ` · עד ${dayLabel(r.neededByDay)}` : ""}</span>
                {chosen && <span className="f-pl-meta">נבחר: {COVER_WORD[chosen.choice]}</span>}
              </div>
              <RequirementStatusWord req={r} plan={plan} />
              {editable && missing && !chosen && <Button size="sm" variant="secondary" onClick={() => setCover(r)} aria-label={`כסה · ${r.title}`}>כסה</Button>}
              {(chosen?.choice === "request" || plan.overlay.requests[r.id]) && <Button size="sm" variant="quiet" onClick={() => setRequest(r)} aria-label={`הבקשה ללקוח · ${r.title}`}>הבקשה ללקוח</Button>}
              {editable && chosen && chosen.choice !== "request" && <button type="button" className="f-pl-linkbtn f-hit" onClick={() => plan.clearRequirement(r.id)}>שנה</button>}
            </li>
          );
        })}
      </ul>
      <CoverDialog req={cover} plan={plan} onClose={() => setCover(null)} onRequest={(r) => { setCover(null); setRequest(r); }} />
      <ClientRequestSheet req={request} plan={plan} open={!!request} onClose={() => setRequest(null)} />
    </section>
  );
}

/** The cover paths for one requirement, in a drawer; "request from the client" hands over to the request sheet. */
export function CoverDialog({ req, plan, onClose, onRequest }: { req: ContentRequirement | null; plan: PlanApi; onClose: () => void; onRequest: (r: ContentRequirement) => void }) {
  const toast = useToast();
  const id = useId();
  return (
    <Dialog open={!!req} onClose={onClose} variant="drawer" labelledBy={`${id}-t`} className="f-pl-panel f-pl-panel--change">
      {req && (
        <div className="f-pl-panel__wrap">
          <div className="f-pl-panel__head">
            <div className="f-pl-panel__crumbrow"><span className="f-pl-meta">דרישת תוכן</span><button type="button" className="f-pl-x f-hit" aria-label="סגירה" onClick={onClose}>×</button></div>
            <h2 id={`${id}-t`} className="f-pl-panel__title">כסה · {req.title}</h2>
            <span className="f-pl-meta">{req.spec}</span>
          </div>
          <div className="f-pl-panel__body">
            <RequirementSpec req={req} approverName={plan.approverName} />
            <CoverOptions
              req={req}
              chosen={plan.overlay.requirements[req.id]}
              today={plan.today}
              onChoose={(choice: CoverOption, extra) => {
                if (choice === "request") { onRequest(req); return; }
                if (!plan.coverRequirement(req.id, choice, { assetId: extra?.assetId })) { toast.push({ kind: "error", title: "הדרך הזו לא מותרת לסוג הנכס", detail: req.title }); return; }
                toast.push({ title: `${COVER_WORD[choice]} · ${req.title}`, detail: "הנכס ממתין לאישור לפני שימוש" });
                onClose();
              }}
              onClear={() => plan.clearRequirement(req.id)}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
