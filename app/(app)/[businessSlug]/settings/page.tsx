"use client";

/**
 * Studio identity only for Phase 1 (name, accent color, language) — AI
 * Provider / Google Account / Higgsfield connection UI land in Phase 2-4
 * alongside the actual integrations, per the plan.
 */
import { useState } from "react";
import { useStudio, useT } from "@/components/studio-provider";

export default function SettingsPage() {
  const { settings, setSetting } = useStudio();
  const t = useT();
  const [studioName, setStudioName] = useState((settings.studio_name as string) || "");
  const [accentColor, setAccentColor] = useState((settings.accent_color as string) || "#6366f1");
  const [savedFlash, setSavedFlash] = useState(false);

  async function handleSave() {
    await setSetting("studio_name", studioName);
    await setSetting("accent_color", accentColor);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
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
        <button onClick={handleSave}>{t("Save")}</button>
        {savedFlash && <span className="empty">{t("Saved")}</span>}
      </div>
    </div>
  );
}
