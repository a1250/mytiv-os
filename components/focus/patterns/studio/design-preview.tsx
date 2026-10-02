import type { CSSProperties, ReactNode } from "react";
import type { FormatVariant, Layer } from "@/lib/focus/contracts/studio";
import { cx } from "@/components/focus/ui/cx";

/**
 * Renders a design variant from data (layers in base coordinates). Used by content approval (D7, M8), the editor
 * canvas (E6) and asset cards. Geometry and the client's brand colours are data, so they are the only inline styles.
 * `pins` draws numbered review notes; `selected` outlines the selected layer with handles (editor).
 */
export type Pin = { n: number; layerId: string };

function layerStyle(l: Layer, s: number): CSSProperties {
  const b = l.box, st = l.style;
  const css: CSSProperties = {
    position: "absolute",
    insetInlineStart: b.inline * s,
    ...(b.inlineEnd != null ? { insetInlineEnd: b.inlineEnd * s } : {}),
    ...(b.top != null ? { top: b.top * s } : {}),
    ...(b.bottom != null ? { bottom: b.bottom * s } : {}),
    ...(b.height != null ? { height: b.height * s } : {}),
    ...(b.width != null ? { width: b.width * s } : {}),
    color: st.color,
    fontSize: st.size ? st.size * s : undefined,
    fontWeight: st.weight,
    lineHeight: st.lineHeight,
    letterSpacing: st.tracking,
  };
  if (l.kind === "button") Object.assign(css, { background: st.bg, padding: `${8 * s}px ${16 * s}px`, borderRadius: 999 });
  if (l.kind === "image" && st.pattern) {
    Object.assign(css, {
      background: `repeating-linear-gradient(135deg, ${st.pattern[0]} 0 ${6 * s}px, ${st.pattern[1]} ${6 * s}px ${12 * s}px)`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 * Math.max(s, 0.8),
    });
  }
  return css;
}

export function DesignPreview({
  variant, scale = 1, selected, showSafeZones, pins, onSelect, label, className, children,
}: {
  variant: FormatVariant; scale?: number; selected?: string | null; showSafeZones?: boolean; pins?: Pin[];
  onSelect?: (layerId: string) => void; label: string; className?: string; children?: ReactNode;
}) {
  const s = scale;
  const w = variant.base.w * s, h = variant.base.h * s;
  return (
    <div className={cx("f-design", className)} style={{ width: w, height: h, background: variant.background }} role="img" aria-label={label}>
      {showSafeZones && variant.safeZones.map((z) => (
        <div key={z.edge} className={cx("f-design__safe", `f-design__safe--${z.edge}`)} style={{ height: z.height * s }} aria-hidden>{z.label}</div>
      ))}
      {variant.layers.filter((l) => l.kind !== "background").map((l) => {
        const content = l.kind === "image" ? <span className="f-design__ph">{l.text ?? ""}</span> : (l.text ?? "").split("\n").map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>);
        const style = { ...layerStyle(l, s), opacity: l.visible ? undefined : 0 };
        const isSel = selected === l.id;
        const pinned = pins?.some((p) => p.layerId === l.id);
        return onSelect && !l.locked ? (
          <button key={l.id} type="button" className={cx("f-design__layer", isSel && "f-design__layer--sel")} style={style} onClick={() => onSelect(l.id)} aria-pressed={isSel} aria-label={`בחר שכבה: ${l.label}`}>
            {content}{isSel && <Handles />}
          </button>
        ) : (
          <div key={l.id} className={cx("f-design__layer", isSel && "f-design__layer--sel", pinned && "f-design__layer--pinned")} style={style} aria-hidden>{content}{isSel && <Handles />}</div>
        );
      })}
      {pins?.map((p) => {
        const l = variant.layers.find((x) => x.id === p.layerId);
        if (!l) return null;
        return <span key={p.n} className="f-design__pin" style={{ top: Math.max(0, ((l.box.top ?? 0) - 18) * s), insetInlineEnd: 10 }} aria-hidden>{p.n}</span>;
      })}
      {children}
    </div>
  );
}

function Handles() {
  return (
    <>
      {(["ts", "te", "bs", "be"] as const).map((k) => <span key={k} className={`f-design__h f-design__h--${k}`} aria-hidden />)}
    </>
  );
}
