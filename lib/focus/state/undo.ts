/**
 * Undo windows (handoff: "פעולות הפיכות מציגות 'בטל' ב־Toast/בכרטיס עד חלון הזמן").
 * Two kinds of window:
 *  - a short UI window after any reversible action (UNDO_WINDOW_MS) — the toast's "בטל" button;
 *  - a domain window carried by the action itself (e.g. a scheduled post can be cancelled until it is published).
 * Pure functions so they are unit-tested (tests/focus/undo.test.ts).
 */
export const UNDO_WINDOW_MS = 10_000;
/** Plain toasts disappear after this; errors and undo toasts stay until closed. */
export const TOAST_MS = 6_000;

export type UndoWindow = { startedAt: number; endsAt: number };

export const openWindow = (now: number, ms = UNDO_WINDOW_MS): UndoWindow => ({ startedAt: now, endsAt: now + ms });
export const canUndo = (w: UndoWindow | null | undefined, now: number) => !!w && now < w.endsAt;
export const remainingMs = (w: UndoWindow, now: number) => Math.max(0, w.endsAt - now);
/** "0:08" */
export const fmtRemaining = (ms: number) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
