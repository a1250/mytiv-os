import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { foldersForBusiness, stuckThresholdDays } from "@/lib/ops-config";
import { listLinkedProjects } from "@/lib/db/queries/projects";
import { ClickUpConfigError, ClickUpRateLimitError, getOpenTasksWithCompleteness, statsFor } from "@/lib/clickup";

/**
 * Stats plus the stuck list in one response — the Ops Home payload.
 *
 * Lives under [businessSlug] like every other route handler so it passes
 * through guard(), which is the app's single tenancy choke point. The ClickUp
 * token never leaves this process.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    const { businessId } = await guard(businessSlug);

    const thresholdParam = Number(req.nextUrl.searchParams.get("threshold"));
    const thresholdDays = Number.isFinite(thresholdParam) && thresholdParam > 0 ? thresholdParam : stuckThresholdDays();

    const folders = foldersForBusiness(businessSlug, await listLinkedProjects(businessId));
    if (folders.length === 0) {
      return NextResponse.json({
        thresholdDays,
        stats: { stuck: 0, overdue: 0, openTasks: 0, openBugs: 0 },
        stuck: [],
        incomplete: false,
        note: "no_folders_mapped",
      });
    }

    const { tasks, incomplete } = await getOpenTasksWithCompleteness(folders);
    // A truncated read (20-page cap) is unknown, not partial: no numbers, no stuck list.
    if (incomplete) {
      return NextResponse.json({ thresholdDays, stats: null, stuck: [], incomplete: true, note: "read_incomplete" });
    }
    const stuck = tasks.filter((t) => t.daysIdle >= thresholdDays).sort((a, b) => b.daysIdle - a.daysIdle);

    return NextResponse.json({ thresholdDays, stats: statsFor(tasks, thresholdDays), stuck, incomplete: false });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    if (err instanceof ClickUpConfigError) return NextResponse.json({ error: "clickup_not_configured" }, { status: 503 });
    if (err instanceof ClickUpRateLimitError) {
      return NextResponse.json(
        { error: "clickup_rate_limited", retryAfterSeconds: err.retryAfterSeconds },
        { status: 429 }
      );
    }
    throw err;
  }
}
