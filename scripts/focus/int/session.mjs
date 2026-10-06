// Real Auth.js credentials sign-in over HTTP (cookie jar), for the local integration checks. Fixture users only.
export const BASE = process.env.BASE ?? "http://localhost:3200";
export class Session {
  constructor(name) { this.name = name; this.jar = new Map(); }
  cookieHeader() { return [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "); }
  absorb(res) { for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(";"); const i = kv.indexOf("="); this.jar.set(kv.slice(0, i), kv.slice(i + 1)); } }
  async fetch(path, init = {}) {
    const headers = { ...(init.headers ?? {}), cookie: this.cookieHeader() };
    if (init.method && init.method !== "GET" && !("origin" in headers)) headers.origin = BASE;
    const res = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
    this.absorb(res); return res;
  }
  async json(path, init = {}) {
    const res = await this.fetch(path, init.body && typeof init.body !== "string" ? { ...init, body: JSON.stringify(init.body), headers: { "content-type": "application/json", ...(init.headers ?? {}) } } : init);
    const text = await res.text(); let body; try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body };
  }
  async login(email, password) {
    const { csrfToken } = await (await this.fetch("/api/auth/csrf")).json();
    const res = await this.fetch("/api/auth/callback/credentials", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken, email, password, redirect: "false" }) });
    if (![200, 302].includes(res.status) || ![...this.jar.keys()].some((k) => k.includes("session-token"))) throw new Error(`login failed for ${email}: ${res.status}`);
    return this;
  }
}
