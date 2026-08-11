import { NextRequest, NextResponse } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { listProjects, createProject } from "@/lib/db/queries/projects";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json(await listProjects(businessId));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    const data = await req.json();
    if (!data?.name?.trim()) return NextResponse.json({ error: "name_required" }, { status: 400 });
    return NextResponse.json(await createProject(businessId, data));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
