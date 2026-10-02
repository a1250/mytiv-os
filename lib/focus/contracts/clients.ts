import type { ClientRef, Fact, IsoDate, IsoDateTime, Metric, PersonId } from "./common";
import type { Loadable } from "./loadable";
import type { ProjectSummary } from "./projects";
import type { ApprovalStatus, ContentOrigin } from "./status";

/**
 * Clients & projects area (handoff H1–H5): the project portfolio, a client page, the new-project wizard, a marketing
 * plan and the content work board. Types only — the demo data lives in lib/focus/fixtures/clients.ts.
 */

/* ---------- H1 · all projects ---------- */

/** Lifecycle phase used by the "מצב" filter (health is a separate axis). */
export type ProjectPhase = "planning" | "active" | "done";

/**
 * A project row in the portfolio. Health "at risk" / "attention" carry their reason in `health`; `healthNote` is the
 * written line for the other states, so every health pill is shown with a reason.
 */
export type PortfolioProject = Omit<ProjectSummary, "href"> & {
  phase: ProjectPhase;
  healthNote: string;
  /** retainer without a due date ("שוטף") — `dueDate` is then null on purpose, not unknown */
  ongoing?: boolean;
  /** the project environment page, when the demo has one; null = not built yet (shown as planned, never as "#") */
  href: string | null;
  /** where "+ משימה" opens the quick-create */
  taskHref: string;
  /** created in the wizard during this browser session (demo only — not on any server) */
  sessionOnly?: boolean;
};

/** Risk filter values, derived from health (never set by hand). */
export type PortfolioRisk = "high" | "medium" | "low" | "none";

/* ---------- H2 · client page ---------- */

export type ClientContact = { id: string; role: string; scope: string; email: string };

export type ConnectionState = "ok" | "expired" | "error";
export type ClientConnection = { id: string; label: string; detail: string; state: ConnectionState; since?: IsoDateTime };

export type BrainSummary = {
  verified: number;
  partial: number;
  missing: number;
  /** topics whose source changed after they were verified */
  stale: { id: string; text: string }[];
  updatedAt: IsoDateTime;
};

export type ClientProfile = {
  client: ClientRef;
  /** route segment (R.client(slug)) */
  slug: string;
  /** wordmark tile — brand colours are data, rendered inline */
  logo: { text: string; bg: string; fg: string };
  kind: string;
  since: IsoDate;
  primaryContact: string;
  ownerId: PersonId;
  contacts: Loadable<ClientContact[]>;
  brain: Loadable<BrainSummary>;
  connections: Loadable<ClientConnection[]>;
  results: Loadable<Metric[]>;
};

/* ---------- H3 · new project wizard ---------- */

export type WizardStepKey = "basics" | "goals" | "dates" | "budget" | "connections" | "summary";

export type MilestoneDraft = { id: string; title: string; date: IsoDate | "" };

export type NewProjectDraft = {
  clientId: string;
  name: string;
  goal: string;
  deliverables: string[];
  startDate: IsoDate | "";
  dueDate: IsoDate | "";
  ownerId: PersonId | "";
  teamIds: PersonId[];
  milestones: MilestoneDraft[];
  /** "" = not set yet (unknown, never 0) */
  hoursBudget: string;
  moneyBudget: string;
  connections: { clickup: boolean; meta: boolean };
};

/** A project created in the wizard. Lives only in this browser session — nothing is sent to a server. */
export type SessionProject = NewProjectDraft & { id: string; createdAt: IsoDateTime };

/* ---------- H4 · marketing plan ---------- */

export type PlanItem = { id: string; title: string; channels: string; metric: string; approval: ApprovalStatus };
export type PlanField = { key: "goal" | "audience" | "message" | "channels"; label: string; value: string };

export type MarketingPlan = {
  id: string;
  client: ClientRef;
  title: string;
  /** the approval this plan waits on (R.approval) */
  approvalId: string;
  status: ApprovalStatus;
  requestedAt: IsoDateTime;
  fields: PlanField[];
  items: PlanItem[];
  /** assumptions the plan relies on — production waits until they are verified */
  assumptions: Fact[];
  basis: { briefAt: IsoDate; brainOf: string; originLabel: string; origin: ContentOrigin };
  recipient: { name: string; email: string };
};

/* ---------- H5 · content work board ---------- */

export type ContentStage = "idea" | "planning" | "production" | "review" | "pending_approval" | "approved" | "scheduled" | "measured";

export type ContentItem = {
  id: string;
  title: string;
  format: string;
  stage: ContentStage;
  ownerId: PersonId | null;
  due: IsoDate | null;
  /** a line that replaces the date when it says more ("מתוך הזדמנויות", "ממתין לתזמון") */
  note?: string;
  origin: ContentOrigin;
  /** a blocked item always carries its reason */
  blockedReason?: string;
  approvalId?: string;
  href?: string;
};
