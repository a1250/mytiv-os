import type { ClientRef, IsoDate, IsoDateTime, Metric, PersonId, Reading } from "./common";
import type { Loadable } from "./loadable";
import type { RiskLevel, Verification } from "./status";

/**
 * Reports & control (handoff G1–G6): goals and performance, hours and profitability, the weekly review, the activity
 * log, the business brain and the connections settings. Types only — fixtures in lib/focus/fixtures/reports.ts.
 */

export type LinkRef = { label: string; href: string };

/**
 * "מגירת מקור הנתון" (G1): where a number comes from, when it was updated, how it is calculated and what is missing.
 * The certainty itself lives on the Reading; this is the explanation shown next to it.
 */
export type SourceDetail = {
  source: string;
  updated: { at: IsoDateTime; how: string } | null;
  calculation: string;
  missing: string | null;
  /** consequence of the missing part ("לא נכנס לסיכום הרבעוני כנתון סופי") */
  consequence?: string;
  verification: Verification;
  usedIn: LinkRef[];
  /** where the raw data can be opened; absent = no backend for it yet (rendered as planned) */
  fileHref?: string;
  /** when the source is broken: where to fix it */
  fix?: LinkRef;
  history: { at: IsoDateTime; text: string }[];
  /** whether asking the client for the value makes sense */
  canRequest: boolean;
};

/** A metric that has a source drawer. */
export type SourcedMetric = Metric & { detail: SourceDetail };

/** One row of the goals table. `target` is always known (it is set by the agency). */
export type GoalRow = SourcedMetric & { target: number; sourceState: Verification | "failed" };

export type ChartBar = { id: string; date: IsoDate; reading: Reading };

export type GoalsReport = {
  periodId: string;
  periodLabel: string;
  client: ClientRef;
  rows: GoalRow[];
  chart: { title: string; caption: string; metricId: string; bars: ChartBar[] };
};

export type ReportPeriod = { id: string; label: string };

/* ---------- G2 hours & profitability ---------- */

export type ProfitRow = {
  id: string;
  project: string;
  client: ClientRef;
  href?: string;
  hours: Reading;
  /** null = no hours budget set (never shown as 0%) */
  budgetHours: number | null;
  revenue: Reading;
  cost: Reading;
  gross: Reading;
  /** over-budget / at-risk explanation — a risk is always written with its reason */
  overrun: { level: RiskLevel; label: string; reason: string } | null;
};

export type ProfitReport = {
  periodLabel: string;
  rows: Loadable<ProfitRow[]>;
  estimateNote: { title: string; detail: string; missing: string[] };
  /** source drawers for the KPI tiles (keyed by KPI id) */
  details: Record<"hours" | "revenue" | "cost" | "gross", SourceDetail>;
};

/* ---------- G3 weekly review ---------- */

export type ReviewItemKind = "done" | "blocked" | "unavailable" | "estimated" | "info";

export type ReviewItem = { id: string; kind: ReviewItemKind; text: string; source?: LinkRef };

export type ReviewSection = {
  id: string;
  title: string;
  /** "data" = every line is linked to its source item; "ai" = suggested by AI and not verified */
  basis: "data" | "ai";
  verification: Verification;
  items: ReviewItem[];
};

export type WeeklyReview = {
  week: number;
  range: { from: IsoDate; to: IsoDate };
  createdAt: IsoDateTime;
  summary: { text: string; origin: "ai_suggested"; basis: string };
  sections: ReviewSection[];
  goals: ReviewItem[];
  method: { badge: "data" | "ai"; text: string }[];
  missing: ReviewItem[];
  previous: { week: number; savedBy: PersonId; savedAt: IsoDateTime }[];
};

/* ---------- G4 activity log ---------- */

export type ActivityCategory = "decision" | "external" | "ai" | "sync";

export type ActivityActor = { kind: "person"; personId: PersonId } | { kind: "system"; label: string } | { kind: "ai"; label: string };

export type ActivityReversal =
  | { kind: "undo"; label: string; undoneText: string }
  | { kind: "none"; why: string }
  | { kind: "retry"; label: string }
  | { kind: "open"; label: string; href: string };

export type ActivityEntry = {
  id: string;
  at: IsoDateTime;
  actor: ActivityActor;
  categories: ActivityCategory[];
  text: string;
  context: string;
  before: string | null;
  after: string | null;
  result: "done" | "failed";
  failure?: string;
  reversal: ActivityReversal;
  /** technical details, shown only under "פרטים מתקדמים" */
  tech: string;
  href?: string;
};

/* ---------- G5 business brain ---------- */

export type BrainSection = { id: string; label: string };

export type FactContentState = "ok" | "stale" | "missing";

export type BrainFact = {
  id: string;
  sectionId: string;
  title: string;
  /** null = no value yet ("— אין עדיין ערך"), never an empty string */
  value: string | null;
  contentState: FactContentState;
  verification: Verification;
  verificationLabel?: string;
  source: string | null;
  verifiedBy?: { personId: PersonId | null; label: string; at: IsoDateTime } | null;
  recheck: { date: IsoDate; why?: string } | null;
  usedIn: LinkRef[];
};

/* ---------- G6 connections ---------- */

export type ConnectionState = "connected" | "failed" | "not_connected";

export type Connection = {
  id: string;
  name: string;
  account: string;
  /** the account part that is an e-mail/handle (rendered in <bdi>) */
  handle?: string;
  scope: string;
  state: ConnectionState;
  lastSync: IsoDateTime | null;
  planned?: boolean;
  permissions: string;
  failure?: { since: IsoDateTime; reason: string; detail: string; affected: string; kept: string; affectedLinks: LinkRef[] };
  afterReconnect?: string[];
};
