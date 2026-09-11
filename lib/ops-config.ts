/**
 * Which ClickUp folders belong to which business, and what the lists inside a
 * client folder are called.
 *
 * Phase 0 only. In Phase 1 this table is replaced by `projects.clickupFolderId`
 * and this file shrinks to the list-name constants. Until then the mapping is
 * checked in, because it is workspace structure — not a secret and not user data.
 *
 * Keyed by business slug so a second tenant can never read Mytiv's folders:
 * an unknown slug returns an empty list, not a default.
 *
 * Folder IDs, never folder names. The names carry emoji prefixes and get
 * renamed; the IDs do not.
 */

export type ClientFolder = {
  /** Stable key used in URLs and filters. */
  key: string;
  /** Display name. Kept short — it sits in a table cell. */
  label: string;
  clickupFolderId: string;
  /** Mytiv's own internal folder — real work, but not client-facing. */
  internal?: boolean;
};

export const OPS_CLIENT_FOLDERS: Record<string, ClientFolder[]> = {
  mytiv: [
    { key: "ap", label: "AP", clickupFolderId: "901816026300" },
    { key: "360cctv", label: "360CCTV", clickupFolderId: "901816026301" },
    { key: "paseo", label: "Paseo", clickupFolderId: "901816026302" },
    { key: "umino", label: "UMINO", clickupFolderId: "901816026303" },
    { key: "mytiv", label: "מיטיב", clickupFolderId: "901816026304", internal: true },
  ],
};

/**
 * What each list inside a client folder means.
 *
 * Matched by name because list IDs differ per folder, which makes this the one
 * place in the module that depends on a string. So it accepts both languages
 * and ignores case and surrounding whitespace: the folders were built by hand
 * and by a browser agent, and they already disagree — AP has "יומן החלטות"
 * while 360CCTV has "Tasks" and "Bugs". A list whose name matches nothing is
 * classified "other" and left out of every count rather than guessed at.
 */
export const OPS_LIST_ALIASES = {
  tasks: ["משימות", "tasks", "task"],
  bugs: ["תקלות", "תקלה", "bugs", "bug", "issues"],
  decisions: ["יומן החלטות", "החלטות", "decisions", "decision log"],
} as const;

export type ListKind = keyof typeof OPS_LIST_ALIASES | "other";

export function classifyList(listName: string): ListKind {
  const name = listName.trim().toLowerCase();
  for (const [kind, aliases] of Object.entries(OPS_LIST_ALIASES)) {
    if ((aliases as readonly string[]).some((a) => a.toLowerCase() === name)) return kind as ListKind;
  }
  return "other";
}

/**
 * ClickUp custom field that records who a task is waiting on.
 * Created by hand in the ClickUp UI — the API cannot create custom fields.
 * Type: Dropdown. Options must be exactly these three labels.
 */
export const BLOCKED_ON_FIELD = "Blocked On";
export const BLOCKED_ON_VALUES = ["Client", "Contractor", "Me"] as const;
export type BlockedOn = (typeof BLOCKED_ON_VALUES)[number];

export function clientFoldersFor(businessSlug: string): ClientFolder[] {
  return OPS_CLIENT_FOLDERS[businessSlug] ?? [];
}

/**
 * A project row seen as a ClickUp folder. This is the Phase 1 handover: once a
 * business has projects carrying a clickupFolderId, the hardcoded map above
 * stops being consulted. `key` is the project id so every Ops row can link
 * straight back to its client workspace.
 */
export function folderFromProject(project: {
  id: string;
  name: string;
  clickupFolderId: string | null;
}): ClientFolder | null {
  if (!project.clickupFolderId) return null;
  return { key: project.id, label: project.name, clickupFolderId: project.clickupFolderId };
}

/**
 * The folders an Ops screen should read for this business: linked projects when
 * there are any, otherwise the checked-in map so Phase 0 keeps working on a
 * database with no projects yet.
 */
export function foldersForBusiness(
  businessSlug: string,
  linkedProjects: { id: string; name: string; clickupFolderId: string | null }[]
): ClientFolder[] {
  const allowed = new Set(clientFoldersFor(businessSlug).map(f => f.clickupFolderId));
  const fromDb = linkedProjects.filter(p => p.clickupFolderId && allowed.has(p.clickupFolderId)).map(folderFromProject).filter((f): f is ClientFolder => f !== null);
  return fromDb.length > 0 ? fromDb : clientFoldersFor(businessSlug);
}

/**
 * Days without a ClickUp update before a task counts as stuck.
 * 0 is allowed and means "every open task" — useful for proving the screen
 * renders without waiting for real idleness to accumulate.
 */
export function stuckThresholdDays(): number {
  const raw = Number(process.env.STUCK_THRESHOLD_DAYS);
  return Number.isFinite(raw) && raw >= 0 ? raw : 3;
}
