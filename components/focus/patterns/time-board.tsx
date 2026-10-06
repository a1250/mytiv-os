"use client";

import { useState, type ReactNode } from "react";
import type { TimeColumn } from "@/lib/focus/contracts/today";
import { Tabs } from "@/components/focus/ui/tabs";
import { SectionHead } from "./page";

/**
 * Now / Today / This week (handoff principle 1). Desktop ≥1200: three columns read right-to-left. Below 1200 the
 * columns become tabs (handoff: "עמודות הזמן הופכות ללשוניות"). Columns are content-agnostic.
 */
export type TimeBoardColumn = { key: TimeColumn; title: string; short?: string; note?: string; count: number; content: ReactNode };

export function TimeBoard({ columns, label = "לפי זמן" }: { columns: TimeBoardColumn[]; label?: string }) {
  const [tab, setTab] = useState<TimeColumn>(columns[0]?.key ?? "now");
  const current = columns.find((c) => c.key === tab) ?? columns[0];
  return (
    <div className="f-tboard">
      <div className="f-tboard__grid">
        {columns.map((c) => (
          <section key={c.key} className="f-tboard__col" aria-label={c.title}>
            <SectionHead title={c.title} note={c.note} count={c.count} />
            {c.content}
          </section>
        ))}
      </div>
      <div className="f-tboard__tabs">
        <Tabs
          label={label}
          idBase="tboard"
          className="f-tboard__tablist"
          value={tab}
          onChange={setTab}
          items={columns.map((c) => ({ key: c.key, label: c.short ?? c.title, count: c.count }))}
        />
        <div role="tabpanel" id={`tboard-panel-${current.key}`} aria-labelledby={`tboard-tab-${current.key}`} className="f-tboard__panel">
          {current.content}
        </div>
      </div>
    </div>
  );
}
