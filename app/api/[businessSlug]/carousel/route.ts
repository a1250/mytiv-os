import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { listCarousels, createCarousel } from "@/lib/db/queries/carousel";
import { getSettingsForBusiness } from "@/lib/db/queries/settings";
import { buildCarouselConcept } from "@/lib/services/carouselEngine";
import { enrichCarouselConcept } from "@/lib/ai/carousel-concept";
import { buildSystemPrompt } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json(await listCarousels(businessId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId, business } = await guard((await params).businessSlug);
    const data = await req.json();
    const settings = await getSettingsForBusiness(businessId);

    const concept = buildCarouselConcept({
      sourceType: data.sourceType,
      payload: data.sourcePayload,
      slideCount: data.slideCount ?? 4,
      tone: data.tone ?? "editorial",
      audience: data.audience ?? "",
      aspect: data.aspectRatio ?? "4:5",
    });

    let aiError: string | null = null;
    if (settings.ai_usage_mode !== "mock") {
      const enriched = await enrichCarouselConcept(businessId, concept, {
        system: buildSystemPrompt({
          businessName: settings.studio_name || business.name,
          description: settings.business_description,
          ownerName: settings.owner_name,
          language: business.locale,
        }),
        brandName: settings.studio_name || business.name,
        // The Electron prompt hardcoded Mytiv's navy/blue palette; the accent
        // is per-business, so the image prompts follow it instead.
        accentColor: business.accentColor ?? "#6366f1",
        topic: data.title || data.sourcePayload?.title || "",
        summary: data.sourcePayload?.summary,
        platform: data.platform ?? "instagram",
        tone: data.tone ?? "editorial",
        audience: data.audience,
      });
      aiError = enriched.aiError;
    }

    const project = await createCarousel(businessId, data, concept);
    return NextResponse.json({ ...project, aiError, aiSource: (concept as { source?: string }).source ?? "builder" });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
