import { NextRequest } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { CONFIRM_REQUIRED, executeProposal, loadOpsContext } from "@/lib/ai/ops-copilot";

/**
 * The only path in the product that writes to ClickUp from the copilot.
 *
 * It is reached exclusively by a click on a confirmation card: the chat stream
 * emits proposals and never calls this. The tool name is re-checked against the
 * allowlist here rather than trusted from the body, so a crafted request cannot
 * execute something the model was never able to propose — and there is no
 * delete case in the switch at all.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    const { businessId } = await guard(businessSlug);

    const body = (await req.json()) as {
      projectId?: string;
      tool?: string;
      input?: Record<string, unknown>;
    };

    if (!body.projectId || !body.tool || typeof body.input !== "object" || body.input === null) {
      return Response.json({ ok: false, error: "projectId, tool and input are required" }, { status: 400 });
    }
    if (!CONFIRM_REQUIRED.has(body.tool)) {
      return Response.json({ ok: false, error: `"${body.tool}" is not a confirmable action.` }, { status: 400 });
    }

    const ctx = await loadOpsContext(businessId, body.projectId);
    if (!ctx) return Response.json({ ok: false, error: "not_found" }, { status: 404 });

    const result = await executeProposal(ctx, body.tool, body.input);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
