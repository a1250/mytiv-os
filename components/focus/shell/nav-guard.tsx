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
 * The dialog offers stay, leave without saving, and (when the screen can) save and leave. Programmatic navigation
 * (a screen's own exit button, J in focus mode) asks through `useNavGuardAttempt()` too; a navigation that is allowed
 * goes through useFocusRouter, which replaces the guard entry instead of stacking a duplicate.
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
  /** used by useFocusRouter: run a navigation after a pending removal of the guard entry (never racing it) */
  whenSettled: (fn: () => void) => void;
  /** used by useFocusRouter.discardAndReplace: the draft is being thrown away — step off the guard entry now */
  discard: () => void;
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
  /** the URL the guard entry was pushed for (Next replaces history.state on its own navigations) */
  const entryUrl = useRef<string | null>(null);
  const ignoreNextPop = useRef(false);
  /**
   * Removing the guard entry is an async history step. A navigation started before it lands would be undone by it
   * (or abort it), so navigations wait for it: `queued` runs when the step completed.
   */
  const pendingBack = useRef(false);
  const queued = useRef<(() => void) | null>(null);
  const dirtyRef = useRef(false);
  /** the user chose "leave" — the browser's own unload prompt must not ask a second time */
  const leaving = useRef(false);

  /** the last dirty guard in mount order (its text and save action are snapshotted when navigation is held) */
  const held = useCallback((): Held | null => {
    let last: Guard | null = null;
    for (const g of guards.current.values()) if (g.dirty) last = g;
    return last ? { what: last.what, save: last.onSaveAndLeave } : null;
  }, []);
  const anyDirty = dirtyIds.length > 0;
  useEffect(() => { dirtyRef.current = anyDirty; }, [anyDirty]);

  const flush = useCallback(() => {
    pendingBack.current = false;
    const run = queued.current;
    queued.current = null;
    // after Next applied the history step (its popstate handler restores this page; a push dispatched in the same
    // tick would be cancelled by that restore)
    if (run) requestAnimationFrame(() => setTimeout(run, 0));
  }, []);

  /**
   * Step off the guard entry the moment the last dirty guard turns clean — synchronously, in the same commit, so a
   * link clicked right after is already queued behind the step instead of being undone by it.
   */
  const stepOff = useCallback(() => {
    if (!entryOnTop.current) return;
    entryOnTop.current = false;
    // only our own entry is stepped off (if the page replaced its URL since, that entry is a real one: keep it)
    if (!(window.history.state?.[GUARD_KEY] || window.location.href === entryUrl.current)) return;
    ignoreNextPop.current = true;
    pendingBack.current = true;
    window.history.back();
    // the step normally lands within a frame; never leave navigation queued if it does not
    setTimeout(() => { if (pendingBack.current) { ignoreNextPop.current = false; flush(); } }, 500);
  }, [flush]);
  const anyGuardDirty = () => [...guards.current.values()].some((g) => g.dirty);

  const register = useCallback((id: string, g: Guard) => {
    guards.current.set(id, g);
    if (!g.dirty && !anyGuardDirty()) stepOff();
    setDirtyIds((xs) => (g.dirty ? (xs.includes(id) ? xs : [...xs, id]) : xs.filter((x) => x !== id)));
  }, [stepOff]);
  const unregister = useCallback((id: string) => {
    guards.current.delete(id);
    if (!anyGuardDirty()) stepOff();
    setDirtyIds((xs) => xs.filter((x) => x !== id));
  }, [stepOff]);
  /** run a navigation now, or right after a pending removal of the guard entry */
  const whenSettled = useCallback((fn: () => void) => {
    if (pendingBack.current) queued.current = fn; else fn();
  }, []);

  // the guard entry: pushed while dirty so Back lands on the same page (after the commit, so a page that mounts dirty
  // never pushes ahead of Next's own history update); removed again by stepOff when clean
  useEffect(() => {
    if (anyDirty && !entryOnTop.current) {
      window.history.pushState({ ...(window.history.state ?? {}), [GUARD_KEY]: true }, "", window.location.href);
      entryOnTop.current = true;
      entryUrl.current = window.location.href;
    } else if (!anyDirty) stepOff();
  }, [anyDirty, stepOff]);

  useEffect(() => {
    const onPop = () => {
      if (ignoreNextPop.current) { ignoreNextPop.current = false; flush(); return; }
      // a jump of several entries (Back's long-press menu, history.go(-n)) lands past the page: the router already
      // left it and history cannot be held there — never push a guard entry onto the other page or ask after the fact
      if (entryOnTop.current && window.location.href !== entryUrl.current) { entryOnTop.current = false; return; }
      const h = entryOnTop.current ? held() : null;
      if (!h) return;
      // Back/Forward left the guard entry: put it back (the page and draft stay) and ask
      window.history.pushState({ ...(window.history.state ?? {}), [GUARD_KEY]: true }, "", window.location.href);
      entryUrl.current = window.location.href;
      setTarget({ kind: "back", ...h });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [held, flush]);

  // in-app links: held while dirty (dialog), queued while the guard entry is being removed
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current && !pendingBack.current) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const href = url.pathname + url.search + url.hash;
      if (pendingBack.current) { e.preventDefault(); e.stopPropagation(); queued.current = () => router.push(href); return; }
      const h = held();
      if (!h) return;
      e.preventDefault();
      e.stopPropagation();
      setTarget({ kind: "href", href, ...h });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [held, router]);

  // closing / reloading the tab while dirty
  useEffect(() => {
    if (!anyDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { if (!leaving.current) e.preventDefault(); };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyDirty]);

  /** the screen discards its draft and navigates in place (close / switch without saving): step off the guard entry
   * first, so the discarded state does not stay behind as an extra history entry */
  const discard = useCallback(() => {
    // only when the discarding screen is the one dirty guard (another dirty one keeps the page protected)
    if ([...guards.current.values()].filter((g) => g.dirty).length <= 1) stepOff();
  }, [stepOff]);

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
    leaving.current = true;
    setTimeout(() => { leaving.current = false; }, 1500); // still here (in-app navigation, or nowhere to go back to)
    if (t.kind === "back") {
      ignoreNextPop.current = true;
      window.history.go(hadEntry ? -2 : -1);
      // nothing before this page (opened in a new tab): no popstate comes — leave to the Focus home instead of doing
      // nothing (the guard entry on top is replaced by it), and the next real Back is not swallowed
      const onPop = () => { clearTimeout(fallback); };
      const fallback = setTimeout(() => {
        window.removeEventListener("popstate", onPop);
        if (ignoreNextPop.current) { ignoreNextPop.current = false; router.replace(base); }
      }, 400);
      window.addEventListener("popstate", onPop, { once: true });
      return;
    }
    // replace the guard entry with the destination: Back from there returns to the page, not to a duplicate
    if (hadEntry) router.replace(t.href); else router.push(t.href);
  };
  const saveAndLeave = target?.save ? () => { if (target.save!() === false) { setTarget(null); return; } leave(); } : undefined;

  const value = useMemo(() => ({ register, unregister, attempt, consumeGuardEntry, whenSettled, discard }), [register, unregister, attempt, consumeGuardEntry, whenSettled, discard]);
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
  const canSave = !!onSaveAndLeave; // re-register on what changes, not on a new inline callback every render
  useEffect(() => {
    ctx?.register(id, { dirty, what, onSaveAndLeave: canSave ? () => save.current?.() : undefined });
  }, [ctx, id, dirty, what, canSave]);
  useEffect(() => () => ctx?.unregister(id), [ctx, id]);
}

