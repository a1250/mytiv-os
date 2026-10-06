import type { ClientRef, IsoDate, IsoDateTime, Metric, PersonId, SourceRef } from "./common";
import type { Loadable } from "./loadable";
import type { RiskLevel, WorkStatus } from "./status";

/** Project health. "at risk" always carries a written reason (handoff 6.8). */
export type ProjectHealth =
  | { state: "on_track" }
  | { state: "attention"; reason: string }
  | { state: "at_risk"; reason: string; blockers: number }
  | { state: "done"; at: IsoDate };

export type HoursUse = { spent: number; budget: number | null; certainty: "known" | "estimated" };

export type ProjectSummary = {
  id: string;
  name: string;
  client: ClientRef;
  ownerId: PersonId;
  dueDate: IsoDate | null;
  health: ProjectHealth;
  hours: HoursUse;
  pendingApprovals: number;
  /** "הבא" is always an action with a date */
  next: { text: string; due?: IsoDate } | null;
  updated: { at: IsoDateTime; source?: SourceRef };
  href: string;
};

export type Milestone = { id: string; title: string; date: IsoDate; state: "done" | "current" | "blocked" | "upcoming"; note?: string };

export type ProjectBlocker = { id: string; title: string; meta: string; risk: RiskLevel };
export type ProjectDecision = { id: string; title: string; meta: string; risk: RiskLevel; href: string };

export type ProjectArea = "overview" | "execution" | "marketing" | "knowledge";

export type ProjectDetail = ProjectSummary & {
  logo: string;                         // short wordmark on the tile
  areaCounts: Partial<Record<ProjectArea, number>>;
  statusLine: string;                   // "אחראית: דנה · יעד 8.10.2026 · עודכן לפני שעה"
  milestones: Loadable<Milestone[]>;
  nextAction: { label: string; title: string; detail: string; action: { label: string; href: string } } | null;
  blockers: Loadable<ProjectBlocker[]>;
  decisions: Loadable<ProjectDecision[]>;
  results: Loadable<Metric[]>;
  workStatusCounts?: Partial<Record<WorkStatus, number>>;
};
