"use client";

import { useEffect, useState } from "react";
import { useApi, useStudio, useT } from "@/components/studio-provider";
import { generateDraft } from "@/lib/services/outreachGenerator";

type Lead = { id: string; company: string; contactName: string | null; opportunityType: string | null; category: string | null; status: string };
type OutreachMsg = { id: string; leadId: string; kind: string; subject: string | null; body: string; status: string };

const KINDS = ["cold_email_en", "cold_email_he", "linkedin", "followup", "premium", "brand_direct"];

export default function OutreachPage() {
  const api = useApi();
  const t = useT();
  const { settings } = useStudio();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [messages, setMessages] = useState<OutreachMsg[] | null>(null);
  const [leadId, setLeadId] = useState("");
  const [kind, setKind] = useState("cold_email_en");
  const [draft, setDraft] = useState<{ subject: string; body: string; language: string } | null>(null);

  async function load() {
    const [leadRows, msgRows] = await Promise.all([api.leads.list(), api.outreach.list()]);
    setLeads(leadRows as Lead[]);
    setMessages(msgRows as OutreachMsg[]);
  }

  useEffect(() => {
    load();
  }, []);

  function handleGenerate() {
    const lead = leads?.find((l) => l.id === leadId);
    if (!lead) return;
    const result = generateDraft(kind, lead, { studioName: settings.studio_name, ownerName: settings.owner_name });
    setDraft(result);
  }

  async function handleSave() {
    if (!draft || !leadId) return;
    await api.outreach.create({ leadId, kind, language: draft.language, subject: draft.subject, body: draft.body });
    setDraft(null);
    await load();
  }

  if (!leads || !messages) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{t("Outreach Assistant")}</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          <option value="">{t("Select a lead…")}</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.company}
            </option>
          ))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <button onClick={handleGenerate} disabled={!leadId}>
          {t("Generate draft")}
        </button>
      </div>

      {draft && (
        <div className="settings-form" style={{ marginBottom: 24, maxWidth: 600 }}>
          <div className="settings-field">
            <label>{t("Subject")}</label>
            <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
          </div>
          <div className="settings-field">
            <label>{t("Body")}</label>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={8}
              dir={draft.language === "he" ? "rtl" : "ltr"}
              style={{ width: "100%", background: "var(--panel)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}
            />
          </div>
          <button onClick={handleSave}>{t("Save as draft")}</button>
        </div>
      )}

      <h2 style={{ fontSize: 15, marginBottom: 8 }}>{t("Saved drafts")}</h2>
      <div className="task-list">
        {messages.length === 0 && <p className="empty">{t("No outreach drafts yet.")}</p>}
        {messages.map((m) => (
          <div key={m.id} className="task-row">
            <span className="task-title">{m.subject || m.kind}</span>
            <span className="pill">{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
