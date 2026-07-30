/**
 * The single seam every AI-flavoured feature calls through, mirroring the
 * Electron app's `api.ai.complete`. The caller supplies a prompt; the key,
 * model choice, and business system prompt are resolved here server-side.
 */
import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { getSettingsForBusiness } from "@/lib/db/queries/settings";
import { complete, buildSystemPrompt } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId, business } = await guard((await params).businessSlug);
    const body = await req.json().catch(() => ({}));

    if (typeof body?.prompt !== "string" || !body.prompt.trim()) {
      return NextResponse.json({ ok: false, error: "prompt is required" }, { status: 400 });
    }

    const settings = await getSettingsForBusiness(businessId);
    const system =
      typeof body.system === "string" && body.system.trim()
        ? body.system
        : buildSystemPrompt({
            businessName: settings.studio_name || business.name,
            description: settings.business_description,
            ownerName: settings.owner_name,
            language: business.locale,
          });

    const result = await complete(businessId, {
      prompt: body.prompt,
      system,
      maxTokens: typeof body.maxTokens === "number" ? body.maxTokens : undefined,
      json: body.json !== false,
    });

    // Always 200: callers treat { ok: false } as "use the deterministic path",
    // and an HTTP error status would make that indistinguishable from a bug.
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
