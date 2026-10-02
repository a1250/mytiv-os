import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./focus.css";
import { FocusTopBar } from "@/components/focus/shell";

/** Open Sans with Hebrew + Latin, exposed as --font-focus (the board's typeface). */
const openSans = Open_Sans({ subsets: ["latin", "hebrew"], variable: "--font-focus", display: "swap" });

export const metadata: Metadata = {
  title: "Mytiv OS — Focus",
  description: "Direction C — Focus. Prototype on temporary data.",
};

/**
 * Focus prototype shell. Self-contained and RTL: it sets its own typeface and light theme under `.focus-app`,
 * so it never touches the legacy dark app. The switcher per route is set by each page via a context-free default
 * here; project pages render their own top bar with the client name.
 */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${openSans.variable} focus-app`} dir="rtl" lang="he">
      <FocusTopBar />
      {children}
    </div>
  );
}
