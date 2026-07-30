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
import { db } from "@/lib/db";
import {
  tasks, leads, outreachMessages, newsItems, proposals,
  clientBriefs, savedPrompts, inspirationItems, moodboards, calendarEvents,
} from "@/lib/db/schema";
import { getSettingsForBusiness } from "@/lib/db/queries/settings";
import { buildWeeklyReview } from "@/lib/services/review-builder";
import { todayISO, addDays } from "@/lib/date-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId, business } = await guard((await params).businessSlug);
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

    return NextResponse.json(review);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
