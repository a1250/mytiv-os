import type { ClientRef, IsoDate, IsoDateTime, Metric, PersonId, Reading } from "./common";
import type { Loadable } from "./loadable";
import type { ApprovalStatus } from "./status";
import type { FormatKey } from "./studio";

/**
 * Marketing & content (handoff H6, H7, H11, H12, E1, E2, E7). Types only — the UI contract the marketing engine,
 * the studio and the publishing adapter map onto. Live state (decisions, publishing jobs) stays in the demo store.
 */

/* ---------- H6 · inspiration & moodboards ---------- */
export type InspirationKind = "photo" | "poster" | "link";

export type InspirationItem = {
  id: string;
  kind: InspirationKind;
  /** what the placeholder stands for until the real image is loaded ("צילום מנה") */
  placeholder: string;
  title: string;
  clientId: string | null;
  tags: string[];
  /** card image height in px (masonry geometry, data-driven) */
  height: number;
  /** external source of a saved link */
  url?: string;
  boardIds: string[];
  addedAt: IsoDateTime;
};

/** A moodboard cover tile: a client brand colour (data), a theme tint, or a photo placeholder. */
export type MoodSwatch = { kind: "color"; hex: string; label: string } | { kind: "tint" } | { kind: "photo" };

export type Moodboard = {
  id: string;
  title: string;
  clientId: string | null;
  cover: MoodSwatch[];
  /** where the board is used as visual direction */
  usedIn?: { label: string; href: string };
};

export type InspirationFilter = { key: string; label: string; clientId?: string; tag?: string; counted: boolean };

/* ---------- H7 · opportunities & trends ---------- */
export type Confidence = "high" | "medium" | "low";

export type Opportunity = {
  id: string;
  source: string;
  publishedAt: IsoDateTime;
  title: string;
  /** "למה זה רלוונטי" — always written, never just a score */
  why: string;
  client: ClientRef;
  confidence: Confidence;
  /** what the confidence is based on */
  basis: string;
};

export type OpportunityFeed = { updatedAt: IsoDateTime; sourceCount: number; items: Loadable<Opportunity[]> };

/* ---------- H11 · brief analysis ---------- */
/** The original brief as segments; `extracted` marks what the analysis pulled out of it. */
export type BriefSegment = { text: string; extracted?: boolean };
export type BriefField = { id: string; label: string; value: string };

export type BriefAnalysis = {
  id: string;
  title: string;
  client: ClientRef;
  source: { label: string; at: IsoDateTime };
  segments: BriefSegment[];
  /** facts that appear in the brief ("= מופיע בבריף") — confirmed by a person before they are used */
  stated: BriefField[];
  /** AI conclusions — not in the brief, never shown as facts */
  inferred: BriefField[];
  missing: string[];
  conflicts: { id: string; text: string; reason: string }[];
  questions: string[];
};

/* ---------- H12 · prompt library ---------- */
export type PromptCategory = "image" | "text";
export type PromptOwner = { kind: "mine" } | { kind: "system" } | { kind: "person"; personId: PersonId };

export type PromptTemplate = {
  id: string;
  title: string;
  category: PromptCategory;
  owner: PromptOwner;
  favorite: boolean;
  version: number;
  savedAt: IsoDateTime;
  tool: string;
  output: string;
  goal: string;
  constraints: string[];
  checks: { id: string; text: string; done: boolean }[];
  /** the assembled prompt (English, LTR) */
  full: string;
  /** the AI's suggested improvement (shown as a diff before saving) */
  improved?: string;
};

/* ---------- E1 · campaign ---------- */
export type ContentThumb = { kind: "design"; designId: string; format: FormatKey } | { kind: "slides"; count: number } | { kind: "wide" } | { kind: "planned" };

/**
 * A row in the campaign's content plan. State comes from the approval (live, via the demo store) when there is one;
 * otherwise from `state`. A blocked row names the task it waits for (`taskId`): it is blocked exactly while that task is
 * open, and shows "בהפקה" once it closes.
 */
export type ContentPlanRow = {
  id: string;
  title: string;
  channels: string;
  ownerId: PersonId;
  version?: number;
  publishAt: IsoDateTime | IsoDate | null;
  thumb: ContentThumb;
  approvalId?: string;
  state: { kind: "approval"; status: ApprovalStatus } | { kind: "blocked"; taskId: string } | { kind: "idea" };
  href: string;
};

export type CampaignBrief = { label: string; value: string; note: string; verification?: "verified"; approvalId?: string };

export type Campaign = {
  id: string;
  name: string;
  /**
   * Plan links (Plan spec §8): the E1 campaign page is the detail page of a Move, which serves exactly one Priority
   * and one Goal of it. Optional while the E1 demo campaign predates a Plan record.
   */
  moveId?: string;
  priorityId?: string;
  goalId?: string;
  client: ClientRef;
  projectId: string;
  projectName: string;
  start: IsoDate;
  end: IsoDate;
  channels: string[];
  ownerId: PersonId;
  goal: CampaignBrief;
  audience: CampaignBrief;
  message: CampaignBrief;
  plan: Loadable<ContentPlanRow[]>;
  results: Loadable<Metric[]>;
  /** when the first results reading is expected (formatted relative to now) */
  firstDataAt: IsoDate;
  mediaBudget: Reading;
  log: { id: string; at: IsoDateTime; text: string }[];
};

/* ---------- E2 · studio home ---------- */
export type StudioStage = "draft" | "changes_requested" | "blocked" | "pending" | "approved" | "exported" | "scheduled" | "published";
export type StudioFilter = "drafts" | "pending" | "approved" | "out";

export type StudioItem = {
  id: string;
  title: string;
  client: ClientRef;
  format: FormatKey;
  stage: StudioStage;
  /** a short line under the title (e.g. why it waits) */
  note?: string;
  /** a blocked card waits for this task: blocked exactly while it is open */
  blockedByTaskId?: string;
  ownerId: PersonId;
  updatedAt: IsoDateTime;
  /** a design to render as the thumbnail (lib/focus/fixtures/studio) */
  designId?: string;
  thumbLabel?: string;
  href?: string;
};

export type StartFrom = { id: string; label: string; detail: string; href?: string };

export type RecentAsset = { id: string; label: string; swatch: MoodSwatch };

/* ---------- E7 · export & publish ---------- */
export type DownloadFormat = { format: FormatKey; label: string; files: string };

/** Meta scheduling — an external action: confirmed by a person, "scheduled" only after Meta answers. */
export type PublishPlan = {
  designId: string;
  approvalId: string;
  campaignId: string;
  formats: FormatKey[];
  downloads: DownloadFormat[];
  channels: { value: string; label: string }[];
  account: string;
  defaultAt: IsoDateTime;
  /** what still blocks scheduling, besides approval ("התמונה עדיין מקום שמור") */
  placeholder: { title: string; detail: string; taskId: string } | null;
  originNote: string;
  meta: {
    checks: { id: string; text: string; tone: "ok" | "warning" }[];
    after: string;
    finalLabel: string;
    pendingLabel: string;
    pendingNote: string;
    successTitle: string;
    successDetail: string;
    failureTitle: string;
    failureDetail: string;
    latencyMs: number;
  };
};
