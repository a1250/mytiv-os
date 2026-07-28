"use client";

/**
 * New component (no Electron equivalent — the desktop app is single-business).
 * Reads the businesses the current user belongs to (lib/tenant.ts's
 * listBusinessesForUser, passed down from the layout Server Component) and
 * lets them jump between workspaces without re-login. URL-segment-based
 * tenancy means this is a plain navigation, not a state change.
 */
import { useRouter } from "next/navigation";

export type BusinessOption = { slug: string; name: string; role: string };

export function BusinessSwitcher({
  businesses,
  currentSlug,
}: {
  businesses: BusinessOption[];
  currentSlug: string;
}) {
  const router = useRouter();

  if (businesses.length <= 1) return null;

  return (
    <select
      className="business-switcher"
      value={currentSlug}
      onChange={(e) => router.push(`/${e.target.value}`)}
      aria-label="Switch business"
    >
      {businesses.map((b) => (
        <option key={b.slug} value={b.slug}>
          {b.name}
        </option>
      ))}
    </select>
  );
}
