"use client";

import Link from "next/link";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./cx";

/**
 * Tabs & segmented controls (§6.3). Two kinds, chosen by what the control does:
 *  - `Tabs`      — switches content on the same page: role=tablist, roving tabindex, arrow keys (RTL-aware), Home/End.
 *  - `NavTabs`   — moves between pages: Next <Link>s with aria-current (no tab semantics).
 * `Chips` are toggle buttons (aria-pressed) for filters/sub-views.
 */
export type TabItem<K extends string> = { key: K; label: ReactNode; count?: ReactNode; ariaLabel?: string };

function rovingKeys(e: KeyboardEvent<HTMLElement>, count: number, index: number, go: (i: number) => void) {
  const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
  const next = rtl ? "ArrowLeft" : "ArrowRight";
  const prev = rtl ? "ArrowRight" : "ArrowLeft";
  let i = -1;
  if (e.key === next) i = (index + 1) % count;
  else if (e.key === prev) i = (index - 1 + count) % count;
  else if (e.key === "Home") i = 0;
  else if (e.key === "End") i = count - 1;
  if (i >= 0) { e.preventDefault(); go(i); }
}

export function Tabs<K extends string>({
  items, value, onChange, label, className, itemClassName, idBase, size,
}: { items: TabItem<K>[]; value: K; onChange: (k: K) => void; label: string; className?: string; itemClassName?: string; idBase?: string; size?: "sm" }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div role="tablist" aria-label={label} className={cx("f-seg", size === "sm" && "f-seg--sm", className)}>
      {items.map((t, i) => {
        const selected = t.key === value;
        return (
          <button
            key={t.key}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={idBase ? `${idBase}-tab-${t.key}` : undefined}
            aria-controls={idBase ? `${idBase}-panel-${t.key}` : undefined}
            aria-selected={selected}
            aria-label={t.ariaLabel}
            tabIndex={selected ? 0 : -1}
            className={cx("f-seg__item", "f-hit", itemClassName)}
            onClick={() => onChange(t.key)}
            onKeyDown={(e) => rovingKeys(e, items.length, i, (j) => { onChange(items[j].key); refs.current[j]?.focus(); })}
          >
            {t.label}{t.count != null && <> {t.count}</>}
          </button>
        );
      })}
    </div>
  );
}

export function NavTabs<K extends string>({
  items, value, label, className, itemClassName, size,
}: { items: (TabItem<K> & { href: string })[]; value: K; label: string; className?: string; itemClassName?: string; size?: "sm" }) {
  return (
    <nav aria-label={label} className={cx("f-seg", size === "sm" && "f-seg--sm", className)}>
      {items.map((t) => (
        <Link key={t.key} href={t.href} aria-label={t.ariaLabel} aria-current={t.key === value ? "page" : undefined} className={cx("f-seg__item", "f-hit", itemClassName)}>
          {t.label}{t.count != null && <> {t.count}</>}
        </Link>
      ))}
    </nav>
  );
}

export function Chips<K extends string>({
  items, value, onChange, label, className, soft, multi,
}: { items: TabItem<K>[]; value: K | K[]; onChange: (k: K) => void; label: string; className?: string; soft?: boolean; multi?: boolean }) {
  const on = (k: K) => (Array.isArray(value) ? value.includes(k) : value === k);
  return (
    <div role="group" aria-label={label} className={cx("f-chips", className)} data-multi={multi || undefined}>
      {items.map((t) => (
        <button key={t.key} type="button" aria-pressed={on(t.key)} aria-label={t.ariaLabel} onClick={() => onChange(t.key)} className={cx("f-chip", "f-hit", soft && "f-chip--soft")}>
          {t.label}{t.count != null && <> {t.count}</>}
        </button>
      ))}
    </div>
  );
}
