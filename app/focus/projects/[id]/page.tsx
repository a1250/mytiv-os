import { RISK_META, projectDetail } from "@/lib/focus/mock";

/** C2 — סביבת פרויקט › סקירה. One prototype project (UMINO) on mock data; other ids fall back to it. */
export default async function ProjectEnv({ params }: { params: Promise<{ id: string }> }) {
  await params; // id ignored in the prototype — single demo project
  const p = projectDetail;
  return (
    <main className="f-main">
      <div className="f-crumb">לקוחות ופרויקטים › {p.name}</div>
      <div className="f-phead">
        <div>
          <div className="f-phead__title">{p.name}</div>
          <div className="f-phead__ctx">{p.ctx}</div>
          <div className="f-phead__meta">אחראית: {p.owner} · {p.due} · {p.updated}</div>
        </div>
        <div className="f-phead__right">
          <span className="f-chip f-chip--red">▲ {p.riskLabel}</span>
          <button type="button" className="f-btn f-btn--ghost">הוסף עדכון</button>
          <button type="button" className="f-btn f-btn--soft">+ משימה</button>
        </div>
      </div>

      <div className="f-tabs">
        {p.tabs.map((t) => (
          <span key={t.id} className="f-tab" aria-current={t.id === "overview" ? "page" : undefined}>
            {t.label}{t.count != null && <span className="f-tab__count">{t.count}</span>}
          </span>
        ))}
      </div>

      <div className="f-ov">
        <div className="f-ov__col">
          {/* milestones */}
          <section className="f-card">
            <div className="f-ms__head">
              <h2 className="f-section__title" style={{ margin: 0 }}>אבני דרך</h2>
              <span className="f-ms__lead">{p.milestonesLead}</span>
            </div>
            <div className="f-ms">
              {p.milestones.map((m) => (
                <div key={m.label} className={`f-ms__step f-ms__step--${m.state}`}>
                  <div className="f-ms__bar" />
                  <div className="f-ms__label">{m.state === "done" ? "✓ " : m.state === "blocked" ? "■ " : ""}{m.label}</div>
                  <div className="f-ms__date">{m.state === "blocked" ? "חסום · " : ""}{m.date}</div>
                </div>
              ))}
            </div>
          </section>

          {/* next action */}
          <section className="f-next">
            <div className="f-next__kicker">הפעולה הבאה</div>
            <div className="f-next__title">{p.nextAction.title}</div>
            <p className="f-next__why">{p.nextAction.why}</p>
            <div className="f-next__foot"><button type="button" className="f-btn f-btn--primary f-btn--lg">{p.nextAction.action}</button></div>
          </section>

          {/* hours */}
          <section className="f-card">
            <div className="f-hours">
              <span className="f-hours__pct">{p.hours.pct}%</span>
              <span className="f-hours__track"><span className="f-hours__fill" style={{ width: `${p.hours.pct}%` }} /></span>
            </div>
            <div className="f-hours__meta" style={{ marginTop: 8 }}>{p.hours.label} · {p.hours.source}</div>
            <div className="f-hours__meta" style={{ marginTop: 4 }}>{p.mediaBudget}</div>
          </section>
        </div>

        <div className="f-ov__col">
          {/* blockers */}
          <section className="f-card">
            <h2 className="f-section__title">חסימות <span className="f-faint">· {p.blockers.length}</span></h2>
            {p.blockers.map((b) => (
              <div key={b.title} className="f-row">
                <div><div className="f-row__t">{b.title}</div><div className="f-row__s">{b.meta}</div></div>
                <span className="f-chip f-chip--red">■</span>
              </div>
            ))}
          </section>

          {/* approvals */}
          <section className="f-card">
            <h2 className="f-section__title">החלטות ואישורים <span className="f-faint">· 3</span></h2>
            {p.approvals.map((a) => (
              <div key={a.title} className="f-row">
                <div><div className="f-row__t">{a.title}</div><div className="f-row__s">{a.meta}</div></div>
                <span className={`f-chip ${RISK_META[a.risk].chip}`}>{RISK_META[a.risk].glyph} {RISK_META[a.risk].label.replace("סיכון ", "")}</span>
              </div>
            ))}
          </section>

          {/* marketing results */}
          <section className="f-card">
            <h2 className="f-section__title">תוצאות שיווק</h2>
            {p.results.map((r) => (
              <div key={r.label} className="f-result">
                <div><div className="f-row__t">{r.label}</div><div className="f-row__s">{r.note}</div></div>
                <span className={`f-result__v${r.na ? " f-result__v--na" : ""}`}>{r.value}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
