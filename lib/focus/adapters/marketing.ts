import type { RiskLevel } from "@/lib/focus/contracts/status";

/**
 * A C2a approval-queue item (Marketing OS contract, as imported into Mytiv) as Focus shows it, with the C2b decision
 * this app recorded for it, if any. Pure and client-safe.
 */
export type FocusMarketingApproval = {
  projectId: string; projectName: string; client: string | null; bindingVersion: number; sourceArtifactId: string; asOf: string;
  approvalId: string; contentHash: string; state: "pending" | "approved" | "rejected" | "expired" | "applied";
  title: string; why: string; actionType: string; actionClass: "GREEN" | "YELLOW" | "RED"; qaVerdict: "PASS" | "BLOCKED" | "NOT_RUN";
  rollbackNote: string; requestedChange: string | null; diffSummary: string | null; factsCited: string[];
  decision: { decision: "approved" | "rejected"; note: string; decidedAt: string; reconciledState: string | null } | null;
};

/** The engine's action class is its risk: GREEN low · YELLOW medium · RED high. */
export const riskOf = (c: FocusMarketingApproval["actionClass"]): RiskLevel => (c === "RED" ? "high" : c === "YELLOW" ? "medium" : "low");

/**
 * Where an item stands for the person deciding: waiting for a decision, decided here but not yet applied by the
 * engine (the next C2a export closes it), or settled by the engine itself.
 */
export function approvalPhase(a: FocusMarketingApproval): "pending" | "decided_awaiting_engine" | "approved" | "rejected" | "expired" | "applied" {
  if (a.state === "pending") return a.decision ? "decided_awaiting_engine" : "pending";
  return a.state;
}

/** The decision route refuses with these; the screen explains each in words. */
export const DECISION_REFUSAL: Record<string, string> = {
  stale_content_hash: "התוכן השתנה מאז שנטען. רעננו ובדקו את הגרסה החדשה לפני החלטה.",
  approval_not_pending: "הפריט כבר לא ממתין להחלטה.",
  stale_binding_version: "החיבור למנוע השיווק עודכן. רעננו את המסך.",
  already_recorded: "החלטה על הגרסה הזו כבר נרשמה.",
  request_already_claimed_check_audit_before_retry: "הבקשה כבר נשלחה. בדקו ביומן הפעולות לפני ניסיון נוסף.",
  approval_role_required: "רק בעלים או מנהל יכולים להחליט.",
  same_origin_required: "הבקשה נחסמה (מקור לא מוכר).",
  invalid_note: "חובה לכתוב נימוק.",
  marketing_unavailable: "מנוע השיווק לא זמין כרגע. דבר לא נרשם.",
  reconciliation_pending: "יש פעולה קודמת שתוצאתה עוד לא ידועה. בדקו ביומן הפעולות.",
};
