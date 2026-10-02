"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Theme: light / dark / system, remembered per browser. The choice is applied to <html data-f-theme> by an inline
 * script before first paint (ThemeScript, rendered at the top of the Focus layout), so there is no flash; "system"
 * removes the attribute and the tokens follow prefers-color-scheme (light-dark() in focus.css).
 */
export type ThemePref = "light" | "dark" | "system";
export const THEME_KEY = "mytiv-focus-theme";

const SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});var d=document.documentElement;if(t==="light"||t==="dark"){d.setAttribute("data-f-theme",t)}else{d.removeAttribute("data-f-theme")}}catch(e){}})();`;

/** Blocking inline script — must render before the Focus content. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}

const listeners = new Set<() => void>();
function read(): ThemePref {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => { if (e.key === THEME_KEY) { apply(read()); fn(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}
function apply(p: ThemePref) {
  const d = document.documentElement;
  if (p === "system") d.removeAttribute("data-f-theme");
  else d.setAttribute("data-f-theme", p);
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, read, () => "system" as ThemePref);
  const setPref = useCallback((p: ThemePref) => {
    try { if (p === "system") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, p); } catch { /* storage blocked: applies for this page only */ }
    apply(p);
    listeners.forEach((l) => l());
  }, []);
  return { pref, setPref };
}

export const THEME_OPTIONS: { value: ThemePref; label: string; icon: "sun" | "moon" | "monitor" }[] = [
  { value: "light", label: "בהיר", icon: "sun" },
  { value: "dark", label: "כהה", icon: "moon" },
  { value: "system", label: "לפי המערכת", icon: "monitor" },
];
