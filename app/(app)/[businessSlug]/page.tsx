import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { db } from "@/lib/db";
import { tasks, leads } from "@/lib/db/schema";

export default async function DashboardPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const session = await auth();
  const { business } = await resolveBusiness(businessSlug, session!.user!.id!);
  const businessId = business.id;

  const today = new Date().toISOString().slice(0, 10);

  const [allTasks, allLeads] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.businessId, businessId)),
    db.select().from(leads).where(eq(leads.businessId, businessId)),
  ]);

  const openTasks = allTasks.filter((t) => t.status !== "done");
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < today);
  const newLeads = allLeads.filter((l) => l.status === "new");
  const followUpsDue = allLeads.filter((l) => l.nextFollowUp && l.nextFollowUp <= today);

  const cards = [
    { label: "Open tasks", value: openTasks.length, href: `/${businessSlug}/tasks` },
    { label: "Overdue tasks", value: overdueTasks.length, href: `/${businessSlug}/tasks` },
    { label: "New leads", value: newLeads.length, href: `/${businessSlug}/leads` },
    { label: "Follow-ups due", value: followUpsDue.length, href: `/${businessSlug}/leads` },
    { label: "Total leads", value: allLeads.length, href: `/${businessSlug}/leads` },
  ];

  return (
    <div className="page">
      <h1>{business.name} — Dashboard</h1>
      <div className="card-grid">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="stat-card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
