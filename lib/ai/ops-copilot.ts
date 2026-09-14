/**
 * The Ops Copilot.
 *
 * Context is deliberately three things and nothing else: the client's spec, its
 * live ClickUp work, and its last ten decisions. Loading the whole database is
 * what makes an assistant confidently wrong; a lean context also keeps latency
 * in the range where the panel is usable.
 *
 * Reads run inline. Writes never do — a write tool produces a *proposal* that
 * ends the turn, and only an explicit click from the browser executes it
 * (see executeProposal, called from the confirm route). Free-text chat plus
 * silent writes is how a board quietly fills with things nobody asked for.
 *
 * There is no delete tool, by design. Tasks are deleted in ClickUp, by hand.
 */
import "server-only";
import { requireScopedTask, requireStatusEvidence } from "@/lib/ops-access";
import { dateMs, requiredText, expectedMarker, OpsPolicyError } from "@/lib/ops-policy";
import { snapshotTask, type TaskSnapshot } from "@/lib/ops-snapshot";
import type { AuditTarget, ExternalRef } from "@/lib/ops-audit";
import Anthropic from "@anthropic-ai/sdk";
import { getSecret } from "@/lib/db/queries/secrets";
import { AI_KEY_SECRET } from "./claude";
import {
  ClickUpWriteUnverifiedError,
  addComment,
  createTask,
  getTaskEvidence,
  getTasksByFolder,
  getTimeEntries,
  getWorkspaceMembers,
  resolveListId,
  updateTask,
  type OpsTask,
} from "@/lib/clickup";
import { folderFromProject, stuckThresholdDays, type ClientFolder } from "@/lib/ops-config";
import { getProject, type ProjectRow } from "@/lib/db/queries/projects";

const MODEL = "claude-opus-5";

export type OpsContext = {
  project: ProjectRow;
  folder: ClientFolder | null;
  tasks: OpsTask[];
  bugs: OpsTask[];
  decisions: OpsTask[];
  thresholdDays: number;
  dataState?: "available" | "unavailable" | "unlinked" | "unauthorized";
};

/** Tools that change something in ClickUp. Every one requires a confirmed click. */
export const CONFIRM_REQUIRED = new Set(["create_task", "update_task", "add_comment", "add_decision"]);

/**
 * Assembles the context server-side, from the project id alone.
 *
 * Both the chat route and the confirm route go through here, so a request body
 * can never widen what the model reads or what a confirmed write can touch.
 */
