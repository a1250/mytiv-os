"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi, useStudio, useT } from "@/components/studio-provider";
import type { ServiceTemplate } from "@/lib/service-templates";

/**
 * Per-business service catalogue. Each row here becomes a "+ <label>" button in
 * the proposal editor. Seeded on request from the starter set rather than
 * automatically, so a business that sells something else isn't handed someone
 * else's price list.
 */
export default function ServiceTemplatesPage() {
  const api = useApi();
  const t = useT();
  const { businessSlug } = useStudio();
  const [rows, setRows] = useState<ServiceTemplate[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setRows((await api.serviceTemplates.list()) as ServiceTemplate[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(id: string, patch: Partial<ServiceTemplate>) {
    await api.serviceTemplates.update(id, patch);
    await load();
  }

  async function addBlank() {
    setBusy(true);
    await api.serviceTemplates.create({ label: t("New service"), title: "", setupFee: 0, monthlyFee: 0 });
    setBusy(false);
    await load();
  }

  async function loadStarters() {
    setBusy(true);
    await api.serviceTemplates.seedStarters();
    setBusy(false);
    await load();
  }

  async function remove(id: string) {
    await api.serviceTemplates.remove(id);
    await load();
  }

  if (!rows) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <div className="editor-head">
        <h1>{t("Service catalogue")}</h1>
        <div className="editor-actions">
          <Link href={`/${businessSlug}/proposals`} className="empty">
            ← {t("Proposals")}
          </Link>
          <button onClick={addBlank} disabled={busy}>
            {t("Add service")}
          </button>
        </div>
      </div>

      <p className="empty">
        {t("These become the quick-add buttons in the proposal editor. Prices are starting points — each proposal can override them.")}
      </p>

      {rows.length === 0 && (
        <div className="totals-box" style={{ marginTop: 16 }}>
          <p className="empty" style={{ marginBottom: 10 }}>
            {t("No services yet. Start from scratch, or load the starter set and edit it to match your pricing.")}
          </p>
          <button className="secondary" onClick={loadStarters} disabled={busy}>
            {t("Load starter set")}
          </button>
        </div>
      )}

      {rows.map((row) => (
        <div key={row.id} className="service-card">
          <div className="service-card-head">
            <input
              className="service-title"
              placeholder={t("Button label (e.g. Landing page)")}
              defaultValue={row.label}
              onBlur={(e) => e.target.value !== row.label && save(row.id, { label: e.target.value })}
            />
            <button className="task-remove" onClick={() => remove(row.id)}>
              {t("Remove")}
            </button>
          </div>

          <div className="settings-field">
            <label>{t("Title written into the proposal")}</label>
            <input
              defaultValue={row.title ?? ""}
              onBlur={(e) => e.target.value !== (row.title ?? "") && save(row.id, { title: e.target.value })}
            />
          </div>

          <textarea
            className="editor-textarea"
            rows={3}
            placeholder={t("Short description of the service…")}
            defaultValue={row.description ?? ""}
            onBlur={(e) => e.target.value !== (row.description ?? "") && save(row.id, { description: e.target.value })}
          />

          <div className="field-grid">
            <div className="settings-field">
              <label>{t("Setup fee (₪)")}</label>
              <input
                type="number"
                min={0}
                dir="ltr"
                defaultValue={row.setupFee ?? 0}
                onBlur={(e) => save(row.id, { setupFee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="settings-field">
              <label>{t("Monthly fee (₪)")}</label>
              <input
                type="number"
                min={0}
                dir="ltr"
                defaultValue={row.monthlyFee ?? 0}
                onBlur={(e) => save(row.id, { monthlyFee: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="monthly-block">
            <div className="settings-field">
              <label>{t("Monthly block title")}</label>
              <input
                placeholder="חבילת תחזוקה ואחסון"
                defaultValue={row.monthlyBlockTitle ?? ""}
                onBlur={(e) =>
                  e.target.value !== (row.monthlyBlockTitle ?? "") &&
                  save(row.id, { monthlyBlockTitle: e.target.value })
                }
              />
            </div>
            <div className="settings-field">
              <label>{t("What's included (one per line)")}</label>
              <textarea
                className="editor-textarea"
                rows={4}
                defaultValue={row.monthlyBreakdown ?? ""}
                onBlur={(e) =>
                  e.target.value !== (row.monthlyBreakdown ?? "") &&
                  save(row.id, { monthlyBreakdown: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
