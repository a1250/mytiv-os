import type { Approval, DecisionCheck, DecisionOutcome } from "@/lib/focus/contracts/approvals";
import { QUICK_APPROVE, REASON_REQUIRED, type RiskLevel } from "@/lib/focus/contracts/status";

/**
 * Approval rules (handoff prototype flows 1, 3, 5, 6) — pure and unit-tested.
 *  - A decision on a medium/high risk item is not recorded without a written reason.
 *  - Requesting changes or rejecting always needs a reason (it tells the author what to fix / why).
 *  - "Save for later" never needs one.
 *  - Quick approve ("A") exists only for low risk.
 *  - An item with an external, irreversible action never executes from the decision block: it goes through the
 *    pre-execution summary (see execution.ts).
 */
export function reasonRequired(risk: RiskLevel, outcome: DecisionOutcome): boolean {
  if (outcome === "defer") return false;
  if (outcome === "request_changes" || outcome === "reject") return true;
  return REASON_REQUIRED.has(risk);
}

export function checkDecision(approval: Pick<Approval, "risk">, outcome: DecisionOutcome, reason: string): DecisionCheck {
  if (reasonRequired(approval.risk, outcome) && reason.trim().length === 0) {
    const error = outcome === "approve"
      ? "יש לכתוב נימוק. ההחלטה עדיין לא נרשמה."
      : outcome === "request_changes" ? "יש לכתוב מה לתקן. שום דבר עדיין לא נשלח." : "יש לכתוב למה נדחה. ההחלטה עדיין לא נרשמה.";
    return { ok: false, field: "reason", error };
  }
  return { ok: true };
}

export const canQuickApprove = (a: Pick<Approval, "risk" | "execution">) => QUICK_APPROVE.has(a.risk) && !a.execution;

const RISK_RANK: Record<RiskLevel, number> = { high: 3, connection: 2, medium: 1, low: 0 };

/** Queue order: high risk first, then by when it must be decided (handoff D6: "סיכון גבוה קודם"). */
export function queueOrder<T extends { risk: RiskLevel; dueAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => RISK_RANK[b.risk] - RISK_RANK[a.risk] || a.dueAt.localeCompare(b.dueAt));
}
