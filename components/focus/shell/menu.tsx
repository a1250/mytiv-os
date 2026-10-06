"use client";

import Link from "@/components/focus/ui/link";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/components/focus/ui/cx";

/**
 * Menu button (WAI-ARIA menu pattern): Enter/Space/↓ opens and focuses the first item, ↑/↓/Home/End move,
 * Esc or Tab closes and returns focus to the button, a click outside closes.
 */
export function Menu({
  label, buttonClassName, buttonContent, children, align = "end", panelClassName, buttonLabel, className,
}: {
  label: string; buttonClassName?: string; buttonContent: ReactNode; children: (close: () => void) => ReactNode;
  align?: "start" | "end"; panelClassName?: string; buttonLabel?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => { setOpen(false); btn.current?.focus(); }, []);
  const dismiss = useCallback(() => setOpen(false), []);
  const items = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);

  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    const onDoc = (e: MouseEvent) => {
      if (!panel.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onPanelKey = (e: KeyboardEvent) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") setOpen(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); list[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); list[list.length - 1]?.focus(); }
  };

  return (
    <div className={cx("f-menu", className)}>
      <button
        ref={btn}
        type="button"
        className={buttonClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={buttonLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "ArrowDown" && !open) { e.preventDefault(); setOpen(true); } }}
      >
        {buttonContent}
      </button>
      {open && (
        <div ref={panel} id={id} role="menu" aria-label={label} className={cx("f-menu__panel", align === "start" && "f-menu__panel--start", panelClassName)} onKeyDown={onPanelKey}>
          {children(dismiss)}
        </div>
      )}
    </div>
  );
}

export function MenuLink({ href, children, onSelect, current, hint }: { href: string; children: ReactNode; onSelect: () => void; current?: boolean; hint?: ReactNode }) {
  return (
    <Link role="menuitem" tabIndex={-1} href={href} className="f-menu__item" aria-current={current ? "page" : undefined} onClick={onSelect}>
      {children}{hint && <span className="f-menu__hint">{hint}</span>}
    </Link>
  );
}

export function MenuButton({ children, onSelect, checked, hint }: { children: ReactNode; onSelect: () => void; checked?: boolean; hint?: ReactNode }) {
  return (
    <button type="button" role={checked == null ? "menuitem" : "menuitemradio"} aria-checked={checked} tabIndex={-1} className="f-menu__item" onClick={onSelect}>
      {children}{hint && <span className="f-menu__hint">{hint}</span>}
    </button>
  );
}
