"use client";

import { useFocusRouter } from "@/components/focus/ui/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";

/**
 * Unsaved-edits guard (handoff §6.2 "שינויים שלא נשמרו"): while `dirty`, closing the tab asks the browser to confirm
 * and an in-app link click is held until the user chooses — stay, leave without saving, or save and leave.
 */
export function useLeaveGuard(dirty: boolean) {
  const router = useFocusRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
  return {
    pendingHref,
    stay: () => setPendingHref(null),
    leave: () => { const h = pendingHref; setPendingHref(null); if (h) router.push(h); },
  };
}

export function LeaveDialog({ open, what, onStay, onLeave, onSaveAndLeave }: {
  open: boolean; what: string; onStay: () => void; onLeave: () => void; onSaveAndLeave?: () => void;
}) {
  return (
    <Dialog open={open} onClose={onStay} labelledBy="cm-leave-title" className="f-cm-modal">
      <div className="f-cm-dlg">
        <h2 id="cm-leave-title" className="f-cm-dlg__title">יש שינויים שלא נשמרו</h2>
        <p className="f-cm-dlg__text">{what}</p>
        <div className="f-cm-dlg__actions">
          {onSaveAndLeave && <Button variant="primary" onClick={onSaveAndLeave}>שמור וצא</Button>}
          <Button variant={onSaveAndLeave ? "neutral" : "primary"} onClick={onStay}>הישאר בעמוד</Button>
          <Button variant="neutral" onClick={onLeave}>צא בלי לשמור</Button>
        </div>
      </div>
    </Dialog>
  );
}
