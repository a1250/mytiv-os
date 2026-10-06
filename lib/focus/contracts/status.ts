/**
 * Status language (handoff README → "שפת מצבים"). Every family has its own shape; colour never travels alone —
 * the UI always renders symbol + word (components/focus/ui/status.tsx). These are the only status vocabularies the
 * Focus UI accepts; adapters map backend values onto them.
 */

/**
 * Work state — rectangular tag (r:6). `WorkStatus` is the canonical, storable status (pkg1 WorkStatusCategory): the
 * only values a task holds and a write may set. `unknown` = the source status could not be mapped safely: never
 * counted as done or active, shown as unmapped, no action branches on it.
 *
 * "blocked" is NOT a status (pkg1 has no blocked category). It is derived for display — `WorkDisplayStatus` — from
 * an open dependency, or from a manual block = status `waiting` + a written `blockedReason` (pkg1: a business status
 * key under category `waiting`). See `displayStatus()` in lib/focus/state/work.ts.
 */
export type WorkStatus = "todo" | "in_progress" | "waiting" | "done" | "cancelled" | "unknown";
export const WORK_STATUSES: readonly WorkStatus[] = ["todo", "in_progress", "waiting", "done", "cancelled", "unknown"];
/** What the UI shows for a task: its canonical status, or "blocked" when derived. Never stored, never written. */
export type WorkDisplayStatus = WorkStatus | "blocked";

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
