import { fixtureMetadata, getFocusScope, mailConnected, rendersFixtures, type FocusPageProps } from "@/lib/focus/scope.server";
import { requireBusinessScope } from "@/lib/focus/scope";
import { readInbox } from "@/lib/external/mail";
import { AreaNotConnected } from "@/components/focus/shell/area-not-connected";
import BusinessMailScreen from "@/components/focus/screens/business-mail";
import CommsMailScreen from "@/components/focus/screens/comms-mail";

export const generateMetadata = fixtureMetadata({ title: "דואר · שיחה וטיוטת תשובה — Mytiv OS" });

/** Demo: the fixture mailbox. Business: its own Gmail through backend-owned send attempts, when connected. */
export default async function Page({ params }: FocusPageProps) {
  if (await rendersFixtures(params)) return <CommsMailScreen />;
  const { businessSlug } = await params;
  if (!mailConnected()) return <AreaNotConnected businessSlug={businessSlug} />;
  const scope = requireBusinessScope(await getFocusScope(businessSlug));
  return <BusinessMailScreen inbox={await readInbox(scope.businessId)} />;
}
