"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi, useStudio, useT } from "@/components/studio-provider";

type Moodboard = { id: string; name: string; description: string | null };

export default function MoodboardsPage() {
  const api = useApi();
  const t = useT();
  const { businessSlug } = useStudio();
  const [boards, setBoards] = useState<Moodboard[] | null>(null);
  const [name, setName] = useState("");

  async function load() {
    setBoards((await api.moodboards.list()) as Moodboard[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.moodboards.create({ name });
    setName("");
    await load();
  }

  if (!boards) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Moodboards")}</h1>

      <form onSubmit={handleCreate} className="lead-form">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("New moodboard name…")} />
        <button type="submit">{t("Add")}</button>
      </form>

      <div className="lead-list">
        {boards.length === 0 && <p className="empty">{t("No moodboards yet.")}</p>}
        {boards.map((b) => (
          <Link key={b.id} href={`/${businessSlug}/moodboards/${b.id}`} className="lead-row">
            <span className="lead-company">{b.name}</span>
            {b.description && <span className="lead-meta">{b.description}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
