/**
 * Generates a slide background through Higgsfield and stores the result.
 *
 * The returned URL is copied into Blob rather than saved as-is: Higgsfield's
 * result URLs are temporary, so a slide pointing at one would render fine today
 * and break later. Rate-limited under the discovery bucket because every call
 * spends generation credits.
 */
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { rateLimitGuard } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { carouselSlides } from "@/lib/db/schema";
import { updateSlide } from "@/lib/db/queries/carousel";
import { getSettingsForBusiness } from "@/lib/db/queries/settings";
import { uploadAsset } from "@/lib/blob";
import { generateImage, pollExisting, DEFAULT_MODEL } from "@/lib/higgsfield";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; id: string }> }) {
  try {
    const { businessSlug, id } = await params;
    const { businessId } = await guard(businessSlug);
    const limited = await rateLimitGuard(businessId, "discovery");
    if (limited) return limited;

    const [slide] = await db
      .select()
      .from(carouselSlides)
      .where(and(eq(carouselSlides.businessId, businessId), eq(carouselSlides.id, id)))
      .limit(1);
    if (!slide) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const settings = await getSettingsForBusiness(businessId);
    let extraParams: Record<string, unknown> = {};
    try {
      extraParams = JSON.parse(settings.higgsfield_params || "{}");
    } catch {
      // A malformed params setting shouldn't block generation — ignore it.
    }

    // Resuming a job whose earlier poll ran out of budget must not re-submit,
    // which would spend a second set of credits for the same image.
    const result = body?.requestId
      ? await pollExisting(businessId, String(body.requestId))
      : await generateImage(businessId, {
          prompt: slide.imagePrompt || slide.visualDirection || slide.headline || "",
          aspect: body?.aspect ?? "4:5",
          modelPath: settings.higgsfield_model || DEFAULT_MODEL,
          extraParams,
        });

    if (!result.ok) {
      return NextResponse.json(result, { status: "pending" in result && result.pending ? 202 : 200 });
    }

    const image = await fetch(result.url);
    if (!image.ok) {
      return NextResponse.json({ ok: false, error: `Could not download the generated image (${image.status}).` });
    }
    const file = new File([await image.blob()], `slide-${slide.slideNumber}.png`, { type: "image/png" });
    const storedUrl = await uploadAsset(businessId, "carousels", file);

    const updated = await updateSlide(businessId, id, { generatedImageUrl: storedUrl });
    return NextResponse.json({ ok: true, url: storedUrl, slide: updated });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
