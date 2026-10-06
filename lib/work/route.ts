import "server-only";
import { NextResponse } from "next/server";
import { ApiGuardError } from "@/lib/api-guard";
import { OpsPolicyError } from "@/lib/ops-policy";
import { WorkRefusal } from "./commands";

/**
 * The Work API (`/api/[slug]/work/*`) exists only where its migrations are applied: the flag is off everywhere by
 * default, and off it answers 404 like any unknown route.
 */
export const workApiEnabled = () => process.env.WORK_API_ENABLED === "true";
export const notFound = () => NextResponse.json({ error: "not found" }, { status: 404 });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** Every write: same origin, a fresh UUID request id (the ledger key). */
export function writeEnvelope(req: Request, body: unknown): { requestId: string; body: Record<string, unknown> } {
  if (req.headers.get("origin") !== new URL(req.url).origin) throw new OpsPolicyError("same_origin_required", 403);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new OpsPolicyError("invalid_input");
  const b = body as Record<string, unknown>;
  if (!isUuid(b.requestId)) throw new OpsPolicyError("invalid_request_id");
  return { requestId: b.requestId, body: b };
}

export function workRouteError(err: unknown): NextResponse {
  if (err instanceof ApiGuardError) return err.response;
  if (err instanceof WorkRefusal) return NextResponse.json({ error: err.code, ...(err.detail ? { detail: err.detail } : {}) }, { status: err.status });
  if (err instanceof OpsPolicyError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof SyntaxError) return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  console.error("work route failed", err);
  return NextResponse.json({ error: "work_unavailable" }, { status: 503 });
}
