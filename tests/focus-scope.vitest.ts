/**
 * Focus tenant scope (GPT review P1) and prototype isolation (P2): Focus pages live under /{businessSlug}/focus and
 * are scoped on the server like lib/api-guard.ts — session → membership → verified business. The fixture demo
 * (`/_demo/focus`) exists only where prototype surfaces are on and is the only scope that renders fixtures.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEMO_SCOPE_SLUG, decideFocusScope, fixturesAllowed, prototypeSurfacesEnabled, requireBusinessScope, scopeBase, scopedHref,
  unscopedPath, type ScopeDeps,
} from "@/lib/focus/scope";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), resolve: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/tenant", () => ({ resolveBusinessOrNull: mocks.resolve }));

const BIZ = { business: { id: "biz-1", slug: "acme", name: "Acme" }, role: "admin" };
const deps = (o: Partial<ScopeDeps> = {}): ScopeDeps => ({
  prototype: false,
  getUserId: async () => "user-1",
  resolve: async (slug, userId) => (slug === "acme" && userId === "user-1" ? BIZ : null),
  ...o,
});

describe("scope decision (pure) — fails closed", () => {
  it("unauthenticated → login, and membership is never consulted", async () => {
    const resolve = vi.fn();
    expect(await decideFocusScope("acme", deps({ getUserId: async () => null, resolve }))).toEqual({ kind: "login" });
    expect(resolve).not.toHaveBeenCalled();
  });
  it("a business you are not a member of (or that does not exist) → not found, indistinguishable", async () => {
    expect(await decideFocusScope("other", deps())).toEqual({ kind: "notFound" });
    expect(await decideFocusScope("acme", deps({ getUserId: async () => "stranger" }))).toEqual({ kind: "notFound" });
  });
  it("a member gets a business scope whose identity comes from the resolved row, not the URL", async () => {
    const d = await decideFocusScope("acme", deps({ resolve: async () => ({ business: { id: "biz-1", slug: "acme", name: "Acme Ltd" }, role: "owner" }) }));
    expect(d).toEqual({ kind: "scope", scope: { kind: "business", businessId: "biz-1", slug: "acme", name: "Acme Ltd", role: "owner", userId: "user-1" } });
  });
  it("an unknown membership role is narrowed to the least privilege (member)", async () => {
    const d = await decideFocusScope("acme", deps({ resolve: async () => ({ ...BIZ, role: "superuser" }) }));
    expect(d.kind === "scope" && d.scope.kind === "business" && d.scope.role).toBe("member");
  });
  it("the demo scope exists only with prototype surfaces on; it never touches the session or the tenant table", async () => {
    const getUserId = vi.fn(), resolve = vi.fn();
    expect(await decideFocusScope(DEMO_SCOPE_SLUG, deps({ prototype: false, getUserId, resolve }))).toEqual({ kind: "notFound" });
    expect(await decideFocusScope(DEMO_SCOPE_SLUG, deps({ prototype: true, getUserId, resolve }))).toEqual({ kind: "scope", scope: { kind: "demo", slug: "_demo" } });
    expect(getUserId).not.toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
  });
  it("the demo slug can never be a business slug (project slug format)", () => {
    expect(/^[a-z0-9][a-z0-9-]*$/.test(DEMO_SCOPE_SLUG)).toBe(false);
  });
});

describe("fixture isolation and adapter identity", () => {
  it("only the demo scope may render fixtures", () => {
    expect(fixturesAllowed({ kind: "demo", slug: "_demo" })).toBe(true);
    expect(fixturesAllowed({ kind: "business", businessId: "b", slug: "acme", name: "A", role: "owner", userId: "u" })).toBe(false);
  });
  it("adapters get a verified business identity and refuse the demo scope", () => {
    const b = { kind: "business", businessId: "biz-1", slug: "acme", name: "Acme", role: "member", userId: "u" } as const;
    expect(requireBusinessScope(b).businessId).toBe("biz-1");
    expect(() => requireBusinessScope({ kind: "demo", slug: "_demo" })).toThrow();
  });
});

describe("prototype surfaces by environment", () => {
  it("on in development and on Vercel Preview; off in any production build", () => {
    expect(prototypeSurfacesEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(prototypeSurfacesEnabled({ NODE_ENV: "test" })).toBe(true);
    expect(prototypeSurfacesEnabled({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(true);
    expect(prototypeSurfacesEnabled({ NODE_ENV: "production", VERCEL_ENV: "production" })).toBe(false);
    expect(prototypeSurfacesEnabled({ NODE_ENV: "production" })).toBe(false); // plain `next start`
  });
});

describe("scoped URLs", () => {
  const base = scopeBase("acme");
  it("resolves Focus paths into the scope and leaves everything else alone", () => {
    expect(scopedHref(base, "/focus")).toBe("/acme/focus");
    expect(scopedHref(base, "/focus/work/list?task=t-1")).toBe("/acme/focus/work/list?task=t-1");
    expect(scopedHref(base, "/focus?x=1")).toBe("/acme/focus?x=1");
    expect(scopedHref(base, "/focusing")).toBe("/focusing");
    expect(scopedHref(base, "/login")).toBe("/login");
    expect(scopedHref(base, "tel:+972")).toBe("tel:+972");
    expect(scopedHref(base, "https://other.example/focus")).toBe("https://other.example/focus");
    expect(scopedHref(base, "/other/focus/x")).toBe("/other/focus/x"); // an absolute path to another scope is not rewritten into this one
  });
  it("maps an absolute pathname back to its scope-relative form for nav state", () => {
    expect(unscopedPath(base, "/acme/focus")).toBe("/focus");
    expect(unscopedPath(base, "/acme/focus/work/board")).toBe("/focus/work/board");
    expect(unscopedPath(base, "/acme/focusx")).toBe("/acme/focusx");
  });
  it("encodes the slug", () => {
    expect(scopeBase("a b")).toBe("/a%20b/focus");
  });
});

describe("server wiring (getFocusScope) — the real redirect / notFound", () => {
  beforeEach(() => { vi.resetModules(); mocks.auth.mockReset(); mocks.resolve.mockReset(); vi.unstubAllEnvs(); });
  const load = async () => (await import("@/lib/focus/scope.server")).getFocusScope;
  const digest = async (p: Promise<unknown>) => { try { await p; return "rendered"; } catch (e) { return String((e as { digest?: string }).digest ?? e); } };

  it("no session → NEXT_REDIRECT to /login", async () => {
    mocks.auth.mockResolvedValue(null);
    expect(await digest((await load())("acme"))).toMatch(/^NEXT_REDIRECT;.*\/login/);
    expect(mocks.resolve).not.toHaveBeenCalled();
  });
  it("signed in but not a member → 404", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.resolve.mockResolvedValue(null);
    expect(await digest((await load())("acme"))).toMatch(/404/);
    expect(mocks.resolve).toHaveBeenCalledWith("acme", "user-1");
  });
  it("a member → the verified business scope", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.resolve.mockResolvedValue(BIZ);
    await expect((await load())("acme")).resolves.toEqual({ kind: "business", businessId: "biz-1", slug: "acme", name: "Acme", role: "admin", userId: "user-1" });
  });
  it("the demo scope 404s in a production build and renders in development / Preview", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await digest((await load())(DEMO_SCOPE_SLUG))).toMatch(/404/);
    vi.resetModules();
    vi.stubEnv("VERCEL_ENV", "preview");
    await expect((await load())(DEMO_SCOPE_SLUG)).resolves.toEqual({ kind: "demo", slug: "_demo" });
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it("prototype-only pages 404 for a business even in development", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.resolve.mockResolvedValue(BIZ);
    const { requireDemoScope } = await import("@/lib/focus/scope.server");
    expect(await digest(requireDemoScope("acme"))).toMatch(/404/);
  });
});

describe("static guarantees over the Focus route tree", () => {
  const ROOT = new URL("../", import.meta.url).pathname;
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const APP = join(ROOT, "app/(focus)/[businessSlug]/focus");
  const pages = walk(APP).filter((f) => f.endsWith("page.tsx"));
  const rel = (f: string) => f.replace(ROOT, "");
  // code only: a guard name in a comment must not satisfy a guarantee
  const code = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("Focus lives only under the tenant segment (no unscoped app/focus tree)", () => {
    expect(() => statSync(join(ROOT, "app/focus"))).toThrow();
    expect(pages.length).toBeGreaterThan(40);
  });
  it("every Focus page is scope-guarded (fixture pages render nothing for a business)", () => {
    const unguarded = pages.filter((f) => !/rendersFixtures\(|rendersWork\(|requireDemoScope\(|getFocusScope\(/.test(code(f)));
    expect(unguarded.map(rel)).toEqual([]);
  });
  it("page metadata is scope-gated too (Next resolves metadata even when the layout 404s)", () => {
    expect(pages.filter((f) => /export const metadata\b/.test(code(f))).map(rel)).toEqual([]);
  });
  it("prototype pages require the demo scope", () => {
    for (const p of ["screens/page.tsx", "reference/[id]/page.tsx", "m/[n]/page.tsx"]) expect(code(join(APP, p)), p).toContain("requireDemoScope(");
  });
  it("tenant identity never comes from query parameters", () => {
    for (const f of [join(APP, "layout.tsx"), join(ROOT, "lib/focus/scope.ts"), join(ROOT, "lib/focus/scope.server.ts")]) {
      expect(code(f), rel(f)).not.toMatch(/searchParams|useSearchParams/);
    }
  });
  it("Focus components link through the scoped Link (no direct next/link outside the shell exit)", () => {
    const comps = walk(join(ROOT, "components/focus")).filter((f) => /\.tsx?$/.test(f) && !f.includes("/reference/"));
    const direct = comps.filter((f) => /from "next\/link"/.test(readFileSync(f, "utf8"))).map(rel).sort();
    expect(direct).toEqual(["components/focus/shell/area-not-connected.tsx", "components/focus/shell/not-connected.tsx", "components/focus/ui/link.tsx"]);
  });
  it("prototype controls are gated by the demo scope, not by NODE_ENV", () => {
    const comps = walk(join(ROOT, "components/focus")).filter((f) => /\.tsx?$/.test(f) && !f.includes("/reference/"));
    expect(comps.filter((f) => /process\.env\.NODE_ENV/.test(readFileSync(f, "utf8"))).map(rel)).toEqual([]);
  });
});

describe("scoped href is idempotent", () => {
  it("an already-scoped path is never doubled (also for a business slugged 'focus')", () => {
    const b = scopeBase("focus");
    expect(b).toBe("/focus/focus");
    expect(scopedHref(b, "/focus/focus/work/list")).toBe("/focus/focus/work/list");
    expect(scopedHref(b, "/focus/work/list")).toBe("/focus/focus/work/list");
    expect(scopedHref(b, "/focus")).toBe("/focus/focus");
    expect(scopedHref(scopeBase("acme"), scopedHref(scopeBase("acme"), "/focus/work"))).toBe("/acme/focus/work");
  });
});
