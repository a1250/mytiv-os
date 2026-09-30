// Pure: the owner-only, PII-free audit export (T-11.2 · MKT-GOV02, GOV07). No data access.
import type { AuditActionView } from './db/queries/ops-audit';

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Only unambiguous phone shapes: `+`-prefixed international numbers and Israeli local numbers (0X-XXXXXXX /
// 05X-XXXXXXX). A bare digit run is NOT treated as a phone — ISO dates, ClickUp date_updated millis and UUID
// digit groups must survive intact.
const PHONE = /(?<![\w-])(?:\+\d[\d\s().-]{7,}\d|0\d{1,2}-?\d{7})(?![\w-])/g;
/** Token shapes that must never leave the system (API keys, bearer tokens, cloud keys, JWTs, DB URLs). */
const SECRET_SHAPES: [string, RegExp][] = [
  ['bearer', /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/g], ['openai/anthropic key', /\bsk-[A-Za-z0-9_-]{16,}/g], ['github token', /\bgh[pousr]_[A-Za-z0-9]{20,}/g],
  ['slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/g], ['aws key', /\bAKIA[0-9A-Z]{16}\b/g], ['clickup token', /\bpk_\d+_[A-Z0-9]{20,}/g],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g], ['connection string', /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+/g],
];
const SECRET_KEY = /(token|secret|password|passwd|authorization|api[_-]?key|cookie|credential)/i;

/** Recursively remove PII and secrets from an audit detail: secret-named keys are dropped to "[redacted]",
 *  emails / phone numbers / token shapes inside strings are replaced. Numbers, booleans and ids stay. */
export function redact(value: unknown, key = ''): unknown {
  if (SECRET_KEY.test(key)) return '[redacted]';
  if (typeof value === 'string') {
    let s = value;
    for (const [, re] of SECRET_SHAPES) s = s.replace(re, '[redacted-secret]');
    return s.replace(EMAIL, '[redacted-email]').replace(PHONE, '[redacted-phone]');
  }
  if (Array.isArray(value)) return value.map((v) => redact(v));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  return value;
}

/** Findings of the secret scan over an export (after redaction there must be none — the export fails closed). */
export function scanForSecrets(text: string): string[] {
  const found = SECRET_SHAPES.filter(([, re]) => { re.lastIndex = 0; return re.test(text); }).map(([name]) => name);
  if (EMAIL.test(text)) found.push('email');
  EMAIL.lastIndex = 0;
  return found;
}

/** One JSON line per governed action (actor as an opaque user id, never a name or email). */
export function toExportLines(rows: (AuditActionView & { projectId: string })[]): string[] {
  return rows.map((r) => JSON.stringify({
    action_id: r.id, request_id: r.requestId, action: r.action, project_id: r.projectId, actor_id: r.actor, confirmed_at: r.confirmedAt.toISOString(),
    events: r.events.map((e) => ({ event: e.event, at: e.at.toISOString(), detail: redact(e.detail) })),
  }));
}

/** The full export text, or an error when the scan still finds anything secret-shaped (nothing is written). */
export function buildAuditExport(rows: (AuditActionView & { projectId: string })[]): { ok: true; jsonl: string; lines: number } | { ok: false; findings: string[] } {
  const lines = toExportLines(rows);
  const jsonl = lines.length ? `${lines.join('\n')}\n` : '';
  const findings = scanForSecrets(jsonl);
  return findings.length ? { ok: false, findings } : { ok: true, jsonl, lines: lines.length };
}
