import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { getProject, updateProject } from "@/lib/db/queries/projects";

type Params = { params: Promise<{ businessSlug: string; projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { businessSlug, projectId } = await params;
    const { businessId } = await guard(businessSlug);
    const row = await getProject(businessId, projectId);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { businessSlug, projectId } = await params;
    const { businessId } = await guard(businessSlug);
    const patch = await req.json();
    const row = await updateProject(businessId, projectId, patch);
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    // A second project pointing at the same ClickUp folder trips the unique index.
    if (err instanceof Error && /projects_business_clickup_folder_idx/.test(err.message)) {
      return NextResponse.json({ error: "folder_already_linked" }, { status: 409 });
    }
    throw err;
  }
}
