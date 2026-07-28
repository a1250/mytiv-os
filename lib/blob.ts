/**
 * Vercel Blob wrapper — replaces the Electron app's local-filesystem +
 * native-dialog flows (inspiration images under userData/inspiration/,
 * carousel exports/uploads under userData/carousels/, brand logo file).
 * Every business's files are prefixed by businessId to keep them logically
 * separated even though the store itself has no per-tenant access control
 * (it's a single shared public bucket — fine here since nothing stored is
 * sensitive: images, not secrets).
 */
import { put, del } from "@vercel/blob";

export async function uploadAsset(businessId: string, folder: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const key = `${businessId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const blob = await put(key, file, { access: "public", addRandomSuffix: false });
  return blob.url;
}

export async function deleteAsset(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    /* best effort — asset may already be gone */
  }
}
