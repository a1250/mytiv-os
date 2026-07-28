import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeAndStore } from "@/lib/google/oauth";

/** Single global callback (Google only allows one redirect URI per OAuth client). */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const pendingRaw = cookieStore.get("google_oauth_pending")?.value;
  cookieStore.delete("google_oauth_pending");

  if (!pendingRaw) {
    return NextResponse.redirect(new URL("/login?error=oauth_state_missing", req.url));
  }
  const pending = JSON.parse(pendingRaw) as { businessId: string; businessSlug: string; verifier: string; state: string };

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const settingsUrl = new URL(`/${pending.businessSlug}/settings`, req.url);

  if (error || !code || state !== pending.state) {
    settingsUrl.searchParams.set("google_error", error || "state_mismatch");
    return NextResponse.redirect(settingsUrl);
  }

  try {
    await exchangeCodeAndStore(pending.businessId, code, pending.verifier);
    settingsUrl.searchParams.set("google_connected", "1");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    settingsUrl.searchParams.set("google_error", err instanceof Error ? err.message : "unknown_error");
    return NextResponse.redirect(settingsUrl);
  }
}
