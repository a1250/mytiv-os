import Link from "next/link";
import type { ProjectHealth, ProjectSummary } from "@/lib/focus/contracts/projects";
import { fmtDayMonth } from "@/lib/focus/format";
import { personName } from "@/lib/focus/fixtures/people";
import { cx } from "@/components/focus/ui/cx";

/**
 * Project card (handoff §6.8): health with a written reason ("בסיכון" never stands alone), owner, due date, hours vs
 * budget, and "הבא" — always an action with a date. Health speaks the status language (symbol + word).
 */
export const HEALTH: Record<ProjectHealth["state"], { glyph: string; word: string; tone: "high" | "medium" | "low" | "neutral" }> = {
  at_risk: { glyph: "▲", word: "בסיכון", tone: "high" },
  attention: { glyph: "◆", word: "דורש מעקב", tone: "medium" },
  on_track: { glyph: "●", word: "תקין", tone: "low" },
  done: { glyph: "✓", word: "הושלם", tone: "low" },
};

export function HealthPill({ health, withBlockers, size = "sm" }: { health: ProjectHealth; withBlockers?: boolean; size?: "sm" | "xl" }) {
  const h = HEALTH[health.state];
  const tone = h.tone === "neutral" ? "connection" : h.tone;
  return (
    <span className={cx("f-risk", `f-risk--${tone}`, size === "xl" && "f-risk--xl")}>
      <span aria-hidden>{h.glyph}</span>{h.word}{withBlockers && health.state === "at_risk" ? ` · ${health.blockers} חסימות` : ""}
    </span>
  );
}

export function ProjectCardCompact({ p }: { p: ProjectSummary }) {
  const reason = p.health.state === "at_risk" || p.health.state === "attention" ? p.health.reason : null;
  return (
    <article className="f-pcard f-panel">
      <div className="f-pcard__top">
        <h3 className="f-pcard__title"><Link href={p.href} className="f-pcard__link">{p.client.name} · {p.name}</Link></h3>
        <HealthPill health={p.health} />
      </div>
      {reason && <span className="f-pcard__reason">{reason}</span>}
      <div className="f-pcard__meta">
        <span>{personName(p.ownerId)}</span>
        {p.dueDate && <span>יעד {fmtDayMonth(p.dueDate)}</span>}
        <span className="f-num">{p.hours.certainty === "estimated" ? "≈ " : ""}{p.hours.spent}/{p.hours.budget ?? "—"} שעות</span>
      </div>
      {p.next && <span className="f-pcard__next"><b>הבא:</b> {p.next.text}{p.next.due ? ` עד ${fmtDayMonth(p.next.due)}` : ""}</span>}
    </article>
  );
}
