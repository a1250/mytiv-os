import type { IsoDateTime } from "./common";

/**
 * Settings (handoff H13 users & permissions, H14 business / AI / Brand Kit). Types only — fixtures in
 * lib/focus/fixtures/settings.ts. Saving is local to the demo; the real backend implements the same shapes.
 */

export type SettingsSection = "business" | "brand" | "users" | "ai" | "connections";
export type SettingsNavItem = { key: SettingsSection; label: string; href: string; count?: number; countLabel?: string };

/* ---------- users & permissions (H13) ---------- */

export type AccountRole = "owner" | "manager" | "viewer";

export type UserAccount = {
  id: string;
  name: string;
  initial: string;
  email: string;
  /** shown after the name ("רואת חשבון") */
  title?: string;
  /** grammatical gender for the role word (מנהל / מנהלת) */
  gender: "f" | "m";
  role: AccountRole;
  status: "active" | "invited" | "revoked";
  /** null = active right now */
  lastActiveAt: IsoDateTime | null;
  /** where "צפה בפעילות" leads */
  activityHref?: string;
};

/** A permission cell: always rendered as symbol + word. */
export type Permission = "yes" | "no" | "gated" | "own";
export type PermissionRow = { id: string; label: string; cells: Record<AccountRole, Permission> };

/* ---------- business, AI, Brand Kit (H14) ---------- */

export type BusinessSettings = {
  name: string;
  language: "he" | "en";
  timeZone: string;
  /** #rrggbb — used in proposals and exported reports */
  brandColor: string;
  ai: { drafts: boolean; suggestions: boolean };
};

export type AiProvider = { id: string; label: string; status: "connected" | "failed"; detail: string };

export type AiCapability = {
  key: keyof BusinessSettings["ai"] | "autoSend";
  label: string;
  help: string;
  /** false = the system does not support it at all (rendered as text, not a control) */
  available: boolean;
};

export type BrandKit = {
  clientId: string;
  clientName: string;
  colors: { hex: string; name: string }[];
  rows: { label: string; value: string }[];
  note: string;
  href?: string;
};
