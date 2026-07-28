import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveBusiness, listBusinessesForUser } from "@/lib/tenant";
import { getSettingsForBusiness } from "@/lib/db/queries/settings";
import { StudioProvider } from "@/components/studio-provider";
import { Sidebar } from "@/components/sidebar";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { business } = await resolveBusiness(businessSlug, session.user.id);
  const rawSettings = await getSettingsForBusiness(business.id);
  const businesses = (await listBusinessesForUser(session.user.id)).map((b) => ({
    slug: b.business.slug,
    name: b.business.name,
    role: b.role,
  }));

  const initialSettings = {
    studio_name: business.name,
    accent_color: business.accentColor ?? "#6366f1",
    default_language: (business.locale as "en" | "he") ?? "en",
    logo_url: business.logoUrl ?? undefined,
    ...rawSettings,
  };

  return (
    <StudioProvider businessSlug={businessSlug} initialSettings={initialSettings}>
      <div className="app">
        <Sidebar businesses={businesses} />
        <main className="main">{children}</main>
      </div>
    </StudioProvider>
  );
}
