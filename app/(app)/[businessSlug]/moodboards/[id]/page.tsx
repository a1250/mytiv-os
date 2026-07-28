"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi, useT } from "@/components/studio-provider";

type InspirationItem = { id: string; title: string; imageUrl: string | null };
type BoardDetail = { board: { id: string; name: string }; items: { item: InspirationItem; position: number }[] };
type AllInspiration = InspirationItem[];

export default function MoodboardDetailPage() {
  const api = useApi();
  const t = useT();
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<BoardDetail | null>(null);
  const [allItems, setAllItems] = useState<AllInspiration | null>(null);

  async function load() {
    setDetail((await api.moodboards.get(params.id)) as BoardDetail);
    setAllItems((await api.inspiration.list()) as AllInspiration);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function handleAdd(itemId: string) {
    await api.moodboards.addItem(params.id, itemId);
    await load();
  }

  async function handleRemove(itemId: string) {
    await api.moodboards.removeItem(params.id, itemId);
    await load();
  }

  if (!detail || !allItems) return <div className="page">{t("Loading…")}</div>;

  const usedIds = new Set(detail.items.map((i) => i.item.id));
  const available = allItems.filter((i) => !usedIds.has(i.id));

  return (
    <div className="page">
      <h1>{detail.board.name}</h1>

      <h2 style={{ fontSize: 15, margin: "20px 0 8px" }}>{t("On this board")}</h2>
      <div className="moodboard-grid">
        {detail.items.length === 0 && <p className="empty">{t("No items on this board yet.")}</p>}
        {detail.items.map(({ item }) => (
          <div key={item.id}>
            {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="moodboard-thumb" />}
            <button className="task-remove" onClick={() => handleRemove(item.id)}>
              {t("Remove")}
            </button>
          </div>
        ))}
      </div>

      {available.length > 0 && (
        <>
          <h2 style={{ fontSize: 15, margin: "24px 0 8px" }}>{t("Add from Inspiration")}</h2>
          <div className="moodboard-grid">
            {available.map((item) => (
              <div key={item.id} onClick={() => handleAdd(item.id)} style={{ cursor: "pointer" }}>
                {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="moodboard-thumb" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
