/**
 * Minimal staging fixtures, emitted as SQL on stdout so the same seed runs through psql against
 * any Postgres (local or Neon). Nothing from production. Every identifier is fixed and distinct
 * across the two businesses so a tenant-isolation test can never pass by coincidence.
 *
 *   Business A  slug "mytiv"            — the only slug on the checked-in ClickUp allowlist
 *     project A1 "UMINO staging"          folder 901816026303 (allowlisted; exists in the mock)      → linked
 *     project A2 "Unauthorized folder"    folder 999000111    (NOT allowlisted; exists in the mock) → unauthorized
 *     project A3 "Unlinked"               no folder                                                 → unlinked
 *   Business B  slug "second-business"  — no allowlist at all
 *     project B1 "B project"              folder 999000111                                          → unauthorized
 *   Users: owner-a (owner of A) · member-a (member of A) · owner-b (owner of B only)
 *
 * Usage: STAGING_PASSWORD=<one password for all three fixture users> node scripts/staging/seed-staging.mjs | psql "$DATABASE_URL"
 */
import bcrypt from "bcryptjs";

const pw = process.env.STAGING_PASSWORD;
if (!pw) throw new Error("STAGING_PASSWORD is required");
const hash = await bcrypt.hash(pw, 10);
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

export const IDS = {
  bizA: "aaaaaaaa-0000-4000-8000-00000000000a", bizB: "bbbbbbbb-0000-4000-8000-00000000000b",
  ownerA: "aaaaaaaa-0000-4000-8000-0000000000a1", memberA: "aaaaaaaa-0000-4000-8000-0000000000a2", ownerB: "bbbbbbbb-0000-4000-8000-0000000000b1",
  projA1: "aaaaaaaa-1111-4000-8000-0000000000a1", projA2: "aaaaaaaa-1111-4000-8000-0000000000a2", projA3: "aaaaaaaa-1111-4000-8000-0000000000a3",
  projB1: "bbbbbbbb-1111-4000-8000-0000000000b1",
};

const sql = `
BEGIN;
INSERT INTO businesses (id, name, slug) VALUES
  (${q(IDS.bizA)}, 'Mytiv — staging', 'mytiv'),
  (${q(IDS.bizB)}, 'Second Business — staging', 'second-business')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, email, password_hash, name) VALUES
  (${q(IDS.ownerA)}, 'owner-a@staging.invalid', ${q(hash)}, 'Owner A'),
  (${q(IDS.memberA)}, 'member-a@staging.invalid', ${q(hash)}, 'Member A'),
  (${q(IDS.ownerB)}, 'owner-b@staging.invalid', ${q(hash)}, 'Owner B')
ON CONFLICT (id) DO NOTHING;
INSERT INTO business_memberships (business_id, user_id, role, accepted_at) VALUES
  (${q(IDS.bizA)}, ${q(IDS.ownerA)}, 'owner', now()),
  (${q(IDS.bizA)}, ${q(IDS.memberA)}, 'member', now()),
  (${q(IDS.bizB)}, ${q(IDS.ownerB)}, 'owner', now())
ON CONFLICT DO NOTHING;
INSERT INTO projects (id, business_id, name, client, clickup_folder_id) VALUES
  (${q(IDS.projA1)}, ${q(IDS.bizA)}, 'UMINO staging', 'UMINO', '901816026303'),
  (${q(IDS.projA2)}, ${q(IDS.bizA)}, 'Unauthorized folder', 'Fixture', '999000111'),
  (${q(IDS.projA3)}, ${q(IDS.bizA)}, 'Unlinked', 'Fixture', NULL),
  (${q(IDS.projB1)}, ${q(IDS.bizB)}, 'B project', 'Fixture B', '999000111')
ON CONFLICT (id) DO NOTHING;
COMMIT;
SELECT b.slug, p.name, p.id, p.clickup_folder_id FROM projects p JOIN businesses b ON b.id = p.business_id ORDER BY 1, 2;
`;
process.stdout.write(sql);
