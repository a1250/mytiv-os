"use client";

import { useEffect, useState } from "react";
import { useApi, useT } from "@/components/studio-provider";
import { analyzeBriefHeuristic } from "@/lib/services/briefAnalyzer";
import { askClaude } from "@/lib/ai/ask-claude";

type BriefSummary = { id: string; title: string; clientName: string | null; status: string };
type Analysis = {
  summary: string[];
  missing: string[];
  deliverables: string[];
  risks: { risk: string; severity: string }[];
  replies: { en_email: string; he_email: string };
  source?: string;
};

export default function BriefAnalyzerPage() {
  const api = useApi();
  const t = useT();
  const [briefs, setBriefs] = useState<BriefSummary[] | null>(null);
  const [rawText, setRawText] = useState("");
  const [clientName, setClientName] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

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
    setAiNote(null);
    try {
      // Heuristic structure is the source of truth; Claude only sharpens the
      // summary and the suggested replies, and only where it returns usable text.
      const local = analyzeBriefHeuristic({ rawText, clientName }) as Analysis;

      const ai = await askClaude<{ summary?: string[] | string; replies?: Record<string, string> }>(api, {
        maxTokens: 1600,
        onError: (msg) => setAiNote(`${t("Analyzed without Claude")}: ${msg}`),
        prompt: [
          "A client sent this (possibly messy) brief:",
          "---",
          rawText.slice(0, 4000),
          "---",
          "Improve these parts of our analysis. Return JSON only:",
          '{"summary": ["3-5 sharp sentences: what they want, budget/deadline signals, what kind of client this is"],',
          ' "replies": {"en_email": "improved English reply", "he_email": "improved Hebrew reply"}}',
        ].join("\n"),
      });

      const result: Analysis = { ...local, source: "local" };
      if (ai) {
        const summary = Array.isArray(ai.summary)
          ? ai.summary.filter((x): x is string => typeof x === "string")
          : typeof ai.summary === "string"
            ? [ai.summary]
            : [];
        if (summary.length > 0) {
          result.summary = summary;
          result.source = "claude";
        }
        // Replace a reply only when Claude actually returned usable text —
        // a short or missing value must not blank out the heuristic one.
        for (const key of ["en_email", "he_email"] as const) {
          const value = ai.replies?.[key];
          if (typeof value === "string" && value.trim().length > 20) {
            result.replies = { ...result.replies, [key]: value };
            result.source = "claude";
          }
        }
      }
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
        {analysis?.source === "claude" && <span className="pill">Claude</span>}
        {aiNote && <span className="empty">{aiNote}</span>}
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
