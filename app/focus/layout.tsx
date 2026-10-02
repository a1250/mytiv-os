import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Open_Sans } from "next/font/google";
import "./focus.css";
import "@/components/focus/ui/ui.css";
import "@/components/focus/shell/shell.css";
import "@/components/focus/patterns/patterns.css";
import "@/components/focus/patterns/work/work.css";
import "@/components/focus/patterns/approval/approval.css";
import { DemoStoreProvider } from "@/components/focus/shell/demo-store";
import { ThemeScript } from "@/components/focus/shell/theme";
import { FocusTopBar, ScreenMapButton } from "@/components/focus/shell/top-bar";
import { ToastProvider } from "@/components/focus/ui/toast";

/** Open Sans (Hebrew + Latin, 400–800) as --font-focus; IBM Plex Mono for timers, e-mails and codes. */
const openSans = Open_Sans({ subsets: ["latin", "hebrew"], variable: "--font-focus", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Mytiv OS — Focus",
  description: "Direction C — Focus. Prototype on temporary data (fixtures); no backend is connected.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

/**
 * Focus shell. Self-contained and RTL: its own typefaces, tokens (on :root while mounted) and theme, so the legacy
 * dark app is untouched. ThemeScript runs before any content paints (no theme flash). The demo store stands in for
 * the backend; the toast region announces results politely (errors assertively).
 */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${openSans.variable} ${plexMono.variable} focus-app`} dir="rtl" lang="he">
      <ThemeScript />
      <a href="#main" className="f-skip">דלג לתוכן</a>
      <DemoStoreProvider>
        <ToastProvider>
          <FocusTopBar />
          <main id="main" tabIndex={-1} className="f-main">{children}</main>
          <ScreenMapButton />
        </ToastProvider>
      </DemoStoreProvider>
    </div>
  );
}
