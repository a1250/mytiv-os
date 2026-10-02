import type { ReactNode } from "react";
import { cx } from "@/components/focus/ui/cx";
import { SegmentProgress } from "@/components/focus/ui/misc";

/**
 * Page frame + page header (handoff §6.4): date/crumb, title, a status sentence that starts with the conclusion
 * (≤20 words), an optional "טופלו X מתוך Y" progress, and one primary action. Viewers get a "צפייה בלבד" strip.
 */
export function Page({ children, className, width = "wide" }: { children: ReactNode; className?: string; width?: "wide" | "narrow" }) {
  return <div className={cx("f-page", width === "narrow" && "f-page--narrow", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow, title, status, progress, actions, aside, titleLevel = 1, size = "display", className,
}: {
  eyebrow?: ReactNode; title: ReactNode; status?: ReactNode; progress?: { done: number; total: number };
  actions?: ReactNode; aside?: ReactNode; titleLevel?: 1 | 2; size?: "display" | "entity" | "page"; className?: string;
}) {
  const H = titleLevel === 1 ? "h1" : "h2";
  return (
    <header className={cx("f-phead", className)}>
      <div className="f-phead__main">
        {eyebrow && <span className="f-phead__eyebrow">{eyebrow}</span>}
        <H className={cx("f-phead__title", `f-phead__title--${size}`)}>{title}</H>
        {status && <p className="f-phead__status">{status}</p>}
      </div>
      {aside}
      {progress && (
        <div className="f-phead__progress">
          <SegmentProgress total={progress.total} done={progress.done} label={`טופלו ${progress.done} מתוך ${progress.total}`} />
          <span className="f-meta" aria-hidden>טופלו {progress.done} מתוך {progress.total}</span>
        </div>
      )}
      {actions && <div className="f-phead__actions">{actions}</div>}
    </header>
  );
}

export function ViewOnlyStrip({ who }: { who: string }) {
  return (
    <div className="f-viewonly" role="note">
      <b>צפייה בלבד</b> אפשר לראות ולייצא. שינויים מתבצעים ע״י {who}.
    </div>
  );
}

/** Column / section heading with a count: "עכשיו  לפני 12:00 · 2". */
export function SectionHead({ title, count, note, tone, level = 2, size = "md", children, className }: {
  title: ReactNode; count?: number | string; note?: ReactNode; tone?: "risk"; level?: 2 | 3; size?: "md" | "sm" | "lg"; children?: ReactNode; className?: string;
}) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className={cx("f-shead", `f-shead--${size}`, className)}>
      <H className={cx("f-shead__title", tone === "risk" && "f-shead__title--risk")}>{title}</H>
      {(note != null || count != null) && <span className="f-shead__count">{note}{note != null && count != null ? " · " : ""}{count}</span>}
      {children}
    </div>
  );
}
