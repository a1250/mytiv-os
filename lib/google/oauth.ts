/**
 * Google OAuth 2.0 — standard web Authorization Code flow with PKCE.
 * Replaces electron/services/googleAuth.cjs's RFC 8252 loopback-server dance
 * (which spun up a local http.createServer to catch the browser redirect —
 * impossible in serverless). The web version is simpler: a real HTTPS
 * redirect URI (GOOGLE_OAUTH_REDIRECT_URI) does the same job.
 *
 * One OAuth app (GOOGLE_OAUTH_CLIENT_ID/_SECRET, app-wide env vars) is used
 * across all businesses — each business connects its own Google *account*,
 * stored as one row in google_accounts (unique per business_id). This is not
 * a multi-tenant-SaaS-with-per-customer-OAuth-app setup; it's one person
 * (you) connecting different Google accounts for different businesses you
 * manage, which is exactly what the google_accounts schema (one row per
 * business_id) already assumes.
 */
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { googleAccounts } from "../db/schema";
import { encryptSecret, decryptSecret } from "../crypto/secrets";

const SCOPE_SETS = {
  base: ["openid", "email", "profile"],
  gmail: ["https://www.googleapis.com/auth/gmail.modify"],
  calendar: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.readonly"],
};

function clientCreds() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID/_SECRET/_REDIRECT_URI must be set");
  }
  return { clientId, clientSecret, redirectUri };
}

const b64url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function generatePkce() {
  const verifier = b64url(crypto.randomBytes(48));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const state = b64url(crypto.randomBytes(16));
  return { verifier, challenge, state };
}

/** Builds the Google consent-screen URL the user gets redirected to. */
export function buildAuthUrl(params: { challenge: string; state: string; gmail: boolean; calendar: boolean }) {
  const { clientId, redirectUri } = clientCreds();
  const scopes = [...SCOPE_SETS.base, ...(params.gmail ? SCOPE_SETS.gmail : []), ...(params.calendar ? SCOPE_SETS.calendar : [])];
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    code_challenge: params.challenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
    state: params.state,
  }).toString();
  return url.href;
}

async function postForm(url: string, params: Record<string, string>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error_description || json.error || `HTTP ${res.status}`);
  return json as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
}

/** Exchanges the authorization code for tokens and stores them (encrypted) for the given business. */
export async function exchangeCodeAndStore(businessId: string, code: string, verifier: string) {
  const { clientId, clientSecret, redirectUri } = clientCreds();
  const tokens = await postForm("https://oauth2.googleapis.com/token", {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  let email = "";
  let displayName = "";
  try {
    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    const info = await infoRes.json();
    email = info.email || "";
    displayName = info.name || "";
  } catch {
    /* non-fatal */
  }

  const accessTokenEnc = encryptSecret(tokens.access_token);
  const refreshTokenEnc = encryptSecret(tokens.refresh_token || "");

  await db.delete(googleAccounts).where(eq(googleAccounts.businessId, businessId));
  await db.insert(googleAccounts).values({
    businessId,
    email,
    displayName,
    provider: "google",
    accessTokenEnc: accessTokenEnc.ciphertext,
    accessTokenIv: accessTokenEnc.iv,
    refreshTokenEnc: refreshTokenEnc.ciphertext,
    refreshTokenIv: refreshTokenEnc.iv,
    tokenExpiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
    scopes: tokens.scope || "",
    connectedAt: new Date(),
    status: "connected",
  });

  return { email };
}

async function getAccountRow(businessId: string) {
  const [acc] = await db.select().from(googleAccounts).where(eq(googleAccounts.businessId, businessId)).limit(1);
  return acc ?? null;
}

/** Valid access token for this business, refreshing if it's expiring soon. Throws if not connected. */
export async function getAccessToken(businessId: string): Promise<string> {
  const acc = await getAccountRow(businessId);
  if (!acc) throw new Error("not_connected");

  const expiresSoon = !acc.tokenExpiry || acc.tokenExpiry.getTime() - Date.now() < 60_000;
  if (!expiresSoon) return decryptSecret(acc.accessTokenEnc!, acc.accessTokenIv!);

  const refresh = decryptSecret(acc.refreshTokenEnc!, acc.refreshTokenIv!);
  if (!refresh) throw new Error("token_expired");

  const { clientId, clientSecret } = clientCreds();
  const tokens = await postForm("https://oauth2.googleapis.com/token", {
    refresh_token: refresh,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const accessTokenEnc = encryptSecret(tokens.access_token);
  await db
    .update(googleAccounts)
    .set({
      accessTokenEnc: accessTokenEnc.ciphertext,
      accessTokenIv: accessTokenEnc.iv,
      tokenExpiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
      status: "connected",
    })
    .where(eq(googleAccounts.id, acc.id));

  return tokens.access_token;
}

/** Authenticated Google API call, with one automatic retry on 401 (forces a token refresh). */
export async function googleApi(businessId: string, method: string, url: string, body: unknown = null, retried = false): Promise<any> {
  const token = await getAccessToken(businessId);
  const res = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !retried) {
    const acc = await getAccountRow(businessId);
    if (acc) await db.update(googleAccounts).set({ tokenExpiry: new Date(0) }).where(eq(googleAccounts.id, acc.id));
    return googleApi(businessId, method, url, body, true);
  }

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error((json.error && (json.error.message || json.error)) || `HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return json;
}

export async function disconnect(businessId: string) {
  const acc = await getAccountRow(businessId);
  if (acc) {
    const token = decryptSecret(acc.refreshTokenEnc!, acc.refreshTokenIv!) || decryptSecret(acc.accessTokenEnc!, acc.accessTokenIv!);
    if (token) {
      try {
        await postForm("https://oauth2.googleapis.com/revoke", { token });
      } catch {
        /* best effort */
      }
    }
    await db.delete(googleAccounts).where(eq(googleAccounts.id, acc.id));
  }
  return { ok: true };
}

export async function status(businessId: string) {
  const acc = await getAccountRow(businessId);
  const scopes = acc?.scopes || "";
  return {
    configured: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
    connected: !!acc,
    email: acc?.email || "",
    displayName: acc?.displayName || "",
    gmail: /gmail/.test(scopes),
    calendar: /calendar/.test(scopes),
    tokenExpiry: acc?.tokenExpiry ?? null,
    connectedAt: acc?.connectedAt ?? null,
    lastSyncAt: acc?.lastSyncAt ?? null,
  };
}
