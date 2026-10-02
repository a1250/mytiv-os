"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { contrastRatio } from "@/lib/focus/color";
import { designById } from "@/lib/focus/fixtures/studio";
import { fmtAgo } from "@/lib/focus/format";
import { R } from "@/lib/focus/routes";
import { blockingErrors, editorReducer, initEditor, liveChecks } from "@/lib/focus/state/editor";
import { DesignPreview } from "@/components/focus/patterns/studio/design-preview";
import { BrandSwatches, CanvasToolbar, ChecksPanel, LayersPanel, PropertyCard, SideTabs } from "@/components/focus/patterns/studio/editor-parts";
import { useDemo } from "@/components/focus/shell/demo-store";
import { Button, IconButton } from "@/components/focus/ui/button";
import { EmptyState } from "@/components/focus/ui/feedback";
import { OriginTag } from "@/components/focus/ui/status";
import { useToast } from "@/components/focus/ui/toast";

/**
 * Studio editor (handoff E6). Layers, safety zones, brand kit, live checks and anchored comments over the design
 * fixture; undo/redo is a real history (⌘Z / ⇧⌘Z). "Send for approval" is blocked only by errors, never by warnings.
 */
export default function StudioEditorScreen({ designId }: { designId: string }) {
  const design = designById(designId)!;
  const variant = design.variants.find((v) => v.format === "story")!;
  const { now } = useDemo();
  const toast = useToast();
  const [ed, dispatch] = useReducer(editorReducer, variant, initEditor);
  const [left, setLeft] = useState<"layers" | "brand" | "inspo">("layers");
  const [right, setRight] = useState<"design" | "checks" | "history">("checks");
  const [safe, setSafe] = useState(true);
  const [grid, setGrid] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [sent, setSent] = useState(false);
  const checks = liveChecks(design.checks, ed.present);
  const warnings = checks.filter((c) => c.level === "warning" || c.level === "info").length;
  const selected = ed.present.find((l) => l.id === ed.selected) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || (e.target as HTMLElement)?.closest?.("input, textarea")) return;
      e.preventDefault();
      dispatch({ type: e.shiftKey ? "redo" : "undo" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = () => {
    setSent(true);
    toast.push({ title: "נשלח לאישור של רון", detail: "סטורי + פוסט אנכי כפריט אחד. דבר לא יפורסם לפני אישור.", undo: { onUndo: () => setSent(false), label: "בטל שליחה" } });
  };

  return (
    <div className="f-focusmode f-editor">
      <div className="f-focusbar f-editor__bar" role="banner">
        <Link href={R.designPublish(design.id)} className="f-focusbar__exit"><span aria-hidden>→</span>&nbsp;כל הפורמטים</Link>
        <h1 className="f-editor__title">סטורי · {design.title}</h1>
        <OriginTag origin={design.origin} label={design.originLabel} size="sm" />
        <span className="f-grow" />
        <span className="f-meta f-editor__saved">גרסה {design.version} · נשמר {fmtAgo(design.savedAt, now)}</span>
        <IconButton icon="undo-2" label="בטל (⌘Z)" onClick={() => dispatch({ type: "undo" })} disabled={!ed.past.length} />
        <IconButton icon="redo-2" label="בצע שוב (⇧⌘Z)" onClick={() => dispatch({ type: "redo" })} disabled={!ed.future.length} />
        <Button variant="neutral" onClick={() => setRight("history")}>גרסאות</Button>
        {sent
          ? <Link href={R.approvals} className="f-btn f-btn--secondary"><span aria-hidden>…</span> ממתין לאישור · צפה בתור</Link>
          : <Button variant="primary" onClick={send} disabled={blockingErrors(checks) > 0} disabledReason={blockingErrors(checks) > 0 ? "יש שגיאה שחוסמת" : undefined}>שלח לאישור</Button>}
      </div>

      <div className="f-editor__grid">
        <aside className="f-editor__left" aria-label="שכבות ונכסים">
          <SideTabs label="לוח שמאלי" value={left} onChange={setLeft} items={[{ key: "layers", label: "שכבות" }, { key: "brand", label: "נכסי מותג" }, { key: "inspo", label: "השראה" }]} />
          {left === "layers" && <LayersPanel layers={ed.present} selected={ed.selected} onSelect={(id) => dispatch({ type: "select", id })} onToggle={(id) => dispatch({ type: "toggleVisible", id })} />}
          {left === "brand" && <div className="f-editor__pad"><p className="f-meta">גופן: {design.brand.font}</p><p className="f-meta">טון: {design.brand.tone}</p></div>}
          {left === "inspo" && <EmptyState title="אין השראה מקושרת" hint="מודבורד &quot;ערבי חמישי&quot; יופיע כאן כשיחובר לקמפיין." action={<Link href={R.inspiration} className="f-btn f-btn--secondary f-btn--sm">פתח השראה</Link>} />}
          <BrandSwatches brand={design.brand} active={(selected?.kind === "button" ? selected.style.bg : selected?.style.color) ?? ""} onPick={(hex) => selected && dispatch({ type: "setColor", id: selected.id, hex })} />
        </aside>

        <section className="f-editor__center" aria-label="קנבס">
          <CanvasToolbar safe={safe} grid={grid} zoom={zoom} onSafe={() => setSafe(!safe)} onGrid={() => setGrid(!grid)} onZoom={() => setZoom(zoom === 100 ? 75 : 100)} safeLabel="Instagram סטורי" />
          <div className="f-editor__stage">
            <div className={grid ? "f-editor__canvas f-editor__canvas--grid" : "f-editor__canvas"}>
              <DesignPreview
                variant={{ ...variant, layers: ed.present }}
                scale={zoom / 100}
                selected={ed.selected}
                showSafeZones={safe}
                onSelect={(id) => dispatch({ type: "select", id })}
                label={`סטורי · ${design.title} · קנבס עריכה`}
                className="f-editor__design"
              />
            </div>
            {selected && selected.style.color && <PropertyCard layer={selected} contrast={String(contrastRatio(selected.style.color, variant.background))} />}
          </div>
        </section>

        <aside className="f-editor__right" aria-label="עיצוב, בדיקות והיסטוריה">
          <SideTabs label="לוח ימני" value={right} onChange={setRight} items={[{ key: "design", label: "עיצוב" }, { key: "checks", label: <>בדיקות {warnings}</> }, { key: "history", label: "היסטוריה" }]} />
          {right === "checks" && <div className="f-editor__pad"><ChecksPanel checks={checks} comments={design.comments} version={design.version} onFix={(id) => { const l = ed.present.find((x) => x.id === id); if (l && !l.visible) dispatch({ type: "toggleVisible", id }); }} /></div>}
          {right === "design" && <div className="f-editor__pad">{selected ? <PropertyCard layer={selected} contrast={selected.style.color ? String(contrastRatio(selected.style.color, variant.background)) : "—"} /> : <p className="f-meta">בחר שכבה כדי לערוך אותה.</p>}</div>}
          {right === "history" && (
            <ol className="f-editor__history">
              {design.versions.map((v) => <li key={v.n}><b>גרסה {v.n}</b> · {v.note}{v.n === design.version ? ` · ${fmtAgo(design.savedAt, now)}` : ""}</li>)}
              {ed.past.length > 0 && <li className="f-meta">{ed.past.length} שינויים שלא נשמרו כגרסה</li>}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