/** For navigation that is not a link (search palette): returns false when it was held for the dialog. */
export function useNavGuardAttempt() {
  const ctx = useContext(NavCtx);
  return useCallback((href: string) => (ctx ? ctx.attempt(href) : true), [ctx]);
}

/** Internal: lets useFocusRouter replace the guard entry instead of stacking a duplicate, and wait for its removal. */
export function useNavGuardEntry() {
  const ctx = useContext(NavCtx);
  return useMemo(() => (ctx ? { consume: ctx.consumeGuardEntry, whenSettled: ctx.whenSettled, discard: ctx.discard } : null), [ctx]);
}

export function LeaveDialog({ open, what, onStay, onLeave, onSaveAndLeave }: {
  open: boolean; what: string; onStay: () => void; onLeave: () => void; onSaveAndLeave?: () => void;
}) {
  return (
    <Dialog open={open} onClose={onStay} labelledBy="nav-leave-title" describedBy="nav-leave-text" className="f-cm-modal" initialFocus=".f-nav-leave__stay">
      <div className="f-cm-dlg">
        <h2 id="nav-leave-title" className="f-cm-dlg__title">יש שינויים שלא נשמרו</h2>
        <p id="nav-leave-text" className="f-cm-dlg__text">{what}</p>
        <div className="f-cm-dlg__actions">
          {onSaveAndLeave && <Button variant="primary" onClick={onSaveAndLeave}>שמור וצא</Button>}
          <Button variant={onSaveAndLeave ? "neutral" : "primary"} className="f-nav-leave__stay" onClick={onStay}>הישאר בעמוד</Button>
          <Button variant="neutral" onClick={onLeave}>צא בלי לשמור</Button>
        </div>
      </div>
    </Dialog>
  );
}
