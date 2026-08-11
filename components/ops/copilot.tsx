"use client";

import * as React from "react";
import { ArrowUp, Sparkles, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; content: string };

const TOOL_LABELS: Record<string, string> = {
  fetch_tasks: "Reading tasks",
  check_blockers: "Checking blockers",
  get_time_summary: "Reading logged time",
  get_decisions: "Reading decisions",
};

const SUGGESTIONS = [
  "What is currently blocked, and on whom?",
  "Summarize this client's status.",
  "What is the next priority?",
];

/**
 * Read-only copilot, scoped to the client whose workspace it sits in.
 *
 * It answers from the spec, the live ClickUp board and the decision log — and
 * it cannot write. That is a property of the server route, not of this panel:
 * the browser sends only a project id and the conversation.
 */
export function Copilot({ businessSlug, projectId }: { businessSlug: string; projectId: string }) {
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [draft, setDraft] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [tool, setTool] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, tool]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;

    const next: Turn[] = [...turns, { role: "user", content: question }];
    setTurns([...next, { role: "assistant", content: "" }]);
    setDraft("");
    setError(null);
    setStreaming(true);
    setTool(null);

    try {
      const res = await fetch(`/api/${businessSlug}/ops/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, messages: next }),
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
            setTurns((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = {
                role: "assistant",
                content: copy[copy.length - 1].content + event.text,
              };
              return copy;
            });
          } else if (event.type === "tool") {
            setTool(event.name);
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
      // Drop the placeholder if the turn produced nothing at all.
      setTurns((prev) =>
        prev.length && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content
          ? prev.slice(0, -1)
          : prev
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {turns.length === 0 && (
          <div className="bg-card border-border flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center">
            <Sparkles className="text-active size-6" strokeWidth={1.75} />
            <div className="text-sm font-semibold">Ask about this client</div>
            <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
              Answers come from three places only — the spec, the live ClickUp board, and the decision log. It reads;
              it does not change anything.
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

        {turns.map((turn, i) => (
          <div key={i} className={cn("flex", turn.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                turn.role === "user"
                  ? "bg-active/15 border-active/25 border"
                  : "bg-card border-border border"
              )}
            >
              {turn.content || (
                <span className="text-muted-foreground inline-flex gap-1">
                  <span className="animate-pulse">Thinking…</span>
                </span>
              )}
            </div>
          </div>
        ))}

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
          placeholder="Ask about this client…"
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
