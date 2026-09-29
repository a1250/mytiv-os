import { OpsPolicyError } from '../../ops-policy';

/**
 * Shared, dependency-free ports of the canonical marketing-os contract primitives
 * (marketing-os `schemas/contracts/*.ts`). The vendored JSON Schemas are STRUCTURAL only — their own
 * `$comment` says the reference validator (zod refinements, formats, the safe-ref allowlist and the
 * envelope's not-in-the-future rule) is authoritative. These helpers reproduce those rules exactly so
 * the app's contextual validators agree with the canonical validator on every input;
 * `tests/fixtures/marketing-canonical-parity.json` (generated from the canonical code) pins that.
 */

/** A contract rule violation: the first failing rule, as `contract_rule_violation: <path> <reason>`. */
export function violation(path: string, reason: string): never {
  throw new OpsPolicyError(`contract_rule_violation: ${path} ${reason}`);
}

// ── zod 3.25 `z.string().datetime()` / `.datetime({ offset: true })` / `.date()` — exact regexes ──
// Calendar-aware (leap years), seconds OPTIONAL, fractional seconds of any precision, `Z` required
// unless offsets are allowed (`±HH:MM` or `±HHMM`). Pure regex, exactly as zod checks it.
const DATE_SOURCE = '((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))';
const TIME_SOURCE = '([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d(\\.\\d+)?)?';
const DATETIME_Z = new RegExp(`^${DATE_SOURCE}T${TIME_SOURCE}(Z)$`);
const DATETIME_OFFSET = new RegExp(`^${DATE_SOURCE}T${TIME_SOURCE}(Z|([+-]\\d{2}:?\\d{2}))$`);
const DATE_ONLY = new RegExp(`^${DATE_SOURCE}$`);

/** zod `z.string().datetime()` (UTC `Z` only). */
export function isDateTimeZ(v: unknown): v is string { return typeof v === 'string' && DATETIME_Z.test(v); }
/** zod `z.string().datetime({ offset: true })` — the C4–C16 `Timestamp`. */
export function isTimestamp(v: unknown): v is string { return typeof v === 'string' && DATETIME_OFFSET.test(v); }
/** zod `z.string().date()`. */
export function isDateOnly(v: unknown): v is string { return typeof v === 'string' && DATE_ONLY.test(v); }
/** The C7/C12 `DateOrTimestamp` union. */
export function isDateOrTimestamp(v: unknown): v is string { return isDateOnly(v) || isTimestamp(v); }

/** Clock-skew tolerance for the envelope's not-in-the-future `asOf` rule — the same 5 minutes the
 *  app's C1 path (`parseMarketingPlan`) already applies. */
export const AS_OF_SKEW_MS = 300_000;

/** `NonEmpty = z.string().trim().min(1)` — non-empty after trimming (a whitespace-only identity,
 *  attestation or label never satisfies a mandatory field). */
export function isNonEmpty(v: unknown): v is string { return typeof v === 'string' && v.trim().length >= 1; }
/** The trimmed value zod's `NonEmpty` produces — refinements (uniqueness, references) compare these. */
export function trimmed(v: string): string { return v.trim(); }

// ── canonical `isSafeRef` (marketing-os schemas/contracts/c1-c3.ts) — ported verbatim ──
const MAX_DECODE_PASSES = 20;

function canonicalDecode(s: string): string | null {
  let cur = s;
  for (let i = 0; i < MAX_DECODE_PASSES; i++) {
    if (!cur.includes('%')) return cur;
    let next: string;
    try {
      next = decodeURIComponent(cur);
    } catch {
      return null; // malformed percent-encoding — unsafe
    }
    if (next === cur) return null; // stable but still holds a literal/degenerate `%` — unsafe
    cur = next;
  }
  return null; // bound exhausted while still encoded — unsafe
}

function hasTraversalSegment(path: string): boolean {
  return path.split(/[\\/?#]/).some((seg) => seg === '..');
}

function hasControlChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) return true;
  }
  return false;
}

/** Allowlist ref check: an https URL without userinfo, or a relative `[A-Za-z0-9._-]` path — after
 *  fail-closed raw + fully-percent-decoded pre-filters. A ref is only ever a pointer; never fetched. */
export function isSafeRef(ref: unknown): ref is string {
  if (typeof ref !== 'string' || ref.length === 0) return false;

  if (hasControlChar(ref)) return false;
  if (/\s/.test(ref)) return false;
  if (ref.includes('\\')) return false;
  if (ref.normalize('NFKC') !== ref) return false;

  const decoded = canonicalDecode(ref);
  if (decoded === null) return false;

  if (hasControlChar(decoded)) return false;
  if (/\s/.test(decoded)) return false;
  if (decoded.includes('\\')) return false;
  if (decoded.normalize('NFKC') !== decoded) return false;
  if (hasTraversalSegment(decoded)) return false;

  if (/^https:\/\//i.test(decoded)) {
    let u: URL;
    try {
      u = new URL(decoded);
    } catch {
      return false;
    }
    if (u.protocol !== 'https:') return false;
    if (u.username !== '' || u.password !== '') return false;
    const afterScheme = decoded.slice('https://'.length);
    const authority = afterScheme.split(/[/?#]/, 1)[0];
    if (authority.includes('@')) return false;
    if (!/^[A-Za-z0-9.-]+(?::[0-9]+)?$/.test(authority)) return false;
    const rest = afterScheme.slice(authority.length);
    if (hasTraversalSegment(rest.split(/[?#]/, 1)[0])) return false;
    if (rest !== '' && !/^[A-Za-z0-9._~:/?#@!$&'()*+,;=%-]*$/.test(rest)) return false;
    return true;
  }

  if (decoded.startsWith('/')) return false;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return false;
  const segments = decoded.split('/');
  if (segments.some((s) => s.length === 0)) return false;
  if (!segments.every((s) => /^[A-Za-z0-9._-]+$/.test(s))) return false;
  return true;
}

// ── field assertions used by the per-contract contextual validators ──
export function requireNonEmpty(v: unknown, path: string): string {
  if (!isNonEmpty(v)) violation(path, 'must be non-empty after trimming');
  return v;
}
export function requireTimestamp(v: unknown, path: string): string {
  if (!isTimestamp(v)) violation(path, 'must be an ISO-8601 datetime');
  return v;
}
export function requireDateOrTimestamp(v: unknown, path: string): string {
  if (!isDateOrTimestamp(v)) violation(path, 'must be an ISO-8601 date or datetime');
  return v;
}
export function requireSafeRef(v: unknown, path: string): string {
  if (!isSafeRef(v)) violation(path, 'unsafe ref');
  return v;
}
/** Canonical `uniqueBy` over the (trimmed, for NonEmpty keys) key of each row. */
export function requireUnique<T>(rows: readonly T[], key: (row: T) => string, path: string, label: string): void {
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const k = key(row);
    if (seen.has(k)) violation(`${path}/${i}`, `duplicate ${label}: ${k}`);
    seen.add(k);
  });
}
/** Present-and-array or absent (zod `.default([])`): the structural gate already checked the type. */
export function rows<T>(v: T[] | undefined): T[] { return v ?? []; }
