import type { ReactNode } from "react";
import { cx } from "./cx";

/** Isolate LTR runs (numbers, e-mails, links, codes) inside RTL text (handoff RTL rules). */
export function Bdi({ children, className }: { children: ReactNode; className?: string }) {
  return <bdi dir="ltr" className={className}>{children}</bdi>;
}

export function Avatar({ initial, name, size, className }: { initial: string; name?: string; size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cx("f-avatar", size && `f-avatar--${size}`, className)} role={name ? "img" : undefined} aria-label={name} aria-hidden={name ? undefined : true}>
      {initial}
    </span>
  );
}

/** "טופלו X מתוך Y" segment progress. `current` marks the item in focus. */
export function SegmentProgress({ total, done, current, label, small }: { total: number; done: number; current?: number; label: string; small?: boolean }) {
  return (
    <span className={cx("f-segprog", small && "f-segprog--sm")} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx("f-segprog__seg", i < done && "f-segprog__seg--done", i === current && "f-segprog__seg--current")} />
      ))}
    </span>
  );
}

/** Usage bar: medium above 80%, high above 100% (handoff 6.8). */
export function UsageBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = max > 0 ? value / max : 0;
  return (
    <span className={cx("f-bar", className)} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <span className={cx("f-bar__fill", pct > 1 ? "f-bar__fill--over" : pct > 0.8 && "f-bar__fill--warn")} style={{ width: `${Math.min(100, pct * 100)}%` }} />
    </span>
  );
}
