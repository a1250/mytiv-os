/**
 * Weekly Review builder — ported from src/services/reviewBuilder.js. Pure
 * function over rows the API already has, so it can be unit-checked without a
 * database.
 *
 * Two things had to change in the port, both of which would have failed
 * silently rather than loudly:
 *
 * 1. Postgres returns timestamps as Date objects, not the ISO strings SQLite
 *    handed back, so the original's `iso.slice(0, 10)` range check would have
 *    thrown or silently excluded everything. dayOf() normalises both.
 * 2. The Electron builder tested proposal statuses "approved"/"rejected"/
 *    "viewed"/"in_discussion" and a lead status "meeting_scheduled", none of
 *    which this app uses — its vocabularies are draft|sent|accepted|declined
 *    and new|researching|ready_to_contact|contacted|replied|won|lost. Left
 *    as-is, every won/lost figure would have read zero forever.
 */
import { todayISO, addDays } from "@/lib/date-utils";

const PROPOSAL_AWAITING_REPLY = ["sent"];
const PROPOSAL_WON = ["accepted"];
const PROPOSAL_LOST = ["declined"];
const LEAD_REPLIED = ["replied"];
const LEAD_CLOSED = ["won", "lost"];

/** "1 task" / "2 tasks" — the exec summary is copied into messages, so it reads as prose. */
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Accepts a Date, an ISO string, or null and returns YYYY-MM-DD. */
function dayOf(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  return null;
}

const inRange = (value: unknown, start: string, end: string) => {
  const day = dayOf(value);
  return !!day && day >= start && day <= end;
};

function fmtDateFull(date: string, locale: string) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

type Row = Record<string, any>;

export type ReviewInput = {
  tasks?: Row[];
  leads?: Row[];
  outreach?: Row[];
  news?: Row[];
  proposals?: Row[];
  briefs?: Row[];
  prompts?: Row[];
  inspiration?: Row[];
  moodboards?: Row[];
  events?: Row[];
};

export type ReviewOptions = {
  start?: string;
  end?: string;
  studioName?: string;
  locale?: string;
};

