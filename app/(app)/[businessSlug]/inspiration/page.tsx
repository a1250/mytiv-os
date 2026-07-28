"use client";

import { useEffect, useRef, useState } from "react";
import { useApi, useT } from "@/components/studio-provider";

type InspirationItem = { id: string; title: string; imageUrl: string | null; url: string | null; notes: string | null; category: string | null };

export default function InspirationPage() {
  const api = useApi();
  const t = useT();
  const [items, setItems] = useState<InspirationItem[] | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    setItems((await api.inspiration.list()) as InspirationItem[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.upload.image(file, "inspiration");
      await api.inspiration.create({ title: title || file.name, imageUrl: url });
      setTitle("");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
      await load();
    }
  }

  async function handleRemove(id: string) {
    await api.inspiration.remove(id);
    await load();
  }

  if (!items) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Inspiration")}</h1>

      <div className="lead-form" style={{ marginBottom: 20 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Title (optional)…")} />
        <input ref={fileInput} type="file" accept="image/*" onChange={handleFileChosen} disabled={uploading} />
        {uploading && <span className="empty">{t("Uploading…")}</span>}
      </div>

      <div className="card-grid">
        {items.length === 0 && <p className="empty">{t("No inspiration saved yet.")}</p>}
        {items.map((item) => (
          <div key={item.id} className="inspiration-card">
            {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="inspiration-img" />}
            <div className="inspiration-title">{item.title}</div>
            <button className="task-remove" onClick={() => handleRemove(item.id)}>
              {t("Remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
