/**
 * Plain (no-modifier) shortcuts never fire while the user types: one rule for A/R/J in focus mode, A on low-risk
 * rows/cards and "/" for search. Modifier shortcuts (⌘K search, ⌘Z in the editor) work from fields too, as usual.
 */
export type KeyTarget = { closest?: (selector: string) => unknown } | null | undefined;

export const TYPING_SELECTOR = "input, textarea, select, [contenteditable=''], [contenteditable='true'], dialog";

/** True when the event target is (inside) a text field, a select, an editable region or an open dialog. */
export function isTypingTarget(target: KeyTarget): boolean {
  return !!target?.closest?.(TYPING_SELECTOR);
}

const LATIN = /^[a-zA-Z]$/;

/**
 * A plain single-key shortcut: no modifier held and not typing.
 * - Letters match the produced character; only when the layout produces a non-Latin character (Hebrew "ש") does the
 *   physical key (`e.code` "KeyA") count — so AZERTY/Dvorak keep their own letters.
 * - "/" matches a "/" that is not produced by a letter key (Hebrew puts "/" on Q), or the physical Slash key when it
 *   produces a non-Latin character (Hebrew "." on Slash).
 */
export function plainShortcut(e: { key: string; code?: string; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; target?: unknown }, keys: string[]): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  if (isTypingTarget(e.target as KeyTarget)) return false;
  const fromLetterKey = !!e.code && /^Key[A-Z]$/.test(e.code);
  for (const k of keys) {
    if (LATIN.test(k)) {
      if (e.key === k) return true;
      if (!LATIN.test(e.key) && e.code === `Key${k.toUpperCase()}`) return true;
    } else if (k === "/") {
      if (e.key === "/" && !fromLetterKey) return true;
      if (e.code === "Slash" && !LATIN.test(e.key) && e.key !== "/") return true;
    } else if (e.key === k) return true;
  }
  return false;
}
