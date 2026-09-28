/**
 * Pure timeline geometry for the marketing plan Gantt. Canonical C1 items carry full ISO
 * date-time start/end, so positions are computed from the parsed epoch (never by appending a
 * time to a bare date). Extracted from the panel so it can be unit-tested without React.
 */
export const dayIndex = (iso: string) => Date.parse(iso) / 86_400_000;

export function timelineBars<T extends { start: string; end: string }>(items: T[]) {
  const from = items.length ? Math.min(...items.map((i) => dayIndex(i.start))) : 0;
  const to = items.length ? Math.max(...items.map((i) => dayIndex(i.end))) : 1;
  const span = Math.max(1, to - from + 1);
  return {
    from,
    span,
    /** left/width as percentages of the full span; always finite for valid ISO timestamps. */
    bar(item: T) {
      return {
        left: ((dayIndex(item.start) - from) / span) * 100,
        width: Math.max(0.5, ((dayIndex(item.end) - dayIndex(item.start) + 1) / span) * 100),
      };
    },
  };
}
