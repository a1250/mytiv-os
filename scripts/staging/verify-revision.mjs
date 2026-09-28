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
 * Directional comparison. The DEPLOYED value must be a full 40-hex commit sha; the
 * APPROVED value may be an abbreviation (7–40 hex) that prefixes it. Only the approved
 * side may abbreviate — a short, empty, or "unknown" deployed value can never be
 * accepted as a prefix of a longer approved commit, so it always fails closed.
 */
export function compareRevision(actual, approved) {
  const norm = (s) => String(s ?? "").trim().toLowerCase();
  const a = norm(actual), b = norm(approved);
  const deployedFull = /^[0-9a-f]{40}$/.test(a);
  const approvedHex = /^[0-9a-f]{7,40}$/.test(b);
  const match = deployedFull && approvedHex && a.startsWith(b);
  return { match, actual: a, approved: b };
}

/**
 * Owner login → GET revision → compare. Returns the compareRevision result; throws
 * (fail-closed) on missing config, a failed login, or a non-200 revision response. It
 * never exits the process — the CLI wrapper decides the exit code. `fetchImpl` is
 * injectable so the flow can be tested without a network.
 */
export async function runVerify({ base, email, password, approved, slug = "mytiv", fetchImpl = fetch }) {
  if (!base || !email || !password || !approved) {
    throw new Error("base, email, password and approved are required");
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
    if (init.method && init.method !== "GET") headers.origin = base;
    const res = await fetchImpl(base + path, { ...init, headers, redirect: "manual" });
    absorb(res); return res;
  };

  const { csrfToken } = await (await call("/api/auth/csrf")).json();
  const login = await call("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, email, password, redirect: "false" }),
  });
  if (![200, 302].includes(login.status) || ![...jar.keys()].some((k) => k.includes("session-token"))) {
    throw new Error(`owner login failed: ${login.status}`);
  }

  const res = await call(`/api/${slug}/ops/revision`);
  if (res.status !== 200) throw new Error(`revision endpoint returned ${res.status}`);
  const { revision } = await res.json();
  return compareRevision(revision, approved);
}

async function main() {
  const result = await runVerify({
    base: process.env.BASE,
    email: process.env.OWNER_EMAIL,
    password: process.env.STAGING_PASSWORD,
    approved: process.env.APPROVED_COMMIT,
    slug: process.argv[2] ?? process.env.BUSINESS_SLUG ?? "mytiv",
  });
  if (!result.match) {
    console.error(`REVISION MISMATCH: deployed=${result.actual || "(empty)"} approved=${result.approved || "(empty)"}`);
    process.exit(1);
  }
  console.log(`revision OK: deployed ${result.actual} matches approved ${result.approved}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
