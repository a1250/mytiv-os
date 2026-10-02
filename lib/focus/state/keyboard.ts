/**
 * Keyboard shortcuts never fire while the user types: one rule for every shortcut in the Focus UI
 * (A/R/J in focus mode, A on low-risk rows/cards, "/" and ⌘K for search, ⌘Z in the editor).
 */
export type KeyTarget = { closest?: (selector: string) => unknown } | null | undefined;

export const TYPING_SELECTOR = "input, textarea, select, [contenteditable=''], [contenteditable='true'], dialog";

/** True when the event target is (inside) a text field, a select, an editable region or an open dialog. */
export function isTypingTarget(target: KeyTarget): boolean {
  return !!target?.closest?.(TYPING_SELECTOR);
}

/** A plain single-key shortcut: no modifier held and not typing. */
export function plainShortcut(e: { key: string; metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; target?: unknown }, keys: string[]): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  if (isTypingTarget(e.target as KeyTarget)) return false;
  return keys.includes(e.key);
}
