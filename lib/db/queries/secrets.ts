/**
 * Per-business encrypted secrets. Values are AES-256-GCM encrypted at rest
 * (lib/crypto/secrets.ts) and are never returned to the client — callers can
 * ask whether a secret exists, not what it is.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { businessSecrets } from "../schema";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secrets";

export async function getSecret(businessId: string, key: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(businessSecrets)
    .where(and(eq(businessSecrets.businessId, businessId), eq(businessSecrets.key, key)))
    .limit(1);
  if (!row) return null;
  try {
    return decryptSecret(row.ciphertext, row.iv);
  } catch {
    // Wrong or rotated SECRETS_MASTER_KEY — treat as absent rather than 500ing
    // the whole request; the caller falls back to its non-AI path.
    return null;
  }
}

export async function hasSecret(businessId: string, key: string): Promise<boolean> {
  const [row] = await db
    .select({ id: businessSecrets.id })
    .from(businessSecrets)
    .where(and(eq(businessSecrets.businessId, businessId), eq(businessSecrets.key, key)))
    .limit(1);
  return !!row;
}

export async function setSecret(businessId: string, key: string, plaintext: string) {
  const { ciphertext, iv } = encryptSecret(plaintext);
  const existing = await db
    .select({ id: businessSecrets.id })
    .from(businessSecrets)
    .where(and(eq(businessSecrets.businessId, businessId), eq(businessSecrets.key, key)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(businessSecrets)
      .set({ ciphertext, iv, updatedAt: new Date() })
      .where(eq(businessSecrets.id, existing[0].id));
  } else {
    await db.insert(businessSecrets).values({ businessId, key, ciphertext, iv });
  }
}

export async function removeSecret(businessId: string, key: string) {
  await db
    .delete(businessSecrets)
    .where(and(eq(businessSecrets.businessId, businessId), eq(businessSecrets.key, key)));
}
