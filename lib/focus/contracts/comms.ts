import type { ClientRef, IsoDateTime, Metric, Person, PersonId, SourceRef, SourceSystem } from "./common";
import type { Loadable } from "./loadable";
import type { ApprovalStatus, RiskLevel, Verification, WorkStatus } from "./status";

/**
 * Communication area (handoff F6 mail, H10 calendar, H15 notifications, D8 manager's day). Types only — fixtures in
 * lib/focus/fixtures/comms.ts, adapters map Gmail / Google Calendar / the notification feed onto these shapes.
 */

/* ---------- mail (F6) ---------- */

/** Filter chips over the thread list ("לא נקרא · משויך ללקוח · לידים"). */
export type MailFilter = "unread" | "client" | "lead";

/** What a thread is linked to in Mytiv. `none` = not linked yet ("לא משויך · שייך"). */
export type MailLink =
  | { kind: "lead"; label: string; href: string }
  | { kind: "client"; client: ClientRef; label: string; href: string }
  | { kind: "none" };

/** A claim inside an AI reply draft: the exact phrase that is highlighted + what it relied on. */
export type DraftClaim = {
  id: string;
  /** exact text inside the draft that is highlighted (if the user edits it away, the highlight disappears) */
  phrase: string;
  /** short label for the "על מה הטיוטה הסתמכה" list */
  label: string;
  verification: Verification;
  basis: string;
  source?: SourceRef;
};

/** AI reply draft. Never sent automatically: sending goes through review + explicit confirmation. */
export type ReplyDraft = { id: string; text: string; claims: DraftClaim[]; generatedAt: IsoDateTime };

export type MailContext = { title: string; meta: string; link?: { label: string; href: string } };

export type MailThread = {
  id: string;
  from: { name: string; address: string };
  subject: string;
  receivedAt: IsoDateTime;
  unread: boolean;
  /** newsletters and other low-signal mail render muted */
  muted?: boolean;
  link: MailLink;
  /** message lines as received (plain text) */
  body: string[];
  context: MailContext | null;
  /** the draft that is ready when the thread opens (null = none yet; "צור טיוטה" runs the AI job) */
  draft: ReplyDraft | null;
  /** what the AI job returns on "נסח מחדש" / "צור טיוטה", in order */
  alternates: ReplyDraft[];
};

export type Mailbox = {
  source: SourceRef;
  /** the account replies are sent from */
  account: { name: string; address: string };
  syncedAt: IsoDateTime;
  threads: Loadable<MailThread[]>;
};

/* ---------- calendar (H10) ---------- */

export type CalendarView = "day" | "week" | "month";
export type CalendarEventKind = "meeting" | "internal" | "deadline" | "scheduled_post";

export type CalendarEvent = {
  id: string;
  title: string;
  /** second line ("Meet · ליד"); for task deadlines it is derived from the live task when `taskId` is set */
  meta: string;
  start: IsoDateTime;
  end?: IsoDateTime;
  kind: CalendarEventKind;
  source: SourceSystem;
  href?: string;
  /** deadline backed by a Mytiv Work task — the assignee shown is read from the live task */
  taskId?: string;
  /** scheduled post backed by an approval — its state is read from the live approval */
  approvalId?: string;
  approval?: ApprovalStatus;
  /** created in this session (not synced to Google yet) */
  local?: boolean;
};

export type CalendarSync =
  | { state: "synced"; source: SourceRef; syncedAt: IsoDateTime; note: string }
  | { state: "failed"; source: SourceRef; since: IsoDateTime; reason: string };

/* ---------- notifications (H15) ---------- */

export type NotificationGroup = "action" | "update" | "done" | "connection";

export type NotificationItem = {
  id: string;
  group: NotificationGroup;
  title: string;
  /** area / client shown first in the meta line ("מכירות", "UMINO") */
  area: string;
  risk?: RiskLevel;
  at: IsoDateTime;
  /** "ago" → "לפני שעה"; "waiting" → "3 ימים" (how long it has been waiting) */
  timing: "ago" | "waiting";
  href: string;
  cta: "בדוק" | "פתח";
  read: boolean;
};

/* ---------- manager's day (D8) ---------- */

export type ManagerColumn = "now" | "today" | "others";

export type ManagerTag =
  | { family: "approval"; status: ApprovalStatus }
  | { family: "work"; status: WorkStatus }
  | { family: "risk"; level: RiskLevel };

export type ManagerAction =
  | { kind: "link"; label: string; href: string }
  /** assign the backing task to the manager (real, with undo) */
  | { kind: "assign_me"; label: string }
  /** in-app reminder to a colleague — confirmed before it is sent */
  | { kind: "remind"; label: string; personId: PersonId };

export type ManagerItem = {
  id: string;
  column: ManagerColumn;
  title: string;
  context: string;
  tag: ManagerTag;
  waitingSince: IsoDateTime;
  /** neutral note box ("שינוי מחיר דורש אישור בעלים…") */
  note?: string;
  taskId?: string;
  approvalId?: string;
  action: ManagerAction;
  primary?: boolean;
};

export type ManagerToday = {
  person: Person;
  /** a work source answered only partly: counts that depend on it are hidden until a full read */
  partial: { source: SourceRef; title: string; detail: string; retryMs: number } | null;
  items: Loadable<ManagerItem[]>;
  metrics: Loadable<Metric[]>;
  /** the reading that replaces the hidden one after a full read */
  fullRead: { metricId: string; metric: Metric };
  connection: { title: string; detail: string; href: string; linkLabel: string } | null;
  viewerPreview: { title: string; who: string; detail: string };
  allDonePreview: { title: string; headline: string; detail: string };
};
