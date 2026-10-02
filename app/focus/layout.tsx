import type { Metadata } from "next";
import { Open_Sans, IBM_Plex_Mono } from "next/font/google";
import "./focus.css";
import { FocusTopBar, ScreenMapButton } from "@/components/focus/shell";

/** Open Sans with Hebrew + Latin, exposed as --font-focus (the board's typeface). */
const openSans = Open_Sans({ subsets: ["latin", "hebrew"], variable: "--font-focus", display: "swap" });
/** IBM Plex Mono for emails, codes and keyboard shortcuts (tabular numerals). */
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Mytiv OS — Focus",
  description: "Direction C — Focus. Prototype on temporary data.",
};

/**
 * Focus prototype shell. Self-contained and RTL: its own typefaces and theme under `.focus-app`, so the legacy
 * dark app is untouched. The top bar takes its state (active item, switcher, bell) from the screen registry.
 */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${openSans.variable} ${plexMono.variable} focus-app`} dir="rtl" lang="he">
      <FocusTopBar />
      {children}
      <ScreenMapButton />
    </div>
  );
}
