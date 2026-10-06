"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "./cx";

/**
 * Modal surfaces on the native <dialog> + showModal(): focus is trapped and moved inside, Esc closes, the page behind
 * is inert, and focus returns to the opener on close. `drawer` slides from the inline-end on desktop and becomes a
 * bottom sheet under 768px (handoff M4/M10).
 */
export function Dialog({
  open, onClose, label, labelledBy, describedBy, variant = "center", className, children, initialFocus,
}: {
  open: boolean; onClose: () => void; label?: string; labelledBy?: string; describedBy?: string; variant?: "center" | "drawer";
  className?: string; children: ReactNode; initialFocus?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement;
      d.showModal();
      const target = initialFocus ? d.querySelector<HTMLElement>(initialFocus) : null;
      target?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open, initialFocus]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => { e.preventDefault(); onClose(); };
    const onClosed = () => { (opener.current as HTMLElement | null)?.focus?.(); };
    d.addEventListener("cancel", onCancel);
    d.addEventListener("close", onClosed);
    return () => { d.removeEventListener("cancel", onCancel); d.removeEventListener("close", onClosed); };
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className={cx("f-dialog", `f-dialog--${variant}`, className)}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {open && children}
    </dialog>
  );
}
