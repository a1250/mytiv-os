import type { Metadata } from "next";
import Link from "next/link";
import { SCREENS } from "@/lib/focus/screens";

export const metadata: Metadata = { title: "מפת מסכים — Mytiv OS" };

const GROUPS: { prefix: string; title: string }[] = [
  { prefix: "D", title: "Desktop 1 · היום, אישורים ופרויקט" },
  { prefix: "E", title: "Desktop 2 · סטודיו התוכן וקמפיין" },
  { prefix: "F", title: "Desktop 3 · מכירות ועבודה" },
  { prefix: "G", title: "Desktop 4 · דוחות ובקרה" },
  { prefix: "H", title: "Desktop 5 · שאר המסכים" },
  { prefix: "W", title: "Desktop 6 · Mytiv Work" },
  { prefix: "M", title: "מובייל · מסכי ליבה" },
];
const MODE = { app: "מסך באפליקציה", focus: "מצב פוקוס", mobile: "תצוגת מובייל" } as const;

/** Prototype-only index of every handoff screen (the handoff's own "Mytiv OS - Index"). */
export default function ScreenMap() {
  return (
    <main className="f-index">
      <h1>מפת מסכים</h1>
      <p className="f-index__lead">
        {SCREENS.length} המסכים של כיוון ״פוקוס״, לפי חבילת ה־Handoff. אב טיפוס על נתוני הדגמה בלבד — שום פעולה לא נשמרת
        ולא נשלחת. מסכי מצב פוקוס ומובייל מסתירים את הניווט העליון; הכפתור ״מפת מסכים״ מחזיר לכאן.
      </p>
      {GROUPS.map((g) => (
        <section key={g.prefix} className="f-index__group">
          <h2>{g.title}</h2>
          <div className="f-index__grid">
            {SCREENS.filter((s) => s.id.startsWith(g.prefix)).map((s) => (
              <Link key={s.id} href={s.route} className="f-index__card">
                <span className="f-index__id">{s.id}</span>
                <span className="f-index__t">{s.title}</span>
                {s.subtitle && <span className="f-index__s">{s.subtitle}</span>}
                <span className="f-index__mode">{MODE[s.mode]}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
