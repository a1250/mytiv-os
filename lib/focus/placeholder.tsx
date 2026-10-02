/** Temporary placeholder for Focus areas not yet built (the design is implemented screen by screen). */
export function FocusPlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <main className="f-main">
      <h1 className="f-greeting__title" style={{ fontSize: 28 }}>{title}</h1>
      <p className="f-greeting__sub">{note}</p>
      <div className="f-card" style={{ marginTop: 20, padding: 28, textAlign: "center", color: "var(--f-faint)" }}>
        מסך זה ייבנה בהמשך לפי מסכי ה־Handoff של Focus.
      </div>
    </main>
  );
}
