import { cn } from "@/lib/utils";
import type { OpsStats } from "@/lib/clickup";

/**
 * Four numbers, no decoration. A tile turns colour only when its number is
 * something to act on — a coloured zero would be noise.
 */
/**
 * `stats: null` means the board was not read (no linked folder, ClickUp down, rate-limited).
 * That is unknown, and unknown is rendered as "—", never as 0 — a zero here would read as
 * "nothing stuck, nothing open", which is exactly what nobody knows.
 */
export function StatTiles({ stats }: { stats: OpsStats | null }) {
  const tiles = stats
    ? [
        { label: "Stuck", value: stats.stuck, tone: stats.stuck > 0 ? "text-warning" : undefined },
        { label: "Overdue", value: stats.overdue, tone: stats.overdue > 0 ? "text-danger" : undefined },
        { label: "Open tasks", value: stats.openTasks },
        { label: "Open bugs", value: stats.openBugs, tone: stats.openBugs > 0 ? "text-danger" : undefined },
      ]
    : ["Stuck", "Overdue", "Open tasks", "Open bugs"].map((label) => ({ label, value: "—" as const, tone: "text-muted-foreground" }));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-card border-border rounded-xl border px-4 py-3">
          <div className={cn("text-2xl font-bold tabular-nums", tile.tone)}>{tile.value}</div>
          <div className="text-muted-foreground mt-0.5 text-xs">{tile.label}</div>
        </div>
      ))}
    </div>
  );
}
