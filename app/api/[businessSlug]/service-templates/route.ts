import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import {
  listServiceTemplates,
  createServiceTemplate,
  seedStarterServiceTemplates,
} from "@/lib/db/queries/service-templates";
import { STARTER_SERVICE_TEMPLATES } from "@/lib/service-templates";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json(await listServiceTemplates(businessId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const body = await req.json();

    // { seedStarters: true } loads the starter catalogue; no-ops if any exist.
    if (body?.seedStarters) {
      return NextResponse.json(await seedStarterServiceTemplates(businessId, STARTER_SERVICE_TEMPLATES));
    }

    if (!body?.label) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }
    return NextResponse.json(await createServiceTemplate(businessId, body));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
