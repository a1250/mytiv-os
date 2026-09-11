import { objectInput, requiredText, dateMs, OpsPolicyError } from '../ops-policy';
export type Priority = { id: string; title: string; evidenceRef: string; confidence: 'owner_priority' | 'verified_gap' | 'unverified' };
export type PlanItem = { id: string; title: string; kind: 'campaign' | 'content' | 'crm' | 'events'; priorityId: string; start: string; end: string; dependsOn: string[]; sourceRef: string; approvalRef?: string; clickupTaskId?: string };
export type Review = { id: string; title: string; due: string; cadence: 'weekly' | 'monthly'; sourceRef: string };
export type MarketingPlan = { schemaVersion: 1; marketingBusiness: string; revision: number; sourceRevision: string; asOf: string; priorities: Priority[]; items: PlanItem[]; reviews: Review[] };
function keys(o: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(o).some(k => !allowed.includes(k))) throw new OpsPolicyError('unknown_contract_field');
}
function id(v: unknown) { const s = requiredText(v, 'id', 100); if (!/^[a-zA-Z0-9_-]+$/.test(s)) throw new OpsPolicyError('invalid_id'); return s; }
function ref(v: unknown) {
  const s = requiredText(v, 'source_ref', 1000);
  // References are identifiers or safe public links, never fetched by this importer.
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    const u = new URL(s);
    if (u.protocol !== 'https:' || u.username || u.password) throw new OpsPolicyError('unsafe_reference');
  } else if (s.startsWith('/') || s.includes('..') || s.includes('\\')) throw new OpsPolicyError('unsafe_reference');
  return s;
}
function array(v: unknown): unknown[] { if (!Array.isArray(v) || v.length > 250) throw new OpsPolicyError('invalid_collection'); return v; }
function unique<T extends { id: string }>(rows: T[]) { if (new Set(rows.map(r => r.id)).size !== rows.length) throw new OpsPolicyError('duplicate_id'); return rows; }
function date(v: unknown) { dateMs(v); return v as string; }
export function parseMarketingPlan(value: unknown, expectedBusiness: string): MarketingPlan {
  const o = objectInput(value);
  keys(o, ['schemaVersion','marketingBusiness','revision','sourceRevision','asOf','priorities','items','reviews']);
  if (o.schemaVersion !== 1 || o.marketingBusiness !== expectedBusiness) throw new OpsPolicyError('contract_scope_or_version_mismatch');
  if (!Number.isSafeInteger(o.revision) || (o.revision as number) < 1) throw new OpsPolicyError('invalid_revision');
  const asOf = requiredText(o.asOf, 'as_of', 30);
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(asOf) || !Number.isFinite(Date.parse(asOf)) || Date.parse(asOf) > Date.now() + 300000) throw new OpsPolicyError('invalid_as_of');
  const priorities = unique(array(o.priorities).map(v => {
    const r = objectInput(v); keys(r, ['id','title','evidenceRef','confidence']);
    if (!['owner_priority','verified_gap','unverified'].includes(String(r.confidence))) throw new OpsPolicyError('invalid_confidence');
    return { id: id(r.id), title: requiredText(r.title, 'title', 500), evidenceRef: ref(r.evidenceRef), confidence: r.confidence as Priority['confidence'] };
  }));
  const items = unique(array(o.items).map(v => {
    const r = objectInput(v); keys(r, ['id','title','kind','priorityId','start','end','dependsOn','sourceRef','approvalRef','clickupTaskId']);
    if (!['campaign','content','crm','events'].includes(String(r.kind))) throw new OpsPolicyError('invalid_kind');
    const start = date(r.start), end = date(r.end);
    if (start > end) throw new OpsPolicyError('reversed_schedule');
    const priorityId = id(r.priorityId);
    if (!priorities.some(p => p.id === priorityId)) throw new OpsPolicyError('missing_priority');
    return { id: id(r.id), title: requiredText(r.title, 'title', 500), kind: r.kind as PlanItem['kind'], priorityId, start, end,
      dependsOn: array(r.dependsOn).map(id), sourceRef: ref(r.sourceRef),
      ...(r.approvalRef === undefined ? {} : { approvalRef: ref(r.approvalRef) }),
      ...(r.clickupTaskId === undefined ? {} : { clickupTaskId: id(r.clickupTaskId) }) };
  }));
  const byId = new Map(items.map(i => [i.id, i]));
  const visiting = new Set<string>(), done = new Set<string>();
  function visit(item: PlanItem) {
    if (visiting.has(item.id)) throw new OpsPolicyError('dependency_cycle');
    if (done.has(item.id)) return;
    visiting.add(item.id);
    for (const dependency of item.dependsOn) {
      const parent = byId.get(dependency);
      if (!parent) throw new OpsPolicyError('missing_dependency');
      if (parent.end > item.start) throw new OpsPolicyError('dependency_schedule_conflict');
      visit(parent);
    }
    visiting.delete(item.id); done.add(item.id);
  }
  items.forEach(visit);
  const reviews = unique(array(o.reviews).map(v => {
    const r = objectInput(v); keys(r, ['id','title','due','cadence','sourceRef']);
    if (!['weekly','monthly'].includes(String(r.cadence))) throw new OpsPolicyError('invalid_cadence');
    return { id: id(r.id), title: requiredText(r.title, 'title', 500), due: date(r.due), cadence: r.cadence as Review['cadence'], sourceRef: ref(r.sourceRef) };
  }));
  return { schemaVersion: 1, marketingBusiness: expectedBusiness, revision: o.revision as number, sourceRevision: requiredText(o.sourceRevision, 'source_revision', 100), asOf, priorities, items, reviews };
}
