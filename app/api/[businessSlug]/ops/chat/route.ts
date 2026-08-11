import { NextRequest } from "next/server";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { loadOpsContext, streamOpsChat, type ChatTurn } from "@/lib/ai/ops-copilot";

/**
 * One copilot exchange, streamed as SSE.
 *
 * The context is assembled server-side from the project id, so the browser
 * never sees the ClickUp token or the Claude key and cannot widen what the
 * model is allowed to read. This route only ever reads: a write tool arrives
 * back as a proposal event, and executing it is a separate confirmed call.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    const { businessId, business } = await guard(businessSlug);

    const body = (await req.json()) as { projectId?: string; messages?: ChatTurn[] };
    if (!body.projectId || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: "projectId and messages are required" }, { status: 400 });
    }

    const ctx = await loadOpsContext(businessId, body.projectId);
    if (!ctx) return Response.json({ error: "not_found" }, { status: 404 });

    const history = body.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: String(m.content ?? "") }))
      .filter((m) => m.content.trim().length > 0);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of streamOpsChat(businessId, business.name, ctx, history)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream failed.";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
