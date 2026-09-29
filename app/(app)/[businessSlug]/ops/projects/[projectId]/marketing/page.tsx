import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { getProject } from "@/lib/db/queries/projects";
import { marketingModuleEnabled } from "@/lib/marketing/module-flag";
import { getMarketingBinding } from "@/lib/marketing/binding-store";
import { latestArtifact } from "@/lib/marketing/artifacts";
import { MARKETING_VIEWS, approvalsWaiting, marketingView } from "@/lib/marketing/view";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { ApprovalsView } from "@/components/marketing/approvals";
import { BrainView } from "@/components/marketing/brain";
import { LeadsView } from "@/components/marketing/leads";
import { ReportsView } from "@/components/marketing/reports";
import { IntegrationsView, SkillsView } from "@/components/marketing/integrations";
import { listRecords } from "@/lib/marketing/records";

/**
 * The marketing module of one project (E4 screens). Behind MARKETING_MODULE_ENABLED (off → 404). Every
 * view renders only artifacts imported under the ACTIVE binding version, re-validated on read; a read
 * failure is shown as "unavailable", never as empty data.
 */
export default async function MarketingPage({ params, searchParams }: {
  params: Promise<{ businessSlug: string; projectId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  if (!marketingModuleEnabled()) notFound();
  const { businessSlug, projectId } = await params;
  const view = marketingView((await searchParams).view);
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { business, role } = await resolveBusiness(businessSlug, session.user.id);
  const canWrite = role === "owner" || role === "admin";
  const project = await getProject(business.id, projectId);
  if (!project) notFound();
  const binding = await getMarketingBinding(business.id, projectId);

  // Load only what the selected view needs (errors here → "unavailable"); render after the try/catch.
  type Loaded = { view: "home"; data: Parameters<typeof MarketingHome>[0] }
    | { view: "approvals"; data: Parameters<typeof ApprovalsView>[0] }
    | { view: "brain"; data: Parameters<typeof BrainView>[0] }
    | { view: "leads"; data: Parameters<typeof LeadsView>[0] }
    | { view: "reports"; data: Parameters<typeof ReportsView>[0] }
    | { view: "integrations"; data: Parameters<typeof IntegrationsView>[0] }
    | { view: "skills"; data: Parameters<typeof SkillsView>[0] }
    | { view: "pending" };
  let loaded: Loaded | null = null;
  let unavailable = false;
  if (binding) {
    try {
      if (view === "home") {
        const [weekly, freshness, kpis, queue] = await Promise.all([
          latestArtifact(business.id, projectId, binding, "C8"), latestArtifact(business.id, projectId, binding, "C9"),
          latestArtifact(business.id, projectId, binding, "C5"), latestArtifact(business.id, projectId, binding, "C2a"),
        ]);
        loaded = { view: "home", data: { weekly: weekly?.payload ?? null, freshness: freshness?.payload ?? null, kpis: kpis?.payload ?? null, approvalsWaiting: approvalsWaiting(queue?.payload ?? null) } };
      } else if (view === "approvals") {
        const [queue, records] = await Promise.all([latestArtifact(business.id, projectId, binding, "C2a"), listRecords(business.id, projectId, binding)]);
        loaded = { view: "approvals", data: { businessSlug, projectId, bindingVersion: binding.bindingVersion, canWrite, decisions: records.decisions,
          queue: queue ? { id: queue.id, revision: queue.revision, asOf: queue.asOf, items: queue.payload.items } : null } };
      } else if (view === "brain") {
        const [status, records] = await Promise.all([latestArtifact(business.id, projectId, binding, "C3a"), listRecords(business.id, projectId, binding)]);
        loaded = { view: "brain", data: { businessSlug, projectId, bindingVersion: binding.bindingVersion, canWrite,
          proposals: records.evidence.filter((e) => e.kind === "brain_proposal"), status: status ? { id: status.id, asOf: status.asOf, payload: status.payload } : null } };
      } else if (view === "leads") {
        const [pipeline, consent] = await Promise.all([latestArtifact(business.id, projectId, binding, "C4"), latestArtifact(business.id, projectId, binding, "C13")]);
        loaded = { view: "leads", data: { pipeline: pipeline?.payload ?? null, consent: consent?.payload ?? null } };
      } else if (view === "reports") {
        const [kpis, monthly] = await Promise.all([latestArtifact(business.id, projectId, binding, "C5"), latestArtifact(business.id, projectId, binding, "C14")]);
        loaded = { view: "reports", data: { kpis: kpis?.payload ?? null, monthly: monthly?.payload ?? null } };
      } else if (view === "integrations") {
        loaded = { view: "integrations", data: { integrations: (await latestArtifact(business.id, projectId, binding, "C10"))?.payload ?? null } };
      } else if (view === "skills") {
        loaded = { view: "skills", data: { skills: (await latestArtifact(business.id, projectId, binding, "C11"))?.payload ?? null } };
      } else {
        loaded = { view: "pending" };
      }
    } catch { unavailable = true; }
  }
  const content = !loaded ? null
    : loaded.view === "home" ? <MarketingHome {...loaded.data} />
    : loaded.view === "approvals" ? <ApprovalsView {...loaded.data} />
    : loaded.view === "brain" ? <BrainView {...loaded.data} />
    : loaded.view === "leads" ? <LeadsView {...loaded.data} />
    : loaded.view === "reports" ? <ReportsView {...loaded.data} />
    : loaded.view === "integrations" ? <IntegrationsView {...loaded.data} />
    : loaded.view === "skills" ? <SkillsView {...loaded.data} />
    : <p className="bg-card border-border rounded-xl border p-6">המסך הזה עדיין לא זמין.</p>;

  return (
    <div className="ops-root" dir="rtl">
      <Link href={`/${businessSlug}/ops/projects/${projectId}`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs">
        <ArrowLeft className="size-3.5" />{project.name}
      </Link>
      <header className="mt-2 mb-4">
        <h1 className="text-xl font-bold">שיווק · {project.name}</h1>
        {binding && <p className="text-muted-foreground mt-1 text-xs">מחובר לעסק <span dir="ltr">{binding.marketingBusiness}</span> · גרסת חיבור {binding.bindingVersion}</p>}
      </header>
      <nav aria-label="מסכי השיווק" className="border-border mb-6 flex flex-wrap gap-1 border-b pb-2">
        {MARKETING_VIEWS.map((v) => <Link key={v.id} href={`?view=${v.id}`} aria-current={v.id === view ? "page" : undefined}
          className={v.id === view ? "bg-foreground text-background rounded px-3 py-1 text-sm" : "hover:bg-muted rounded px-3 py-1 text-sm"}>{v.label}</Link>)}
      </nav>
      {!binding ? <p className="bg-card border-border rounded-xl border p-6">הפרויקט אינו מחובר לעסק ב־Marketing OS. בעלי העסק יכולים לחבר אותו מלשונית השיווק של הפרויקט.</p>
        : unavailable ? <p role="alert" className="text-warning">נתוני השיווק אינם זמינים כרגע. אין להסיק שאין נתונים.</p>
        : content}
    </div>
  );
}
