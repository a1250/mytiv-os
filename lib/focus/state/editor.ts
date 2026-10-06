import type { DesignCheck, FormatVariant, Layer } from "@/lib/focus/contracts/studio";

/**
 * Studio editor state (handoff E6) — pure and unit-tested: layer selection/visibility with an undo/redo history, and
 * checks derived from the current layers (a hidden required logo is a warning; a warning never blocks sending, only
 * an error does).
 */
export type EditorState = { past: Layer[][]; present: Layer[]; future: Layer[][]; selected: string | null };

export const initEditor = (v: FormatVariant): EditorState => ({ past: [], present: v.layers, future: [], selected: v.layers.find((l) => l.kind === "headline")?.id ?? null });

export type EditorAction =
  | { type: "select"; id: string | null }
  | { type: "toggleVisible"; id: string }
  | { type: "setColor"; id: string; hex: string }
  | { type: "undo" }
  | { type: "redo" };

export function editorReducer(s: EditorState, a: EditorAction): EditorState {
  switch (a.type) {
    case "select": return { ...s, selected: a.id };
    case "toggleVisible": {
      const l = s.present.find((x) => x.id === a.id);
      if (!l || l.kind === "background") return s;
      const present = s.present.map((x) => (x.id === a.id ? { ...x, visible: !x.visible } : x));
      return { ...s, past: [...s.past, s.present], present, future: [] };
    }
    case "setColor": {
      const l = s.present.find((x) => x.id === a.id);
      if (!l || l.locked) return s;
      const key = l.kind === "button" ? "bg" : "color";
      if (l.style[key] === a.hex) return s;
      const present = s.present.map((x) => (x.id === a.id ? { ...x, style: { ...x.style, [key]: a.hex } } : x));
      return { ...s, past: [...s.past, s.present], present, future: [] };
    }
    case "undo": return s.past.length ? { ...s, past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s;
    case "redo": return s.future.length ? { ...s, past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s;
  }
}

/** Live checks: the fixture's static checks, minus the brand-kit warning once every required layer is visible. */
export function liveChecks(base: DesignCheck[], layers: Layer[]): DesignCheck[] {
  const hiddenRequired = layers.filter((l) => l.required && !l.visible).map((l) => l.id);
  return base.filter((c) => c.level !== "warning" || !c.fix || hiddenRequired.includes(c.fix.layerId));
}

export const blockingErrors = (checks: DesignCheck[]) => checks.filter((c) => c.level === "error").length;
