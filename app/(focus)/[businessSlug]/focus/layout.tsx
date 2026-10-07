import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Open_Sans } from "next/font/google";
import "./focus.css";
import "@/components/focus/ui/ui.css";
import "@/components/focus/shell/shell.css";
import "@/components/focus/patterns/patterns.css";
import "@/components/focus/patterns/work/work.css";
import "@/components/focus/patterns/approval/approval.css";
import "@/components/focus/patterns/project/project.css";
import "@/components/focus/patterns/studio/studio.css";
import "@/components/focus/patterns/sales/sales.css";
import "@/components/focus/patterns/reports/reports.css";
import "@/components/focus/patterns/clients/clients.css";
import "@/components/focus/patterns/comms/comms.css";
import "@/components/focus/patterns/marketing/marketing.css";
import "@/components/focus/patterns/plan/plan.css";
import { fixturesAllowed, requireBusinessScope } from "@/lib/focus/scope";
import { getFocusScope } from "@/lib/focus/scope.server";
import { DemoStoreProvider } from "@/components/focus/shell/demo-store";
import { FocusNotConnected } from "@/components/focus/shell/not-connected";
import { NavGuardProvider } from "@/components/focus/shell/nav-guard";
import { FocusScopeProvider } from "@/components/focus/shell/scope";
import { ThemeScript } from "@/components/focus/shell/theme";
import { FocusTopBar, ScreenMapButton } from "@/components/focus/shell/top-bar";
import { ToastProvider } from "@/components/focus/ui/toast";

/** Open Sans (Hebrew + Latin, 400–800) as --font-focus; IBM Plex Mono for timers, e-mails and codes. */
const openSans = Open_Sans({ subsets: ["latin", "hebrew"], variable: "--font-focus", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Mytiv OS — Focus",
  description: "Direction C — Focus.",
  robots: { index: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

/**
 * Focus shell, mounted under the canonical tenant segment (/{businessSlug}/focus). Every request is scoped on the
 * server first (lib/focus/scope.server.ts — same trust model as lib/api-guard.ts): no session → /login, not a member
 * → 404, demo scope → only where prototype surfaces are on.
 *
 * Data boundary: Focus has no adapters yet, so only the demo scope renders the screens (fixtures + demo store).
 * A verified business gets an honest "not connected yet" page — fixtures are never shown as a business's data.
 *
 * Self-contained and RTL: its own typefaces, tokens (on :root while mounted) and theme, so the legacy dark app is
 * untouched. ThemeScript runs before any content paints (no theme flash).
 */
export default async function FocusLayout({ children, params }: { children: React.ReactNode; params: Promise<{ businessSlug: string }> }) {
  const scope = await getFocusScope((await params).businessSlug);
  return (
    // suppressHydrationWarning: ThemeScript sets data-f-theme on this element before React hydrates it
    <div className={`${openSans.variable} ${plexMono.variable} focus-app`} dir="rtl" lang="he" suppressHydrationWarning>
      <ThemeScript />
      <a href="#main" className="f-skip">דלג לתוכן</a>
      <FocusScopeProvider scope={scope}>
        {fixturesAllowed(scope) ? (
          <DemoStoreProvider>
            <ToastProvider>
              <NavGuardProvider>
                <FocusTopBar />
                <main id="main" tabIndex={-1} className="f-main">{children}</main>
                <ScreenMapButton />
              </NavGuardProvider>
            </ToastProvider>
          </DemoStoreProvider>
        ) : (
          <main id="main" tabIndex={-1} className="f-main"><FocusNotConnected scope={requireBusinessScope(scope)} /></main>
        )}
      </FocusScopeProvider>
    </div>
  );
}
