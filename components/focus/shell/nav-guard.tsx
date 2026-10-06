"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { scopedHref } from "@/lib/focus/scope";
import { Button } from "@/components/focus/ui/button";
import { Dialog } from "@/components/focus/ui/dialog";
import { useFocusScope } from "./scope";

/**
 * One unsaved-changes guard for every way out of a screen (handoff §6.2 "שינויים שלא נשמרו"). A screen registers
 * `useNavGuard({ dirty, what })`; while any registered guard is dirty:
 * - an in-app link click (anywhere: top bar, side cards, in-page links) is held — capture phase, before React;
 * - the search palette asks through `useNavGuardAttempt()` before it navigates;
 * - browser Back / Forward is held: a same-URL guard entry is pushed on top of the page; leaving it re-pushes the
 *   entry and asks, so the page and its draft stay;
 * - closing / reloading the tab asks the browser to confirm.
 * The dialog offers stay, leave without saving, and (when the screen can) save and leave. Screens keep their own
 * dialogs for their own buttons (exit, J); a confirmed programmatic navigation goes through useFocusRouter, which
 * replaces the guard entry instead of stacking a duplicate.
 */
type Guard = { dirty: boolean; what: string; onSaveAndLeave?: () => boolean | void };
type Held = { what: string; save?: () => boolean | void };
type Target = ({ kind: "href"; href: string } | { kind: "back" }) & Held;
type Ctx = {
  register: (id: string, g: Guard) => void;
  unregister: (id: string) => void;
  /** true = navigation may proceed now; false = held, the dialog is open */
  attempt: (href: string) => boolean;
  /** used by useFocusRouter: navigate replacing the guard entry when one is on top */
  consumeGuardEntry: () => boolean;
};

const NavCtx = createContext<Ctx | null>(null);
const GUARD_KEY = "__focusNavGuard";

export function NavGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { base } = useFocusScope();
  const guards = useRef(new Map<string, Guard>());
  const [dirtyIds, setDirtyIds] = useState<string[]>([]); // render reads this, never the ref
  const [target, setTarget] = useState<Target | null>(null);
  const entryOnTop = useRef(false);
  const ignoreNextPop = useRef(false);

  /** the most recently registered dirty guard (its text and save action are snapshotted when navigation is held) */
  const held = useCallback((): Held | null => {
    let last: Guard | null = null;
    for (const g of guards.current.values()) if (g.dirty) last = g;
    return last ? { what: last.what, save: last.onSaveAndLeave } : null;
  }, []);
  const anyDirty = dirtyIds.length > 0;

  const register = useCallback((id: string, g: Guard) => {
    guards.current.set(id, g);
    setDirtyIds((xs) => (g.dirty ? (xs.includes(id) ? xs : [...xs, id]) : xs.filter((x) => x !== id)));
  }, []);
  const unregister = useCallback((id: string) => { guards.current.delete(id); setDirtyIds((xs) => xs.filter((x) => x !== id)); }, []);

  // the guard entry: pushed while dirty so Back lands on the same page; removed again when clean
  useEffect(() => {
    if (anyDirty && !entryOnTop.current) {
      window.history.pushState({ ...(window.history.state ?? {}), [GUARD_KEY]: true }, "", window.location.href);
      entryOnTop.current = true;
    } else if (!anyDirty && entryOnTop.current) {
      entryOnTop.current = false;
      if (window.history.state?.[GUARD_KEY]) { ignoreNextPop.current = true; window.history.back(); }
    }
  }, [anyDirty]);

  useEffect(() => {
    const onPop = () => {
      if (ignoreNextPop.current) { ignoreNextPop.current = false; return; }
      const h = entryOnTop.current ? held() : null;
      if (!h) return;
      // Back/Forward left the guard entry: put it back (the page and draft stay) and ask
      window.history.pushState({ ...(window.history.state ?? {}), [GUARD_KEY]: true }, "", window.location.href);
      setTarget({ kind: "back", ...h });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [held]);

  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const h = held();
      if (!h) return;
      e.preventDefault();
      e.stopPropagation();
      setTarget({ kind: "href", href: url.pathname + url.search + url.hash, ...h });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => { window.removeEventListener("beforeunload", onBeforeUnload); document.removeEventListener("click", onClick, true); };
  }, [anyDirty, held]);

  const consumeGuardEntry = useCallback(() => {
    if (!entryOnTop.current) return false;
    entryOnTop.current = false;
    return true;
  }, []);

  const attempt = useCallback((href: string) => {
    const h = held();
    if (!h) return true;
    setTarget({ kind: "href", href: scopedHref(base, href), ...h });
    return false;
  }, [held, base]);

  const leave = () => {
    const t = target;
    setTarget(null);
    if (!t) return;
    const hadEntry = consumeGuardEntry();
    if (t.kind === "back") { ignoreNextPop.current = true; window.history.go(hadEntry ? -2 : -1); return; }
    // replace the guard entry with the destination: Back from there returns to the page, not to a duplicate
    if (hadEntry) router.replace(t.href); else router.push(t.href);
  };
  const saveAndLeave = target?.save ? () => { if (target.save!() === false) { setTarget(null); return; } leave(); } : undefined;

  const value = useMemo(() => ({ register, unregister, attempt, consumeGuardEntry }), [register, unregister, attempt, consumeGuardEntry]);
  return (
    <NavCtx.Provider value={value}>
      {children}
      <LeaveDialog open={!!target} what={target?.what ?? "השינויים שלא נשמרו יאבדו."} onStay={() => setTarget(null)} onLeave={leave} onSaveAndLeave={saveAndLeave} />
    </NavCtx.Provider>
  );
}

