import { approvalsConnected, fixtureMetadata, getFocusScope, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { requireBusinessScope } from "@/lib/focus/scope";
import { readMarketingExecution } from "@/lib/marketing-focus/execution";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import BusinessMarketingScreen from "@/components/focus/screens/business-marketing";
import Screen from "@/components/focus/screens/clients-board";

export const generateMetadata = fixtureMetadata({ title: "לוח עבודה · Kanban — Mytiv OS" });

/** Demo: the fixture Kanban. Business: campaigns and execution state from the Marketing OS contracts (read-only). */
export default async function Page({ params }: FocusPageProps) {
  if (await rendersFixtures(params)) return <Screen />;
  const { businessSlug } = await params;
  if (!approvalsConnected()) return <AreaNotConnected businessSlug={businessSlug} />;
  const scope = requireBusinessScope(await getFocusScope(businessSlug));
  return <BusinessMarketingScreen projects={(await readMarketingExecution(scope.businessId)).projects} />;
}
