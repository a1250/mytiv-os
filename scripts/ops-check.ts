/**
 * Ops smoke check — proves the ClickUp service returns real data.
 *
 * Ops Home sits behind a login, so this is how the data path is verified
 * without a browser session: same config, same service, same normalisation the
 * page uses. If this prints tasks, the screen has tasks.
 *
 * Run: npm run ops:check
 */
import { clientFoldersFor, stuckThresholdDays, BLOCKED_ON_FIELD } from "../lib/ops-config";
import {
  getOpenTasks,
  getTasksByFolder,
  statsFor,
  ClickUpConfigError,
  ClickUpRateLimitError,
} from "../lib/clickup";

const BUSINESS = process.argv[2] ?? "mytiv";

async function main() {
  const folders = clientFoldersFor(BUSINESS);
  const threshold = stuckThresholdDays();

  console.log(`business: ${BUSINESS}`);
  console.log(`folders:  ${folders.map((f) => `${f.label}(${f.clickupFolderId})`).join(", ") || "none"}`);
  console.log(`stuck threshold: ${threshold} days\n`);

  if (folders.length === 0) {
    console.log("No folders mapped — nothing to check.");
    return;
  }

  const open = await getOpenTasks(folders);
  const stats = statsFor(open, threshold);

  console.log(`stats: stuck=${stats.stuck} overdue=${stats.overdue} openTasks=${stats.openTasks} openBugs=${stats.openBugs}\n`);

  const perFolder = new Map<string, number>();
  for (const t of open) perFolder.set(t.clientLabel, (perFolder.get(t.clientLabel) ?? 0) + 1);
  console.log("open per client:");
  for (const f of folders) console.log(`  ${f.label.padEnd(10)} ${perFolder.get(f.label) ?? 0}`);

  const stuck = open.filter((t) => t.daysIdle >= threshold).sort((a, b) => b.daysIdle - a.daysIdle);
  console.log(`\nstuck (${stuck.length}), worst first:`);
  for (const t of stuck.slice(0, 15)) {
    const who = t.assignee?.name ?? "unassigned";
    const due = t.dueDate ? (t.overdue ? `${t.dueDate} OVERDUE` : t.dueDate) : "no date";
    console.log(
      `  ${String(t.daysIdle).padStart(3)}d  ${t.clientLabel.padEnd(9)} ${who.padEnd(14)} ${due.padEnd(18)} ${t.title.slice(0, 62)}`
    );
  }
  if (stuck.length > 15) console.log(`  … ${stuck.length - 15} more`);

  // Unfiltered view, so it is visible what the folders actually hold and what
  // the Ops view is dropping on purpose.
  console.log("\nraw rows per list (decisions are excluded from everything above):");
  for (const f of folders) {
    const raw = await getTasksByFolder(f);
    if (raw.length === 0) continue;
    const byList = new Map<string, number>();
    for (const t of raw) byList.set(t.listName || "(no list)", (byList.get(t.listName || "(no list)") ?? 0) + 1);
    for (const [list, n] of byList) {
      console.log(`  ${f.label.padEnd(9)} ${list.padEnd(16)} ${n}`);
    }
  }

  const withField = open.filter((t) => t.blockedOn !== null).length;
  console.log(`\n"${BLOCKED_ON_FIELD}" set on ${withField} of ${open.length} open tasks`);
  console.log(`no due date on ${open.filter((t) => !t.dueDate).length} of ${open.length}`);
  console.log(`unassigned on ${open.filter((t) => !t.assignee).length} of ${open.length}`);
}

main().catch((err) => {
  if (err instanceof ClickUpConfigError) console.error(`CONFIG: ${err.message}`);
  else if (err instanceof ClickUpRateLimitError)
    console.error(`RATE LIMIT: retry after ${err.retryAfterSeconds ?? "unknown"}s`);
  else console.error(err);
  process.exit(1);
});