/** Register this screen's unsaved state. `onSaveAndLeave` returning false keeps the user on the page (save failed). */
export function useNavGuard({ dirty, what, onSaveAndLeave }: Guard) {
  const ctx = useContext(NavCtx);
  const id = useId();
  const save = useRef(onSaveAndLeave);
  useEffect(() => { save.current = onSaveAndLeave; });
  useEffect(() => {
    ctx?.register(id, { dirty, what, onSaveAndLeave: onSaveAndLeave ? () => save.current?.() : undefined });
  }, [ctx, id, dirty, what, onSaveAndLeave]);
  useEffect(() => () => ctx?.unregister(id), [ctx, id]);
}

/** For navigation that is not a link (search palette): returns false when it was held for the dialog. */
export function useNavGuardAttempt() {
  const ctx = useContext(NavCtx);
  return useCallback((href: string) => (ctx ? ctx.attempt(href) : true), [ctx]);
}

/** Internal: lets useFocusRouter replace the guard entry instead of stacking a duplicate history entry. */
export function useNavGuardEntry() {
  return useContext(NavCtx)?.consumeGuardEntry;
}

export function LeaveDialog({ open, what, onStay, onLeave, onSaveAndLeave }: {
  open: boolean; what: string; onStay: () => void; onLeave: () => void; onSaveAndLeave?: () => void;
}) {
  return (
    <Dialog open={open} onClose={onStay} labelledBy="nav-leave-title" className="f-cm-modal" initialFocus=".f-nav-leave__stay">
      <div className="f-cm-dlg">
        <h2 id="nav-leave-title" className="f-cm-dlg__title">יש שינויים שלא נשמרו</h2>
        <p className="f-cm-dlg__text">{what}</p>
        <div className="f-cm-dlg__actions">
          {onSaveAndLeave && <Button variant="primary" onClick={onSaveAndLeave}>שמור וצא</Button>}
          <Button variant={onSaveAndLeave ? "neutral" : "primary"} className="f-nav-leave__stay" onClick={onStay}>הישאר בעמוד</Button>
          <Button variant="neutral" onClick={onLeave}>צא בלי לשמור</Button>
        </div>
      </div>
    </Dialog>
  );
}
