/** One error mapping for the legacy internal tasks routes (guard → its response, policy → { error }, bad JSON → 400). */
import "server-only";
import { NextResponse } from "next/server";
import { ApiGuardError } from "./api-guard";
import { OpsPolicyError } from "./ops-policy";

export function taskRouteError(err: unknown): NextResponse {
  if (err instanceof ApiGuardError) return err.response;
  if (err instanceof OpsPolicyError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof SyntaxError) return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  throw err;
}
