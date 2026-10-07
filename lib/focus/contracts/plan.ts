import type { ClientRef, IsoDate, PersonId, Reading } from "./common";
import type { ContentOrigin } from "./status";

/**
 * Plan (Mytiv Plan — Product Model Specification, final): the orchestration layer. One record per client per period
 * (V1: a calendar month) that says what the client promotes, for what result, through which moves, with what budget,
 * and what is missing. Types only — the demo data lives in lib/focus/fixtures/plan.ts, the rules in
 * lib/focus/state/plan.ts.
 *
 * Mytiv is the system of record for Client, Priority, Goal, Plan, Move, the asset index and Recommendation state;
 * Marketing OS proposes. The H4 `MarketingPlan` (contracts/clients.ts) is the client-facing approval document of a
 * Plan; the E1 `Campaign` (contracts/marketing.ts) is the detail page of a Move and links back to its Priority + Goal.
 */

/* ---------- client ---------- */

/** A real domain object: Plan, Priorities, Assets and the Business Brain belong to a client. Projects stay in Work. */
export type Client = ClientRef & { slug: string };

/* ---------- lifecycle ---------- */

/**
 * The one lifecycle every move has (spec §8). Not every move passes through every state. "Needs attention" and
 * "optimization in progress" are NOT states — they are overlays on a move (`attention`, `optimizing`).
 */
export type MoveState = "idea" | "planned" | "building" | "waiting_approval" | "approved" | "live" | "paused" | "ended";

export type MoveType = "paid_search" | "paid_social" | "organic_series" | "outreach" | "crm_sequence" | "event" | "partnership";
export type Channel = "google" | "meta" | "linkedin" | "instagram" | "whatsapp" | "email" | "website" | "offline";

/** Health is a derived signal, shown as a word; the 0–100 score is drill-down only. `unknown` without channel data. */
export type Health = "good" | "attention" | "unknown";

/* ---------- priority + goal ---------- */

/** What the result is measured in. `ils` goals are money; every other unit is a count. */
export type GoalUnit = "qualified_leads" | "bookings" | "ils" | "orders" | "clients";

/** How directly the current value is measured (today's T1–T3 tiers in plain words). */
export type Directness = "direct" | "assisted" | "estimated";

export type Goal = {
  id: string;
  priorityId: string;
  metricLabel: string;
  unit: GoalUnit;
  target: number;
  /** what actually happened so far — known / estimated / unknown, never 0 when unknown */
  actual: Reading;
  /** where the number comes from; null = no measurement source (the goal shows unknown) */
  source: { label: string; directness: Directness } | null;
};

export type PriorityStatus = "on_track" | "at_risk" | "off_track" | "unknown";

export type Priority = {
  id: string;
  clientId: string;
  name: string;
  /** one word for alert pills ("אירועים", "שקיעה") */
  shortName: string;
  description: string;
  /** Brain offer this priority sells; `publishable: false` blocks paid promotion */
  offer: { label: string; publishable: boolean; reason?: string };
  ownerId: PersonId;
  /** why now — evidence with its source (drill-down) */
  whyNow: string;
  channels: Channel[];
};

/* ---------- plan ---------- */

export type PlanState = "draft" | "in_approval" | "approved" | "in_progress" | "closed";

/** The plan of one active Priority inside a period's Plan. A Priority belongs to at most one active Plan at a time. */
export type PriorityPlan = {
  priorityId: string;
  /** 1 = wins budget and attention conflicts */
  rank: number;
  goal: Goal;
  /** secondary goals (drill-down only) */
  secondaryGoals: string[];
  allocation: number;
  status: PriorityStatus;
  /** the status reason, always in words */
  statusReason: string;
  /** a short status reason for the mobile card */
  statusReasonShort?: string;
  moveIds: string[];
  /** plan needs: a coverage gap or a planned move with nothing built */
  needs: PlanNeed[];
  changeLog: { at: IsoDate; text: string }[];
};

export type PlanPeriod = { kind: "month"; month: string /* "2026-10" */ };

export type Plan = {
  id: string;
  client: Client;
  period: PlanPeriod;
  state: PlanState;
  total: number;
  priorities: PriorityPlan[];
  /** holidays, seasons, launches on the timeline (C14 themes, demoted) */
  moments: { id: string; day: number; label: string; strong?: boolean }[];
  nextReview: { day: number; label: string };
};