export function buildWeeklyReview(data: ReviewInput, opts: ReviewOptions = {}) {
  const {
    tasks = [], leads = [], outreach = [], news = [], proposals = [],
    briefs = [], prompts = [], inspiration = [], moodboards = [], events = [],
  } = data;

  const end = opts.end || todayISO();
  const start = opts.start || addDays(end, -6);
  const studio = opts.studioName || "";
  const locale = opts.locale === "he" ? "he-IL" : "en-GB";
  const today = todayISO();

  // --- Tasks ---
  const completed = tasks.filter((t) => t.status === "done" && inRange(t.doneAt, start, end));
  const open = tasks.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.dueDate && t.dueDate < today);
  const stuck = open.filter(
    (t) => t.status === "in_progress" && dayOf(t.updatedAt) && dayOf(t.updatedAt)! < addDays(today, -5)
  );
  const waiting = open.filter((t) => t.status === "waiting");
  const nextWeekTasks = open
    .filter((t) => ["urgent", "high"].includes(t.priority))
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
    .slice(0, 5);

  // --- Leads & outreach ---
  const newLeads = leads.filter((l) => inRange(l.createdAt, start, end));
  const contacted = leads.filter((l) => inRange(l.lastContacted, start, end));
  const needFollowUp = leads.filter(
    (l) => l.nextFollowUp && l.nextFollowUp <= today && !LEAD_CLOSED.includes(l.status)
  );
  const replied = leads.filter((l) => LEAD_REPLIED.includes(l.status));
  const sentMessages = outreach.filter((m) => inRange(m.createdAt, start, end));

  // --- Proposals ---
  const createdProps = proposals.filter((p) => inRange(p.createdAt, start, end));
  const waitingProps = proposals.filter((p) => PROPOSAL_AWAITING_REPLY.includes(p.status));
  const wonProps = proposals.filter((p) => PROPOSAL_WON.includes(p.status));
  const lostProps = proposals.filter((p) => PROPOSAL_LOST.includes(p.status));

  // --- Radar ---
  const weekNews = news.filter((n) => inRange(n.publishedAt, start, end));
  const savedNews = weekNews.filter((n) => n.saved);
  const topNews = [...weekNews].sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0)).slice(0, 5);

  // --- Prompts, inspiration, briefs ---
  const weekPrompts = prompts.filter((p) => inRange(p.createdAt, start, end));
  const favPrompts = prompts.filter((p) => p.favorite);
  const weekInspo = inspiration.filter((i) => inRange(i.createdAt, start, end));
  const weekBoards = moodboards.filter((m) => inRange(m.createdAt, start, end));
  const weekBriefs = briefs.filter((b) => inRange(b.createdAt, start, end));

  // --- Calendar ---
  const weekMeetings = events.filter((e) => inRange(e.startTime, start, end));
  const nextWeekMeetings = events.filter((e) => inRange(e.startTime, addDays(end, 1), addDays(end, 7)));
  const leadMeetingsNext = nextWeekMeetings.filter((e) => e.linkedLeadId);
  const scheduledLeadIds = new Set(events.filter((e) => e.linkedLeadId).map((e) => e.linkedLeadId));
  const noNextStep = replied.filter((l) => !scheduledLeadIds.has(l.id));

  const exec = [
    `${plural(completed.length, "task")} completed, ${overdue.length} overdue, ${open.length} still open.`,
    `${plural(newLeads.length, "new lead")}, ${contacted.length} contacted, ${needFollowUp.length} waiting on follow-up.`,
    createdProps.length || waitingProps.length
      ? `${plural(createdProps.length, "proposal")} created; ${waitingProps.length} awaiting a client response.`
      : "No proposal movement this week.",
    weekBriefs.length ? `${plural(weekBriefs.length, "client brief")} analyzed.` : "",
    savedNews.length
      ? `${plural(savedNews.length, "radar item")} saved — the research muscle is working.`
      : "Nothing saved from the radar this week — worth a scan.",
    weekPrompts.length ? `${plural(weekPrompts.length, "prompt")} developed in the builder.` : "",
    `${plural(weekMeetings.length, "meeting")} this week, ${nextWeekMeetings.length} scheduled for next week${
      leadMeetingsNext.length ? ` (${leadMeetingsNext.length} with leads)` : ""
    }.`,
  ].filter(Boolean);

  const blockers = [
    ...overdue.slice(0, 3).map((t) => `Overdue: ${t.title}`),
    ...stuck.slice(0, 2).map((t) => `Stuck in progress: ${t.title}`),
    ...waiting.slice(0, 2).map((t) => `Waiting on someone: ${t.title}`),
  ];

  const opportunities = [
    ...needFollowUp.slice(0, 3).map((l) => `Follow up with ${l.company} (${l.opportunityType || "open opportunity"})`),
    ...waitingProps.slice(0, 2).map((p) => `Nudge proposal: ${p.title}`),
    ...topNews.slice(0, 2).filter((n) => n.actionIdea).map((n) => n.actionIdea),
  ];

  const priorities = [
    overdue.length ? `Clear the ${plural(overdue.length, "overdue task")} — they poison the week` : null,
    needFollowUp.length
      ? `Run the follow-up sweep: ${needFollowUp.slice(0, 3).map((l) => l.company).join(", ")}${needFollowUp.length > 3 ? "…" : ""}`
      : null,
    waitingProps.length ? `Move ${waitingProps[0].title} forward` : null,
    topNews[0] ? `Test-drive: ${topNews[0].title}` : null,
    "Save 3 strong references to the Inspiration Board",
  ].filter(Boolean).slice(0, 3);

  return {
    title: `Weekly Review — ${fmtDateFull(start, locale)} → ${fmtDateFull(end, locale)}`,
    weekStart: start,
    weekEnd: end,
    payload: {
      studio,
      range: { start, end },
      /** "builder" until a Claude pass rewrites the summary — see the reviews/generate route. */
      source: "builder" as "builder" | "claude",
      exec,
      blockers,
      opportunities,
      tasksSection: {
        completed: completed.map((t) => t.title),
        overdue: overdue.map((t) => ({ title: t.title, due: t.dueDate })),
        stuck: stuck.map((t) => t.title),
        waiting: waiting.map((t) => t.title),
        nextWeek: nextWeekTasks.map((t) => ({ title: t.title, priority: t.priority, due: t.dueDate })),
      },
      leadsSection: {
        added: newLeads.map((l) => l.company),
        contacted: contacted.map((l) => l.company),
        followUps: needFollowUp.map((l) => ({ company: l.company, date: l.nextFollowUp })),
        replied: replied.map((l) => l.company),
        messagesDrafted: sentMessages.length,
      },
      proposalsSection: {
        created: createdProps.map((p) => p.title),
        waiting: waitingProps.map((p) => p.title),
        approved: wonProps.map((p) => p.title),
        rejected: lostProps.map((p) => p.title),
      },
      radarSection: {
        topItems: topNews.map((n) => ({ title: n.title, relevance: n.relevance, category: n.category })),
        savedCount: savedNews.length,
        experiments: topNews.filter((n) => n.actionIdea).slice(0, 3).map((n) => n.actionIdea),
      },
      promptsSection: {
        created: weekPrompts.map((p) => `${p.title} (${p.tool})`),
        favorites: favPrompts.slice(0, 3).map((p) => p.title),
      },
      inspirationSection: {
        saved: weekInspo.map((i) => i.title),
        boards: weekBoards.map((m) => m.name),
      },
      nextWeek: {
        priorities,
        tasks: nextWeekTasks.map((t) => t.title),
        followUps: needFollowUp.slice(0, 5).map((l) => l.company),
        contentIdeas: [
          topNews[0] ? `LinkedIn take: what "${topNews[0].title}" means for brands` : null,
          completed.length ? `Behind-the-scenes post from: ${completed[0].title}` : null,
          "Process clip: one prompt → final frame comparison",
        ].filter(Boolean),
        bizDev: [
          needFollowUp.length ? "Clear the follow-up queue before adding new leads" : "Add 3 fresh leads to the CRM",
          waitingProps.length
            ? "Chase open proposals with one added-value idea each"
            : "Turn the warmest lead into a proposal",
          ...(noNextStep.length
            ? [
                `Schedule a next step with: ${noNextStep.slice(0, 3).map((l) => l.company).join(", ")} — they replied but have no meeting booked`,
              ]
            : []),
        ],
      },
    },
  };
}

export type WeeklyReview = ReturnType<typeof buildWeeklyReview>;
