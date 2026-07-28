import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { guard, ApiGuardError } from "@/lib/api-guard";
import { generatePkce, buildAuthUrl } from "@/lib/google/oauth";

/**
 * Kicks off the Google consent flow for the given business. Stores
 * {businessId, businessSlug, verifier, state} in a short-lived httpOnly
 * cookie so the single global callback route (Google only allows one
 * registered redirect URI) knows which business initiated the request.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string }> }) {
  try {
    const { businessSlug } = await params;
    const { businessId } = await guard(businessSlug);

    const { verifier, challenge, state } = generatePkce();
    const url = buildAuthUrl({ challenge, state, gmail: true, calendar: true });

    const cookieStore = await cookies();
    cookieStore.set(
      "google_oauth_pending",
      JSON.stringify({ businessId, businessSlug, verifier, state }),
      { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" }
    );

    return NextResponse.redirect(url);
  } catch (err) {
    if (err instanceof ApiGuardError) return err.response;
    throw err;
  }
}
