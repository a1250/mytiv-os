import type { ReactNode } from "react";
import type { Loadable } from "@/lib/focus/contracts/loadable";
import { fmtDayMonth } from "@/lib/focus/format";
import { cx } from "./cx";
import { SYSTEM } from "./status";

/**
 * System states (§6.11): empty, skeleton, banners (unavailable / partial / error / stale / processing / done).
 * `LoadableView` is the single place a collection's state turns into UI — an error is never an empty list and an
 * unavailable source is never zero.
 */
export type BannerKind = "unavailable" | "partial" | "error" | "stale" | "processing" | "done" | "warning" | "loading";

const BANNER_GLYPH: Record<BannerKind, string> = {
  unavailable: SYSTEM.unavailable.glyph, partial: SYSTEM.partial.glyph, error: "!", stale: SYSTEM.stale.glyph,
  processing: SYSTEM.processing.glyph, done: "✓", warning: "◆", loading: "…",
};

/**
 * A banner is a polite status region: a banner that appears after an action is announced, one that is part of the
 * page as loaded is not read out (screen readers do not announce a status region's initial content — an `alert`
 * would be, on every page load). `live={false}` for a banner that receives focus itself (read from there, once).
 */
export function Banner({ kind, title, detail, action, className, live = true }: { kind: BannerKind; title: ReactNode; detail?: ReactNode; action?: ReactNode; className?: string; live?: boolean }) {
  const role = live ? "status" : undefined;
  return (
    <div role={role} className={cx("f-banner", `f-banner--${kind}`, className)}>
      <span className="f-banner__glyph" aria-hidden><span className={kind === "processing" ? "f-spin" : undefined}>{BANNER_GLYPH[kind]}</span></span>
      <span className="f-banner__body">
        <span className="f-banner__title">{title}</span>
        {detail && <span className="f-banner__detail">{detail}</span>}
      </span>
      {action}
    </div>
  );
}

export function EmptyState({ glyph = "○", title, hint, action, className }: { glyph?: ReactNode; title: ReactNode; hint?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("f-empty", className)}>
      <span className="f-empty__glyph" aria-hidden>{glyph}</span>
      <span className="f-empty__title">{title}</span>
      {hint && <span className="f-empty__hint">{hint}</span>}
      {action}
    </div>
  );
}

export function Skeleton({ h = 16, w = "100%", r, className }: { h?: number; w?: number | string; r?: number; className?: string }) {
  return <span aria-hidden className={cx("f-skel", className)} style={{ display: "block", height: h, width: w, borderRadius: r }} />;
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cx("f-card", "f-skelcard", className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} h={i === 0 ? 18 : 12} w={i === 0 ? "70%" : `${90 - i * 15}%`} />)}
    </div>
  );
}

/**
 * Render a Loadable. `ready` (and `partial`, with a banner) go to `children`; every other state has a distinct UI.
 * `skeleton` renders the loading state in the final structure.
 */
export function LoadableView<T>({
  value, children, skeleton, emptyAction, retry, label, compact,
}: {
  value: Loadable<T>; children: (data: T) => ReactNode; skeleton?: ReactNode; emptyAction?: ReactNode;
  retry?: ReactNode; label?: string; compact?: boolean;
}) {
  switch (value.state) {
    case "ready":
      return <>{children(value.data)}</>;
    case "partial":
      return <><Banner kind="partial" title={`${label ? `${label}: ` : ""}התקבל רק חלק מהנתונים.`} detail={`${value.missing} הספירות מוסתרות כדי לא להציג מספר חסר.`} />{children(value.data)}</>;
    case "loading":
      return <div role="status" aria-live="polite" aria-busy="true"><span className="f-sr">{value.label ?? "טוען…"}</span>{skeleton ?? <SkeletonCard />}</div>;
    case "empty":
      return <EmptyState title={value.title} hint={value.hint} action={emptyAction} className={compact ? "f-empty--compact" : undefined} />;
    case "error":
      return <Banner kind="error" title={value.message} detail={value.detail} action={value.retryable ? retry : undefined} />;
    case "unavailable":
      return <Banner kind="unavailable" title={value.reason} detail={value.since ? `הנתון האחרון התקבל ב־${fmtDayMonth(value.since)}.` : undefined} />;
    case "forbidden":
      return <Banner kind="unavailable" title="אין לך הרשאה לצפות בזה." detail={value.reason} />;
  }
}
