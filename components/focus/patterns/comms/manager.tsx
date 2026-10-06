import type { ReactNode } from "react";
import type { ManagerTag } from "@/lib/focus/contracts/comms";
import { ApprovalPill, RiskPill, WorkStatusTag } from "@/components/focus/ui/status";

/**
 * Manager's-day card (handoff D8). Same anatomy and classes as the action card (patterns/action-card.tsx) — status,
 * waiting time, title, context, optional note, ONE action — but the status may be any family (approval / work / risk)
 * and the footer may be a button (assign, remind), not only a link. See the report: ActionCard could take `tag` +
 * `footer` slots and replace this.
 */
export function ManagerTagView({ tag }: { tag: ManagerTag }) {
  if (tag.family === "approval") return <ApprovalPill status={tag.status} size="sm" />;
  if (tag.family === "work") return <WorkStatusTag status={tag.status} />;
  return <RiskPill level={tag.level} />;
}

export function ManagerCard({ tag, waiting, title, context, note, footer, busy }: {
  tag: ManagerTag; waiting: string; title: string; context: string; note?: string; footer: ReactNode; busy?: boolean;
}) {
  return (
    <article className="f-acard f-cm-mcard" aria-busy={busy || undefined}>
      <div className="f-acard__top">
        <ManagerTagView tag={tag} />
        <span className="f-acard__wait">{waiting}</span>
      </div>
      <h3 className="f-acard__title">{title}</h3>
      <span className="f-acard__ctx">{context}</span>
      {note && <p className="f-cm-mcard__note">{note}</p>}
      {footer}
    </article>
  );
}
