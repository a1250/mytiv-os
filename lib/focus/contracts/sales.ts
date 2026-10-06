import type { IsoDate, IsoDateTime, Money, PersonId, Reading } from "./common";
import type { Loadable } from "./loadable";
import type { Verification } from "./status";

/**
 * Sales (handoff F1–F4, H8, H9, mobile M7): leads, the lead page, the proposal editor, outreach with a fact check,
 * lead discovery and the proposals list. Types only — the demo data lives in fixtures/sales.ts.
 */

/** Pipeline stage of a lead. A label, not a status family: rendered as a plain tag with its word. */
export type LeadStage = "new" | "in_progress" | "waiting" | "meeting" | "proposal_sent" | "won" | "lost";

/** "הפעולה הבאה" — always a concrete step; `due` is optional ("אמת איש קשר"). */
export type LeadNext = { text: string; due: IsoDate | null };

/** How complete / verified the lead's details are ("✓ מלא", "◑ חסר טלפון", "○ לא מאומת"). */
export type DataQuality = { state: Verification; label: string };

export type Lead = {
  id: string;
  name: string;
  company: string;
  source: string;
  stage: LeadStage;
  /** owner's estimate (≈), a known amount after a proposal, or unknown ("—", never 0) */
  value: Reading;
  ownerId: PersonId;
  /** null on an open lead = "ללא פעולה הבאה" (shown in red with an action to add one) */
  next: LeadNext | null;
  lastContact: IsoDateTime | null;
  createdAt: IsoDateTime;
  quality: DataQuality;
  email?: string;
  /** the lead page, when one exists */
  href: string | null;
};

export type LeadFilter = "all" | LeadStage | "no_next";
export type LeadSort = "activity" | "next" | "value" | "name";

/* ---------- lead page (F2, M7 phone 2) ---------- */

export type TimelineKind = "meeting" | "email" | "note" | "system";

export type TimelineEvent = {
  id: string;
  kind: TimelineKind;
  at: IsoDateTime;
  title: string;
  /** system / channel the event came from ("Google Meet", "Gmail", "טופס באתר") */
  source?: string;
  meta?: string;
  text?: string;
  /** the text is a quote from the lead */
  quote?: boolean;
  authorId?: PersonId;
  link?: { label: string; href: string };
  /** one-line version for the mobile timeline */
  short?: string;
};

export type NeedValue = { kind: "text"; text: string } | { kind: "unknown"; reason: string };

export type ContactSuggestion = {
  id: string;
  name: string;
  role: string;
  source: string;
  confidence: Confidence;
  /** a guessed address is never shown as a fact */
  contact: { text: string; verification: Verification; basis: string };
};

export type LeadDetail = {
  leadId: string;
  initials: string;
  headline: string;
  /** shorter headline for the phone header */
  shortHeadline: string;
  next: { title: string; due: IsoDate; requestedAt: IsoDateTime; meetingAt: IsoDateTime };
  contact: { email: string; phone: string; company: string; verification: DataQuality };
  need: { label: string; value: NeedValue }[];
  timeline: Loadable<TimelineEvent[]>;
  proposalId: string | null;
  /** the background search "מצא איש קשר" returns these (demo) */
  suggestions: ContactSuggestion[];
  searchMs: number;
};

/* ---------- proposal editor (F3) ---------- */

export type ProposalLine = { id: string; name: string; note: string; qty: number; unit: number };

export type ProposalTemplate = { id: string; label: string; lines: ProposalLine[]; notes: string };

export type ProposalVersion = { n: number; status: "draft" | "sent"; byId: PersonId; at: IsoDateTime };

export type ProposalDraft = {
  id: string;
  number: string;
  leadId: string;
  clientName: string;
  templateId: string;
  createdAt: IsoDateTime;
  validityDays: number;
  vatRate: number;
  lines: ProposalLine[];
  notes: string;
  versions: ProposalVersion[];
  savedAt: IsoDateTime;
  /** the brand tile on the PDF (data-driven colours) */
  brand: { label: string; bg: string; fg: string };
  /** the approval that sends this proposal (pre-execution summary) */
  approvalId: string;
};

/* ---------- proposals list (H9) ---------- */

export type ProposalStatus = "draft" | "pending" | "sent" | "accepted" | "declined" | "expired";

/** Whether the client opened it — only when the system knows (document link). Otherwise "לא ידוע". */
export type ProposalView =
  | { kind: "none" }
  | { kind: "unknown"; sentAt: IsoDateTime }
  | { kind: "viewed"; at: IsoDateTime; responded: false }
  | { kind: "accepted"; at: IsoDateTime };

export type ProposalSummary = {
  id: string;
  number: string;
  client: string;
  subject: string;
  amount: Money;
  status: ProposalStatus;
  createdAt: IsoDateTime;
  validUntil: IsoDate | null;
  view: ProposalView;
  followUp: IsoDate | null;
  /** the editor, when one exists */
  href: string | null;
  /** live status comes from this approval (demo store) */
  approvalId?: string;
};

/* ---------- outreach (F4) ---------- */

export type OutreachPurpose = "first" | "followup" | "linkedin" | "partnership";
export type OutreachTone = "formal" | "warm" | "light";

/** A claim in the draft that could not be verified, with the fixes the reviewer can apply. */
export type OutreachClaim = {
  id: string;
  quote: string;
  level: "medium" | "high";
  title: string;
  message: string;
  fixes: { label: string; find: string; replace: string }[];
};

export type OutreachData = {
  leadId: string;
  to: { name: string; company: string; email: string };
  purposes: { key: OutreachPurpose; label: string }[];
  tones: { key: OutreachTone; label: string }[];
  defaults: { purpose: OutreachPurpose; tone: OutreachTone };
  subjects: Record<OutreachPurpose, string>;
  greetings: Record<OutreachTone, string>;
  bodies: Record<OutreachPurpose, string>;
  closings: Record<OutreachTone, string>;
  claims: OutreachClaim[];
  /** spans the draft took from verified sources */
  verified: { quote: string; basis: string }[];
  basis: { text: string; verification: Verification }[];
  noUse: string;
  steps: string[];
  redraftMs: number;
};

/* ---------- lead discovery (H8) ---------- */

export type Confidence = "high" | "medium" | "low";

export type DiscoveryContact =
  | { kind: "found"; text: string; source: string }
  | { kind: "estimated"; text: string; basis: string }
  | { kind: "none" }
  | { kind: "existing"; leadId: string; leadName: string };

export type DiscoveryResult = {
  id: string;
  name: string;
  meta: string;
  category: string;
  sources: string[];
  contact: DiscoveryContact;
  confidence: Confidence;
  /** what "מצא איש קשר" returns (demo) */
  guess?: DiscoveryContact;
};

export type DiscoveryData = {
  categories: { value: string; label: string }[];
  last: { query: string; category: string; ranAt: IsoDateTime };
  results: DiscoveryResult[];
  searchMs: number;
  contactMs: number;
};
