/**
 * Status language (handoff README → "שפת מצבים"). Every family has its own shape; colour never travels alone —
 * the UI always renders symbol + word (components/focus/ui/status.tsx). These are the only status vocabularies the
 * Focus UI accepts; adapters map backend values onto them.
 */

/**
 * Work state — rectangular tag (r:6). `unknown` = the source status could not be mapped safely (pkg1
 * WorkStatusCategory "unknown"): never counted as done or active, shown as unmapped, no action branches on it.
 */
export type WorkStatus = "todo" | "in_progress" | "waiting" | "blocked" | "done" | "cancelled" | "unknown";

/** Approval state — outlined pill. */
export type ApprovalStatus = "draft" | "pending" | "approved" | "changes_requested" | "rejected";

/** Risk level — filled pill; the symbol grows with risk. `connection` = a broken integration ("תקלת חיבור"). */
export type RiskLevel = "low" | "medium" | "high" | "connection";

/** Certainty of a number — a mark attached to the value: known `=`, estimated `≈`, unknown `—`. */
export type Certainty = "known" | "estimated" | "unknown";

/** Verification of a fact — the word "אומת" + outline. */
export type Verification = "verified" | "partial" | "unverified";

/** System state — banner / status line. */
export type SystemStatus = "loading" | "processing" | "done" | "failed" | "unavailable" | "partial" | "stale";

/** Content origin — AI tag. */
export type ContentOrigin = "original" | "ai_edited" | "ai_concept" | "ai_suggested";

/** Priority (Mytiv Work). */
export type Priority = "low" | "medium" | "high" | "urgent";

/** Risks that require a written reason before a decision is recorded (prototype flow 1). */
export const REASON_REQUIRED: ReadonlySet<RiskLevel> = new Set<RiskLevel>(["medium", "high"]);

/** Risks that may be approved with the quick "A" shortcut (handoff: "A מאשר מהר רק בסיכון נמוך"). */
export const QUICK_APPROVE: ReadonlySet<RiskLevel> = new Set<RiskLevel>(["low"]);
