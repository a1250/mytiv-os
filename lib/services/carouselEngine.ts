/**
 * Ported near-verbatim from the Electron app's src/services/carouselEngine.js
 * — pure deterministic content-generation logic, zero Electron dependency.
 * Claude upgrades would live in a server-side aiServices equivalent later
 * (same output shape), per the plan.
 */

export const ASPECTS: Record<string, { w: number; h: number; label: string }> = {
  "1:1": { w: 1080, h: 1080, label: "Square 1:1" },
  "4:5": { w: 1080, h: 1350, label: "Portrait 4:5" },
  "9:16": { w: 1080, h: 1920, label: "Story 9:16" },
};

export const TONES = [
  { id: "editorial", label: "Premium / editorial" },
  { id: "thought_leadership", label: "Sharp / thought leadership" },
  { id: "educational", label: "Educational" },
  { id: "trend_report", label: "Trend report" },
  { id: "bold", label: "Bold / provocative" },
  { id: "client_facing", label: "Client-facing" },
];

export const SOURCE_TYPES = [
  { id: "ai_radar_item", label: "AI Radar item" },
  { id: "manual_topic", label: "Manual topic" },
  { id: "inspiration_item", label: "Inspiration item" },
];

export const TEXT_POSITIONS = ["top_left", "top_center", "center", "bottom_left", "bottom_center"];
export const BACKGROUND_STYLES = ["gradient_blue", "gradient_black", "gradient_chartreuse", "image"];

export const ROLE_SEQUENCES: Record<number, string[]> = {
  3: ["hook", "insight", "takeaway"],
  4: ["hook", "context", "why_it_matters", "takeaway"],
  5: ["hook", "context", "insight", "application", "takeaway"],
};

export const ROLE_META: Record<string, { label: string }> = {
  hook: { label: "Cover / Hook" },
  context: { label: "Context" },
  insight: { label: "Key Insight" },
  why_it_matters: { label: "Why It Matters" },
  application: { label: "Mytiv Angle" },
  takeaway: { label: "Takeaway / CTA" },
};

type SourcePayload = Record<string, string>;
type NormalizedSource = { title: string; summary: string; why: string; action: string; category: string; tags: string; url: string; source: string };

export function normalizeSource(sourceType: string, payload: SourcePayload = {}): NormalizedSource {
  if (sourceType === "ai_radar_item") {
    return {
      title: payload.title || "",
      summary: payload.summary || "",
      why: payload.why_it_matters || "",
      action: payload.action_idea || "",
      category: payload.category || "",
      tags: payload.tags || "",
      url: payload.url || "",
      source: payload.source || "",
    };
  }
  if (sourceType === "inspiration_item") {
    return {
      title: payload.title || "",
      summary: payload.why_saved || payload.notes || "",
      why: payload.why_saved || "",
      action: "",
      category: payload.category || "",
      tags: payload.tags || "",
      url: payload.url || "",
      source: payload.source || "",
    };
  }
  return {
    title: payload.title || "",
    summary: payload.main_idea || payload.section_summary || "",
    why: payload.supporting_points || payload.key_takeaway || "",
    action: payload.cta || "",
    category: payload.category || "Business",
    tags: payload.tags || "",
    url: "",
    source: "",
  };
}

const short = (s: string | undefined, n: number) => {
  const clean = String(s || "").replace(/\s+/g, " ").trim();
  if (clean.length <= n) return clean;
  const cut = clean.slice(0, n);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), n - 12)) + "…";
};

const BG_BY_ROLE: Record<string, string> = {
  hook: "gradient_black",
  context: "gradient_blue",
  insight: "gradient_blue",
  why_it_matters: "gradient_blue",
  application: "gradient_chartreuse",
  takeaway: "gradient_black",
};

function slideText(role: string, s: NormalizedSource, tone: string, audience: string) {
  const aud = audience || "restaurant and hospitality owners";
  switch (role) {
    case "hook":
      return {
        headline: short(s.title, 64) || "The shift worth watching",
        subheadline: "",
        body_text: "",
        label: (s.category || "BUSINESS").toUpperCase(),
      };
    case "context":
      return {
        headline: "What happened",
        subheadline: "",
        body_text: short(s.summary || `${s.title} is changing how the business runs.`, 170),
        label: "CONTEXT",
      };
    case "insight":
      return {
        headline: "The real story",
        subheadline: "",
        body_text: short(s.why || "The tooling is now good enough to change budgets, timelines and team shape — not just experiments.", 170),
        label: "KEY INSIGHT",
      };
    case "why_it_matters":
      return {
        headline: "Why it matters",
        subheadline: "",
        body_text: short(s.why || `For ${aud}: faster iterations, lower cost, and a premium bar that keeps rising.`, 170),
        label: "WHY IT MATTERS",
      };
    case "application":
      return {
        headline: "The Mytiv angle",
        subheadline: "",
        body_text: short(s.action || "We fold this into real pipelines: AI where it accelerates, craft where it counts.", 170),
        label: "IN PRACTICE",
      };
    case "takeaway":
      return {
        headline: tone === "bold" ? "Move before it's obvious" : "The takeaway",
        subheadline: "",
        body_text: short(s.action || "Start small, ship one real piece, learn from it. That beats waiting.", 140),
        label: "TAKEAWAY",
        cta: "Follow Mytiv → @mytiv",
      };
    default:
      return { headline: "", subheadline: "", body_text: "", label: "" };
  }
}

