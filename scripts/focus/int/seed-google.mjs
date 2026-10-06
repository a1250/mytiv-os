// LOCAL TEST TOOLING ONLY — connects a fixture business to the local Gmail stand-in: a google_accounts row with a
// fake access token (encrypted with the stack's SECRETS_MASTER_KEY, valid for a day). Output: SQL on stdout for psql.
// Usage: SECRETS_MASTER_KEY=… node --import tsx scripts/focus/int/seed-google.mjs <businessId> | psql …
import { encryptSecret } from "../../../lib/crypto/secrets.ts";
const business = process.argv[2]; if (!business) throw new Error("businessId required");
const a = encryptSecret("local-fake-access-token"), r = encryptSecret("local-fake-refresh-token");
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
console.log(`INSERT INTO google_accounts (business_id, email, display_name, access_token_enc, access_token_iv, refresh_token_enc, refresh_token_iv, token_expiry, scopes, connected_at, status)
VALUES (${q(business)}, 'owner-a@staging.invalid', 'Owner A', ${q(a.ciphertext)}, ${q(a.iv)}, ${q(r.ciphertext)}, ${q(r.iv)}, now() + interval '1 day', 'https://www.googleapis.com/auth/gmail.modify', now(), 'connected')
ON CONFLICT (business_id) DO NOTHING;`);
