"use client";

import { useId, useState } from "react";
import type { Priority } from "@/lib/focus/contracts/status";
import { parseQuickTask } from "@/lib/focus/state/work";
import { cx } from "@/components/focus/ui/cx";
import { PRIORITY } from "./task-card";

/**
 * Quick create (handoff W1 / W6): one line — "מחר", "גבוה", "@דנה", "#UMINO" fill the fields as you type, shown as
 * chips before you commit. Enter creates; ⌘/Ctrl+Enter creates and keeps the field open for another one.
 */
export type QuickCreateDraft = { title: string; dueDate: string | null; priority: Priority; assigneeId: string | null; client: string | null };

export function QuickCreate({
  now, people, clients, onCreate, autoFocus, compact,
}: {
  now: string; people: { id: string; name: string }[]; clients: string[];
  onCreate: (d: QuickCreateDraft, keepOpen: boolean) => void; autoFocus?: boolean; compact?: boolean;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  const parsed = parseQuickTask(text, now, people, clients);
  const submit = (keep: boolean) => {
    if (!parsed.title) { setError("כתוב מה צריך לעשות."); return; }
    onCreate({ title: parsed.title, dueDate: parsed.dueDate, priority: parsed.priority ?? "medium", assigneeId: parsed.assigneeId, client: parsed.client }, keep);
    setText(""); setError(null);
  };
  return (
    <form className={cx("f-qc", compact && "f-qc--compact")} onSubmit={(e) => { e.preventDefault(); submit(false); }} aria-label="משימה חדשה">
      <span className="f-qc__plus" aria-hidden>+</span>
      <label htmlFor={`${id}-t`} className="f-sr">משימה חדשה</label>
      <input
        id={`${id}-t`}
        className="f-qc__input"
        value={text}
        autoFocus={autoFocus}
        aria-describedby={error ? `${id}-e` : `${id}-h`}
        aria-invalid={error ? true : undefined}
        placeholder={"משימה חדשה… כתוב \"מחר\", \"גבוה\", \"@דנה\", \"#UMINO\" והשדות יתמלאו"}
        onChange={(e) => { setText(e.target.value); setError(null); }}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(true); } }}
      />
      <span id={`${id}-h`} className="f-qc__chips" aria-live="polite">
        <span className={cx("f-qc__chip", parsed.dueLabel && "f-qc__chip--on")}>{parsed.dueLabel ?? "היום"}<span className="f-sr"> · יעד</span></span>
        <span className={cx("f-qc__chip", parsed.priority && "f-qc__chip--on")}>{PRIORITY[parsed.priority ?? "medium"].word}<span className="f-sr"> · עדיפות</span></span>
        {parsed.assignee && <span className="f-qc__chip f-qc__chip--on">@{parsed.assignee}</span>}
        <span className={cx("f-qc__chip", parsed.client && "f-qc__chip--on")}>{parsed.client ? `#${parsed.client}` : "ללא פרויקט"}</span>
      </span>
      <kbd className="f-qc__kbd" dir="ltr" aria-hidden>⏎</kbd>
      <button type="submit" className="f-btn f-btn--primary f-qc__add">הוסף</button>
      {error && <span id={`${id}-e`} className="f-field__error f-qc__err" role="alert"><span aria-hidden>!</span>{error}</span>}
    </form>
  );
}
