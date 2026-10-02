import Link from "next/link";
import { projects } from "@/lib/focus/mock";

/** לקוחות ופרויקטים — list; a card opens the project environment (C2). */
export default function ProjectsList() {
  return (
    <main className="f-main">
      <h1 className="f-greeting__title" style={{ fontSize: 28 }}>לקוחות ופרויקטים</h1>
      <p className="f-greeting__sub">בחר פרויקט כדי להיכנס לסביבת העבודה שלו.</p>
      <div className="f-plist">
        {projects.map((p) => (
          <Link key={p.id} href={`/focus/projects/${p.id}`} className="f-card f-plist__card">
            <div className="f-proj__head">
              <div>
                <div className="f-plist__name">{p.name}</div>
                <div className="f-proj__ctx">{p.ctx}</div>
              </div>
              <span className="f-chip f-chip--red">▲ {p.risk}</span>
            </div>
            <p className="f-proj__risk">{p.note}</p>
            <div className="f-proj__meta"><span><b>{p.owner}</b></span><span>{p.due}</span><span>{p.hours}</span></div>
          </Link>
        ))}
      </div>
    </main>
  );
}
