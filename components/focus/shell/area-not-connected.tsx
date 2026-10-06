import NextLink from "next/link";
import { getFocusScope } from "@/lib/focus/scope.server";
import { scopeBase } from "@/lib/focus/scope";
import { workConnected } from "@/lib/focus/scope.server";

/**
 * A Focus area that has no backend for this business yet (server component): says so, links to what IS connected,
 * and never renders fixtures as the business's data. Used by every non-Work page in a business scope.
 */
export async function AreaNotConnected({ businessSlug }: { businessSlug: string }) {
  const scope = await getFocusScope(businessSlug);
  const base = scopeBase(scope.slug);
  const name = scope.kind === "business" ? scope.name : "";
  return (
    <section className="f-notconn" aria-labelledby="area-nc-h">
      <span className="f-notconn__glyph" aria-hidden>⧗</span>
      <h1 id="area-nc-h" className="f-notconn__h">האזור הזה עדיין לא מחובר לנתונים של <bdi>{name}</bdi></h1>
      <p className="f-notconn__p">
        כדי לא להציג נתוני דוגמה כאילו הם שלכם, המסך יופיע כאן רק אחרי החיבור.
        {workConnected() ? " המשימות כבר מחוברות." : ""}
      </p>
      <div className="f-notconn__actions">
        {workConnected() && <NextLink href={`${base}/work`} className="f-btn f-btn--primary">למשימות שלי</NextLink>}
        <NextLink href={`/${encodeURIComponent(scope.slug)}`} className="f-btn f-btn--neutral">חזרה למערכת</NextLink>
      </div>
    </section>
  );
}
