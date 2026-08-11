"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ProjectRow } from "@/lib/db/queries/projects";

const FIELD = "border-border bg-muted text-foreground w-full rounded-lg border px-2.5 py-1.5 text-sm";
const LABEL = "text-muted-foreground mb-1 block text-xs";

/**
 * The canonical spec lives in the database, not as a file in the repo: half of
 * this gets read and corrected from a phone, where a repo file is unreachable.
 */
export function SpecEditor({ businessSlug, project }: { businessSlug: string; project: ProjectRow }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = React.useState({
    name: project.name ?? "",
    client: project.client ?? "",
    status: project.status ?? "active",
    budget: project.budget ?? "",
    deadline: project.deadline ?? "",
    clickupFolderId: project.clickupFolderId ?? "",
    brief: project.brief ?? "",
  });
  const [saving, setSaving] = React.useState(false);

  const dirty =
    form.name !== (project.name ?? "") ||
    form.client !== (project.client ?? "") ||
    form.status !== (project.status ?? "active") ||
    form.budget !== (project.budget ?? "") ||
    form.deadline !== (project.deadline ?? "") ||
    form.clickupFolderId !== (project.clickupFolderId ?? "") ||
    form.brief !== (project.brief ?? "");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/${businessSlug}/ops/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, clickupFolderId: form.clickupFolderId.trim() || null }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "unknown" }));
        throw new Error(error);
      }
      toast({ message: "Project saved", tone: "ok" });
      router.refresh();
    } catch (err) {
      const reason = err instanceof Error ? err.message : "unknown";
      toast({
        message:
          reason === "folder_already_linked"
            ? "That ClickUp folder is already linked to another project."
            : `Could not save (${reason}).`,
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={LABEL} htmlFor="p-name">Project</label>
          <input id="p-name" className={FIELD} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={LABEL} htmlFor="p-client">Client</label>
          <input id="p-client" className={FIELD} value={form.client} onChange={(e) => set("client", e.target.value)} />
        </div>
        <div>
          <label className={LABEL} htmlFor="p-status">Status</label>
          <select id="p-status" className={FIELD} value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="done">done</option>
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="p-budget">Budget</label>
          <input id="p-budget" className={FIELD} value={form.budget} onChange={(e) => set("budget", e.target.value)} />
        </div>
        <div>
          <label className={LABEL} htmlFor="p-deadline">Deadline</label>
          <input
            id="p-deadline"
            type="date"
            className={FIELD}
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="p-folder">ClickUp folder ID</label>
          <input
            id="p-folder"
            className={FIELD}
            value={form.clickupFolderId}
            onChange={(e) => set("clickupFolderId", e.target.value)}
            placeholder="901816026301"
          />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="p-brief">Spec</label>
        <textarea
          id="p-brief"
          className={`${FIELD} min-h-64 font-mono leading-relaxed`}
          value={form.brief}
          onChange={(e) => set("brief", e.target.value)}
          placeholder="The canonical spec for this client. Business rules, decisions that shaped them, anything a contractor or the Copilot has to read before touching the build."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {dirty && !saving && <span className="text-muted-foreground text-xs">Unsaved changes</span>}
      </div>
    </div>
  );
}
