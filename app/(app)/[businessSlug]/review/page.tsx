"use client";

import { useEffect, useState } from "react";
import { useApi, useT } from "@/components/studio-provider";
import type { WeeklyReview } from "@/lib/services/review-builder";

type PastReview = { id: string; title: string; weekStart: string | null; weekEnd: string | null; createdAt: string };

type Payload = WeeklyReview["payload"];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="review-section">
      <h2>
        <span className="review-num">{n}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function List({ items, empty }: { items: (string | null | undefined)[]; empty: string }) {
  const clean = items.filter(Boolean) as string[];
  if (clean.length === 0) return <p className="empty">{empty}</p>;
  return (
    <ul className="review-list">
      {clean.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function WeeklyReviewPage() {
  const api = useApi();
  const t = useT();

  const [past, setPast] = useState<PastReview[]>([]);
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [range, setRange] = useState<"this" | "last">("this");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPast() {
    setPast((await api.reviews.list()) as PastReview[]);
  }

  useEffect(() => {
    loadPast();
  }, []);

  async function generate() {
    setBusy(true);
    setNotice(null);
    setReview((await api.reviews.generate({ range })) as WeeklyReview);
    setSavedId(null);
    setBusy(false);
  }

  async function save() {
    if (!review) return;
    const row = (await api.reviews.create(review)) as { id: string };
    setSavedId(row.id);
    setNotice(t("Review saved"));
    await loadPast();
  }

  async function openPast(id: string) {
    const full = (await api.reviews.get(id)) as WeeklyReview & { id: string };
    setReview(full);
    setSavedId(full.id);
    setNotice(null);
  }

  async function remove(id: string) {
    await api.reviews.remove(id);
    if (savedId === id) {
      setReview(null);
      setSavedId(null);
    }
    await loadPast();
  }

  async function copySummary() {
    if (!review) return;
    const p = review.payload as Payload;
    const text = [
      review.title,
      "",
      t("Executive summary").toUpperCase(),
      ...p.exec,
      "",
      t("Blockers").toUpperCase(),
      ...(p.blockers.length ? p.blockers : [t("None")]),
      "",
      t("Next week priorities").toUpperCase(),
      ...p.nextWeek.priorities,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setNotice(t("Summary copied"));
  }

  const p = review?.payload as Payload | undefined;

  return (
    <div className="page">
      <div className="editor-head">
        <h1>{t("Weekly Review")}</h1>
        <div className="editor-actions">
          {notice && <span className="empty">{notice}</span>}
          <select value={range} onChange={(e) => setRange(e.target.value as "this" | "last")}>
            <option value="this">{t("This week")}</option>
            <option value="last">{t("Last week")}</option>
          </select>
          <button onClick={generate} disabled={busy}>
            {busy ? t("Building…") : t("Generate")}
          </button>
          {review && (
            <>
              <button className="secondary" onClick={copySummary}>
                {t("Copy summary")}
              </button>
              <button className="secondary" onClick={save} disabled={!!savedId}>
                {savedId ? t("Saved") : t("Save")}
              </button>
            </>
          )}
        </div>
      </div>

      {!review && (
        <p className="empty">
          {t("Generate a review to see the week across tasks, leads, proposals, radar and calendar in one place.")}
        </p>
      )}

      {review && p && (
        <>
          <h2 style={{ fontSize: 16, marginTop: 8 }}>{review.title}</h2>

          <Section n={1} title={t("Executive summary")}>
            <List items={p.exec} empty={t("Nothing to report.")} />
          </Section>

          <Section n={2} title={t("Blockers")}>
            <List items={p.blockers} empty={t("Nothing blocking — good week.")} />
          </Section>

          <Section n={3} title={t("Opportunities")}>
            <List items={p.opportunities} empty={t("No open opportunities flagged.")} />
          </Section>

          <Section n={4} title={t("Tasks")}>
            <div className="review-grid">
              <div>
                <h3>{t("Completed")}</h3>
                <List items={p.tasksSection.completed} empty={t("None completed.")} />
              </div>
              <div>
                <h3>{t("Overdue")}</h3>
                <List
                  items={p.tasksSection.overdue.map((x) => `${x.title}${x.due ? ` (${x.due})` : ""}`)}
                  empty={t("Nothing overdue.")}
                />
              </div>
              <div>
                <h3>{t("Stuck / waiting")}</h3>
                <List items={[...p.tasksSection.stuck, ...p.tasksSection.waiting]} empty={t("Nothing stalled.")} />
              </div>
            </div>
          </Section>

          <Section n={5} title={t("Leads & outreach")}>
            <div className="review-grid">
              <div>
                <h3>{t("Added")}</h3>
                <List items={p.leadsSection.added} empty={t("No new leads.")} />
              </div>
              <div>
                <h3>{t("Follow-ups due")}</h3>
                <List
                  items={p.leadsSection.followUps.map((f) => `${f.company}${f.date ? ` (${f.date})` : ""}`)}
                  empty={t("Queue is clear.")}
                />
              </div>
              <div>
                <h3>{t("Replied")}</h3>
                <List items={p.leadsSection.replied} empty={t("No replies yet.")} />
              </div>
            </div>
            <p className="empty">
              {t("Outreach messages drafted")}: {p.leadsSection.messagesDrafted}
            </p>
          </Section>

          <Section n={6} title={t("Proposals")}>
            <div className="review-grid">
              <div>
                <h3>{t("Created")}</h3>
                <List items={p.proposalsSection.created} empty={t("None created.")} />
              </div>
              <div>
                <h3>{t("Awaiting reply")}</h3>
                <List items={p.proposalsSection.waiting} empty={t("Nothing pending.")} />
              </div>
              <div>
                <h3>{t("Won / lost")}</h3>
                <List
                  items={[
                    ...p.proposalsSection.approved.map((x) => `✓ ${x}`),
                    ...p.proposalsSection.rejected.map((x) => `✕ ${x}`),
                  ]}
                  empty={t("No decisions this week.")}
                />
              </div>
            </div>
          </Section>

          <Section n={7} title={t("Radar & production")}>
            <div className="review-grid">
              <div>
                <h3>{t("Top items")}</h3>
                <List
                  items={p.radarSection.topItems.map((n) => `${n.title} (${n.relevance ?? "—"})`)}
                  empty={t("Radar was quiet.")}
                />
              </div>
              <div>
                <h3>{t("Prompts developed")}</h3>
                <List items={p.promptsSection.created} empty={t("None this week.")} />
              </div>
              <div>
                <h3>{t("Inspiration saved")}</h3>
                <List
                  items={[...p.inspirationSection.saved, ...p.inspirationSection.boards]}
                  empty={t("Nothing saved.")}
                />
              </div>
            </div>
          </Section>

          <Section n={8} title={t("Next week")}>
            <h3>{t("Priorities")}</h3>
            <List items={p.nextWeek.priorities} empty={t("Nothing set.")} />
            <h3>{t("Business development")}</h3>
            <List items={p.nextWeek.bizDev} empty={t("Nothing set.")} />
            <h3>{t("Content ideas")}</h3>
            <List items={p.nextWeek.contentIdeas} empty={t("Nothing set.")} />
          </Section>
        </>
      )}

      <h2 className="section-head">{t("Past reviews")}</h2>
      <div className="lead-list">
        {past.length === 0 && <p className="empty">{t("No saved reviews yet.")}</p>}
        {past.map((r) => (
          <div key={r.id} className="lead-row">
            <button className="lead-company" onClick={() => openPast(r.id)} style={{ background: "none", border: "none", textAlign: "inherit", padding: 0, cursor: "pointer", color: "inherit" }}>
              {r.title}
            </button>
            <span className="lead-meta">{new Date(r.createdAt).toLocaleDateString()}</span>
            <button className="task-remove" onClick={() => remove(r.id)}>
              {t("Remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
