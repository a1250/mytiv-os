import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { proposalTemplates } from "@/lib/db/schema";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessId } = await guard((await params).businessSlug);
    return NextResponse.json(await db.select().from(proposalTemplates).where(eq(proposalTemplates.businessId, businessId)));
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
