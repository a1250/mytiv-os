import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { getSettingsForBusiness } from "@/lib/db/queries/settings";
import { checkModelPath, isConfigured, DEFAULT_MODEL, VISUAL_CLI_GAP_NOTE } from "@/lib/higgsfield";

export const runtime = "nodejs";

/** Reports configuration state; GET never spends credits. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const settings = await getSettingsForBusiness(businessId);
    return NextResponse.json({
      configured: await isConfigured(businessId),
      model: settings.higgsfield_model || DEFAULT_MODEL,
      cliGapNote: VISUAL_CLI_GAP_NOTE,
    });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

/** Probes the model path with an empty body — validates it without generating. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const settings = await getSettingsForBusiness(businessId);
    const body = await req.json().catch(() => ({}));
    const path = String(body?.modelPath || settings.higgsfield_model || DEFAULT_MODEL);
    const result = await checkModelPath(businessId, path);
    return NextResponse.json({ ...result, modelPath: path });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
