"use client";

/**
 * Ported from the Electron app's src/components/StudioContext.jsx. Same
 * shape (useStudio()/useT()), but settings are now business-scoped (passed
 * in as initialSettings from a Server Component that already resolved the
 * business via lib/tenant.ts) instead of a single global untenanted row.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createApiClient, type ApiClient } from "@/lib/api-client";
import { makeT, type Lang } from "@/lib/i18n";

type Settings = Record<string, unknown> & {
  studio_name?: string;
  owner_name?: string;
  accent_color?: string;
  default_language?: Lang;
  logo_url?: string;
};

type StudioContextValue = {
  settings: Settings;
  setSetting: (key: string, value: unknown) => Promise<void>;
  refresh: () => Promise<void>;
  t: (s: string) => string;
  lang: Lang;
  api: ApiClient;
  businessSlug: string;
  /** Display name of the active business — the fallback when studio_name isn't set. */
  businessName: string;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({
  businessSlug,
  businessName,
  initialSettings,
  children,
}: {
  businessSlug: string;
  businessName: string;
  initialSettings: Settings;
  children: React.ReactNode;
}) {
  const api = useMemo(() => createApiClient(businessSlug), [businessSlug]);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const lang = (settings.default_language as Lang) || "en";
  const t = useMemo(() => makeT(lang), [lang]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", settings.accent_color || "#6366f1");
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [settings.accent_color, lang]);

  async function setSetting(key: string, value: unknown) {
    await api.settings.set(key, value);
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function refresh() {
    const fresh = (await api.settings.getAll()) as Settings;
    setSettings(fresh);
  }

  return (
    <StudioContext.Provider value={{ settings, setSetting, refresh, t, lang, api, businessSlug, businessName }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio() must be used within a StudioProvider");
  return ctx;
}

export function useT() {
  return useStudio().t;
}

export function useApi() {
  return useStudio().api;
}
