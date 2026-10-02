import type { IsoDateTime, Metric, SourceRef } from "./common";
import type { Loadable } from "./loadable";
import type { ProjectSummary } from "./projects";
import type { RiskLevel } from "./status";
import type { MyTasksBuckets } from "./work";

/** Time columns (handoff: "עכשיו" until 12:00 or due today, "עד סוף היום", "השבוע"). Derived from `dueAt`, never set by hand. */
export type TimeColumn = "now" | "today" | "week";

/** An item that needs the viewer's action ("כרטיס פעולה"). */
export type ActionItem = {
  id: string;
  title: string;
  context: string;                 // client / project / lead
  why?: string;                    // why it matters (optional on compact cards)
  waitingSince: IsoDateTime;
  dueAt: IsoDateTime;
  risk: RiskLevel;
  action: { label: string; href: string };
  /** approval behind the card, if any (drives focus mode and quick-approve) */
  approvalId?: string;
};

export type StuckItem = { id: string; text: string; action?: { label: string; href: string } };

export type AgendaEvent = {
  id: string;
  start: IsoDateTime;
  end?: IsoDateTime;
  title: string;
  meta: string;
  kind: "meeting" | "internal" | "scheduled_post";
  status?: "pending_approval";
  join?: { label: string; href: string };
};

export type DayAgenda = { source: SourceRef; syncedAt: IsoDateTime; events: AgendaEvent[]; slots: string[] };

export type ResumeItem = { id: string; label: string; at: IsoDateTime; href: string };

export type TodayData = {
  viewer: { name: string };
  now: IsoDateTime;
  queue: Loadable<ActionItem[]>;
  stuck: Loadable<StuckItem[]>;
  agenda: Loadable<DayAgenda>;
  resume: ResumeItem[];
  work: Loadable<MyTasksBuckets>;
  projects: Loadable<ProjectSummary[]>;
  metrics: Loadable<Metric[]>;
};
