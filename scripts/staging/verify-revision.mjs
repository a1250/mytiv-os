/**
 * Verify the deployed revision equals an approved commit (MKT-F20).
 *
 * Logs in as an owner exactly like the browser (Auth.js credentials), GETs
 * /{slug}/ops/revision, and compares the reported commit to APPROVED_COMMIT.
 * Exits 1 on any mismatch or non-200 — never presents a mismatch as success.
 *
 *   BASE=https://app… OWNER_EMAIL=… STAGING_PASSWORD=… APPROVED_COMMIT=<sha> \
 *     node scripts/staging/verify-revision.mjs [businessSlug]
 */

/**
 * Pure comparison: a deployed sha matches an approved sha when they are equal or
 * one is a prefix of the other (an abbreviated approved commit is allowed), and
 * both are real shas (>= 7 hex chars). Case- and whitespace-insensitive.
 */
export function compareRevision(actual, approved) {
  const norm = (s) => String(s ?? "").trim().toLowerCase();
  const a = norm(actual), b = norm(approved);
  const hex = (s) => /^[0-9a-f]{7,40}$/.test(s);
  const match = hex(a) && hex(b) && (a === b || a.startsWith(b) || b.startsWith(a));
  return { match, actual: a, approved: b };
}

async function main() {
  const BASE = process.env.BASE;
  const PW = process.env.STAGING_PASSWORD;
  const EMAIL = process.env.OWNER_EMAIL;
  const APPROVED = process.env.APPROVED_COMMIT;
  const slug = process.argv[2] ?? process.env.BUSINESS_SLUG ?? "mytiv";
  if (!BASE || !PW || !EMAIL || !APPROVED) {
    throw new Error("BASE, OWNER_EMAIL, STAGING_PASSWORD and APPROVED_COMMIT are required");
  }

  const jar = new Map();
  const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const absorb = (res) => {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [kv] = c.split(";"); const i = kv.indexOf("=");
      jar.set(kv.slice(0, i), kv.slice(i + 1));
    }
  };
  const call = async (path, init = {}) => {
    const headers = { ...(init.headers ?? {}), cookie: cookieHeader() };
    if (init.method && init.method !== "GET") headers.origin = BASE;
    const res = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
    absorb(res); return res;
  };

  const { csrfToken } = await (await call("/api/auth/csrf")).json();
  const login = await call("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PW, redirect: "false" }),
  });
  if (![200, 302].includes(login.status) || ![...jar.keys()].some((k) => k.includes("session-token"))) {
    throw new Error(`owner login failed: ${login.status}`);
  }

  const res = await call(`/api/${slug}/ops/revision`);
  if (res.status !== 200) throw new Error(`revision endpoint returned ${res.status}`);
  const { revision } = await res.json();
  const result = compareRevision(revision, APPROVED);
  if (!result.match) {
    console.error(`REVISION MISMATCH: deployed=${result.actual || "(empty)"} approved=${result.approved || "(empty)"}`);
    process.exit(1);
  }
  console.log(`revision OK: deployed ${result.actual} matches approved ${result.approved}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
