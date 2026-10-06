import type { IsoDateTime } from "./common";

/**
 * Every collection a Focus screen shows arrives as a Loadable. The states are deliberately distinct:
 *  - `loading`     → skeleton in the final structure
 *  - `empty`       → the source answered and there is nothing (empty state with a next step)
 *  - `error`       → the read failed; NEVER rendered as an empty list
 *  - `unavailable` → the source is disconnected/down; shows "—" + since + last known value if any
 *  - `partial`     → only part arrived; counts are hidden so a short number is never shown as the truth
 *  - `forbidden`   → the viewer may not see this (handoff: "צפייה בלבד" / permission denied)
 *  - `ready`       → data
 */
export type Loadable<T> =
  | { state: "loading"; label?: string }
  | { state: "ready"; data: T; updatedAt?: IsoDateTime }
  | { state: "empty"; title: string; hint?: string }
  | { state: "error"; message: string; detail?: string; retryable: boolean }
  | { state: "unavailable"; reason: string; since?: IsoDateTime; lastKnown?: T }
  | { state: "partial"; data: T; missing: string }
  | { state: "forbidden"; reason: string };

export const ready = <T,>(data: T, updatedAt?: IsoDateTime): Loadable<T> => ({ state: "ready", data, updatedAt });

/** Data that can be shown (ready or partial), else null. */
export function dataOf<T>(l: Loadable<T>): T | null {
  return l.state === "ready" || l.state === "partial" ? l.data : null;
}
