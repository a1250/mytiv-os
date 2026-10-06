"use client";

import type { ReactNode } from "react";
import type { BrandKit, DesignCheck, DesignComment, Layer } from "@/lib/focus/contracts/studio";
import { cx } from "@/components/focus/ui/cx";
import { Icon } from "@/components/focus/ui/icon";
import { Tabs } from "@/components/focus/ui/tabs";

/** Studio editor panels (handoff E6, §6.12). Pure views; every action is a callback. */
const GLYPH: Record<Layer["kind"], string> = { headline: "T", text: "T", button: "▭", logo: "◻", image: "▨", background: "▭" };

export function SideTabs<K extends string>({ items, value, onChange, label }: { items: { key: K; label: ReactNode }[]; value: K; onChange: (k: K) => void; label: string }) {
  return <Tabs label={label} items={items} value={value} onChange={onChange} className="f-ed-tabs" itemClassName="f-ed-tabs__item" />;
}

export function LayersPanel({ layers, selected, onSelect, onToggle }: { layers: Layer[]; selected: string | null; onSelect: (id: string) => void; onToggle: (id: string) => void }) {
  return (
    <ul className="f-layers" aria-label="שכבות">
      {layers.map((l) => {
        const sel = l.id === selected;
        return (
          <li key={l.id} className={cx("f-layers__row", sel && "f-layers__row--sel", !l.visible && "f-layers__row--hidden")}>
            <button type="button" className="f-layers__pick" onClick={() => onSelect(l.id)} aria-pressed={sel} disabled={l.locked}>
              <b className="f-layers__glyph" aria-hidden>{GLYPH[l.kind]}</b>
              <span className="f-layers__name">{l.label}</span>
            </button>
            {l.locked ? (
              <span className="f-layers__icon" title="נעול — שכבת מותג"><Icon name="lock" size={15} label="נעול" /></span>
            ) : (
              <button type="button" className="f-layers__icon f-layers__toggle" onClick={() => onToggle(l.id)} aria-pressed={!l.visible} aria-label={l.visible ? `הסתר ${l.label}` : `הצג ${l.label}`} title={l.visible ? "הסתר" : "הצג"}>
                <Icon name={l.visible ? "eye" : "eye-off"} size={15} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function BrandSwatches({ brand, active, onPick }: { brand: BrandKit; active: string; onPick: (hex: string) => void }) {
  return (
    <div className="f-swatches">
      <span className="f-meta-sm">צבעי Brand Kit · {brand.client}</span>
      <div className="f-swatches__row" role="radiogroup" aria-label="צבע לשכבה הנבחרת">
        {brand.colors.map((c) => (
          <button key={c.hex} type="button" role="radio" aria-checked={c.hex === active} aria-label={`${c.label} ${c.hex}`} className="f-swatch" style={{ background: c.hex }} onClick={() => onPick(c.hex)} />
        ))}
      </div>
    </div>
  );
}

export function CanvasToolbar({ safe, grid, zoom, onSafe, onGrid, onZoom, safeLabel }: { safe: boolean; grid: boolean; zoom: number; onSafe: () => void; onGrid: () => void; onZoom: () => void; safeLabel: string }) {
  return (
    <div className="f-ctool" role="toolbar" aria-label="תצוגת קנבס">
      <button type="button" className="f-ctool__btn" aria-pressed={safe} onClick={onSafe}>אזורי בטיחות: {safeLabel}{safe ? " ✓" : ""}</button>
      <button type="button" className="f-ctool__btn" aria-pressed={grid} onClick={onGrid}>רשת</button>
      <button type="button" className="f-ctool__btn" onClick={onZoom} aria-label={`זום ${zoom}% · לחץ לשינוי`}>{zoom}%</button>
      <span className="f-grow" />
      <span className="f-meta f-ctool__hint">יישור · חיתוך · שינוי גודל · שכפול · נעילה</span>
    </div>
  );
}

export function PropertyCard({ layer, contrast }: { layer: Layer; contrast: string }) {
  return (
    <section className="f-props" aria-label={`מאפייני ${layer.label}`}>
      <b className="f-props__h">{layer.label}</b>
      <dl className="f-props__grid">
        <div><dt className="f-sr">גופן</dt><dd>Open Sans · {layer.style.weight ?? 400}</dd></div>
        <div><dt className="f-sr">גודל</dt><dd dir="ltr">{layer.style.size ?? "—"}px</dd></div>
        <div><dt className="f-sr">יישור</dt><dd>ימין</dd></div>
        <div><dt className="f-sr">צבע</dt><dd dir="ltr">{(layer.style.color ?? "").toUpperCase()}</dd></div>
      </dl>
      <span className="f-props__ok">ניגודיות {contrast}:1 ✓</span>
    </section>
  );
}

export function ChecksPanel({ checks, comments, onFix, version }: { checks: DesignCheck[]; comments: DesignComment[]; onFix: (layerId: string) => void; version: number }) {
  const errors = checks.filter((c) => c.level === "error");
  return (
    <div className="f-checks">
      <div className="f-checks__row"><span className="f-muted">שגיאות שחוסמות יצוא</span><b className={errors.length ? "f-text-risk" : "f-checks__zero"}>{errors.length}</b></div>
      {checks.filter((c) => c.level === "error").map((c) => <div key={c.id} className="f-checkbox f-checkbox--error" role="alert"><span className="f-checkbox__l">! שגיאה</span><span>{c.text}</span></div>)}
      {checks.map((c) => c.level === "warning" ? (
        <div key={c.id} className="f-checkbox f-checkbox--warn">
          <span className="f-checkbox__l">◆ אזהרה</span>
          <span className="f-checkbox__t">{c.text}</span>
          {c.fix && <button type="button" className="f-checkbox__fix" onClick={() => onFix(c.fix!.layerId)}>{c.fix.label}</button>}
        </div>
      ) : c.level === "info" ? (
        <div key={c.id} className="f-checkbox f-checkbox--info"><span className="f-checkbox__l">ℹ המלצה</span><span className="f-checkbox__t">{c.text}</span></div>
      ) : null)}
      <ul className="f-checks__pass" aria-label="בדיקות שעברו">
        {checks.filter((c) => c.level === "pass").map((c) => <li key={c.id}><span aria-hidden>✓</span> {c.text}</li>)}
      </ul>
      <div className="f-checks__comments">
        <b className="f-checks__ch">הערות פתוחות</b>
        {comments.map((c) => (
          <div key={c.id} className="f-ecomment">
            <span className="f-ecomment__ok" aria-hidden>✓</span>
            <div className="f-ecomment__body">
              <span className="f-meta-sm">{c.author} · {c.target}</span>
              <span className={cx("f-ecomment__text", c.resolvedIn && "f-ecomment__text--done")}>{c.text}</span>
              {c.resolvedIn && <span className="f-ecomment__res">טופל בגרסה {c.resolvedIn}{c.resolvedIn === version ? "" : ""}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
