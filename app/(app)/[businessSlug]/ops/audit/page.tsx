import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { resolveBusiness } from "@/lib/tenant";
import { listBusinessAudit } from "@/lib/db/queries/ops-audit";
import { UnifiedAudit, type BusinessAuditRow } from "@/components/ops/unified-audit";

/** Unified audit of the business (T-11.1): Ops + marketing governed writes, newest first (last 100). */
export default async function BusinessAuditPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const { businessSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { business, role } = await resolveBusiness(businessSlug, session.user.id);
  let rows: BusinessAuditRow[] | null = null;
  try { rows = await listBusinessAudit(business.id); } catch { rows = null; }
  return (
    <div className="ops-root" dir="rtl">
      <Link href={`/${businessSlug}/ops`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"><ArrowLeft className="size-3.5" />Ops</Link>
      <header className="mt-2 mb-4">
        <h1 className="text-xl font-bold">יומן פעולות מבוקרות</h1>
        <p className="text-muted-foreground mt-1 text-xs">כל כתיבה מבוקרת בעסק — Ops ושיווק. היומן אינו נמחק ואינו נערך; 100 הפעולות האחרונות.</p>
      </header>
      {rows === null ? <p role="alert" className="text-warning">היומן אינו זמין כרגע. אין להסיק שלא בוצעו פעולות.</p>
        : <UnifiedAudit businessSlug={businessSlug} rows={rows} canWrite={role === "owner" || role === "admin"} />}
    </div>
  );
}
