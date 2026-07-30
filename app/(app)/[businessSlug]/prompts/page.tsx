"use client";

import { useState } from "react";
import { useApi, useT } from "@/components/studio-provider";
import { PROFILES, FIELD_GROUPS, OUTPUT_TYPES, buildPromptPackage, qualityChecklist } from "@/lib/services/promptEngine";
import { askClaude } from "@/lib/ai/ask-claude";

type Section = { id: string; label: string; text: string };
type Check = { ok: boolean; text: string };

export default function PromptBuilderPage() {
  const api = useApi();
  const t = useT();
  const [toolId, setToolId] = useState("midjourney");
  const [outputType, setOutputType] = useState("image");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<Section[] | null>(null);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [refining, setRefining] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  function setField(id: string, value: string) {
    setFields((f) => ({ ...f, [id]: value }));
  }

  async function handleGenerate() {
    setRefining(true);
    setAiNote(null);

    // The local package encodes each tool's exact syntax rules — Claude may
    // only rewrite the prose of the main prompt, never the structure around it.
    const local = buildPromptPackage(toolId, fields, outputType) as Section[];
    setChecks(qualityChecklist(toolId, fields, outputType));

    const main = local.find((s) => s.id === "prompt");
    if (!main) {
      setOutput(local);
      setRefining(false);
      return;
    }

    const refined = await askClaude<string>(api, {
      json: false,
      maxTokens: 900,
      onError: (msg) => setAiNote(`${t("Built without Claude")}: ${msg}`),
      prompt: [
        `This is a generation prompt for the tool "${toolId}" (${outputType}). It was built with that tool's exact syntax rules.`,
        "---",
        main.text,
        "---",
        "Rewrite it to be more vivid and specific FOR THIS SAME TOOL. Hard rules:",
        "- Preserve every parameter flag, syntax token, ordering convention and structural element exactly as-is.",
        "- Do not add parameters the tool does not support. Do not convert to another tool's style.",
        "- Keep roughly the same length. Return only the rewritten prompt text.",
      ].join("\n"),
    });

    setOutput(
      typeof refined === "string" && refined.trim().length > 30
        ? local.map((s) => (s.id === "prompt" ? { ...s, text: refined.trim(), label: `${s.label} · Claude` } : s))
        : local
    );
    setRefining(false);
  }

  async function handleSave() {
    if (!output) return;
    await api.prompts.createSaved({
      title: fields.subject || `${toolId} — ${outputType}`,
      tool: toolId,
      outputType,
      fields: JSON.stringify(fields),
      output: JSON.stringify(output),
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  return (
    <div className="page">
      <h1>{t("Prompt Builder")}</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={toolId} onChange={(e) => setToolId(e.target.value)}>
          {PROFILES.map((p: { id: string; name: string }) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={outputType} onChange={(e) => setOutputType(e.target.value)}>
          {OUTPUT_TYPES.map((o: { id: string; label: string }) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          {FIELD_GROUPS.map((group: { label: string; fields: { id: string; label: string; textarea?: boolean; placeholder?: string }[] }) => (
            <div key={group.label} style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 8 }}>{group.label}</h2>
              <div className="settings-form">
                {group.fields.map((f) => (
                  <div key={f.id} className="settings-field">
                    <label>{f.label}</label>
                    {f.textarea ? (
                      <textarea
                        value={fields[f.id] || ""}
                        onChange={(e) => setField(f.id, e.target.value)}
                        placeholder={f.placeholder}
                        rows={2}
                        style={{ width: "100%", background: "var(--panel)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: 8 }}
                      />
                    ) : (
                      <input value={fields[f.id] || ""} onChange={(e) => setField(f.id, e.target.value)} placeholder={f.placeholder} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleGenerate} disabled={refining}>
            {refining ? t("Generating…") : t("Generate")}
          </button>
          {aiNote && <span className="empty">{aiNote}</span>}
        </div>

        <div style={{ flex: 1 }}>
          {output ? (
            <>
              {output.map((s) => (
                <div key={s.id} className="task-row" style={{ display: "block", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 12.5 }}>{s.text}</div>
                </div>
              ))}
              {checks && (
                <div style={{ marginTop: 16 }}>
                  <h2 style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 8 }}>{t("Quality checklist")}</h2>
                  {checks.map((c, i) => (
                    <div key={i} style={{ fontSize: 12.5, color: c.ok ? "#5bc98c" : "var(--text-dim)", marginBottom: 4 }}>
                      {c.ok ? "✓" : "○"} {c.text}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleSave} style={{ marginTop: 14 }}>
                {t("Save to Library")}
              </button>
              {savedFlash && <span className="empty" style={{ marginInlineStart: 8 }}>{t("Saved")}</span>}
            </>
          ) : (
            <p className="empty">{t("Fill in the fields and generate to see the prompt here.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