export async function loadOpsContext(businessId: string, projectId: string): Promise<OpsContext | null> {
  const project = await getProject(businessId, projectId);
  if (!project) return null;

  const folder = folderFromProject(project);
  let rows: OpsTask[] = [];
  let dataState: OpsContext["dataState"] = folder ? "available" : project.folderState === "unauthorized" ? "unauthorized" : "unlinked";
  if (folder) {
    try {
      rows = await getTasksByFolder(folder);
    } catch {
      // A ClickUp outage degrades the copilot to spec-only rather than failing
      // the request; the system prompt already tells it to flag missing data.
      rows = [];
      dataState = "unavailable";
    }
  }

  return {
    project,
    folder,
    dataState,
    tasks: rows.filter((t) => t.listKind === "tasks" || t.listKind === "other"),
    bugs: rows.filter((t) => t.isBug),
    decisions: rows.filter((t) => t.isDecision).slice(0, 10),
    thresholdDays: stuckThresholdDays(),
  };
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function describeTask(t: OpsTask) {
  const bits = [
    `[${t.id}]`,
    t.title,
    `· status: ${t.status}`,
    `· owner: ${t.assignee?.name ?? "unassigned"}`,
    `· idle: ${t.daysIdle}d`,
    t.dueDate ? `· due: ${t.dueDate}${t.overdue ? " (OVERDUE)" : ""}` : "· no due date",
  ];
  if (t.blockedOn) bits.push(`· blocked on: ${t.blockedOn}`);
  return bits.join(" ");
}

export function buildCopilotSystem(ctx: OpsContext, businessName: string) {
  const { project, tasks, bugs, decisions, thresholdDays } = ctx;
  const unavailable = ctx.dataState !== undefined && ctx.dataState !== "available";

  return [
    `You are the operations copilot for ${businessName}, working on one client: ${project.name}.`,
    "",
    "How to answer:",
    "- Lead with the answer. Detail after, only if it changes what the reader does next.",
    "- Ground every claim in the data below or in a tool result. Never invent a date, an owner, or an hour count.",
    "- When something is missing — no owner, no due date, no proof of a fix — say so. That absence is usually the actual answer.",
    `- A task is stuck at ${thresholdDays}+ days without a ClickUp update.`,
    "- Answer in the language of the question. The board mixes Hebrew and English; that is expected.",
    "",
    "## Writing to ClickUp",
    "create_task, update_task, add_comment and add_decision do not take effect when you call them. Each one shows the user a card they must confirm, and the change happens only if they click. So call the tool once with your best values and stop — do not call it again, do not claim the change is done, and do not ask the user to confirm in prose. The card is the confirmation.",
    "",
    "## The task contract",
    "A task cannot be created without three things: an owner, a due date, and a definition of done. If the request is missing any of them, ask for it instead of guessing — a task with no committed date is exactly how work stalls without anyone lying about it. An estimate in hours is strongly wanted; ask for it, but do not block on it.",
    "A definition of done states the evidence that ends the task, not the intent: 'screen recording showing the bot stays silent after a human replies', not 'fix the handover bug'.",
    "",
    "## Closing tasks",
    "Nothing closes without proof. When someone reports a fix, call verify_completion first.",
    "- Proof found: show the evidence, then offer to close it via update_task.",
    "- No proof: refuse to close it. Say what is missing and offer to draft a message asking for a screen recording.",
    "A comment saying 'done' or 'fixed' is not proof. A written summary is not proof.",
    "",
    "## Messages to contractors",
    "draft_dev_message renders a card the user copies and sends themselves. You never send anything — there is no send button anywhere in this product, and you must not imply that a message went out.",
    "Format: English, numbered, one action per item, each with its own due date and an explicit proof requirement. Split what lands today from what moves to tomorrow. Jaffer is accountable for everything, including work Saad did.",
    "",
    `## Client: ${project.name}`,
    `Status: ${project.status ?? "unknown"} · Deadline: ${project.deadline || "none set"} · Budget: ${project.budget || "not recorded"}`,
    "",
    "## Spec",
    project.brief?.trim() || "(no spec written yet — say so if the question depends on it)",
    "",
    `ClickUp data state: ${ctx.dataState ?? "available"}. Unavailable, unlinked or unauthorized means UNKNOWN, never zero work or no blockers.`,
    `## Open tasks (${tasks.length})`,
    unavailable ? "(UNKNOWN — source unavailable)" : tasks.length ? tasks.map(describeTask).join("\n") : "(none)",
    "",
    `## Open bugs (${bugs.length})`,
    unavailable ? "(UNKNOWN — source unavailable)" : bugs.length ? bugs.map(describeTask).join("\n") : "(none)",
    "",
    `## Last decisions (${decisions.length})`,
    unavailable ? "(UNKNOWN — source unavailable)" : decisions.length ? decisions.map((d) => `[${d.id}] ${d.title} · ${d.status}`).join("\n") : "(none recorded)",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

export const OPS_TOOLS: Anthropic.Beta.BetaToolUnion[] = [
  // ---- reads: executed inline ----
  {
    name: "fetch_tasks",
    description:
      "Filter this client's open ClickUp work. Use it to narrow by status, assignee, or list rather than re-reading everything.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "ClickUp status name, e.g. 'to do'." },
        assignee: { type: "string", description: "Assignee name, matched loosely." },
        list: { type: "string", enum: ["tasks", "bugs"] },
      },
    },
  },
  {
    name: "check_blockers",
    description:
      "Everything stuck past the threshold, worst first, with who each item is waiting on. Call this for any question about what is stalled, late, or at risk.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_time_summary",
    description:
      "Hours logged in ClickUp for this client over a date range. Zero means nobody tracked time — not that no work happened.",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string", description: "YYYY-MM-DD" },
        to: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_decisions",
    description: "This client's recorded decisions, most recent first.",
    input_schema: { type: "object", properties: { limit: { type: "number" } } },
  },
  {
    name: "verify_completion",
    description:
      "Read a task's comments and attachments and report whether proof of the fix was attached. Call this before offering to close anything a contractor reported as done.",
    input_schema: {
      type: "object",
      properties: { task_id: { type: "string", description: "ClickUp task id, e.g. 86eyc4utz." } },
      required: ["task_id"],
    },
  },

  // ---- writes: produce a confirmation card, never execute directly ----
  {
    name: "create_task",
    description:
      "Propose a new ClickUp task. Requires an owner, a due date and a definition of done — ask for any that are missing rather than guessing. The user confirms before anything is created.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        list: { type: "string", enum: ["tasks", "bugs"], description: "Which list it belongs in." },
        assignee: { type: "string", description: "ClickUp member name, e.g. 'Jaffer Haadi'." },
        due_date: { type: "string", description: "YYYY-MM-DD" },
        estimate_hours: { type: "number" },
        definition_of_done: { type: "string", description: "The evidence that ends this task." },
      },
      required: ["title", "list", "assignee", "due_date", "definition_of_done"],
    },
  },
  {
    name: "update_task",
    description: "Propose a change to an existing task's status, assignee or due date. The user confirms first.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        status: { type: "string" },
        assignee: { type: "string" },
        due_date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "add_comment",
    description: "Propose a comment on a ClickUp task. The user confirms first.",
    input_schema: {
      type: "object",
      properties: { task_id: { type: "string" }, text: { type: "string" } },
      required: ["task_id", "text"],
    },
  },
  {
    name: "add_decision",
    description:
      "Propose an entry in this client's decision log. Use it when a decision was made in conversation and would otherwise be lost.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The decision itself, stated in one line." },
        detail: { type: "string" },
        source: { type: "string", description: "Who decided, and where — e.g. 'Amit, WhatsApp'." },
      },
      required: ["title", "source"],
    },
  },

  // ---- draft: rendered as a copyable card, never sent ----
  {
    name: "draft_dev_message",
    description:
      "Show the user a message to copy and send themselves. Write the full message — it is displayed verbatim, never summarized, and never sent by this system.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient, e.g. 'Jaffer'." },
        subject: { type: "string" },
        body: { type: "string", description: "The complete message, numbered, one action per item." },
      },
      required: ["to", "subject", "body"],
    },
  },
];

