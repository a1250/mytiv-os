"use client";

/**
 * Studio identity + Google Account connection (Phase 2). AI Provider /
 * Higgsfield connection UI land in Phase 4 alongside those integrations.
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApi, useStudio, useT } from "@/components/studio-provider";

type GoogleStatus = { configured: boolean; connected: boolean; email: string; gmail: boolean; calendar: boolean };

export default function SettingsPage() {
  const { settings, setSetting } = useStudio();
  const api = useApi();
  const t = useT();
  const searchParams = useSearchParams();
  const [studioName, setStudioName] = useState((settings.studio_name as string) || "");
  const [accentColor, setAccentColor] = useState((settings.accent_color as string) || "#6366f1");
  const [savedFlash, setSavedFlash] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  async function loadGoogleStatus() {
    setGoogleStatus((await api.google.status()) as GoogleStatus);
  }

  useEffect(() => {
    loadGoogleStatus();
  }, []);

  async function handleSave() {
    await setSetting("studio_name", studioName);
    await setSetting("accent_color", accentColor);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  async function handleDisconnect() {
    await api.google.disconnect();
    await loadGoogleStatus();
  }

  async function handleLogoChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { url } = await api.upload.image(file, "logo");
      await setSetting("logo_url", url);
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleLogoClear() {
    await setSetting("logo_url", "");
  }

  const googleConnected = searchParams.get("google_connected");
  const googleError = searchParams.get("google_error");

  const [aiStatus, setAiStatus] = useState<{ configured: boolean } | null>(null);
  const [aiKeyInput, setAiKeyInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => setAiStatus((await api.ai.status()) as { configured: boolean }))();
  }, []);

  async function handleAiSave() {
    setAiBusy(true);
    setAiMessage(null);
    try {
      await api.ai.setKey(aiKeyInput.trim());
      setAiKeyInput("");
      setAiStatus((await api.ai.status()) as { configured: boolean });
      setAiMessage(t("Key saved. Run a test to confirm it works."));
    } catch {
      setAiMessage(t("Could not save the key."));
    }
    setAiBusy(false);
  }

  async function handleAiTest() {
    setAiBusy(true);
    setAiMessage(null);
    const res = (await api.ai.test()) as { ok: boolean; error?: string };
    setAiMessage(res.ok ? t("Connection works.") : `${t("Test failed")}: ${res.error ?? ""}`);
    setAiBusy(false);
  }

  async function handleAiClear() {
    setAiBusy(true);
    await api.ai.clearKey();
    setAiStatus((await api.ai.status()) as { configured: boolean });
    setAiMessage(t("Key removed."));
    setAiBusy(false);
  }

  return (
    <div className="page">
      <h1>{t("Settings")}</h1>

      <h2 style={{ fontSize: 15, marginBottom: 12 }}>{t("Studio identity")}</h2>
      <div className="settings-form">
        <div className="settings-field">
          <label>{t("Studio name")}</label>
          <input value={studioName} onChange={(e) => setStudioName(e.target.value)} />
        </div>
        <div className="settings-field">
          <label>{t("Accent color")}</label>
          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
        </div>
        <div className="settings-field">
          <label>{t("Logo")}</label>
          {settings.logo_url ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={settings.logo_url as string} alt="logo" style={{ width: 40, height: 40, borderRadius: 8 }} />
              <button className="secondary" onClick={handleLogoClear}>
                {t("Remove")}
              </button>
            </div>
          ) : (
            <input type="file" accept="image/*" onChange={handleLogoChosen} disabled={logoUploading} />
          )}
          {logoUploading && <span className="empty">{t("Uploading…")}</span>}
        </div>
        <button onClick={handleSave}>{t("Save")}</button>
        {savedFlash && <span className="empty">{t("Saved")}</span>}
      </div>

      <h2 style={{ fontSize: 15, margin: "28px 0 12px" }}>{t("Claude API")}</h2>
      <p className="empty">
        {t("Powers the AI passes in Weekly Review, Outreach, Brief Analyzer and Prompt Builder. Without a key those modules still work — they fall back to their built-in logic.")}
      </p>
      <div className="settings-form">
        {aiStatus?.configured ? (
          <>
            <p className="empty" style={{ color: "#5bc98c" }}>{t("A key is stored for this business.")}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="secondary" onClick={handleAiTest} disabled={aiBusy}>
                {aiBusy ? t("Testing…") : t("Test connection")}
              </button>
              <button className="secondary" onClick={handleAiClear} disabled={aiBusy}>
                {t("Remove key")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="settings-field">
              <label>{t("Anthropic API key")}</label>
              <input
                type="password"
                autoComplete="off"
                placeholder="sk-ant-…"
                value={aiKeyInput}
                onChange={(e) => setAiKeyInput(e.target.value)}
              />
            </div>
            <button onClick={handleAiSave} disabled={aiBusy || !aiKeyInput.trim()}>
              {aiBusy ? t("Saving…") : t("Save key")}
            </button>
          </>
        )}
        {aiMessage && <span className="empty">{aiMessage}</span>}
      </div>

      <h2 style={{ fontSize: 15, margin: "28px 0 12px" }}>{t("Google Account")}</h2>
      {googleConnected && <p className="empty" style={{ color: "#5bc98c" }}>{t("Google account connected.")}</p>}
      {googleError && <p className="empty" style={{ color: "#f0655a" }}>{t("Google connection failed")}: {googleError}</p>}

      {googleStatus?.connected ? (
        <div className="settings-form">
          <p>{googleStatus.email}</p>
          <p className="lead-meta">
            Gmail: {googleStatus.gmail ? "✓" : "—"} · Calendar: {googleStatus.calendar ? "✓" : "—"}
          </p>
          <button className="secondary" onClick={handleDisconnect}>
            {t("Disconnect")}
          </button>
        </div>
      ) : (
        <div className="settings-form">
          <p className="empty">{t("Not connected.")}</p>
          <button onClick={() => api.google.connect()}>{t("Connect Google Account")}</button>
        </div>
      )}
    </div>
  );
}
