"use client";

import { useEffect, useState } from "react";
import { useApi, useT } from "@/components/studio-provider";

type NewsItem = { id: string; title: string; source: string | null; category: string | null; relevance: number | null; whyItMatters: string | null; url: string | null };

export default function RadarPage() {
  const api = useApi();
  const t = useT();
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);

  async function load() {
    setItems((await api.radar.list()) as NewsItem[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setResult(null);
    try {
      const res = (await api.radar.refresh()) as { added: number; skipped: number };
      setResult(res);
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  if (!items) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("AI Weekly Radar")}</h1>

      <button onClick={handleRefresh} disabled={refreshing} style={{ marginBottom: 8 }}>
        {refreshing ? t("Refreshing…") : t("Refresh")}
      </button>
      {result && (
        <p className="lead-meta" style={{ marginBottom: 16 }}>
          {t("Added")} {result.added} · {t("Skipped")} {result.skipped}
        </p>
      )}

      <div className="lead-list">
        {items.length === 0 && <p className="empty">{t("No radar items yet — click Refresh.")}</p>}
        {items
          .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
          .map((item) => (
            <a key={item.id} href={item.url || "#"} target="_blank" rel="noreferrer" className="lead-row">
              <span className="lead-company">{item.title}</span>
              <span className="pill">{item.category}</span>
              <span className="lead-meta">{item.source}</span>
              <span className="pill priority-medium">{"★".repeat(item.relevance || 0)}</span>
            </a>
          ))}
      </div>
    </div>
  );
}