type ToolInput = Record<string, unknown>;

/** Reads only. A write never reaches this function. */
export async function runOpsTool(name: string, input: ToolInput, ctx: OpsContext): Promise<string> {
  if (ctx.dataState !== undefined && ctx.dataState !== "available") return "ClickUp data is unavailable: task counts, blockers and decisions are UNKNOWN.";
  switch (name) {
    case "fetch_tasks": {
      const pool = input.list === "bugs" ? ctx.bugs : input.list === "tasks" ? ctx.tasks : [...ctx.tasks, ...ctx.bugs];
      const status = typeof input.status === "string" ? input.status.toLowerCase() : null;
      const assignee = typeof input.assignee === "string" ? input.assignee.toLowerCase() : null;
      const rows = pool.filter(
        (t) =>
          (!status || t.status.toLowerCase() === status) &&
          (!assignee || (t.assignee?.name ?? "").toLowerCase().includes(assignee))
      );
      return rows.length ? rows.map(describeTask).join("\n") : "No tasks match that filter.";
    }

    case "check_blockers": {
      const stuck = [...ctx.tasks, ...ctx.bugs]
        .filter((t) => t.daysIdle >= ctx.thresholdDays)
        .sort((a, b) => b.daysIdle - a.daysIdle);
      return stuck.length
        ? stuck.map(describeTask).join("\n")
        : `Nothing has been untouched for ${ctx.thresholdDays}+ days.`;
    }

    case "get_time_summary": {
      if (!ctx.folder) return "This project is not linked to a ClickUp folder, so no time can be read.";
      const from = new Date(String(input.from));
      const to = new Date(String(input.to));
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "Invalid date range.";
      const summary = await getTimeEntries(ctx.folder, { from, to });
      return summary.hours === 0
        ? `0 hours logged between ${input.from} and ${input.to}. Nobody has tracked time on this client in ClickUp — this is not evidence that no work happened.`
        : `${summary.hours.toFixed(2)} hours logged between ${input.from} and ${input.to}.`;
    }

    case "get_decisions": {
      const limit = typeof input.limit === "number" ? input.limit : 10;
      const rows = ctx.decisions.slice(0, limit);
      return rows.length ? rows.map((d) => `[${d.id}] ${d.title} · ${d.status}`).join("\n") : "No decisions recorded.";
    }

    case "verify_completion": {
      const taskId = String(input.task_id ?? "").trim();
      if (!taskId) return "No task id given.";
      await requireScopedTask(ctx.folder, taskId);
      const evidence = await getTaskEvidence(taskId);
      const lines = [
        `Task: ${evidence.title}`,
        `Status: ${evidence.status}`,
        `Comments: ${evidence.comments.length}`,
        `Attachments: ${evidence.attachments.length}${
          evidence.attachments.length ? ` (${evidence.attachments.map((a) => a.title || a.mimetype).join(", ")})` : ""
        }`,
        "",
        evidence.recordings.length
          ? `Possible recordings found:\n${evidence.recordings.map((u) => `- ${u}`).join("\n")}`
          : "NO RECORDING FOUND. Nothing here shows the fix working, so this task must not be closed.",
      ];
      if (evidence.comments.length) {
        lines.push("", "Recent comments:");
        for (const c of evidence.comments.slice(-5)) {
          lines.push(`- ${c.author}: ${c.text.slice(0, 400)}`);
        }
      }
      return lines.join("\n");
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

// ---------------------------------------------------------------------------
// Executing a confirmed proposal
// ---------------------------------------------------------------------------

export type ExecuteResult =
  | { ok: true; summary: string; url?: string; audit?: { target: AuditTarget; pre?: TaskSnapshot; post?: TaskSnapshot; ref?: ExternalRef } }
  | { ok: false; error: string };

async function resolveAssigneeId(name: string | undefined): Promise<number | null> {
  const wanted = (name ?? "").trim().toLowerCase();
  if (!wanted) return null;
  const members = await getWorkspaceMembers();
  const hit =
    members.filter((m) => m.name.toLowerCase() === wanted);
  return hit.length === 1 ? hit[0].id : null;
}

/**
 * Runs a proposal the user clicked Confirm on. Called only from the confirm
 * route — the chat stream has no path into this function.
 */
/**
 * `onPre` fires the instant the pre-write snapshot exists, before the external write — so the
 * audit record keeps it even when the write itself fails or its outcome is unknown.
 */
export async function executeProposal(ctx: OpsContext, tool: string, input: ToolInput, onPre?: (pre: TaskSnapshot) => void): Promise<ExecuteResult> {
  try {
    switch (tool) {
      case "create_task": {
        if (!ctx.folder) return { ok: false, error: "This project is not linked to a ClickUp folder." };
        const kind = input.list === "bugs" ? "bugs" : "tasks";
        const listId = await resolveListId(ctx.folder, kind);
        if (!listId) return { ok: false, error: `No "${kind}" list exists in this client's folder.` };

        const assigneeId = await resolveAssigneeId(input.assignee as string);
        const hours = typeof input.estimate_hours === "number" ? input.estimate_hours : null;
        const dod = requiredText(input.definition_of_done, 'definition_of_done');
        const title = requiredText(input.title, 'title', 500);
        const due = dateMs(input.due_date);
        if (!assigneeId) return { ok: false, error: 'An exact, unique ClickUp owner is required.' };
        if (hours !== null && (!Number.isFinite(hours) || hours <= 0)) return { ok: false, error: 'Invalid estimate.' };

        const created = await createTask(listId, {
          name: title,
          assignees: assigneeId ? [assigneeId] : undefined,
          due_date: due,
          time_estimate: hours ? Math.round(hours * 3_600_000) : undefined,
          markdown_description: dod ? `**Done when:** ${dod}` : undefined,
        });

        return { ok: true, summary: `Task created in ${kind}`, url: created.url, audit: { target: { kind: "list", id: listId }, ref: { taskId: created.id, url: created.url } } };
      }

      case "update_task": {
        const taskId = String(input.task_id ?? "").trim();
        if (!taskId) return { ok: false, error: "No task id." };
        const scoped = await requireScopedTask(ctx.folder, taskId);
        const patch: { status?: string; assignees?: { add?: number[] }; due_date?: number } = {};
        if (typeof input.status === "string" && input.status.trim()) patch.status = input.status.trim();
        if (typeof input.assignee === "string" && input.assignee.trim()) {
          const id = await resolveAssigneeId(input.assignee);
          if (!id) return { ok: false, error: `No ClickUp member matched "${input.assignee}".` };
          patch.assignees = { add: [id] };
        }
        const due = input.due_date ? dateMs(input.due_date) : undefined;
        if (due) patch.due_date = due;
        if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to change." };

        if (patch.status) await requireStatusEvidence(ctx.folder, taskId, patch.status, input, scoped);
        // The model reasoned over the board in `ctx`; if that board carried this task, the write is
        // refused when the task has changed since — the proposal was made about a different task state.
        const seen = [...ctx.tasks, ...ctx.bugs].find((t) => t.id === taskId);
        const expectedDateUpdated = seen ? expectedMarker(seen.updatedAt) : undefined;
        let pre: TaskSnapshot | undefined;
        const { raw, post } = await updateTask(taskId, patch, { expectedDateUpdated, onPre: (t) => { pre = snapshotTask(t); onPre?.(pre); } });
        return { ok: true, summary: "Task updated in ClickUp", url: raw.url,
          audit: { target: { kind: "task", id: taskId }, pre, post: snapshotTask(post), ref: { taskId, url: raw.url, date_updated: post.date_updated ?? null } } };
      }

      case "add_comment": {
        const taskId = String(input.task_id ?? "").trim();
        const text = String(input.text ?? "").trim();
        if (!taskId || !text) return { ok: false, error: "A task id and comment text are both required." };
        await requireScopedTask(ctx.folder, taskId);
        const comment = await addComment(taskId, text);
        return { ok: true, summary: "Comment added in ClickUp", url: `https://app.clickup.com/t/${taskId}`, audit: { target: { kind: "task", id: taskId }, ref: { taskId, url: `https://app.clickup.com/t/${taskId}#comment-${comment.id}` } } };
      }

      case "add_decision": {
        if (!ctx.folder) return { ok: false, error: "This project is not linked to a ClickUp folder." };
        const listId = await resolveListId(ctx.folder, "decisions");
        if (!listId) return { ok: false, error: "No decision-log list exists in this client's folder." };
        const detail = String(input.detail ?? "").trim();
        const source = requiredText(input.source, "source");
        const created = await createTask(listId, {
          name: requiredText(input.title, "title", 500),
          markdown_description: [source ? `**Source:** ${source}` : "", detail].filter(Boolean).join("\n\n"),
        });
        return { ok: true, summary: "Decision recorded", url: created.url, audit: { target: { kind: "list", id: listId }, ref: { taskId: created.id, url: created.url } } };
      }

      default:
        return { ok: false, error: `"${tool}" is not something this system can execute.` };
    }
  } catch (err) {
    // An unverified write is "sent, unconfirmed" — it must reach the audit layer as a thrown error
    // (phase after_write_unverified), never be flattened into a plain `ok: false` that reads as "not written".
    if (err instanceof ClickUpWriteUnverifiedError) throw err;
    return { ok: false, error: err instanceof OpsPolicyError ? err.message : "ClickUp write failed or its result could not be verified. Check the audit and ClickUp before retrying." };
  }
}

// ---------------------------------------------------------------------------
// The turn
// ---------------------------------------------------------------------------

export type CopilotEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string }
  | { type: "proposal"; tool: string; input: ToolInput }
  | { type: "dev_message"; to: string; subject: string; body: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Streams one exchange. Reads run inline; the first write tool ends the turn as
 * a proposal for the browser to confirm.
 *
 * A manual loop rather than the SDK tool runner: the panel names the tool that
 * is running while text streams, and a write has to stop the loop rather than
 * be executed by it — which is exactly the behaviour a runner automates away.
 */
export async function* streamOpsChat(
  businessId: string,
  businessName: string,
  ctx: OpsContext,
  history: ChatTurn[]
): AsyncGenerator<CopilotEvent> {
  const apiKey = await getSecret(businessId, AI_KEY_SECRET);
  if (!apiKey) {
    yield { type: "error", message: "No Claude API key is configured for this business. Add it in Settings." };
    return;
  }

  const client = new Anthropic({ apiKey });
  const system = buildCopilotSystem(ctx, businessName);
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((t) => ({ role: t.role, content: t.content }));

  try {
    // Bounded so a read loop cannot spin. Visible, not implicit.
    for (let round = 0; round < 4; round++) {
      const stream = client.beta.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        tools: OPS_TOOLS,
        messages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield { type: "text", text: event.delta.text };
        }
      }

      const message = await stream.finalMessage();

      // Checked before reading content: on a refusal content is empty or partial.
      if (message.stop_reason === "refusal") {
        yield { type: "error", message: "Claude's safety classifiers declined that request." };
        return;
      }

      const toolUses = message.content.filter(
        (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use"
      );
      if (toolUses.length === 0) {
        yield { type: "done" };
        return;
      }

      // A write or a draft ends the turn. Everything the model asked for in the
      // same message is surfaced, so a bulk request shows every affected item
      // rather than confirming one and silently dropping the rest.
      const halting = toolUses.filter((u) => CONFIRM_REQUIRED.has(u.name) || u.name === "draft_dev_message");
      if (halting.length > 0) {
        for (const use of halting) {
          const input = (use.input ?? {}) as ToolInput;
          if (use.name === "draft_dev_message") {
            yield {
              type: "dev_message",
              to: String(input.to ?? ""),
              subject: String(input.subject ?? ""),
              body: String(input.body ?? ""),
            };
          } else {
            yield { type: "proposal", tool: use.name, input };
          }
        }
        yield { type: "done" };
        return;
      }

      messages.push({ role: "assistant", content: message.content });

      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const use of toolUses) {
        yield { type: "tool", name: use.name };
        try {
          const out = await runOpsTool(use.name, (use.input ?? {}) as ToolInput, ctx);
          results.push({ type: "tool_result", tool_use_id: use.id, content: out });
        } catch (err) {
          results.push({
            type: "tool_result",
            tool_use_id: use.id,
            content: err instanceof Error ? err.message : "Tool failed.",
            is_error: true,
          });
        }
      }
      messages.push({ role: "user", content: results });
    }

    yield { type: "error", message: "Stopped after four tool rounds without a final answer." };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      yield { type: "error", message: "The stored Claude API key was rejected." };
    } else if (err instanceof Anthropic.RateLimitError) {
      yield { type: "error", message: "Claude rate limit reached — try again shortly." };
    } else if (err instanceof Anthropic.APIError) {
      yield { type: "error", message: `Claude API error (${err.status}): ${err.message}` };
    } else {
      yield { type: "error", message: err instanceof Error ? err.message : "Unknown error." };
    }
  }
}
