import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";

export default async function DashboardPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const session = await auth();
  const { business } = await resolveBusiness(businessSlug, session!.user!.id!);

  return (
    <div className="page">
      <h1>{business.name} — Dashboard</h1>
      <p>
        Phase 0 foundation is live: you&apos;re logged in, tenant-resolved to <code>{business.slug}</code>, and this
        page is rendering business-scoped data. Module content (tasks, leads, etc.) lands in Phase 1.
      </p>
    </div>
  );
}
