import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { db } from "@/lib/db";
import { tasks, leads, proposals } from "@/lib/db/schema";
import { computeTotals } from "@/lib/pdf-helpers";

export default async function DashboardPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const session = await auth();
  const { business } = await resolveBusiness(businessSlug, session!.user!.id!);
  const businessId = business.id;

  const today = new Date().toISOString().slice(0, 10);

  const [allTasks, allLeads, allProposals] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.businessId, businessId)),
    db.select().from(leads).where(eq(leads.businessId, businessId)),
    db.select().from(proposals).where(eq(proposals.businessId, businessId)),
  ]);

  const openTasks = allTasks.filter((t) => t.status !== "done");
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < today);
  const newLeads = allLeads.filter((l) => l.status === "new");
  const followUpsDue = allLeads.filter((l) => l.nextFollowUp && l.nextFollowUp <= today);

  const openProposals = allProposals.filter((p) => p.status === "draft" || p.status === "sent");
  // Pipeline = what the still-open proposals are worth, using the same totals
  // helper the PDF uses so the dashboard can't drift from the printed number.
  const pipelineValue = openProposals.reduce(
    (sum, p) =>
      sum +
      computeTotals({
        clientName: p.clientName,
        services: (p.services as { setupFee: number; monthlyFee: number }[]) ?? [],
        vatRate: p.vatRate,
        includeVat: p.includeVat,
      }).grandTotal,
    0
  );

  const cards = [
    { label: "Open tasks", value: openTasks.length, href: `/${businessSlug}/tasks` },
    { label: "Overdue tasks", value: overdueTasks.length, href: `/${businessSlug}/tasks` },
    { label: "New leads", value: newLeads.length, href: `/${businessSlug}/leads` },
    { label: "Follow-ups due", value: followUpsDue.length, href: `/${businessSlug}/leads` },
    { label: "Total leads", value: allLeads.length, href: `/${businessSlug}/leads` },
    { label: "Open proposals", value: openProposals.length, href: `/${businessSlug}/proposals` },
    {
      label: "Pipeline value",
      value: `₪ ${pipelineValue.toLocaleString("en-US")}`,
      href: `/${businessSlug}/proposals`,
    },
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