function imagePrompt(role: string, s: NormalizedSource, aspect: string) {
  const base =
    "Premium dark editorial background visual, cinematic lighting, deep navy base with royal blue (#2563EB) atmosphere, subtle film grain, clean negative space reserved for overlay text, minimal composition, high-end business-tech mood. No text, no letters, no logos, no watermarks.";
  const byRole: Record<string, string> = {
    hook: `Abstract hero visual about "${s.title}": one strong central form (light beam / lens flare / liquid chrome), dramatic contrast,`,
    context: "Wide atmospheric scene suggesting a modern hospitality environment — soft volumetric light, out-of-focus screens or restaurant service tools,",
    insight: "Macro abstract detail — refractive glass or flowing particles implying data becoming imagery, shallow depth of field,",
    why_it_matters: "Split-tone gradient field with a single geometric accent shape, calm and confident,",
    application: "Human craft moment — hands, tools or light shaping a frame, tactile and human, indigo (#6366F1) accent as a thin light edge,",
    takeaway: "Minimal closing frame — near-black field with a soft blue horizon glow and one indigo accent line,",
  };
  return `${byRole[role] || ""} ${base} Aspect ratio ${aspect}, keep the ${role === "hook" ? "lower third" : "left half"} visually quiet for text overlay.`;
}

const NEGATIVE = "text, letters, words, typography, logos, watermarks, clutter, busy composition, cartoon, low quality, oversaturated, generic stock look, distorted shapes";

const VISUAL_DIRECTION: Record<string, string> = {
  hook: "Full-bleed dark hero. Headline dominates, indigo label above. Quiet lower third.",
  context: "Blue atmospheric field, text block on the left, generous margins.",
  insight: "Macro abstract detail as texture; headline + short body, high contrast.",
  why_it_matters: "Calm gradient, one accent shape, centered short statement.",
  application: "Human/craft frame with thin indigo light accent; Mytiv voice.",
  takeaway: "Near-black minimal close; takeaway line + CTA + wordmark.",
};

export function buildCarouselConcept({
  sourceType,
  payload,
  slideCount = 4,
  tone = "editorial",
  audience = "",
  aspect = "4:5",
}: {
  sourceType: string;
  payload: SourcePayload;
  slideCount?: number;
  tone?: string;
  audience?: string;
  aspect?: string;
  platform?: string;
}) {
  const s = normalizeSource(sourceType, payload);
  const roles = ROLE_SEQUENCES[slideCount] || ROLE_SEQUENCES[4];

  const slides = roles.map((role, i) => ({
    slide_number: i + 1,
    slide_role: role,
    ...slideText(role, s, tone, audience),
    visual_direction: VISUAL_DIRECTION[role] || "",
    image_prompt: imagePrompt(role, s, aspect),
    negative_prompt: NEGATIVE,
    layout_style: role === "hook" ? "image_first" : "text_first",
    text_position: role === "hook" ? "bottom_left" : role === "why_it_matters" ? "center" : "top_left",
    background_style: BG_BY_ROLE[role] || "gradient_blue",
    source_credit: s.source ? `Source: ${s.source}` : "",
    cta: "",
  }));

  const hashtags = buildHashtags(s);
  return { slides, captions: buildCaptions(s, tone, audience, hashtags), hashtags };
}

export function buildHashtags(s: NormalizedSource) {
  const fromTags = String(s.tags || "")
    .split(",")
    .map((t) => t.trim().replace(/\s+/g, ""))
    .filter(Boolean)
    .slice(0, 4);
  const base = ["Business", "AIProduction", "Mytiv", "Hospitality"];
  const cat = (s.category || "").replace(/[^a-zA-Z0-9]/g, "");
  const all = [...new Set([...fromTags, ...(cat ? [cat] : []), ...base])].slice(0, 8);
  return all.map((t) => `#${t}`).join(" ");
}

export function buildCaptions(s: NormalizedSource, tone: string, audience: string, hashtags: string) {
  const aud = audience || "restaurant and hospitality owners";
  const opening = short(s.title, 90) || "A shift worth watching.";
  const why = short(s.why || s.summary, 200);
  const action = short(s.action, 160);

  const instagram = `${opening}\n\n${why}${action ? `\n\nWhere it gets practical: ${action}` : ""}\n\nSwipe → for the full picture.\n\nWhat would you build with this? Tell us below.\n\n${hashtags}`;
  const linkedin = `${opening}\n\n${why}${action ? `\n\nFor ${aud}, the practical move: ${action}` : ""}\n\nWe're testing this inside real operations at Mytiv — happy to compare notes.\n\n${hashtags.split(" ").slice(0, 5).join(" ")}`;
  const shortCap = `${opening} — swipe for the breakdown. ${hashtags.split(" ").slice(0, 3).join(" ")}`;
  const professional = `${opening}\n\n${why}\n\nOur view at Mytiv: adopt where it compounds, keep craft where it differentiates.${action ? ` Next step we recommend: ${action}` : ""}`;

  return { instagram, linkedin, short: shortCap, professional };
}
