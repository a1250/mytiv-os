import type { ClientRef, Fact, IsoDateTime, Money, PersonId, SourceRef } from "./common";
import type { ApprovalStatus, ContentOrigin, RiskLevel } from "./status";

/** What an approval is about. Drives copy only — behaviour comes from `risk` and `execution`. */
export type ApprovalKind = "proposal_send" | "campaign_change" | "content" | "plan" | "reply" | "post";

export type ChangeRow = { what: string; before: string | null; after: string; emphasis?: "changed" | "warning" };

export type Reversibility =
  | { kind: "instant"; label: string }            // ↺ ביטול מיידי עד לפרסום
  | { kind: "until"; until: IsoDateTime; label: string }
  | { kind: "none"; label: string };              // irreversible external action

/**
 * An irreversible external action (high risk). Executing it always goes through the pre-execution summary:
 * extra checks + an explicit confirmation checkbox, then the red final button (prototype flow 6).
 * "Success" is shown only after the target system confirms (`target`).
 */
export type ExternalAction = {
  target: SourceRef;                       // e.g. Gmail · ron@demo.example
  /** sending account at the target */
  from: string;
  recipient: { name: string; address: string };
  payload: { title: string; detail: string; amount?: Money; attachment?: "pdf" };
  after: string;                           // what happens after execution
  checks: { id: string; text: string; tone: "ok" | "warning"; link?: string }[];
  confirmText: string;                     // the checkbox sentence
  finalLabel: string;                      // red button
  pendingLabel: string;                    // "ממתין ל־Gmail…"
  pendingNote: string;                     // what happens if the target does not answer
  successTitle: string;
  successDetail: string;
  failureTitle: string;
  failureDetail: string;
};

export type Approval = {
  id: string;
  kind: ApprovalKind;
  title: string;
  /** "UMINO · ערבי סושי של חמישי · שינוי בקמפיין" */
  context: string;
  client: ClientRef | null;
  /** short line under the title in lists ("UMINO · הצעה של AI · משפיע על מחיר") */
  summary: string;
  risk: RiskLevel;
  riskNote: string;                        // "דורש בדיקה" / "פעולה חיצונית שלא ניתן לבטל"
  status: ApprovalStatus;
  version?: number;
  origin: ContentOrigin;
  originLabel?: string;                    // "הוצע ע״י מנוע השיווק"
  requestedAt: IsoDateTime;                // waiting since
  trigger?: string;                        // "בעקבות הבריף מ־20.9"
  assigneeId?: PersonId;
  changes: ChangeRow[];
  why: string;
  facts: Fact[];
  impact: { effect: string; whyRisk: string; reversibility: Reversibility };
  history: { at: IsoDateTime; text: string }[];
  aiNote?: string;
  reasonHint?: string;                     // help text under the reason field
  managerNote?: string;                    // "רק בעלים יכול לאשר שינוי מחיר"
  /** one-line versions for the mobile summary (M3) */
  short?: { what: string; why: string };
  /** content items (D7, M8): the design under review and the reviewer's draft annotations */
  content?: ContentUnderReview;
  execution?: ExternalAction;
  /** demo-only: how the simulated target system answers */
  simulate?: { latencyMs: number; outcome: "success" | "failure" };
};

export type DecisionOutcome = "approve" | "request_changes" | "reject" | "defer";

export type Decision = {
  approvalId: string;
  outcome: DecisionOutcome;
  reason: string;
  decidedAt: IsoDateTime;
  decidedBy: PersonId;
};

/** Result of trying to record a decision — the UI shows `error` in place of the field help text. */
export type DecisionCheck = { ok: true } | { ok: false; field: "reason"; error: string };

/** A content item under review: previews per format + caption + the reviewer's pinned notes. */
export type ContentUnderReview = {
  designId: string;
  formats: { key: string; label: string; where: string }[];
  channel: string;
  scheduledAt: string;
  createdBy: string;
  editedBy: string;
  caption: { before: string; flagged: string; after: string };
  /** notes pinned to parts of the design (request-changes draft) */
  annotations: { id: string; n: number; target: string; text: string; format?: string }[];
  draftReason: string;
};
