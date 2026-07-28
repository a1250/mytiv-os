"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi, useStudio, useT } from "@/components/studio-provider";

type CarouselSummary = { id: string; title: string; platform: string; status: string; slideCount: number };

export default function CarouselListPage() {
  const api = useApi();
  const t = useT();
  const { businessSlug } = useStudio();
  const [carousels, setCarousels] = useState<CarouselSummary[] | null>(null);
  const [title, setTitle] = useState("");
  const [mainIdea, setMainIdea] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setCarousels((await api.carousel.list()) as CarouselSummary[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const result = (await api.carousel.create({
        title,
        sourceType: "manual_topic",
        sourcePayload: { title, main_idea: mainIdea },
        slideCount: 4,
        tone: "editorial",
      })) as { project: { id: string } };
      setTitle("");
      setMainIdea("");
      window.location.href = `/${businessSlug}/carousel/${result.project.id}`;
    } finally {
      setCreating(false);
    }
  }

  if (!carousels) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Carousel Studio")}</h1>

      <form onSubmit={handleCreate} className="settings-form" style={{ marginBottom: 24 }}>
        <div className="settings-field">
          <label>{t("Title")}</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Carousel title…")} />
        </div>
        <div className="settings-field">
          <label>{t("Main idea")}</label>
          <input value={mainIdea} onChange={(e) => setMainIdea(e.target.value)} placeholder={t("What is this carousel about?")} />
        </div>
        <button type="submit" disabled={creating}>
          {creating ? t("Generating…") : t("Create carousel")}
        </button>
      </form>

      <div className="lead-list">
        {carousels.length === 0 && <p className="empty">{t("No carousels yet.")}</p>}
        {carousels.map((c) => (
          <Link key={c.id} href={`/${businessSlug}/carousel/${c.id}`} className="lead-row">
            <span className="lead-company">{c.title}</span>
            <span className="lead-meta">
              {c.platform} · {c.slideCount} {t("slides")}
            </span>
            <span className="pill">{c.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
