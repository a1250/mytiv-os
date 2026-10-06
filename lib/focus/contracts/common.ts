import type { Verification } from "./status";

/** ISO-8601 timestamp ("2026-10-01T08:10:00+03:00"). Formatting to d.m.yyyy / 24h happens only in lib/focus/format. */
export type IsoDateTime = string;
/** ISO calendar date ("2026-10-08"). */
export type IsoDate = string;

export type PersonId = string;
export type Person = { id: PersonId; name: string; initial: string; email?: string; role?: "owner" | "manager" | "member" | "viewer" };

export type ClientRef = { id: string; name: string };
export type ProjectRef = { id: string; name: string; clientId: string };

/** Money in whole shekels (the handoff's agency works in ILS only). Rendered as "8,750 ₪". */
export type Money = { amount: number; currency: "ILS" };

/** Systems a fact or number can come from. */
export type SourceSystem =
  | "mytiv" | "clickup" | "gmail" | "google_calendar" | "google_meet" | "meta" | "instagram" | "facebook"
  | "bookings" | "studio" | "sales" | "business_brain" | "marketing_engine" | "ai" | "manual" | "menu";

export type SourceRef = { system: SourceSystem; label: string; href?: string; isSourceOfTruth?: boolean };

/** Freshness of a reading. `unavailable` means the source could not be read — never rendered as 0 or as an empty list. */
export type Freshness =
  | { state: "fresh"; updatedAt: IsoDateTime }
  | { state: "stale"; updatedAt: IsoDateTime }
  | { state: "unavailable"; since: IsoDateTime; reason: string };

/**
 * A number with source, freshness and certainty (handoff principle 4). The union makes "unknown is never 0" a type
 * rule: only `known` / `estimated` readings carry a value.
 */
export type Reading =
  | { kind: "known"; value: number }
  | { kind: "estimated"; value: number; basis: string }
  | { kind: "unknown"; reason: string }
  | { kind: "unavailable"; since: IsoDateTime; reason: string };

export type Metric = {
  id: string;
  label: string;
  reading: Reading;
  /** formatting of the value */
  unit?: "count" | "ils" | "hours" | "percent" | "ratio";
  /** e.g. "56/70" for hours vs budget; `total` is the denominator. */
  total?: number;
  delta?: { value: number; tone: "good" | "bad" | "neutral" };
  source: SourceRef;
  freshness?: Freshness;
  /** a short explanation shown under the value ("1 הצעה · טרם נשלחה") */
  note?: string;
  tone?: "default" | "risk";
};

/** A fact the AI or a person relied on, with its verification state. */
export type Fact = { id: string; text: string; verification: Verification; basis: string; source?: SourceRef };

