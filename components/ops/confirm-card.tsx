"use client";

import * as React from "react";
import { Check, ExternalLink, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProposalState =
  | { status: "pending" }
  | { status: "running" }
  | { status: "done"; summary: string; url?: string }
  | { status: "cancelled" }
  | { status: "failed"; error: string };

type Field = { key: string; label: string; type?: "text" | "date" | "number" | "textarea" };

/** What each proposal shows, in the order it reads best. */
const FIELDS: Record<string, { title: string; fields: Field[] }> = {
  create_task: {
    title: "Create task in ClickUp?",
    fields: [
      { key: "title", label: "Title" },
      { key: "list", label: "List" },
      { key: "assignee", label: "Owner" },
      { key: "due_date", label: "Due date", type: "date" },
      { key: "estimate_hours", label: "Estimate (h)", type: "number" },
      { key: "definition_of_done", label: "Done when", type: "textarea" },
    ],
  },
  update_task: {
    title: "Update task in ClickUp?",
    fields: [
      { key: "task_id", label: "Task" },
      { key: "status", label: "Status" },
      { key: "assignee", label: "Owner" },
      { key: "due_date", label: "Due date", type: "date" },
    ],
  },
  add_comment: {
    title: "Add comment in ClickUp?",
    fields: [
      { key: "task_id", label: "Task" },
      { key: "text", label: "Comment", type: "textarea" },
    ],
  },
  add_decision: {
    title: "Record this decision?",
    fields: [
      { key: "title", label: "Decision" },
      { key: "source", label: "Source" },
      { key: "detail", label: "Detail", type: "textarea" },
    ],
  },
};

/**
 * Nothing reaches ClickUp until this card is confirmed.
 *
 * Fields are locked until Edit is pressed: the point of the card is that one
 * deliberate click executes it, and a form you can type into by accident
 * invites exactly the silent mistake the confirmation exists to prevent.
 */
export function ConfirmCard({
  tool,
  input,
  state,
  onConfirm,
  onCancel,
}: {
  tool: string;
  input: Record<string, unknown>;
  state: ProposalState;
  onConfirm: (edited: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const spec = FIELDS[tool];
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      (spec?.fields ?? []).map((f) => [f.key, input[f.key] === undefined || input[f.key] === null ? "" : String(input[f.key])])
    )
  );
  const [editing, setEditing] = React.useState(false);

  if (!spec) return null;
  const settled = state.status === "done" || state.status === "cancelled" || state.status === "failed";
  const busy = state.status === "running";

  function confirm() {
    const out: Record<string, unknown> = {};
    for (const f of spec.fields) {
      const raw = values[f.key]?.trim() ?? "";
      if (!raw) continue;
      out[f.key] = f.type === "number" ? Number(raw) : raw;
    }
    onConfirm(out);
  }

  return (
    <div
      className={cn(
        "bg-card overflow-hidden rounded-xl border",
        state.status === "done" && "border-success/40",
        state.status === "failed" && "border-danger/40",
        state.status === "cancelled" && "border-border opacity-60",
        (state.status === "pending" || busy) && "border-active/40"
      )}
    >
      <div className="border-border border-b px-3.5 py-2.5 text-sm font-semibold">{spec.title}</div>

      <dl className="flex flex-col gap-2 px-3.5 py-3">
        {spec.fields.map((f) => (
          <div key={f.key} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
            <dt className="text-muted-foreground w-28 shrink-0 pt-1.5 text-xs">{f.label}</dt>
            <dd className="flex-1">
              {f.type === "textarea" ? (
                <textarea
                  value={values[f.key] ?? ""}
                  disabled={!editing || settled || busy}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  rows={2}
                  className="border-border bg-muted/50 text-foreground w-full resize-y rounded-lg border px-2 py-1.5 text-sm disabled:border-transparent disabled:bg-transparent disabled:px-0"
                />
              ) : (
                <input
                  type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                  value={values[f.key] ?? ""}
                  disabled={!editing || settled || busy}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={editing ? "—" : ""}
                  className="border-border bg-muted/50 text-foreground w-full rounded-lg border px-2 py-1.5 text-sm disabled:border-transparent disabled:bg-transparent disabled:px-0"
                />
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-border flex flex-wrap items-center gap-2 border-t px-3.5 py-2.5">
        {state.status === "done" ? (
          <>
            <span className="text-success inline-flex items-center gap-1.5 text-xs font-medium">
              <Check className="size-3.5" />
              {state.summary}
            </span>
            {state.url && (
              <a
                href={state.url}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
              >
                <ExternalLink className="size-3.5" />
                Open
              </a>
            )}
          </>
        ) : state.status === "cancelled" ? (
          <span className="text-muted-foreground text-xs">Cancelled — nothing was written.</span>
        ) : state.status === "failed" ? (
          <span className="text-danger text-xs">{state.error}</span>
        ) : (
          <>
            <Button size="sm" onClick={confirm} disabled={busy}>
              {busy ? "Working…" : "Confirm"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)} disabled={busy}>
              <Pencil className="size-3.5" />
              {editing ? "Done" : "Edit"}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
              <X className="size-3.5" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
