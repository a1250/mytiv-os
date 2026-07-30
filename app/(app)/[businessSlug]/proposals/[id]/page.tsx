"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApi, useStudio, useT } from "@/components/studio-provider";
import { computeTotals } from "@/lib/pdf-helpers";
import { buildProposalEmail } from "@/lib/services/proposal-email";
import {
  blankService,
  serviceFromTemplate,
  type ServiceItem,
  type ServiceTemplate,
} from "@/lib/service-templates";

type Lead = { id: string; company: string; contactName: string | null; email: string | null };

type Proposal = {
  id: string;
  title: string;
  leadId: string | null;
  clientName: string | null;
  clientCompany: string | null;
  clientEmail: string | null;
  status: string;
  date: string | null;
  validUntil: string | null;
  projectOverview: string | null;
  notes: string | null;
  emailText: string | null;
  vatRate: number | null;
  includeVat: boolean | null;
  retainerMode: boolean | null;
  services: ServiceItem[] | null;
};

const STATUSES = ["draft", "sent", "accepted", "declined"];

/**
 * Editor holds a local draft and saves explicitly rather than per-field on blur:
 * every updateProposal() call snapshots a row into proposal_versions, so
 * field-level autosave would burn through the 10-version undo history in a
 * single editing session.
 */
export default function ProposalEditorPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const t = useT();
  const { businessSlug, settings: studioSettings, businessName } = useStudio();

  const [draft, setDraft] = useState<Proposal | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const row = (await api.proposals.get(id)) as Proposal;
      setDraft({ ...row, services: row.services ?? [] });
      setDirty(false);
    })();
    (async () => setLeads((await api.leads.list()) as Lead[]))();
    (async () => setTemplates((await api.serviceTemplates.list()) as ServiceTemplate[]))();
  }, [id]);

  function patch(p: Partial<Proposal>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
    setDirty(true);
    setNotice(null); // a status line about the last action is stale once editing resumes
  }

  const services = draft?.services ?? [];

  /** Linking a lead fills in blank client fields from it, but never overwrites what's already typed. */
  function linkLead(leadId: string) {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return patch({ leadId: null });
    patch({
      leadId,
      clientCompany: draft?.clientCompany || lead.company,
      clientName: draft?.clientName || lead.contactName || "",
      clientEmail: draft?.clientEmail || lead.email || "",
    });
  }

  function patchService(serviceId: string, p: Partial<ServiceItem>) {
    patch({ services: services.map((s) => (s.id === serviceId ? { ...s, ...p } : s)) });
  }

  function addService(item: ServiceItem) {
    patch({ services: [...services, item] });
  }

  function removeService(serviceId: string) {
    patch({ services: services.filter((s) => s.id !== serviceId) });
  }

  function moveService(index: number, delta: number) {
    const next = [...services];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    patch({ services: next });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    // Send only editable fields: api.proposals.get() returns the whole row
    // (businessId, timestamps and all), and echoing that back as a patch is
    // how tenant-identity columns end up in an UPDATE.
    await api.proposals.update(id, {
      leadId: draft.leadId,
      clientName: draft.clientName,
      clientCompany: draft.clientCompany,
      clientEmail: draft.clientEmail,
      status: draft.status,
      date: draft.date,
      validUntil: draft.validUntil,
      projectOverview: draft.projectOverview,
      notes: draft.notes,
      vatRate: draft.vatRate,
      includeVat: draft.includeVat,
      retainerMode: draft.retainerMode,
      emailText: draft.emailText,
      services,
    });
    setSaving(false);
    setDirty(false);
  }

  async function downloadPdf() {
    if (dirty) await save();
    window.open(api.proposals.pdfUrl(id), "_blank");
  }

  /** Follow-up lives in Tasks & Ops, linked to the same lead, so it surfaces on the dashboard. */
  async function createFollowUpTask() {
    if (!draft) return;
    const due = new Date();
    due.setDate(due.getDate() + 7);
    await api.tasks.create({
      title: `${t("Follow up on proposal")} — ${draft.clientCompany || draft.clientName || draft.title}`,
      notes: `${window.location.origin}/${businessSlug}/proposals/${id}`,
      dueDate: due.toISOString().slice(0, 10),
      priority: "high",
      category: "sales",
      leadId: draft.leadId,
    });
    setNotice(t("Follow-up task created for a week from today."));
  }

  function generateEmail() {
    if (!draft) return;
    const { subject, body } = buildProposalEmail(
      { ...draft, services },
      (studioSettings.studio_name as string) || businessName
    );
    patch({ emailText: `${subject}\n\n${body}` });
    setNotice(t("Draft email generated below — edit it before sending."));
  }

  /** Creates a Gmail draft only. Sending stays behind the Mail module's own confirmation. */
  async function createGmailDraft() {
    if (!draft?.emailText) return;
    if (!draft.clientEmail) return setNotice(t("Add a client email address first."));
    if (dirty) await save();
    const [subject, ...rest] = draft.emailText.split("\n");
    try {
      await api.gmail.createDraft({
        to: draft.clientEmail,
        subject,
        body: rest.join("\n").trimStart(),
      });
      setNotice(t("Draft created in Gmail — review and send it from there."));
    } catch {
      setNotice(t("Could not reach Gmail. Connect a Google account in Settings first."));
    }
  }

  if (!draft) return <div className="page">{t("Loading…")}</div>;

  const totals = computeTotals({
    clientName: draft.clientName,
    services,
    vatRate: draft.vatRate,
    includeVat: draft.includeVat,
  });

  return (
    <div className="page">
      <div className="editor-head">
        <h1>{draft.title}</h1>
        <div className="editor-actions">
          <span className="empty">
            {notice ?? (saving ? t("Saving…") : dirty ? t("Unsaved changes") : t("All changes saved"))}
          </span>
          <button className="secondary" onClick={downloadPdf}>
            {t("Download PDF")}
          </button>
          <button onClick={save} disabled={!dirty || saving}>
            {t("Save")}
          </button>
        </div>
      </div>

      {/* ---- Client ---- */}
      <h2 className="section-head">{t("Client")}</h2>
      <div className="field-grid">
        <div className="settings-field">
          <label>
            {t("Linked lead")}
            {draft.leadId && (
              <>
                {" · "}
                <Link href={`/${businessSlug}/leads/${draft.leadId}`}>{t("open lead")}</Link>
              </>
            )}
          </label>
          <select value={draft.leadId ?? ""} onChange={(e) => linkLead(e.target.value)}>
            <option value="">{t("— none —")}</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.company}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-field">
          <label>{t("Client name")}</label>
          <input value={draft.clientName ?? ""} onChange={(e) => patch({ clientName: e.target.value })} />
        </div>
        <div className="settings-field">
          <label>{t("Company")}</label>
          <input value={draft.clientCompany ?? ""} onChange={(e) => patch({ clientCompany: e.target.value })} />
        </div>
        <div className="settings-field">
          <label>{t("Email")}</label>
          <input value={draft.clientEmail ?? ""} onChange={(e) => patch({ clientEmail: e.target.value })} />
        </div>
        <div className="settings-field">
          <label>{t("Status")}</label>
          <select value={draft.status} onChange={(e) => patch({ status: e.target.value })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="settings-field">
          <label>{t("Proposal date")}</label>
          <input type="date" value={draft.date ?? ""} onChange={(e) => patch({ date: e.target.value })} />
        </div>
        <div className="settings-field">
          <label>{t("Valid until")}</label>
          <input
            type="date"
            value={draft.validUntil ?? ""}
            onChange={(e) => patch({ validUntil: e.target.value })}
          />
        </div>
      </div>

      {/* ---- Overview ---- */}
      <h2 className="section-head">{t("Project overview")}</h2>
      <textarea
        className="editor-textarea"
        rows={5}
        value={draft.projectOverview ?? ""}
        onChange={(e) => patch({ projectOverview: e.target.value })}
      />

      {/* ---- Services ---- */}
      <h2 className="section-head">{t("Services")}</h2>
      <div className="template-row">
        {templates.map((tpl) => (
          <button key={tpl.id} className="secondary" onClick={() => addService(serviceFromTemplate(tpl))}>
            + {tpl.label}
          </button>
        ))}
        <button className="secondary" onClick={() => addService(blankService())}>
          + {t("Blank service")}
        </button>
        <Link href={`/${businessSlug}/proposals/templates`} className="empty" style={{ alignSelf: "center" }}>
          {templates.length === 0 ? t("Set up your service catalogue →") : t("Edit catalogue →")}
        </Link>
      </div>

      {services.length === 0 && <p className="empty">{t("No services yet — add one above.")}</p>}

      {services.map((s, i) => (
        <div key={s.id} className="service-card">
          <div className="service-card-head">
            <input
              className="service-title"
              placeholder={t("Service name")}
              value={s.title}
              onChange={(e) => patchService(s.id, { title: e.target.value })}
            />
            <button className="task-remove" onClick={() => moveService(i, -1)} disabled={i === 0}>
              ↑
            </button>
            <button
              className="task-remove"
              onClick={() => moveService(i, 1)}
              disabled={i === services.length - 1}
            >
              ↓
            </button>
            <button className="task-remove" onClick={() => removeService(s.id)}>
              {t("Remove")}
            </button>
          </div>

          <textarea
            className="editor-textarea"
            rows={3}
            placeholder={t("Short description of the service…")}
            value={s.description}
            onChange={(e) => patchService(s.id, { description: e.target.value })}
          />

          <div className="field-grid">
            <div className="settings-field">
              <label>{t("Setup fee (₪)")}</label>
              <input
                type="number"
                min={0}
                dir="ltr"
                value={s.setupFee || ""}
                onChange={(e) => patchService(s.id, { setupFee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="settings-field">
              <label>{t("Monthly fee (₪)")}</label>
              <input
                type="number"
                min={0}
                dir="ltr"
                value={s.monthlyFee || ""}
                onChange={(e) => patchService(s.id, { monthlyFee: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {s.monthlyFee > 0 && (
            <div className="monthly-block">
              <div className="settings-field">
                <label>{t("Monthly block title")}</label>
                <input
                  placeholder="חבילת תחזוקה ואחסון"
                  value={s.monthlyBlockTitle ?? ""}
                  onChange={(e) => patchService(s.id, { monthlyBlockTitle: e.target.value })}
                />
              </div>
              <div className="settings-field">
                <label>{t("What's included (one per line)")}</label>
                <textarea
                  className="editor-textarea"
                  rows={4}
                  value={s.monthlyBreakdown ?? ""}
                  onChange={(e) => patchService(s.id, { monthlyBreakdown: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* ---- Pricing ---- */}
      <h2 className="section-head">{t("Pricing")}</h2>
      <div className="field-grid">
        <div className="settings-field">
          <label>{t("VAT rate (%)")}</label>
          <input
            type="number"
            min={0}
            dir="ltr"
            value={draft.vatRate ?? 18}
            onChange={(e) => patch({ vatRate: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="settings-field checkbox-field">
          <label>
            <input
              type="checkbox"
              checked={draft.includeVat ?? false}
              onChange={(e) => patch({ includeVat: e.target.checked })}
            />
            {t("Prices already include VAT")}
          </label>
        </div>
        <div className="settings-field checkbox-field">
          <label>
            <input
              type="checkbox"
              checked={draft.retainerMode ?? false}
              onChange={(e) => patch({ retainerMode: e.target.checked })}
            />
            {t("Retainer mode (split one-time / monthly)")}
          </label>
        </div>
      </div>

      <div className="totals-box">
        <div className="totals-row">
          <span>{t("Total setup")}</span>
          <span>₪ {totals.totalSetup.toLocaleString("en-US")}</span>
        </div>
        <div className="totals-row">
          <span>{t("Total monthly")}</span>
          <span>₪ {totals.totalMonthly.toLocaleString("en-US")}</span>
        </div>
        <div className="totals-row">
          <span>{t("First year (setup + 12 months)")}</span>
          <span>₪ {totals.firstYearTotal.toLocaleString("en-US")}</span>
        </div>
        {!draft.includeVat && (
          <div className="totals-row">
            <span>
              {t("VAT")} {draft.vatRate ?? 18}%
            </span>
            <span>₪ {totals.vatAmount.toLocaleString("en-US")}</span>
          </div>
        )}
        <div className="totals-row grand">
          <span>{t("Grand total")}</span>
          <span>₪ {totals.grandTotal.toLocaleString("en-US")}</span>
        </div>
      </div>

      {/* ---- Send & follow up ---- */}
      <h2 className="section-head">{t("Send & follow up")}</h2>
      <div className="template-row">
        <button className="secondary" onClick={generateEmail}>
          {t("Generate cover email")}
        </button>
        <button className="secondary" onClick={createGmailDraft} disabled={!draft.emailText}>
          {t("Create Gmail draft")}
        </button>
        <button className="secondary" onClick={createFollowUpTask}>
          {t("Add follow-up task")}
        </button>
      </div>
      <p className="empty">{t("Drafts only — nothing is sent from here. Review and send from Mail.")}</p>
      {draft.emailText && (
        <textarea
          className="editor-textarea"
          rows={12}
          value={draft.emailText}
          onChange={(e) => patch({ emailText: e.target.value })}
        />
      )}

      {/* ---- Notes ---- */}
      <h2 className="section-head">{t("Notes")}</h2>
      <p className="empty">{t("**bold header** on its own line, * bullet item")}</p>
      <textarea
        className="editor-textarea"
        rows={6}
        value={draft.notes ?? ""}
        onChange={(e) => patch({ notes: e.target.value })}
      />
    </div>
  );
}
