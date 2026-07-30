/**
 * Assembles the week's data and runs the review builder server-side. The
 * Electron version did this in the renderer, loading ten full tables into the
 * page just to summarise them; over HTTP that would mean shipping the entire
 * workspace to the browser on every click. Nothing is persisted here — the
 * client POSTs the result back to /reviews if the user chooses to keep it.
 */
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { rateLimitGuard } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import {
  tasks, leads, outreachMessages, newsItems, proposals,
  clientBriefs, savedPrompts, inspirationItems, moodboards, calendarEvents,
} from "@/lib/db/schema";
import { getSettingsForBusiness } from "@/lib/db/queries/settings";
import { buildWeeklyReview } from "@/lib/services/review-builder";
import { todayISO, addDays } from "@/lib/date-utils";
import { complete, buildSystemPrompt } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Optional Claude pass over the deterministic review: it rewrites the executive
 * summary and next-week priorities from the numbers the builder already
 * produced. Any failure — no key, a refusal, malformed JSON — leaves the
 * deterministic text in place, exactly as the Electron version behaved when no
 * key was configured.
 */
async function enrichWithClaude(
  businessId: string,
  review: ReturnType<typeof buildWeeklyReview>,
  system: string
) {
  const p = review.payload;
  const result = await complete(businessId, {
    system,
    maxTokens: 1200,
    json: true,
    prompt: [
      "Here is this week's real business data summary:",
      `exec: ${JSON.stringify(p.exec)}`,
      `blockers: ${JSON.stringify(p.blockers)}`,
      `opportunities: ${JSON.stringify(p.opportunities)}`,
      `leads: ${JSON.stringify(p.leadsSection)}`,
      `proposals: ${JSON.stringify(p.proposalsSection)}`,
      "",
      "Rewrite the executive summary (4-6 sentences, direct, honest about weak spots) and give 3 practical next-week priorities that are specific and actionable, referencing the actual companies and tasks above.",
      'Return JSON only: {"exec": ["sentence", ...], "priorities": ["...", "...", "..."]}',
    ].join("\n"),
  });

  if (!result.ok) return { review, aiError: result.error };

  try {
    const parsed = JSON.parse(result.text);
    const exec = Array.isArray(parsed.exec) ? parsed.exec.filter((s: unknown) => typeof s === "string") : [];
    const priorities = Array.isArray(parsed.priorities)
      ? parsed.priorities.filter((s: unknown) => typeof s === "string").slice(0, 3)
      : [];
    // Only replace what actually came back — a partial response must not blank
    // out a section that the deterministic builder filled in correctly.
    if (exec.length > 0) p.exec = exec;
    if (priorities.length > 0) p.nextWeek.priorities = priorities;
    if (exec.length > 0 || priorities.length > 0) p.source = "claude";
    return { review, aiError: null };
  } catch {
    return { review, aiError: "Claude returned text that was not valid JSON." };
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId, business } = await guard((await params).businessSlug);
    const limited = await rateLimitGuard(businessId, "ai");
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));

    // "this" = the last 7 days, "last" = the 7 before that.
    const end = body?.end || (body?.range === "last" ? addDays(todayISO(), -7) : todayISO());
    const start = body?.start || addDays(end, -6);

    const scoped = <T extends { businessId: any }>(table: T) =>
      db.select().from(table as any).where(eq((table as any).businessId, businessId));

    const [
      tasksRows, leadsRows, outreachRows, newsRows, proposalsRows,
      briefsRows, promptsRows, inspirationRows, moodboardsRows, eventsRows,
    ] = await Promise.all([
      scoped(tasks), scoped(leads), scoped(outreachMessages), scoped(newsItems), scoped(proposals),
      scoped(clientBriefs), scoped(savedPrompts), scoped(inspirationItems), scoped(moodboards),
      scoped(calendarEvents),
    ]);

    const settings = await getSettingsForBusiness(businessId);

    const review = buildWeeklyReview(
      {
        tasks: tasksRows, leads: leadsRows, outreach: outreachRows, news: newsRows,
        proposals: proposalsRows, briefs: briefsRows, prompts: promptsRows,
        inspiration: inspirationRows, moodboards: moodboardsRows, events: eventsRows,
      },
      {
        start,
        end,
        studioName: settings.studio_name || business.name,
        locale: business.locale ?? "en",
      }
    );

    // ai_usage_mode "mock" is the kill switch carried over from the Electron
    // settings. Its "ask" mode prompted with window.confirm, which has no
    // meaning now that generation runs server-side — treated as "auto".
    if (settings.ai_usage_mode === "mock") {
      return NextResponse.json({ ...review, aiError: null });
    }

    const enriched = await enrichWithClaude(
      businessId,
      review,
      buildSystemPrompt({
        businessName: settings.studio_name || business.name,
        description: settings.business_description,
        ownerName: settings.owner_name,
        language: business.locale,
      })
    );

    return NextResponse.json({ ...enriched.review, aiError: enriched.aiError });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
