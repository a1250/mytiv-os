import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listBusinessesForUser } from "@/lib/tenant";

export default async function RootPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const businesses = await listBusinessesForUser(session.user.id);
  if (businesses.length === 0) {
    // No business membership yet — Phase 0 has no invite/onboarding UI, so this
    // is a dead end for now; the seed script (scripts/seed.ts) is how the first
    // business gets created.
    redirect("/login");
  }

  // Ops Home is the landing screen: what is stuck is the first thing to see
  // after logging in, not something to navigate to.
  redirect(`/${businesses[0].business.slug}/ops`);
}
