import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { OpsPolicyError } from "@/lib/ops-policy";
import { createDraft } from "@/lib/google/gmail";
import { status } from "@/lib/google/oauth";
import { externalActionsEnabled } from "@/lib/external/flag";
import { notFound, workRouteError, writeEnvelope } from "@/lib/work/route";

const ID = /^[A-Za-z0-9_-]{1,200}$/;
const ADDRESS = /^[^\s@<>,;]+@[^\s@<>,;]+$/;

/**
 * POST { requestId, threadId, to, subject, body } — save a reply as a Gmail draft in the thread (nothing is sent).
 * Same origin, any member of the business, its own Google connection. Sending the draft is a separate, gated
 * attempt (POST …/external/gmail/send). 200 { draftId }.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  if (!externalActionsEnabled()) return notFound();
  try {
    const { businessId } = await guard((await params).businessSlug);
    const { body } = writeEnvelope(req, await req.json());
    const { threadId, to, subject, body: text } = body;
    if (typeof threadId !== "string" || !ID.test(threadId)) throw new OpsPolicyError("invalid_target");
    if (typeof to !== "string" || !ADDRESS.test(to)) throw new OpsPolicyError("invalid_recipient");
    if (typeof subject !== "string" || subject.length > 500) throw new OpsPolicyError("invalid_subject");
    if (typeof text !== "string" || !text.trim() || text.length > 20000) throw new OpsPolicyError("invalid_body");
    const s = await status(businessId);
    if (!s.connected || !s.gmail) throw new OpsPolicyError("gmail_not_connected", 409);
    const draft = await createDraft(businessId, { to, subject, body: text, googleThreadId: threadId, fromEmail: s.email });
    return NextResponse.json({ draftId: draft.googleDraftId });
  } catch (err) {
    return workRouteError(err);
  }
}
