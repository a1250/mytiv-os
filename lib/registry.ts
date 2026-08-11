/**
 * Module/nav registry — ported from the Electron app's src/modules/registry.js.
 * Drives both the Sidebar and the [businessSlug] route tree. Paths here are
 * relative to a business workspace (e.g. "tasks" -> /{businessSlug}/tasks).
 */

export type NavItem = { id: string; label: string; path: string; icon: string };
export type NavSection = { label: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Ops",
    items: [
      { id: "ops", label: "Ops Home", path: "ops", icon: "activity" },
      { id: "projects", label: "Projects", path: "ops/projects", icon: "folder" },
      { id: "money", label: "Money", path: "ops/money", icon: "banknote" },
    ],
  },
  {
    label: "Studio",
    items: [
      { id: "dashboard", label: "Dashboard", path: "", icon: "home" },
      { id: "tasks", label: "Tasks & Ops", path: "tasks", icon: "check-square" },
      { id: "leads", label: "Lead CRM", path: "leads", icon: "users" },
      { id: "outreach", label: "Outreach Assistant", path: "outreach", icon: "send" },
      { id: "mail", label: "Mail", path: "mail", icon: "mail" },
      { id: "calendar", label: "Calendar", path: "calendar", icon: "calendar" },
      { id: "radar", label: "AI Weekly Radar", path: "radar", icon: "radar" },
    ],
  },
  {
    label: "Create",
    items: [
      { id: "prompt-builder", label: "Prompt Builder", path: "prompts", icon: "wand" },
      { id: "prompt-library", label: "Prompt Library", path: "prompts/library", icon: "book" },
      { id: "carousel", label: "Carousel Studio", path: "carousel", icon: "layout" },
      { id: "proposals", label: "Proposals", path: "proposals", icon: "file-text" },
      { id: "briefs", label: "Brief Analyzer", path: "briefs", icon: "clipboard" },
    ],
  },
  {
    label: "Library",
    items: [
      { id: "inspiration", label: "Inspiration", path: "inspiration", icon: "image" },
      { id: "moodboards", label: "Moodboards", path: "moodboards", icon: "grid" },
    ],
  },
  {
    label: "Review",
    items: [{ id: "review", label: "Weekly Review", path: "review", icon: "bar-chart" }],
  },
];

/** Project Hub graduated out of here in Phase 1 — it is the Ops › Projects entry above. */
export const FUTURE_MODULES: NavItem[] = [];
