"use client";

import type { ReactNode } from "react";
import type { WorkViewState } from "@/lib/focus/contracts/work";
import { fmtDayMonth } from "@/lib/focus/format";
import { PEOPLE_BY_ID } from "@/lib/focus/fixtures/people";
import { Icon } from "@/components/focus/ui/icon";
import { Button } from "@/components/focus/ui/button";
import { Banner, EmptyState, Skeleton } from "@/components/focus/ui/feedback";

/**
 * Mytiv Work system states (handoff W6): empty · loading (skeleton in the final structure) · error (what was kept +
 * retry) · unavailable (the source is down — "—", never an empty list) · permission denied (view only) · version
 * conflict (both versions, nothing overwritten until decided).
 */
export function WorkStateView({ state, onRetry, onCreate, onRequestAccess, onKeepMine, onTakeTheirs, children }: {
  state: WorkViewState | { kind: "ready" }; onRetry?: () => void; onCreate?: () => void; onRequestAccess?: () => void;
  onKeepMine?: () => void; onTakeTheirs?: () => void; children?: ReactNode;
}) {
  const show = (v: unknown, field: string) => (field === "assigneeId" ? (typeof v === "string" ? PEOPLE_BY_ID[v]?.name ?? v : "ללא") : String(v ?? "—"));
  switch (state.kind) {
    case "ready": return <>{children}</>;
    case "empty":
      return <EmptyState glyph="✓" title={state.title} hint={state.hint} action={onCreate && <Button variant="primary" size="sm" onClick={onCreate}>+ משימה</Button>} />;
    case "loading":
      return (
        <div className="f-wstate__skel" role="status" aria-busy="true" aria-label="טוען משימות">
          <Skeleton h={14} w="55%" /><Skeleton h={44} /><Skeleton h={44} /><Skeleton h={44} />
        </div>
      );
    case "error":
      return (
        <div className="f-wstate f-wstate--error" role="alert">
          <span className="f-wstate__glyph" aria-hidden>!</span>
          <b>{state.message}</b>
          <span className="f-meta">הנתונים שהוצגו לאחרונה נשמרו. אפשר לנסות שוב.</span>
          {onRetry && <Button variant="neutral" size="sm" onClick={onRetry}>נסה שוב</Button>}
        </div>
      );
    case "unavailable":
      return <Banner kind="unavailable" title={state.reason} detail={state.since ? `המשימות מהמקור לא זמינות מאז ${fmtDayMonth(state.since)}. לא מוצגת רשימה ריקה — הנתונים חסרים, לא אפס.` : "הנתונים חסרים, לא אפס."} action={onRetry && <Button variant="neutral" size="sm" onClick={onRetry}>נסה שוב</Button>} />;
    case "permissionDenied":
      return (
        <div className="f-wstate" role="status">
          <span className="f-wstate__glyph" aria-hidden><Icon name="lock" size={18} /></span>
          <b>צפייה בלבד</b>
          <span className="f-meta">{state.reason}</span>
          {onRequestAccess && <Button variant="secondary" size="sm" onClick={onRequestAccess}>בקש גישה ממנהל הצוות</Button>}
        </div>
      );
    case "versionConflict":
      return (
        <div className="f-conflict" role="alert">
          <b className="f-conflict__h"><span aria-hidden>⧗</span> {state.theirsBy} עדכן/ה משימה זו בזמן שערכת</b>
          <span className="f-conflict__d">השדה &quot;{state.field === "assigneeId" ? "אחראי" : String(state.field)}&quot; השתנה אצל שניכם. בחר איזו גרסה לשמור — שום דבר לא נדרס עד שתחליט.</span>
          <div className="f-conflict__cols">
            <div className="f-conflict__col"><span className="f-meta-sm">שלך</span><b>{show(state.mine[state.field], String(state.field))}</b></div>
            <div className="f-conflict__col f-conflict__col--theirs"><span className="f-meta-sm">של {state.theirsBy} · חדש יותר</span><b>{show(state.theirs[state.field], String(state.field))}</b></div>
          </div>
          <div className="f-conflict__actions">
            {onKeepMine && <Button variant="primary" size="sm" onClick={onKeepMine}>שמור את שלי</Button>}
            {onTakeTheirs && <Button variant="neutral" size="sm" onClick={onTakeTheirs}>קבל את של {state.theirsBy}</Button>}
          </div>
        </div>
      );
  }
}
