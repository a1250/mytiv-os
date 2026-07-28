"use client";

import { useEffect, useState } from "react";
import { useApi, useT } from "@/components/studio-provider";

type SavedPrompt = { id: string; title: string; tool: string; tags: string | null; favorite: boolean };

export default function PromptLibraryPage() {
  const api = useApi();
  const t = useT();
  const [prompts, setPrompts] = useState<SavedPrompt[] | null>(null);
  const [title, setTitle] = useState("");

  async function load() {
    setPrompts((await api.prompts.listSaved()) as SavedPrompt[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.prompts.createSaved({ title, tool: "generic" });
    setTitle("");
    await load();
  }

  async function toggleFavorite(p: SavedPrompt) {
    await api.prompts.updateSaved(p.id, { favorite: !p.favorite });
    await load();
  }

  async function handleRemove(id: string) {
    await api.prompts.removeSaved(id);
    await load();
  }

  if (!prompts) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Prompt Library")}</h1>

      <form onSubmit={handleCreate} className="lead-form">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("New prompt title…")} />
        <button type="submit">{t("Add")}</button>
      </form>

      <div className="task-list">
        {prompts.length === 0 && <p className="empty">{t("No saved prompts yet.")}</p>}
        {prompts.map((p) => (
          <div key={p.id} className="task-row">
            <span className="task-title">{p.title}</span>
            <span className="pill">{p.tool}</span>
            <button className="task-remove" onClick={() => toggleFavorite(p)}>
              {p.favorite ? "★" : "☆"}
            </button>
            <button className="task-remove" onClick={() => handleRemove(p.id)}>
              {t("Remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
