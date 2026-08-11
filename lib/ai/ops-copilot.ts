/**
 * The Ops Copilot — read-only in this phase.
 *
 * Context is deliberately three things and nothing else: the client's spec,
 * its live ClickUp work, and its last ten decisions. Loading the whole database
 * is what makes an assistant confidently wrong; a lean context also keeps
 * latency in the range where the panel is usable.
 *
 * Every tool here only reads. Writing arrives in Phase 3, behind a preview and
 * a confirm — there is deliberately no write path in this file to reach for.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getSecret } from "@/lib/db/queries/secrets";
import { AI_KEY_SECRET } from "./claude";
import { getTimeEntries, type OpsTask } from "@/lib/clickup";
import type { ClientFolder } from "@/lib/ops-config";
import type { ProjectRow } from "@/lib/db/queries/projects";

const MODEL = "claude-opus-5";

/** What the copilot can see. Assembled once per request, never per turn. */
export type OpsContext = {
  project: ProjectRow;
  folder: ClientFolder | null;
  tasks: OpsTask[];
  bugs: OpsTask[];
  decisions: OpsTask[];
  thresholdDays: number;
};

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

  const sections = [
    `You are the operations copilot for ${businessName}, answering about one client: ${project.name}.`,
    "",
    "You can read this client's spec, its live ClickUp work, and its decision log. You cannot change anything — no creating, updating, closing, commenting, or messaging. If asked to do any of those, say plainly that writing arrives in the next phase and offer the reasoning instead.",
    "",
    "How to answer:",
    "- Lead with the answer. Detail after, only if it changes what the reader does next.",
    "- Ground every claim in the data below or in a tool result. Never estimate a date, an owner, or an hour count that is not there.",
    "- When something is missing — no owner, no due date, no proof of a fix — say so. That absence is usually the actual answer.",
    `- A task is stuck at ${thresholdDays}+ days without a ClickUp update.`,
    "- Answer in the language of the question. The board is a mix of Hebrew and English; that is expected.",
    "",
    `## Client: ${project.name}`,
    `Status: ${project.status ?? "unknown"} · Deadline: ${project.deadline || "none set"} · Budget: ${project.budget || "not recorded"}`,
    "",
    "## Spec",
    project.brief?.trim() || "(no spec written yet — say so if the question depends on it)",
    "",
    `## Open tasks (${tasks.length})`,
    tasks.length ? tasks.map(describeTask).join("\n") : "(none)",
    "",
    `## Open bugs (${bugs.length})`,
    bugs.length ? bugs.map(describeTask).join("\n") : "(none)",
    "",
    `## Last decisions (${decisions.length})`,
    decisions.length
      ? decisions.map((d) => `[${d.id}] ${d.title} · ${d.status}`).join("\n")
      : "(none recorded)",
  ];

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Read-only tools
// ---------------------------------------------------------------------------

export const OPS_READ_TOOLS: Anthropic.Beta.BetaToolUnion[] = [
  {
    name: "fetch_tasks",
    description:
      "Filter the client's open ClickUp work that is already in your context. Use it to narrow by status, assignee, or list rather than re-reading everything.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "ClickUp status name, e.g. 'to do'." },
        assignee: { type: "string", description: "Assignee name, matched loosely." },
        list: { type: "string", enum: ["tasks", "bugs"], description: "Which list to filter." },
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
      "Hours logged in ClickUp for this client over a date range. Returns zero if the contractors have not logged time — report that plainly rather than treating zero as 'no work'.",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Start date, YYYY-MM-DD." },
        to: { type: "string", description: "End date, YYYY-MM-DD." },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "get_decisions",
    description: "The client's recorded decisions, most recent first.",
    input_schema: {
      type: "object",
      properties: { limit: { type: "number", description: "How many to return (default 10)." } },
    },
  },
];

type ToolInput = Record<string, unknown>;

export async function runOpsTool(name: string, input: ToolInput, ctx: OpsContext): Promise<string> {
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
      if (!stuck.length) return `Nothing has been untouched for ${ctx.thresholdDays}+ days.`;
      return stuck.map(describeTask).join("\n");
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

    default:
      return `Unknown tool: ${name}`;
  }
}

// ---------------------------------------------------------------------------
// The turn
// ---------------------------------------------------------------------------

export type CopilotEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Streams one exchange, running read tools inline as Claude asks for them.
 *
 * A manual loop rather than the SDK tool runner: the panel shows which tool is
 * running while text streams, so tool execution and token deltas have to be
 * interleaved into one custom event stream.
 */
export async function* streamOpsChat(
  businessId: string,
  businessName: string,
  ctx: OpsContext,
  history: ChatTurn[]
): AsyncGenerator<CopilotEvent> {
  const apiKey = await getSecret(businessId, AI_KEY_SECRET);
  if (!apiKey) {
    yield {
      type: "error",
      message: "No Claude API key is configured for this business. Add it in Settings.",
    };
    return;
  }

  const client = new Anthropic({ apiKey });
  const system = buildCopilotSystem(ctx, businessName);
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((t) => ({
    role: t.role,
    content: t.content,
  }));

  try {
    // Bounded so a tool loop cannot spin: four rounds is more than any read
    // question here needs, and the cap is visible rather than implicit.
    for (let round = 0; round < 4; round++) {
      const stream = client.beta.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        tools: OPS_READ_TOOLS,
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
