import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Shared helpers for the vendored-contract conformance tests (not a test file itself). */
export const BINDING = { marketingBusiness: 'demo-biz', bindingVersion: 1 };
export const CONTRACTS_DIR = path.join(process.cwd(), 'lib/marketing/contracts');
export type Vectors = { valid: unknown[]; invalid: unknown[] };
export const vectors = (kind: string): Vectors => JSON.parse(readFileSync(path.join(CONTRACTS_DIR, `${kind}.vectors.json`), 'utf8'));
/** A fresh deep copy of the first valid canonical vector, as a mutable record. */
export const validOf = (kind: string): Record<string, unknown> => JSON.parse(JSON.stringify(vectors(kind).valid[0]));
