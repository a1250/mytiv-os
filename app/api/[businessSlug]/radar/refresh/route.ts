import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { refreshRadar } from "@/lib/db/queries/radar";
import { getSettingsForBusiness, setSettingForBusiness } from "@/lib/db/queries/settings";
import { DEFAULT_FEEDS } from "@/lib/services/rss";

// Fetching up to 12 feeds sequentially can take a while — give this route
// more room than the Vercel default. If this proves too slow in practice,
// move it to a QStash-triggered background job like Discover Leads (Phase 4b).
export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    const { businessId } = await guard(businessSlug);
    const settings = await getSettingsForBusiness(businessId);
    const feeds = settings.radar_feeds ? settings.radar_feeds.split("\n").map((s) => s.trim()).filter(Boolean) : DEFAULT_FEEDS;
    const result = await refreshRadar(businessId, feeds);
    await setSettingForBusiness(businessId, "radar_last_refresh", new Date().toISOString());
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
