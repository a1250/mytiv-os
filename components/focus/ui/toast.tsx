"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { canUndo, fmtRemaining, openWindow, remainingMs, TOAST_MS, UNDO_WINDOW_MS, type UndoWindow } from "@/lib/focus/state/undo";
import { cx } from "./cx";
import { Icon } from "./icon";

/**
 * Toasts (§6.11). Plain toasts leave after 6s; errors stay until closed; a toast with "בטל" leaves 6s after its undo window ends. "Success" is only
 * raised by callers after the target system confirmed. Polite live region; errors are assertive.
 */
export type ToastInput = {
  kind?: "success" | "info" | "error";
  title: string;
  detail?: string;
  /**
   * `onUndo` returns false when the undo was refused (it explains why itself) — the toast then never claims "בוטל";
   * a string replaces the default "בוטל." line when the undo had an effect elsewhere worth saying (e.g. a sync revert).
   */
  undo?: { onUndo: () => boolean | string | void; windowMs?: number; label?: string };
  action?: { label: string; onClick: () => void };
};
type ToastItem = ToastInput & { id: number; window: UndoWindow | null; undone?: string };

const Ctx = createContext<{ push: (t: ToastInput) => number; dismiss: (id: number) => void } | null>(null);

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast outside ToastProvider");
  return c;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback((t: ToastInput) => {
    const id = ++seq.current;
    const window = t.undo ? openWindow(Date.now(), t.undo.windowMs ?? UNDO_WINDOW_MS) : null;
    setItems((xs) => [...xs.slice(-2), { ...t, id, window }]);
    if (!t.undo && t.kind !== "error") setTimeout(() => dismiss(id), TOAST_MS);
    return id;
  }, [dismiss]);
  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="f-toasts" aria-live="polite" aria-relevant="additions text">
        {items.filter((t) => t.kind !== "error").map((t) => <Toast key={t.id} t={t} onClose={() => dismiss(t.id)} onUndone={(text) => setItems((xs) => xs.map((x) => x.id === t.id ? { ...x, undone: text } : x))} />)}
      </div>
      <div className="f-toasts f-toasts--errors" aria-live="assertive">
        {items.filter((t) => t.kind === "error").map((t) => <Toast key={t.id} t={t} onClose={() => dismiss(t.id)} onUndone={() => {}} />)}
      </div>
    </Ctx.Provider>
  );
}

function Toast({ t, onClose, onUndone }: { t: ToastItem; onClose: () => void; onUndone: (text: string) => void }) {
  const [now, setNow] = useState(() => Date.now());
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = canUndo(t.window, now) && !t.undone;
  useEffect(() => {
    if (!t.window || t.undone) return;
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [t.window, t.undone]);
  // once the undo window closes the toast behaves like a plain one
  useEffect(() => {
    if (t.window && !open) { const to = setTimeout(onClose, t.undone ? 2500 : TOAST_MS); return () => clearTimeout(to); }
  }, [open, t.window, t.undone, onClose]);
  const glyph = t.kind === "error" ? "!" : t.undone ? "↺" : "✓";
  return (
    // announced once, by its container's live region (a role here too would announce it twice)
    <div className={cx("f-toast", t.kind === "error" && "f-toast--error")}>
      <span className="f-toast__glyph" aria-hidden>{glyph}</span>
      <span className="f-toast__body">
        <span className="f-toast__title">{t.undone ?? t.title}</span>
        {!t.undone && t.detail && <span className="f-toast__detail">{t.detail}</span>}
      </span>
      <span className="f-toast__actions">
        {open && t.undo && (
          // the countdown is visual only: its text changes every 250ms and would be re-announced by the live region
          <button type="button" className="f-toast__btn f-hit" aria-label={t.undo.label ?? "בטל"} onClick={(e) => {
            const hadFocus = document.activeElement === e.currentTarget;
            const r = t.undo!.onUndo();
            if (r === false) onClose(); else onUndone(typeof r === "string" ? r : "בוטל.");
            // the undo button goes away: keep keyboard focus in a sensible place (this toast's close, or the page)
            if (hadFocus) requestAnimationFrame(() => (r === false ? document.getElementById("main") : closeRef.current)?.focus());
          }}>
            {t.undo.label ?? "בטל"} <span className="f-num" aria-hidden>{fmtRemaining(remainingMs(t.window!, now))}</span>
          </button>
        )}
        {t.action && <button type="button" className="f-toast__btn f-hit" onClick={t.action.onClick}>{t.action.label}</button>}
        <button ref={closeRef} type="button" className="f-toast__btn f-toast__btn--x f-hit" aria-label="סגור הודעה" onClick={onClose}><Icon name="x" size={14} /></button>
      </span>
    </div>
  );
}
