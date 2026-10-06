import type { Metric } from "@/lib/focus/contracts/common";
import type { Loadable } from "@/lib/focus/contracts/loadable";
import { fmtAgo, fmtDayMonth } from "@/lib/focus/format";
import { cx } from "@/components/focus/ui/cx";
import { LoadableView, Skeleton } from "@/components/focus/ui/feedback";
import { ReadingValue } from "@/components/focus/ui/status";

/**
 * Metric tile (handoff §6.8): every number with its source, freshness and certainty — known "ידוע", estimated "≈ …
 * מוערך", unknown/unavailable "—" with the reason (never 0). Loading = skeleton in the same structure.
 */
export function metricNote(m: Metric, now: string): { text: string; tone: "default" | "estimated" | "unavailable" } {
  const r = m.reading;
  if (r.kind === "unavailable") return { text: `לא זמין · מ־${fmtDayMonth(r.since)}`, tone: "unavailable" };
  if (r.kind === "unknown") return { text: `לא ידוע · ${r.reason}`, tone: "unavailable" };
  if (r.kind === "estimated") return { text: `מוערך · ${r.basis}`, tone: "estimated" };
  if (m.note) return { text: m.note, tone: "default" };
  const fresh = m.freshness?.state === "fresh" || m.freshness?.state === "stale" ? ` · ${fmtAgo(m.freshness.updatedAt, now)}` : "";
  return { text: `${m.source.label}${fresh} · ידוע`, tone: "default" };
}

export function MetricTile({ m, now, size = "md" }: { m: Metric; now: string; size?: "md" | "sm" }) {
  const note = metricNote(m, now);
  const unavailable = m.reading.kind === "unavailable" || m.reading.kind === "unknown";
  return (
    <div className={cx("f-metric", size === "sm" && "f-metric--sm")}>
      <span className="f-metric__label">{m.label}</span>
      <b className={cx("f-metric__value", m.tone === "risk" && !unavailable && "f-metric__value--risk", unavailable && "f-metric__value--na")}>
        <ReadingValue reading={m.reading} unit={m.unit} total={m.total} />
        {m.delta && m.reading.kind === "known" && (
          <span className={cx("f-metric__delta", `f-metric__delta--${m.delta.tone}`)}> {m.delta.value > 0 ? "+" : ""}{m.delta.value}</span>
        )}
      </b>
      <span className={cx("f-metric__note", `f-metric__note--${note.tone}`)}>{note.text}</span>
    </div>
  );
}

export function MetricGrid({ metrics, now, columns = 3, className, label = "מדדים" }: { metrics: Loadable<Metric[]>; now: string; columns?: number; className?: string; label?: string }) {
  return (
    <section className={cx("f-metricgrid", "f-panel", className)} aria-label={label} style={{ ["--cols" as string]: columns }}>
      <LoadableView value={metrics} label={label} skeleton={<>{Array.from({ length: columns * 2 }, (_, i) => <div key={i} className="f-metric"><Skeleton h={12} w="60%" /><Skeleton h={26} w="40%" /></div>)}</>}>
        {(ms) => <>{ms.map((m) => <MetricTile key={m.id} m={m} now={now} />)}</>}
      </LoadableView>
    </section>
  );
}
