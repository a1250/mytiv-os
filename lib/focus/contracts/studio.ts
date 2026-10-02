import type { IsoDateTime } from "./common";
import type { ContentOrigin } from "./status";

/**
 * Studio (handoff Desktop 2, §6.12): formats in plain language (not dimensions), safety zones, brand kit, layers,
 * pre-approval checks (a warning never blocks; only an error blocks export), anchored comments and versions.
 */
export type FormatKey = "story" | "post" | "square" | "banner" | "carousel" | "custom";

export type FormatDef = { key: FormatKey; label: string; hint: string; ratio: { w: number; h: number } };

export type BrandKit = { client: string; colors: { hex: string; label: string }[]; font: string; tone: string };

export type LayerKind = "headline" | "text" | "button" | "logo" | "image" | "background";

/** A layer in design coordinates (the format's base size, e.g. 360×640 for a story). */
export type Layer = {
  id: string;
  kind: LayerKind;
  label: string;
  visible: boolean;
  locked: boolean;
  text?: string;
  box: { top?: number; bottom?: number; inline: number; inlineEnd?: number; height?: number; width?: number };
  style: { size?: number; weight?: number; color?: string; bg?: string; lineHeight?: number; tracking?: string; pill?: boolean; pattern?: [string, string] };
  /** brand-kit requirement ("הלוגו נדרש בכל סטורי") */
  required?: boolean;
};

export type SafeZone = { edge: "top" | "bottom"; height: number; label: string };

export type FormatVariant = { format: FormatKey; base: { w: number; h: number }; background: string; layers: Layer[]; safeZones: SafeZone[] };

export type DesignCheck =
  | { id: string; level: "error"; text: string }
  | { id: string; level: "warning"; text: string; fix?: { label: string; layerId: string } }
  | { id: string; level: "info"; text: string }
  | { id: string; level: "pass"; text: string };

export type DesignComment = { id: string; author: string; target: string; text: string; resolvedIn?: number };

export type Design = {
  id: string;
  title: string;
  client: string;
  campaign: string;
  origin: ContentOrigin;
  originLabel: string;
  version: number;
  savedAt: IsoDateTime;
  variants: FormatVariant[];
  brand: BrandKit;
  checks: DesignCheck[];
  comments: DesignComment[];
  versions: { n: number; note: string }[];
};

/** Brief for new content (handoff E3): required message + CTA; "must appear" and "must not invent" lists. */
export type Brief = {
  client: string;
  campaign: string;
  goal: string;
  audienceAction: string;
  formats: FormatKey[];
  message: string;
  secondary: string;
  cta: string;
  promo: { text: string; verified: string | null } | null;
  language: "he" | "en";
  mustInclude: string[];
  mustNotInvent: string[];
  materialsNote: string;
};

/** A creative direction produced by the (simulated) AI step (handoff E4). */
export type Direction = { id: string; name: string; headline: string; basis: string; durationMs: number; outcome: "success" | "failure"; style: "typographic" | "direct" | "photo" };
