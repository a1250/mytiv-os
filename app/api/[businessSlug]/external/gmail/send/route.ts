import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-guard";
import { OpsPolicyError } from "@/lib/ops-policy";
import { admitAttempt, settleAttempt } from "@/lib/external/attempts";
import { gmailSendDraft } from "@/lib/external/providers";
import { isUuid, workRouteError, writeEnvelope, notFound } from "@/lib/work/route";
import { externalActionsEnabled } from "@/lib/external/flag";
import { WorkRefusal } from "@/lib/work/commands";

const ID = /^[A-Za-z0-9_-]{1,200}$/;

/**
 * POST { requestId, threadId, draftId, attestedUnknownAttemptId? } — send a Gmail draft as a backend-owned attempt.
 * The attempt is recorded (and gated) before Gmail is called and settled with Gmail's answer:
 * 200 { attempt } (confirmed | failed | unknown) · 409 { error: in_flight | already_done | needs_target_check, unknownAttemptId? }.
 * A replay of the same request id returns the same attempt and never calls Gmail again.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  if (!externalActionsEnabled()) return notFound();
  try {
    const { businessSlug } = await params;
    const { businessId, userId } = await guard(businessSlug);
    const { requestId, body } = writeEnvelope(req, await req.json());
    const threadId = body.threadId, draftId = body.draftId, attested = body.attestedUnknownAttemptId ?? null;
    if (typeof threadId !== "string" || !ID.test(threadId) || typeof draftId !== "string" || !ID.test(draftId)) throw new OpsPolicyError("invalid_target");
    if (attested !== null && !isUuid(attested)) throw new OpsPolicyError("invalid_attestation");
    const admitted = await admitAttempt({ businessId, userId }, requestId, "gmail_send", `gmail:thread:${threadId}`, { unit: draftId, draftId }, attested);
    if (!admitted.admitted) return NextResponse.json({ ok: true, replayed: true, attempt: admitted.attempt });
    const out = await gmailSendDraft(businessId, draftId);
    const attempt = await settleAttempt(businessId, admitted.attempt.id, out.state, out.state === "confirmed" ? out.ref : null, out.state === "confirmed" ? null : out.error);
    return NextResponse.json({ ok: true, attempt });
  } catch (err) {
    if (err instanceof WorkRefusal && err.code === "needs_target_check") return NextResponse.json({ error: err.code, ...(err.detail as object) }, { status: 409 });
    if (err instanceof WorkRefusal && ["in_flight", "already_done"].includes(err.code)) return NextResponse.json({ error: err.code }, { status: 409 });
    return workRouteError(err);
  }
}
