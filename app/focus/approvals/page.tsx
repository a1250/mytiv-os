import Link from "next/link";
import { approvalFlow as f } from "@/lib/focus/mock";

/**
 * C3 — אישורים · מצב פוקוס. Distraction-free, step-by-step. The last step is a high-risk, irreversible
 * external send: an explicit consent checkbox, and a preview of both possible outcomes (sent / pending Gmail).
 * Nav is hidden in focus mode (CSS: .focus-app:has(.f-focusmode) .f-topbar). Static prototype on mock data.
 */
export default function ApprovalsFocus() {
  return (
    <div className="f-focusmode">
      <div className="f-fm__bar">
        <div className="f-fm__bar-in">
          <Link href="/focus" className="f-fm__exit">✕ צא ממצב פוקוס</Link>
          <span className="f-topbar__spacer" />
          <span className="f-fm__risk">▲ {f.header.risk}</span>
          <span className="f-fm__pos">{f.header.pos}</span>
          <button type="button" className="f-btn f-btn--ghost" style={{ minHeight: 34 }}>דלג לבא</button>
        </div>
      </div>

      <div className="f-fm__wrap">
        {/* handled rail */}
        <aside>
          <div className="f-rail__title">טופלו</div>
          <div className="f-done">
            {f.handled.map((h) => (
              <div key={h.title} className="f-done__item">
                <div className={`f-done__state${h.mark === "↺" ? " f-done__state--fix" : ""}`}>{h.mark} {h.state}</div>
                <div className="f-done__t">{h.title}</div>
                <div className="f-done__n">{h.note}</div>
                {h.undo && <a href="#" className="f-done__undo">{h.undo}</a>}
              </div>
            ))}
          </div>
          <div className="f-upnext">
            <div className="f-upnext__k">הבא בתור</div>
            <div className="f-done__t">{f.upNext.title}</div>
            <div className="f-done__n">{f.upNext.sub}</div>
          </div>
          <div className="f-stepper">
            {f.steps.map((s, i) => (
              <div key={s.label} className={`f-step${s.done ? " f-step--done" : ""}${i === 1 ? " f-step--active" : ""}`}>
                <span className="f-step__n">{s.n}</span> {s.label}
              </div>
            ))}
          </div>
        </aside>

        {/* confirmation */}
        <section>
          <div className="f-confirm">
            <div className="f-confirm__head">
              <div className="f-confirm__ctx">{f.context}</div>
              <div className="f-confirm__title">{f.title}</div>
              <div className="f-confirm__risk">▲ {f.riskLine}</div>
              <div className="f-confirm__lead">{f.lead}</div>
            </div>
            <div className="f-confirm__body">
              {f.fields.map((fld) => (
                <div key={fld.k} className="f-field">
                  <span className="f-field__k">{fld.k}</span>
                  <span className="f-field__v">{fld.v}{fld.sub && <span className="f-field__sub">{fld.sub}</span>}</span>
                </div>
              ))}
              <div className="f-checks">
                {f.checks.map((c) => (
                  <div key={c.text} className="f-check">
                    <span className={`f-check__m ${c.ok === "info" ? "f-check__m--info" : "f-check__m--ok"}`}>{c.ok === "info" ? "◆" : "✓"}</span>
                    <span>{c.text}</span>
                    {c.link && <a href="#" className="f-check__link">{c.link}</a>}
                  </div>
                ))}
              </div>
              <div className="f-consent">
                <input id="consent" type="checkbox" />
                <label htmlFor="consent">{f.consent}</label>
              </div>
              <div className="f-confirm__actions">
                <button type="button" className="f-btn f-btn--primary f-btn--lg">{f.cta}</button>
                <button type="button" className="f-btn f-btn--ghost f-btn--lg">{f.back}</button>
              </div>
              <div className="f-confirm__note">{f.note}</div>
            </div>
          </div>

          <div className="f-after">
            {f.after.map((a) => (
              <div key={a.title} className="f-after__card">
                <div className={`f-after__t${a.tone === "green" ? " f-after__t--green" : ""}`}>{a.icon} {a.title}</div>
                <div className="f-after__b">{a.body}</div>
                {a.link && <a href="#" className="f-after__link">{a.link}</a>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
