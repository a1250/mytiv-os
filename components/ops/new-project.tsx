"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Name is the only thing required up front — everything else is filled in the workspace. */
export function NewProject({ businessSlug }: { businessSlug: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [folder, setFolder] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/${businessSlug}/ops/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), clickupFolderId: folder.trim() || undefined }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "unknown");
      toast({ message: `Project “${name.trim()}” created`, tone: "ok" });
      setName("");
      setFolder("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({ message: `Could not create (${err instanceof Error ? err.message : "unknown"}).`, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        New project
      </Button>
    );
  }

  return (
    <form onSubmit={create} className="flex flex-wrap items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Client name"
        className="border-border bg-muted text-foreground rounded-lg border px-2.5 py-1.5 text-sm"
      />
      <input
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        placeholder="ClickUp folder ID (optional)"
        className="border-border bg-muted text-foreground w-56 rounded-lg border px-2.5 py-1.5 text-sm"
      />
      <Button type="submit" size="sm" disabled={saving || !name.trim()}>
        {saving ? "Creating…" : "Create"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
