"use client";

import { useEffect, useState } from "react";
import { useApi, useT } from "@/components/studio-provider";
import { analyzeBriefHeuristic } from "@/lib/services/briefAnalyzer";

type BriefSummary = { id: string; title: string; clientName: string | null; status: string };
type Analysis = {
  summary: string[];
  missing: string[];
  deliverables: string[];
  risks: { risk: string; severity: string }[];
  replies: { en_email: string; he_email: string };
};

export default function BriefAnalyzerPage() {
  const api = useApi();
  const t = useT();
  const [briefs, setBriefs] = useState<BriefSummary[] | null>(null);
  const [rawText, setRawText] = useState("");
  const [clientName, setClientName] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function load() {
    setBriefs((await api.briefs.list()) as BriefSummary[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!rawText.trim()) return;
    setAnalyzing(true);
    try {
      const result = analyzeBriefHeuristic({ rawText, clientName }) as Analysis;
      setAnalysis(result);
      await api.briefs.create({
        title: clientName ? `Brief — ${clientName}` : "New brief",
        clientName,
        rawText,
        analysis: result,
      });
      await load();
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="page">
      <h1>{t("Brief Analyzer")}</h1>

      <form onSubmit={handleAnalyze} className="settings-form" style={{ marginBottom: 24 }}>
        <div className="settings-field">
          <label>{t("Client name")}</label>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div className="settings-field">
          <label>{t("Paste the brief")}</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={6}
            style={{ width: "100%", background: "var(--panel)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}
          />
        </div>
        <button type="submit" disabled={analyzing}>
          {analyzing ? t("Analyzing…") : t("Analyze")}
        </button>
      </form>

      {analysis && (
        <div className="settings-form" style={{ marginBottom: 24, maxWidth: "none" }}>
          <div>
            <h2 style={{ fontSize: 14, marginBottom: 6 }}>{t("Summary")}</h2>
            {analysis.summary.map((s, i) => (
              <p key={i} className="lead-meta">{s}</p>
            ))}
          </div>
          {analysis.missing.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, marginBottom: 6 }}>{t("Missing information")}</h2>
              {analysis.missing.map((s, i) => (
                <p key={i} className="lead-meta">{s}</p>
              ))}
            </div>
          )}
          {analysis.risks.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, marginBottom: 6 }}>{t("Risks")}</h2>
              {analysis.risks.map((r, i) => (
                <p key={i} className="lead-meta">{r.risk} ({r.severity})</p>
              ))}
            </div>
          )}
        </div>
      )}

      <h2 style={{ fontSize: 15, marginBottom: 8 }}>{t("Past briefs")}</h2>
      <div className="task-list">
        {!briefs && <p className="empty">{t("Loading…")}</p>}
        {briefs?.length === 0 && <p className="empty">{t("No briefs analyzed yet.")}</p>}
        {briefs?.map((b) => (
          <div key={b.id} className="task-row">
            <span className="task-title">{b.title}</span>
            <span className="lead-meta">{b.clientName}</span>
            <span className="pill">{b.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