/** A gap the Plan must close: expected contributions below the goal, or a measurement source missing. */
export type PlanNeed = {
  id: string;
  priorityId: string;
  kind: "coverage_gap" | "no_measurement";
  /** amount short, in the goal's unit (coverage gaps only) */
  short?: number;
  title: string;
  detail: string;
};

/* ---------- moves ---------- */

export type MoveBudget = {
  planned: number;
  /** null = nothing committed yet (planned / building) */
  committed: number | null;
  spent: Reading | null;
  /** manual entry date when spend was typed in */
  manualAt?: IsoDate;
};

export type Move = {
  id: string;
  priorityId: string;
  /** a move serves exactly ONE goal of its ONE priority */
  goalId: string;
  /** short name (map, budget) */
  name: string;
  /** the name with its type or channel (overview, timeline): "פנייה יזומה · LinkedIn" */
  longName: string;
  /** the specific word the interface uses for the type (קמפיין ממומן, סדרת תוכן, פנייה יזומה…) */
  typeLabel: string;
  /** the second line under the name in the map ("קמפיין ממומן", "אורגני · Instagram") */
  sub: string;
  type: MoveType;
  channel: Channel;
  channelLabel: string;
  state: MoveState;
  /** overlay: needs attention, with the reason in words */
  attention: string | null;
  /** activity detail: an accepted change being applied (live moves only) */
  optimizing: string | null;
  health: Health;
  /** health score 0–100 — drill-down only */
  healthScore: number | null;
  /** expected contribution in the goal's unit */
  expected: number;
  /** actual contribution so far */
  actual: Reading | null;
  budget: MoveBudget;
  /** day of month the move starts / launches (planned and building moves) */
  startDay?: number;
  /** day of month building starts (planned moves) */
  buildStartDay?: number;
  mainIssue: string | null;
  recommendationId: string | null;
  /** the builder that builds it, when one exists */
  builderId?: string;
  /** a line in the overview's "missing / awaiting" column */
  overviewNote?: string;
  ownerId: PersonId;
};

/* ---------- recommendations ---------- */

/** Where a recommendation goes: to the owner of what it changes (spec §4 rule 3). */
export type RecommendationRoute = "plan" | "marketing" | "work";

export type Recommendation = {
  id: string;
  moveId: string;
  text: string;
  route: RecommendationRoute;
  evidence: string;
  /** the tasks accepting it creates (previewed before they are created; owner and dates editable) */
  tasks: { title: string; ownerId: PersonId; dueDay: number }[];
};

/* ---------- assets ---------- */

/** Asset availability — three distinct words; "awaiting approval" is never merged with "missing". */
export type AssetAvailability = "approved" | "awaiting_approval" | "missing";

export type CoverOption = "existing" | "generate" | "ai_client" | "request" | "upload";

export type ContentRequirement = {
  id: string;
  priorityId: string;
  moveId: string;
  title: string;
  /** the short words used in the plain-language gap line ("סרטון המלצה") */
  gapLabel: string;
  /** the move or slot it serves ("Meta לידים", "Google Search · תוספי תמונה") */
  forLabel: string;
  spec: string;
  neededByDay: number | null;
  /** one slot per asset the requirement needs, each with its availability */
  slots: AssetAvailability[];
  /** builder creatives this requirement is made of — their approval state is the slots' state */
  creativeIds?: string[];
  /** live = already running ("פעיל") instead of a needed-by date */
  live?: boolean;
  /** Brain rule that blocks generating a new asset (e.g. testimonials must be real) */
  generateBlockedReason?: string;
  existingCandidates: { id: string; label: string; format: string; note: string }[];
  recommended?: CoverOption;
  aiClientNote?: string;
  requestNote?: string;
};

export type AssetSummary = {
  priorityId: string;
  total: number;
  active: number;
  scheduled: number;
  fatigue?: string;
  rightsNote?: string;
};

/** A creative inside a builder (Meta creative strip). */
export type Creative = { id: string; label: string; origin: Extract<ContentOrigin, "original" | "ai_edited">; availability: AssetAvailability };

