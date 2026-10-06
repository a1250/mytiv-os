import { approvalsConnected, fixtureMetadata, getFocusScope, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { requireBusinessScope } from "@/lib/focus/scope";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import ApprovalsListScreen from "@/components/focus/screens/approvals-list";
import BusinessApprovalsScreen from "@/components/focus/screens/business-approvals";
import { readMarketingApprovals } from "@/lib/marketing-focus/approvals";

export const generateMetadata = fixtureMetadata({ title: "אישורים — Mytiv OS" });

/** Demo: the fixture queue. A business: its Marketing OS approval queues (C2a) when the marketing module is on. */
export default async function Page({ params }: FocusPageProps) {
  if (await rendersFixtures(params)) return <ApprovalsListScreen />;
  const { businessSlug } = await params;
  if (!approvalsConnected()) return <AreaNotConnected businessSlug={businessSlug} />;
  const scope = requireBusinessScope(await getFocusScope(businessSlug));
  const { items } = await readMarketingApprovals(scope.businessId);
  return <BusinessApprovalsScreen items={items} canDecide={scope.role === "owner" || scope.role === "admin"} />;
}
