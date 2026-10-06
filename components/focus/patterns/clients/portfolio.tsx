import Link from "@/components/focus/ui/link";
import type { ReactNode, SelectHTMLAttributes } from "react";
import type { PortfolioProject, PortfolioRisk } from "@/lib/focus/contracts/clients";
import type { HoursUse } from "@/lib/focus/contracts/projects";
import { fmtAgo, fmtDayMonth } from "@/lib/focus/format";
import { personName } from "@/lib/focus/fixtures/people";
import { cx } from "@/components/focus/ui/cx";
import { PlannedTag } from "@/components/focus/ui/status";
import { HealthPill } from "../project-card";

/**
 * Portfolio building blocks (handoff H1, H2): a project card with health + written reason, owner, due date, hours with
 * their certainty and "הבא"; the same data as a table row; and the pill-shaped filter select. Pure views.
 * (ProjectCardCompact is the dashboard tile; the portfolio card adds the client eyebrow, update time and actions.)
 */

/** Written reason for every health state — "בסיכון" never stands alone. */
export function healthReason(p: PortfolioProject): string {
  if (p.health.state === "at_risk" || p.health.state === "attention") return p.health.reason;
  if (p.health.state === "done") return `הושלם ב־${fmtDayMonth(p.health.at)}. ${p.healthNote}`.trim();
  return p.healthNote;
}

export function riskOf(p: PortfolioProject): PortfolioRisk {
  switch (p.health.state) {
    case "at_risk": return "high";
    case "attention": return "medium";
    case "on_track": return "low";
    case "done": return "none";
  }
}

const URGENCY = { at_risk: 0, attention: 1, on_track: 2, done: 3 } as const;
export const byUrgency = (a: PortfolioProject, b: PortfolioProject) =>
  URGENCY[a.health.state] - URGENCY[b.health.state] || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");

/** Hours vs budget with the certainty mark: "34/40 ש׳", "≈ 6 ש׳" (no budget). */
export function HoursText({ hours, className }: { hours: HoursUse; className?: string }) {
  return (
    <span className={cx("f-num", className)}>
      <span className="f-sr">שעות: </span>
      {hours.certainty === "estimated" && <><span aria-hidden>≈ </span><span className="f-sr">מוערך </span></>}
      {hours.budget != null ? `${hours.spent}/${hours.budget}` : hours.spent} ש׳
      {hours.budget == null && <span className="f-sr"> · ללא מכסה</span>}
    </span>
  );
}

export function dueText(p: PortfolioProject) {
  if (p.ongoing) return "יעד שוטף";
  return p.dueDate ? `יעד ${fmtDayMonth(p.dueDate)}` : "ללא יעד";
}

export function nextText(p: PortfolioProject) {
  if (!p.next) return "אין";
  return `${p.next.text}${p.next.due ? ` עד ${fmtDayMonth(p.next.due)}` : ""}`;
}

/** Project name — a link when the demo has the project's page. */
export function ProjectName({ p, className }: { p: PortfolioProject; className?: string }) {
  return p.href ? <Link href={p.href} className={cx("f-cl-plink", className)}>{p.name}</Link> : <span className={className}>{p.name}</span>;
}

export function ProjectActions({ p }: { p: PortfolioProject }) {
  return (
    <span className="f-cl-pcard__actions">
      <Link href={p.taskHref} className="f-cl-mini f-cl-mini--neutral" aria-label={`משימה חדשה ב${p.name}`}>+ משימה</Link>
      {p.href
        ? <Link href={p.href} className="f-cl-mini f-cl-mini--accent" aria-label={`פתח את ${p.name}`}>פתח</Link>
        : <span className="f-cl-pcard__planned"><span className="f-sr">עמוד הפרויקט </span><PlannedTag /></span>}
    </span>
  );
}

export function PortfolioCard({ p, now, headingLevel = 3 }: { p: PortfolioProject; now: string; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className={cx("f-cl-pcard", p.sessionOnly && "f-cl-pcard--session")}>
      <div className="f-cl-pcard__top">
        <div className="f-cl-pcard__titles">
          <span className="f-cl-pcard__client">{p.client.name}</span>
          <H className="f-cl-pcard__name"><ProjectName p={p} /></H>
        </div>
        <HealthPill health={p.health} />
      </div>
      <p className="f-cl-pcard__reason">{healthReason(p)}</p>
      <p className="f-cl-pcard__meta">
        <span>{personName(p.ownerId)}</span>
        <span>{dueText(p)}</span>
        <HoursText hours={p.hours} />
        <span className="f-num">{p.pendingApprovals} לאישור</span>
      </p>
      <p className="f-cl-pcard__next"><b>הבא:</b> {nextText(p)}</p>
      <div className="f-cl-pcard__foot">
        <span className="f-cl-pcard__upd">{p.sessionOnly ? "נשמר בדמו · לא בשרת" : `עודכן ${fmtAgo(p.updated.at, now)}`}</span>
        <ProjectActions p={p} />
      </div>
    </article>
  );
}

/** The portfolio as a table (desktop/tablet). Under 768px the caller shows cards instead. */
export function PortfolioTable({ projects, now, caption }: { projects: PortfolioProject[]; now: string; caption: string }) {
  return (
    <table className="f-cl-table f-cl-ptable">
      <caption className="f-sr">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">פרויקט</th><th scope="col">מצב</th><th scope="col">אחראי</th><th scope="col">יעד</th>
          <th scope="col">שעות</th><th scope="col">לאישור</th><th scope="col">הבא</th><th scope="col"><span className="f-sr">פעולות</span></th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <tr key={p.id}>
            <th scope="row" className="f-cl-ptable__name">
              <span className="f-cl-pcard__client">{p.client.name}</span>
              <ProjectName p={p} className="f-cl-ptable__title" />
            </th>
            <td><span className="f-cl-ptable__health"><HealthPill health={p.health} /><span className="f-cl-ptable__reason">{healthReason(p)}</span></span></td>
            <td>{personName(p.ownerId)}</td>
            <td className="f-num">{p.ongoing ? "שוטף" : p.dueDate ? fmtDayMonth(p.dueDate) : "ללא יעד"}</td>
            <td><HoursText hours={p.hours} /></td>
            <td className="f-num">{p.pendingApprovals}</td>
            <td className="f-cl-ptable__next">{nextText(p)}<span className="f-cl-ptable__upd">{p.sessionOnly ? "נשמר בדמו" : `עודכן ${fmtAgo(p.updated.at, now)}`}</span></td>
            <td><ProjectActions p={p} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Pill-shaped filter: a visible label and a native select (keyboard + screen readers for free). */
export function FilterSelect({ label, options, className, ...rest }: {
  label: ReactNode; options: { value: string; label: string }[]; className?: string;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={cx("f-cl-filter", rest.value && rest.value !== "all" && "f-cl-filter--on", className)}>
      <span className="f-cl-filter__label">{label}</span>
      <select {...rest} className="f-cl-filter__select">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="f-cl-filter__caret" aria-hidden>▾</span>
    </label>
  );
}
