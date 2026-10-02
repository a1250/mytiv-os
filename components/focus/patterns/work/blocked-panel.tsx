"use client";

import { useEffect, useId, useState } from "react";
import type { Task } from "@/lib/focus/contracts/work";
import { daysBetween, fmtDayMonth, fmtDays } from "@/lib/focus/format";
import { PEOPLE } from "@/lib/focus/fixtures/people";
import { blocking } from "@/lib/focus/state/work";
import { Button } from "@/components/focus/ui/button";
import { cx } from "@/components/focus/ui/cx";
import { Banner } from "@/components/focus/ui/feedback";
import { Icon } from "@/components/focus/ui/icon";
import { PlannedTag, SourceDot, WorkStatusTag } from "@/components/focus/ui/status";
import { PRIORITY } from "./task-card";

/**
 * Blocked-task panel (handoff D3, prototype flow 2): reason, impact, assignee ("הקצה לי"), next step, follow-up date
 * shortcuts and a note — saved together with "שמור וסנכרן". When the source of truth is ClickUp the save is a sync
 * that can fail: the change is then kept here and marked "טרם סונכרן". Unsaved edits are guarded by the caller.
 */
export type BlockedDraft = { assigneeId: string | null; nextAction: string; followUp: string | null; note: string };
export type SyncState = { kind: "idle" } | { kind: "syncing" } | { kind: "synced"; at: string } | { kind: "failed"; message: string };

export function BlockedTaskPanel({
  task, all, now, viewerId, sync, onSave, onRetry, onDirtyChange, canEdit,
}: {
  task: Task; all: Task[]; now: string; viewerId: string; sync: SyncState;
  onSave: (d: BlockedDraft) => void; onRetry: () => void; onDirtyChange: (dirty: boolean) => void; canEdit: boolean;
}) {
  const initial: BlockedDraft = { assigneeId: task.assigneeId, nextAction: task.nextAction ?? "", followUp: task.followUp ?? null, note: "" };
  const [d, setD] = useState<BlockedDraft>(initial);
  const id = useId();
  const dirty = d.assigneeId !== initial.assigneeId || d.nextAction !== initial.nextAction || d.followUp !== initial.followUp || d.note.trim() !== "";
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);
  const day = (n: number) => new Date(new Date(now).getTime() + n * 86_400_000).toISOString().slice(0, 10);
  const idle = daysBetween(task.updatedAt, now);
  const impacts = blocking(task, all);
  const set = (p: Partial<BlockedDraft>) => setD((x) => ({ ...x, ...p }));

  return (
    <section className="f-bpanel f-panel" aria-labelledby={`${id}-h`}>
      <div className="f-bpanel__meta"><span className="f-meta-sm">משימה · מקור: <SourceDot source={task.source} /></span></div>
      <h2 id={`${id}-h`} className="f-bpanel__title">{task.title}</h2>
      <div className="f-bpanel__chips">
        <WorkStatusTag status={task.status} size="xs" />
        <span className={cx("f-risk", "f-risk--xs", `f-risk--${PRIORITY[task.priority].tone}`)}>עדיפות {PRIORITY[task.priority].word}</span>
        <span className="f-meta-sm">ללא עדכון {fmtDays(idle)}</span>
      </div>
      <div className="f-bpanel__reason" role="note">
        <b>סיבת החסימה</b>
        <span>{task.blockedReason ?? "לא נכתבה סיבה — יש להוסיף לפני שממשיכים."}</span>
        {impacts.length > 0 && <span>משפיע על: {impacts.map((x) => x.title).join(", ")}{task.links.projectId === "umino-autumn" ? ", השקה 8.10" : ""}</span>}
      </div>
      {canEdit ? (
        <form className="f-bpanel__form" onSubmit={(e) => { e.preventDefault(); onSave(d); }}>
          <div className="f-bpanel__row">
            <label htmlFor={`${id}-a`} className="f-field__label">אחראי</label>
            <div className="f-bpanel__assign">
              <select id={`${id}-a`} className="f-input f-input--sm" value={d.assigneeId ?? ""} onChange={(e) => set({ assigneeId: e.target.value || null })}>
                <option value="">בחר אחראי</option>
                {Object.values(PEOPLE).filter((p) => p.role !== "viewer").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button variant="secondary" size="sm" onClick={() => set({ assigneeId: viewerId })} disabled={d.assigneeId === viewerId}>הקצה לי</Button>
            </div>
          </div>
          <div className="f-bpanel__row">
            <label htmlFor={`${id}-n`} className="f-field__label">הצעד הבא</label>
            <input id={`${id}-n`} className="f-input f-input--sm" value={d.nextAction} onChange={(e) => set({ nextAction: e.target.value })} placeholder="מה צריך לקרות עכשיו?" />
          </div>
          <fieldset className="f-bpanel__row f-bpanel__fs">
            <legend className="f-field__label">תאריך מעקב</legend>
            <div className="f-chips" role="group" aria-label="קיצורי תאריך">
              {([["מחר", day(1)], ["בעוד 3 ימים", day(3)]] as const).map(([l, v]) => (
                <button key={l} type="button" className="f-chip f-hit" aria-pressed={d.followUp === v} onClick={() => set({ followUp: v })}>{l}</button>
              ))}
              <label className="f-bpanel__date"><span className="f-sr">בחר תאריך</span><input type="date" className="f-input f-input--sm" min={day(0)} value={d.followUp ?? ""} onChange={(e) => set({ followUp: e.target.value || null })} /></label>
            </div>
            {d.followUp && <span className="f-field__help">תזכורת תופיע בהיום שלי ב־{fmtDayMonth(d.followUp)}.</span>}
          </fieldset>
          <div className="f-bpanel__row">
            <label htmlFor={`${id}-c`} className="f-field__label">הערה <PlannedTag /></label>
            <textarea id={`${id}-c`} className="f-input f-input--sm f-bpanel__note" rows={2} value={d.note} onChange={(e) => set({ note: e.target.value })} placeholder="הוסף הערה לצלם או לצוות…" />
          </div>
          <ol className="f-bpanel__hist">
            {task.activity.map((a) => <li key={a.id} className="f-meta-sm">{fmtDayMonth(a.at)} · {a.text}</li>)}
          </ol>
          {sync.kind === "failed" && <Banner kind="error" title="הסנכרון ל־ClickUp נכשל" detail={`${sync.message} השינוי נשמר כאן ומסומן "טרם סונכרן".`} action={<Button variant="neutral" size="sm" onClick={onRetry}>נסה שוב</Button>} />}
          {sync.kind === "synced" && <Banner kind="done" title="סונכרן ל־ClickUp" detail={`ClickUp אישר ב־${sync.at}. תזכורת תופיע בהיום שלי.`} />}
          <div className="f-bpanel__actions">
            <Button type="submit" variant="primary" loading={sync.kind === "syncing"} loadingLabel="מסנכרן ל־ClickUp…" disabled={!dirty && sync.kind !== "syncing"} disabledReason={!dirty && sync.kind !== "syncing" ? "אין שינויים לשמור" : undefined}>
              {task.source === "clickup" ? "שמור וסנכרן" : "שמור"}
            </Button>
            <span className="f-bpanel__ext">פתח ב־ClickUp <Icon name="link" size={13} /> <PlannedTag /></span>
          </div>
          {dirty && sync.kind !== "syncing" && <span className="f-meta-sm" role="status">יש שינויים שלא נשמרו.</span>}
        </form>
      ) : <Banner kind="unavailable" title="צפייה בלבד" detail="אין לך הרשאה לערוך משימה זו." />}
    </section>
  );
}
