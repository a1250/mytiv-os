import { objectInput, requiredText, OpsPolicyError } from '../ops-policy';
export type Priority = {
  id: string; title: string; evidenceRef: string;
  // Canonical C1 / MKT-DAT04 value-confidence tier and provenance label.
  confidence: 'KNOWN' | 'ESTIMATED' | 'UNKNOWN';
  provenance: 'owner_supplied' | 'source_verified' | 'owner_verified';
  owner?: string;
};
export type PlanItem = { id: string; title: string; kind: string; priorityId: string; start: string; end: string; dependsOn: string[]; sourceRef: string; approvalRef?: string; clickupTaskId?: string };
export type Review = { id: string; title: string; due: string; cadence: string; sourceRef: string };
export type MarketingPlan = { schemaVersion: 1; marketingBusiness: string; revision: number; sourceRevision: string; asOf: string; priorities: Priority[]; items: PlanItem[]; reviews: Review[] };

const CONFIDENCE = ['KNOWN', 'ESTIMATED', 'UNKNOWN'];
const PROVENANCE = ['owner_supplied', 'source_verified', 'owner_verified'];
// ISO-8601 date-time (canonical C1 uses full timestamps for item start/end and review due).
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

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
function dateTime(v: unknown) {
  const s = requiredText(v, 'date', 40);
  if (!DATE_TIME.test(s) || !Number.isFinite(Date.parse(s))) throw new OpsPolicyError('invalid_date');
  return s;
}
export function parseMarketingPlan(value: unknown, expectedBusiness: string): MarketingPlan {
  const o = objectInput(value);
  keys(o, ['schemaVersion','marketingBusiness','revision','sourceRevision','asOf','priorities','items','reviews']);
  if (o.schemaVersion !== 1 || o.marketingBusiness !== expectedBusiness) throw new OpsPolicyError('contract_scope_or_version_mismatch');
  if (!Number.isSafeInteger(o.revision) || (o.revision as number) < 1) throw new OpsPolicyError('invalid_revision');
  const asOf = requiredText(o.asOf, 'as_of', 40);
  if (!DATE_TIME.test(asOf) || !Number.isFinite(Date.parse(asOf)) || Date.parse(asOf) > Date.now() + 300000) throw new OpsPolicyError('invalid_as_of');
  const priorities = unique(array(o.priorities).map(v => {
    const r = objectInput(v); keys(r, ['id','title','evidenceRef','confidence','provenance','owner']);
    if (!CONFIDENCE.includes(String(r.confidence))) throw new OpsPolicyError('invalid_confidence');
    if (!PROVENANCE.includes(String(r.provenance))) throw new OpsPolicyError('invalid_provenance');
    return { id: id(r.id), title: requiredText(r.title, 'title', 500), evidenceRef: ref(r.evidenceRef),
      confidence: r.confidence as Priority['confidence'], provenance: r.provenance as Priority['provenance'],
      ...(r.owner === undefined ? {} : { owner: requiredText(r.owner, 'owner', 200) }) };
  }));
  const items = unique(array(o.items).map(v => {
    const r = objectInput(v); keys(r, ['id','title','kind','priorityId','start','end','dependsOn','sourceRef','approvalRef','clickupTaskId']);
    const kind = requiredText(r.kind, 'kind', 100); // canonical C1: a non-empty free-form kind, no enum
    const start = dateTime(r.start), end = dateTime(r.end);
    if (Date.parse(start) > Date.parse(end)) throw new OpsPolicyError('reversed_schedule');
    const priorityId = id(r.priorityId);
    if (!priorities.some(p => p.id === priorityId)) throw new OpsPolicyError('missing_priority');
    return { id: id(r.id), title: requiredText(r.title, 'title', 500), kind, priorityId, start, end,
      dependsOn: r.dependsOn === undefined ? [] : array(r.dependsOn).map(id), sourceRef: ref(r.sourceRef),
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
      if (Date.parse(parent.end) > Date.parse(item.start)) throw new OpsPolicyError('dependency_schedule_conflict');
      visit(parent);
    }
    visiting.delete(item.id); done.add(item.id);
  }
  items.forEach(visit);
  const reviews = unique(array(o.reviews).map(v => {
    const r = objectInput(v); keys(r, ['id','title','due','cadence','sourceRef']);
    const cadence = requiredText(r.cadence, 'cadence', 100); // canonical C1: a non-empty free-form cadence, no enum
    return { id: id(r.id), title: requiredText(r.title, 'title', 500), due: dateTime(r.due), cadence, sourceRef: ref(r.sourceRef) };
  }));
  return { schemaVersion: 1, marketingBusiness: expectedBusiness, revision: o.revision as number, sourceRevision: requiredText(o.sourceRevision, 'source_revision', 100), asOf, priorities, items, reviews };
}
