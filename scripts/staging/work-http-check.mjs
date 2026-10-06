/**
 * Mytiv Work HTTP check — LOCAL ONLY (scripts/staging/dev.sh-style server on localhost with the ClickUp mock).
 * Real Auth.js sessions (owner-a, member-a, owner-b fixtures from seed-staging.mjs) against:
 *   1. the hardened legacy /api/[slug]/tasks routes (allowlist, tenant-checked links, same-origin, delete role, 404s);
 *   2. the ClickUp write route with the task table's neutral assignee body ({provider, id}).
 * Test rows are titled "PKG1-QA …".
 *
 *   BASE=http://localhost:3100 MOCK=http://127.0.0.1:4545 STAGING_PASSWORD=… node scripts/staging/work-http-check.mjs
 */
const BASE = process.env.BASE ?? 'http://localhost:3100', MOCK = process.env.MOCK ?? 'http://127.0.0.1:4545', PW = process.env.STAGING_PASSWORD;
if (!PW) throw new Error('STAGING_PASSWORD required');
if (!/^http:\/\/(localhost|127\.0\.0\.1):/.test(BASE) || !/^http:\/\/(localhost|127\.0\.0\.1):/.test(MOCK)) throw new Error('refused: local only');
const A1 = 'aaaaaaaa-1111-4000-8000-0000000000a1', B1 = 'bbbbbbbb-1111-4000-8000-0000000000b1';
class Session {
  constructor(n) { this.n = n; this.jar = new Map(); }
  absorb(r) { for (const c of r.headers.getSetCookie?.() ?? []) { const [kv] = c.split(';'); const i = kv.indexOf('='); this.jar.set(kv.slice(0, i), kv.slice(i + 1)); } }
  async fetch(path, init = {}, origin = BASE) {
    const headers = { ...(init.headers ?? {}), cookie: [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ') };
    if (init.method && init.method !== 'GET' && origin) headers.origin = origin;
    const r = await fetch(BASE + path, { ...init, headers, redirect: 'manual' }); this.absorb(r); return r;
  }
  async login(email) {
    const { csrfToken } = await (await this.fetch('/api/auth/csrf')).json();
    await this.fetch('/api/auth/callback/credentials', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ csrfToken, email, password: PW, redirect: 'false' }) });
    if (![...this.jar.keys()].some((k) => k.includes('session-token'))) throw new Error(`login failed ${email}`); return this;
  }
}
const ownerA = await new Session('owner-a').login('owner-a@staging.invalid'), memberA = await new Session('member-a').login('member-a@staging.invalid'), ownerB = await new Session('owner-b').login('owner-b@staging.invalid');
let fail = 0; const rows = [];
async function check(s, method, path, body, want, origin = BASE, note = '') {
  const r = await s.fetch(path, { method, ...(body ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {}) }, origin);
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
  const ok = r.status === want.status && (want.error === undefined || j?.error === want.error) && (!want.check || want.check(j));
  if (!ok) fail++; rows.push(`| ${ok ? '✅' : '❌'} | ${s.n} | ${method} ${path.replace(/[0-9a-f-]{36}/g, (m) => m.slice(0, 8))} ${note} | ${r.status}${j?.error ? ' ' + j.error : ''} |`); return j;
}
const created = await check(ownerA, 'POST', '/api/mytiv/tasks', { title: 'PKG1-QA linked task', projectId: A1 }, { status: 200, check: (j) => j.projectId === A1 }, BASE, '(own project → stored)');
const id = created?.id;
await check(ownerA, 'POST', '/api/mytiv/tasks', { title: 'PKG1-QA foreign', projectId: B1 }, { status: 404, error: 'project_not_found' }, BASE, "(B's project)");
await check(ownerA, 'POST', '/api/mytiv/tasks', { title: 'PKG1-QA x', businessId: 'x' }, { status: 400, error: 'field_not_allowed' });
await check(ownerA, 'POST', '/api/mytiv/tasks', { title: 'PKG1-QA x' }, { status: 403, error: 'same_origin_required' }, 'https://evil.example', '(cross-origin)');
await check(ownerA, 'PATCH', `/api/mytiv/tasks/${id}`, { projectId: B1 }, { status: 404, error: 'project_not_found' });
await check(memberA, 'PATCH', `/api/mytiv/tasks/${id}`, { status: 'done' }, { status: 200, check: (j) => j.doneAt }, BASE, '(member may update)');
await check(memberA, 'DELETE', `/api/mytiv/tasks/${id}`, null, { status: 403, error: 'approval_role_required' }, BASE, '(member delete)');
await check(ownerB, 'PATCH', `/api/second-business/tasks/${id}`, { title: 'hijack' }, { status: 404, error: 'not_found' }, BASE, "(B on A's task)");
await check(ownerB, 'DELETE', `/api/second-business/tasks/${id}`, null, { status: 404, error: 'not_found' }, BASE, "(B on A's task)");
await check(ownerB, 'GET', '/api/mytiv/tasks', null, { status: 404 }, BASE, "(B reads A's business)");
await check(ownerA, 'DELETE', `/api/mytiv/tasks/${id}`, null, { status: 204 });
await check(ownerA, 'DELETE', `/api/mytiv/tasks/${id}`, null, { status: 404, error: 'not_found' }, BASE, '(already gone)');

// 2. The ClickUp write route with neutral person refs (what the task table now sends).
await fetch(`${MOCK}/__reset`, { method: 'POST' });
const mockTask = async (id) => (await (await fetch(`${MOCK}/__state`)).json()).tasks[id];
const before = await mockTask('STG-2');
const opsPatch = (body) => ownerA.fetch('/api/mytiv/ops/tasks/STG-2', { method: 'PATCH', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ projectId: A1, confirmed: true, requestId: crypto.randomUUID(), ...body }) });
const r1 = await opsPatch({ assignee: { add: [{ provider: 'clickup', id: '1002' }], rem: [] }, expectedUpdatedAt: new Date(Number(before.date_updated)).toISOString() });
const after = await mockTask('STG-2');
const ok1 = r1.status === 200 && JSON.stringify(after.assignees) === '[1002]'; if (!ok1) fail++;
rows.push(`| ${ok1 ? '✅' : '❌'} | owner-a | PATCH /api/mytiv/ops/tasks/STG-2 neutral ref {clickup,1002} → ClickUp member 1002 | ${r1.status} ${JSON.stringify(after.assignees)} |`);
const r2 = await opsPatch({ assignee: { add: [{ provider: 'mytiv', id: '1001' }] } });
const j2 = await r2.json(); const after2 = await mockTask('STG-2');
const ok2 = r2.status === 400 && j2.error === 'invalid_assignee' && after2.date_updated === after.date_updated; if (!ok2) fail++;
rows.push(`| ${ok2 ? '✅' : '❌'} | owner-a | PATCH /api/mytiv/ops/tasks/STG-2 Mytiv ref with numeric id → refused, nothing written | ${r2.status} ${j2.error} |`);
console.log('| | session | request | got |\n|---|---|---|---|\n' + rows.join('\n') + `\n\n${rows.length - fail}/${rows.length} checks passed`);
process.exit(fail ? 1 : 0);
