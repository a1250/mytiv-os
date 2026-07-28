/**
 * AES-256-GCM encryption for per-business secrets (Claude API key, Google OAuth
 * tokens, Higgsfield key). Replaces Electron's OS-keychain-backed `safeStorage`
 * (electron/services/anthropic.cjs) — there's no OS keychain in a serverless
 * environment, so a single master key from an encrypted Vercel env var is used
 * instead. Ciphertext and IV are stored separately (see business_secrets /
 * google_accounts columns in lib/db/schema.ts).
 */
import crypto from "crypto";

const ALGO = "aes-256-gcm";

function masterKey(): Buffer {
  const raw = process.env.SECRETS_MASTER_KEY;
  if (!raw) {
    throw new Error("SECRETS_MASTER_KEY is not set — generate one with `openssl rand -hex 32`.");
  }
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error("SECRETS_MASTER_KEY must be a 32-byte value hex-encoded (64 hex chars).");
  }
  return key;
}

export function encryptSecret(plaintext: string): { ciphertext: string; iv: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, masterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // store ciphertext || authTag together, base64-encoded; iv stored separately
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptSecret(ciphertext: string, iv: string): string {
  const raw = Buffer.from(ciphertext, "base64");
  const authTag = raw.subarray(raw.length - 16);
  const encrypted = raw.subarray(0, raw.length - 16);
  const decipher = crypto.createDecipheriv(ALGO, masterKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