/* ---------- timeline ---------- */

/** A flight bar: period context only (what is running / being built). Execution sits on exact days (`DayItem`). */
export type TimelineKind = "live" | "build" | "review" | "planned" | "waiting_flight";

export type TimelineItem = {
  id: string;
  moveId: string;
  kind: TimelineKind;
  startDay: number;
  endDay: number;
  label?: string;
  /** a bar that starts inside a week shows once on that day in the mobile agenda ("בנייה מתחילה") */
  agenda?: string;
};

/** Content and execution placed on one exact calendar day (a post, a send, a launch, a review…). */
export type DayItemType =
  | "post" | "story" | "reel" | "email" | "whatsapp"
  | "creative_due" | "approval_due" | "launch" | "campaign_review" | "optimization_review" | "creative_refresh"
  | "milestone" | "moment";

/** done = published / sent / completed (worded per type); blocked carries its reason. */
export type DayItemStatus = "planned" | "in_progress" | "ready" | "scheduled" | "done" | "blocked";

export type DayItem = {
  id: string;
  day: number;
  type: DayItemType;
  title: string;
  /** null = the whole plan (a business moment, the weekly review) */
  priorityId: string | null;
  /** the campaign / move it belongs to; null = the priority in general */
  moveId: string | null;
  status: DayItemStatus;
  blockedReason?: string;
  /** what must be true before this day: an asset requirement covered, an approval item completed */
  needs?: { requirementId?: string; approvalItemId?: string };
  /** added in this demo session (browser only) */
  added?: boolean;
};

/** A content-production row under a move, hidden by default (shown with a reason). */
export type ProductionRow = {
  moveId: string;
  startDay: number;
  endDay: number;
  label: string;
  warning: boolean;
  approvalDue: boolean;
  deadlineDay: number;
};

/** A channel option in the Create Move panel: why, how much it may bring, and the proposed move it creates. */
export type CreateMoveOption = {
  moveId: string;
  label: string;
  why: string;
  expected: number;
  cost: number;
  recommended?: boolean;
  /** the builder that prepares a full proposal; none = the move can only be saved as planned */
  builderId?: string;
  channelWord?: string;
};

export type CreateMoveNeed = {
  needId: string;
  title: string;
  lead: string;
  options: CreateMoveOption[];
  /** other move types without a builder yet (V1) */
  others: string[];
  inherited: { plan: string; brain: string; assets: string; earlier: string };
  autoFilled: { type: string; purpose: string; dates: string; owner: string };
  approvalNote?: string;
};

/* ---------- builders ---------- */

export type DecisionKey = "promote" | "result" | "audience" | "budget" | "acceptable";

export type BuilderDecision = {
  key: DecisionKey;
  label: string;
  value: string;
  detail?: string;
  chips?: string[];
  /** a warning line under the value (amber) */
  warn?: string;
};

export type BuilderDetail = { key: string; label: string; summary: string; problem?: string; lines: string[] };

export type BuilderProposal = {
  id: string;
  moveId: string;
  channel: "google" | "meta";
  title: string;
  /** the priority the move belongs to (breadcrumb) */
  priorityId: string;
  intro: string;
  decisions: BuilderDecision[];
  /** the "is the proposal acceptable?" summary + what was removed for not being verified in the Brain */
  summary: string;
  removedClaim?: string;
  budget: { amount: number; fromDay: number; toDay: number; fromUnallocated: boolean; /** cost per result range behind the expected range; null = no measurement source (the expectation is unknown) */
    costPerResult: { low: number; high: number } | null; resultWord: string };
  details: BuilderDetail[];
  /** the line under the budget decision when the money comes from inside the priority's allocation */
  budgetNote?: string;
  preview?: { url: string; headline: string; body: string; footer: string };
  creatives?: Creative[];
  creativeNote?: string;
  footerNote: string;
  sideNote?: string;
  /** the Brain does not clear the offer for paid promotion: "שלח לאישור" is unavailable until it is verified */
  blocked?: string;
  /** context lines the change panel shows (Plan / Brain / earlier move) */
  context: { plan: string; brain: string; earlier: string };
  launchDay: number;
  /** a pre-launch task created on "send for approval" (a missing tracking event) */
  preLaunchTask?: string;
};
