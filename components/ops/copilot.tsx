"use client";

import * as React from "react";
import { ArrowUp, Sparkles, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ConfirmCard, type ProposalState } from "./confirm-card";
import { DevMessageCard } from "./dev-message-card";

type Item =
  | { kind: "turn"; role: "user" | "assistant"; content: string }
  | { kind: "proposal"; id: number; tool: string; input: Record<string, unknown>; state: ProposalState }
  | { kind: "dev"; id: number; to: string; subject: string; body: string }
  | { kind: "note"; id: number; text: string };

const TOOL_LABELS: Record<string, string> = {
  fetch_tasks: "Reading tasks",
  check_blockers: "Checking blockers",
  get_time_summary: "Reading logged time",
  get_decisions: "Reading decisions",
  verify_completion: "Looking for proof",
};

const SUGGESTIONS = [
  "What is currently blocked, and on whom?",
  "Summarize this client's status.",
  "Draft a message to Jaffer about what's stuck.",
];

/**
 * Read-and-propose copilot, scoped to the client whose workspace it sits in.
 *
 * It answers from the spec, the live board and the decision log. Writes arrive
 * as cards that do nothing until confirmed — the browser cannot execute one by
 * streaming text, only by posting to the confirm route on a click.
 */
export function Copilot({ businessSlug, projectId }: { businessSlug: string; projectId: string }) {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Item[]>([]);
  const [draft, setDraft] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [tool, setTool] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const nextId = React.useRef(0);
  const confirmationIds = React.useRef(new Map<number, string>());
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items, tool]);

  const appendText = React.useCallback((text: string) => {
    setItems((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.kind === "turn" && last.role === "assistant") {
        copy[copy.length - 1] = { ...last, content: last.content + text };
        return copy;
      }
      return [...copy, { kind: "turn", role: "assistant", content: text }];
    });
  }, []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;

    const history = [
      ...items.filter((i): i is Extract<Item, { kind: "turn" }> => i.kind === "turn"),
      { kind: "turn" as const, role: "user" as const, content: question },
    ].map(({ role, content }) => ({ role, content }));

    setItems((prev) => [
      ...prev,
      { kind: "turn", role: "user", content: question },
      { kind: "turn", role: "assistant", content: "" },
    ]);
    setDraft("");
    setError(null);
    setStreaming(true);
    setTool(null);

    try {
      const res = await fetch(`/api/${businessSlug}/ops/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, messages: history }),
      });
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line; keep the trailing partial.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6));

          if (event.type === "text") {
            setTool(null);
            appendText(event.text);
          } else if (event.type === "tool") {
            setTool(event.name);
          } else if (event.type === "proposal") {
            setItems((prev) => [
              ...prev,
              { kind: "proposal", id: nextId.current++, tool: event.tool, input: event.input, state: { status: "pending" } },
            ]);
          } else if (event.type === "dev_message") {
            setItems((prev) => [
              ...prev,
              { kind: "dev", id: nextId.current++, to: event.to, subject: event.subject, body: event.body },
            ]);
          } else if (event.type === "error") {
            setError(event.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStreaming(false);
      setTool(null);
      // Drop the placeholder if the turn produced no text at all.
      setItems((prev) => {
        const last = prev[prev.length - 1];
        return last?.kind === "turn" && last.role === "assistant" && !last.content ? prev.slice(0, -1) : prev;
      });
    }
  }

  function setProposalState(id: number, state: ProposalState) {
    setItems((prev) => prev.map((i) => (i.kind === "proposal" && i.id === id ? { ...i, state } : i)));
  }

  async function confirmProposal(id: number, tool: string, input: Record<string, unknown>) {
    if (!confirmationIds.current.has(id)) confirmationIds.current.set(id, crypto.randomUUID());
    setProposalState(id, { status: "running" });
    try {
      const res = await fetch(`/api/${businessSlug}/ops/chat/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, tool, input, confirmed: true, requestId: confirmationIds.current.get(id) }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) throw new Error(result.error ?? `Failed (${res.status})`);
      setProposalState(id, { status: "done", summary: result.summary, url: result.url });
      toast({ message: result.summary, href: result.url, tone: "ok" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Write failed.";
      setProposalState(id, { status: "failed", error: message });
      toast({ message, tone: "error" });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {items.length === 0 && (
          <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center">
            <Sparkles className="text-active size-6" strokeWidth={1.75} />
            <div className="text-sm font-semibold">Ask about this client</div>
            <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
              Answers come from the spec, the live ClickUp board and the decision log. It can propose changes — nothing
              reaches ClickUp until you confirm the card, and it never sends a message.
            </p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="border-border text-muted-foreground hover:text-foreground hover:border-active/50 rounded-full border px-3 py-1.5 text-xs transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {items.map((item, i) => {
          if (item.kind === "turn") {
            return (
              <div key={i} className={cn("flex", item.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    item.role === "user" ? "bg-active/15 border-active/25 border" : "bg-card border-border border"
                  )}
                >
                  {item.content || <span className="text-muted-foreground animate-pulse">Thinking…</span>}
                </div>
              </div>
            );
          }
          if (item.kind === "proposal") {
            return (
              <ConfirmCard
                key={item.id}
                tool={item.tool}
                input={item.input}
                state={item.state}
                onConfirm={(edited) => confirmProposal(item.id, item.tool, edited)}
                onCancel={() => setProposalState(item.id, { status: "cancelled" })}
              />
            );
          }
          if (item.kind === "dev") {
            return (
              <DevMessageCard
                key={item.id}
                to={item.to}
                subject={item.subject}
                body={item.body}
                onRegenerate={() => send("Rewrite that message — same facts, different wording.")}
              />
            );
          }
          return (
            <div key={item.id} className="text-muted-foreground text-xs">
              {item.text}
            </div>
          );
        })}

        {tool && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Wrench className="size-3.5 animate-pulse" />
            {TOOL_LABELS[tool] ?? tool}…
          </div>
        )}

        {error && (
          <div className="border-danger/30 bg-danger/10 text-danger rounded-xl border px-3.5 py-2.5 text-xs">
            {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="border-border bg-card sticky bottom-3 flex items-end gap-2 rounded-xl border p-2"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          rows={1}
          placeholder="Ask, or describe a task to create…"
          className="text-foreground max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={streaming || !draft.trim()}
          aria-label="Send"
          className="bg-active inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
    </div>
  );
}
