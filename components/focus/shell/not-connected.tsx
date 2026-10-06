import NextLink from "next/link";
import type { BusinessScope } from "@/lib/focus/scope";

/**
 * What a verified business sees at /{slug}/focus until the Focus adapters exist: an honest unavailable state, never
 * fixtures dressed up as this business's data. Server component; no demo store, no fixture-backed shell.
 */
export function FocusNotConnected({ scope }: { scope: BusinessScope }) {
  return (
    <section className="f-notconn" aria-labelledby="notconn-h">
      <span className="f-notconn__glyph" aria-hidden>⧗</span>
      <h1 id="notconn-h" className="f-notconn__h">Focus עדיין לא מחובר לנתונים של <bdi>{scope.name}</bdi></h1>
      <p className="f-notconn__p">
        הממשק החדש מוכן, אבל החיבור לנתוני העסק (משימות, אישורים, פרויקטים) עדיין לא הושלם. כדי לא להציג נתוני דוגמה
        כאילו הם שלכם, המסכים יופיעו כאן רק אחרי החיבור.
      </p>
      <NextLink href={`/${encodeURIComponent(scope.slug)}`} className="f-btn f-btn--primary">חזרה למערכת</NextLink>
    </section>
  );
}
