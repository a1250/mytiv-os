"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Confidence, ContentThumb as Thumb, MoodSwatch, StudioStage } from "@/lib/focus/contracts/marketing";
import type { FormatKey } from "@/lib/focus/contracts/studio";
import { designById } from "@/lib/focus/fixtures/studio";
import { DesignPreview } from "@/components/focus/patterns/studio/design-preview";
import { cx } from "@/components/focus/ui/cx";
import { ApprovalPill, PlannedTag, WorkStatusTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Marketing & content building blocks (handoff H6, H7, E1, E2, E7): photo placeholders, moodboard swatches,
 * confidence of an opportunity, content thumbnails rendered from the design data, the studio stage tag and a
 * clipboard helper with a graceful fallback. Pure views + callbacks; styles in marketing.css (prefix f-mk-).
 */

/** Striped placeholder that stands in for a photo until the real asset arrives. `height` is data-driven geometry. */
export function PhotoPlaceholder({ label, height, className, align = "end" }: { label?: string; height?: number; className?: string; align?: "end" | "center" }) {
  return (
    <div className={cx("f-mk-ph", align === "center" && "f-mk-ph--center", className)} style={height ? { height } : undefined} aria-hidden>
      {label && <span className="f-mk-ph__label">{label}</span>}
    </div>
  );
}

/** One moodboard / asset tile. A client brand colour is data (inline); tint and photo come from tokens. */
export function Swatch({ swatch, className }: { swatch: MoodSwatch; className?: string }) {
  if (swatch.kind === "color") return <span className={cx("f-mk-swatch", className)} style={{ background: swatch.hex }} title={swatch.label} aria-hidden />;
  return <span className={cx("f-mk-swatch", swatch.kind === "tint" ? "f-mk-swatch--tint" : "f-mk-swatch--photo", className)} aria-hidden />;
}

const CONF: Record<Confidence, { glyph: string; word: string }> = {
  high: { glyph: "●", word: "התאמה גבוהה" },
  medium: { glyph: "◐", word: "התאמה בינונית" },
  low: { glyph: "○", word: "התאמה נמוכה" },
};

/** How well an opportunity fits — symbol + word, with what it is based on. */
export function ConfidenceTag({ level, basis }: { level: Confidence; basis?: string }) {
  const c = CONF[level];
  return (
    <span className={cx("f-mk-conf", `f-mk-conf--${level}`)} title={basis}>
      <span aria-hidden>{c.glyph}</span> {c.word}
    </span>
  );
}

/** A design variant scaled to fit a box (from lib/focus/fixtures/studio), or null when the design has no such format. */
export function DesignThumb({ designId, format, fitHeight, fitWidth, label, className }: {
  designId: string; format: FormatKey; fitHeight: number; fitWidth?: number; label: string; className?: string;
}) {
  const v = designById(designId)?.variants.find((x) => x.format === format);
  if (!v) return null;
  const scale = Math.min(fitHeight / v.base.h, fitWidth ? fitWidth / v.base.w : Infinity);
  return <DesignPreview variant={v} scale={scale} label={label} className={cx("f-mk-dthumb", className)} />;
}

/** Content-plan thumbnail (E1): the real design when one exists, otherwise a neutral shape by kind. */
export function ContentThumb({ thumb, label }: { thumb: Thumb; label: string }) {
  if (thumb.kind === "design") {
    return <span className="f-mk-cthumb"><DesignThumb designId={thumb.designId} format={thumb.format} fitHeight={72} label={label} /></span>;
  }
  if (thumb.kind === "slides") {
    return <span className="f-mk-cthumb f-mk-cthumb--slides" aria-hidden>{Array.from({ length: thumb.count }, (_, i) => <span key={i} className="f-mk-cthumb__slide" />)}</span>;
  }
  return <span className={cx("f-mk-cthumb", thumb.kind === "wide" ? "f-mk-cthumb--wide" : "f-mk-cthumb--planned")} aria-hidden />;
}

/** Studio stage — mapped onto the status families (approval pill, work tag); never a hand-drawn glyph. */
export function StageTag({ stage, note }: { stage: StudioStage; note?: string }) {
  switch (stage) {
    case "draft": return <ApprovalPill status="draft" size="sm" />;
    case "changes_requested": return <ApprovalPill status="changes_requested" size="sm" />;
    case "pending": return <ApprovalPill status="pending" size="sm" />;
    case "approved": return <ApprovalPill status="approved" size="sm" />;
    case "blocked": return <WorkStatusTag status="blocked" size="xs" label={note ? `חסום · ${note}` : "חסום"} />;
    case "exported": return <WorkStatusTag status="done" size="xs" label="יוצא" />;
    case "scheduled": return <ApprovalPill status="approved" size="sm" label="מתוזמן" />;
    case "published": return <WorkStatusTag status="done" size="xs" label="פורסם" />;
  }
}

/** A labelled capability that has no backend yet: rendered in full, never as a working control. */
export function PlannedAction({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("f-mk-planned", className)}>
      {children} <PlannedTag />
    </span>
  );
}

/**
 * Copy text with the Clipboard API. Success is announced only after the browser confirmed; when the API is missing or
 * refused, the text is selected on screen (if an element is given) and the toast says how to copy it by hand.
 */
export function useCopy() {
  const toast = useToast();
  return (text: string, what: string, selectEl?: HTMLElement | null) => {
    const fallback = () => {
      if (selectEl) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(selectEl);
        sel?.addRange(range);
      }
      toast.push({ kind: "info", title: `לא ניתן להעתיק אוטומטית את ${what}`, detail: selectEl ? "הטקסט סומן על המסך. אפשר להעתיק אותו ידנית (⌘C / Ctrl+C)." : "הדפדפן חסם גישה ללוח. סמנו את הטקסט והעתיקו ידנית." });
    };
    if (!navigator.clipboard?.writeText) { fallback(); return; }
    navigator.clipboard.writeText(text).then(
      () => toast.push({ title: `${what} הועתק`, detail: "אפשר להדביק עכשיו." }),
      fallback,
    );
  };
}

/** Fit a format's ratio into a box (format picker shapes) — data-driven geometry. */
export function ratioBox(ratio: { w: number; h: number }, maxW: number, maxH: number): CSSProperties {
  const s = Math.min(maxW / ratio.w, maxH / ratio.h);
  return { width: Math.round(ratio.w * s), height: Math.round(ratio.h * s) };
}
