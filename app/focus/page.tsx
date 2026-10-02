import { RISK_META, calendar, continueItems, greeting, kpis, projects, stuck, todayColumns, type TodayItem } from "@/lib/focus/mock";

/** C1 — "היום שלי": the day by time (now / end of day / this week), what's stuck, calendar, and status tiles. */
function RiskChip({ risk }: { risk: TodayItem["risk"] }) {
  const m = RISK_META[risk];
  return <span className={`f-chip ${m.chip}`}>{m.glyph} {m.label}</span>;
}

function ItemCard({ item }: { item: TodayItem }) {
  return (
    <article className="f-card">
      <div className="f-item__top">
        <RiskChip risk={item.risk} />
        {item.wait && <span className="f-item__wait">{item.wait}</span>}
      </div>
      <h3 className="f-item__title">{item.title}</h3>
      <p className="f-item__sub">{item.sub}</p>
      {item.desc && <p className="f-item__desc">{item.desc}</p>}
      <div className="f-item__foot">
        <button type="button" className="f-btn f-btn--soft f-btn--block">{item.action}</button>
      </div>
    </article>
  );
}

export default function FocusHome() {
  const pct = Math.round((greeting.handled / greeting.needsAttention) * 100);
  return (
    <main className="f-main">
      {/* greeting */}
      <section>
        <div className="f-greeting__date">{greeting.date}</div>
        <h1 className="f-greeting__title">בוקר טוב, {greeting.name}</h1>
        <p className="f-greeting__sub">יש היום {greeting.needsAttention} פריטים שדורשים את תשומת ליבך.</p>
        <div className="f-greeting__bar">
          <button type="button" className="f-btn f-btn--primary f-btn--lg">התחל לטפל, אחד־אחד</button>
          <span className="f-progress">
            <span className="f-progress__track"><span className="f-progress__fill" style={{ width: `${pct}%` }} /></span>
            טופלו {greeting.handled} מתוך {greeting.needsAttention}
          </span>
        </div>
      </section>

      {/* three time columns */}
      <section className="f-cols">
        {todayColumns.map((col) => {
          const count = col.items.length + (col.quiet?.length ?? 0);
          return (
            <div key={col.id}>
              <div className="f-col__head">
                <span className="f-col__title">{col.title}</span>
                <span className="f-col__count">{count}</span>
              </div>
              <div className="f-col__stack">
                {col.items.map((it) => <ItemCard key={it.id} item={it} />)}
                {col.quiet?.map((it) => (
                  <article key={it.id} className="f-card f-item--quiet">
                    <div>
                      <h3 className="f-item__title">{it.title}</h3>
                      <p className="f-item__sub">{it.sub} · <RiskChipInline risk={it.risk} />{it.wait ? ` · ${it.wait}` : ""}</p>
                    </div>
                    <button type="button" className="f-btn f-btn--ghost">{it.action}</button>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* stuck + calendar */}
      <section className="f-two">
        <div>
          <div className="f-card" style={{ marginBottom: 18 }}>
            <h2 className="f-section__title">מה תקוע <span className="f-faint">· {stuck.length}</span></h2>
            <ul className="f-stuck">
              {stuck.map((s) => (
                <li key={s.id} className="f-stuck__row">
                  <span className="f-stuck__dot">◆</span>
                  <span>{s.text}{s.action && <a className="f-stuck__assign" href="#">{s.action}</a>}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="f-card">
            <h2 className="f-section__title">המשך מאיפה שעצרת</h2>
            <div className="f-continue">
              {continueItems.map((c) => (
                <a key={c.id} href="#" className="f-continue__chip">
                  <span className="f-continue__t">{c.t}</span>
                  <span className="f-continue__s">{c.s}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="f-card">
          <h2 className="f-section__title">היום ביומן <span className="f-faint" style={{ fontWeight: 600 }}>· {calendar.source}</span></h2>
          <div>
            {calendar.rows.map((r) => (
              <div key={r.time} className="f-cal__row">
                <span className="f-cal__time">{r.time}</span>
                {r.title ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <span className="f-cal__title">{r.title}</span>
                      {r.cta && <button type="button" className="f-btn f-btn--soft" style={{ minHeight: 30, padding: "4px 14px" }}>{r.cta}</button>}
                    </div>
                    <div className="f-cal__sub">{r.sub}</div>
                  </div>
                ) : (
                  <span className="f-cal__free">פנוי</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* projects at risk */}
      <section style={{ marginTop: 24 }}>
        <h2 className="f-section__title">הפרויקטים שלך</h2>
        <div className="f-proj">
          {projects.map((p) => (
            <article key={p.id} className="f-card">
              <div className="f-proj__head">
                <div>
                  <div className="f-proj__name">{p.name}</div>
                  <div className="f-proj__ctx">{p.ctx}</div>
                </div>
                <span className="f-chip f-chip--red">▲ {p.risk}</span>
              </div>
              <p className="f-proj__risk">{p.note}</p>
              <div className="f-proj__next">{p.next}</div>
              <div className="f-proj__meta">
                <span><b>{p.owner}</b></span>
                <span>{p.due}</span>
                <span>{p.hours}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* KPI tiles */}
      <section className="f-kpis">
        {kpis.map((k) => (
          <div key={k.label} className="f-kpi">
            <div className="f-kpi__label">{k.label}</div>
            <div className={`f-kpi__value${k.na ? " f-kpi__value--na" : ""}`}>
              {k.value}{k.delta && <span className="f-chip f-chip--green" style={{ marginInlineStart: 8, fontSize: 11 }}>{k.delta}</span>}
            </div>
            <div className="f-kpi__foot">{k.foot}</div>
          </div>
        ))}
      </section>
    </main>
  );
}

function RiskChipInline({ risk }: { risk: TodayItem["risk"] }) {
  const m = RISK_META[risk];
  const color = risk === "low" ? "var(--f-green-ink)" : risk === "mid" ? "var(--f-amber-ink)" : "var(--f-muted)";
  return <span style={{ color, fontWeight: 700 }}>{m.glyph} {m.label.replace("סיכון ", "")}</span>;
}
