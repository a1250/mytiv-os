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

  const googleConnected = searchParams.get("google_connected");
  const googleError = searchParams.get("google_error");

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
        <button onClick={handleSave}>{t("Save")}</button>
        {savedFlash && <span className="empty">{t("Saved")}</span>}
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
