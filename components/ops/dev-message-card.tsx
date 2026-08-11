"use client";

import * as React from "react";
import { Check, Copy, Pencil, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * A message for a contractor, rendered to be copied — never sent.
 *
 * There is no send button here and there is no code path behind one. Managing
 * someone whose work is slipping is a judgment moment; automating the send
 * removes the read of whether the message is right before it goes out.
 */
export function DevMessageCard({
  to,
  subject,
  body,
  onRegenerate,
}: {
  to: string;
  subject: string;
  body: string;
  onRegenerate?: () => void;
}) {
  const { toast } = useToast();
  const [text, setText] = React.useState(body);
  const [editing, setEditing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // No prop-sync effect: Regenerate appends a new card rather than mutating this
  // one, so `body` never changes under an open editor and clobbers an edit.

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ message: "Message copied", tone: "ok" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ message: "Could not reach the clipboard — select the text and copy manually.", tone: "error" });
    }
  }

  return (
    <div className="bg-card border-border overflow-hidden rounded-xl border">
      <div className="border-border bg-muted/40 border-b px-3.5 py-2.5 text-xs">
        <div className="flex gap-2">
          <span className="text-muted-foreground w-14 shrink-0">To:</span>
          <span className="font-medium">{to}</span>
        </div>
        <div className="mt-1 flex gap-2">
          <span className="text-muted-foreground w-14 shrink-0">Subject:</span>
          <span className="font-medium">{subject}</span>
        </div>
      </div>

      {editing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="text-foreground min-h-64 w-full resize-y bg-transparent px-3.5 py-3 font-mono text-xs leading-relaxed outline-none"
        />
      ) : (
        <pre className="px-3.5 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{text}</pre>
      )}

      <div className="border-border flex flex-wrap items-center gap-2 border-t px-3.5 py-2.5">
        <Button size="sm" onClick={copy}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied ✓" : "Copy message"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
          <Pencil className="size-3.5" />
          {editing ? "Done editing" : "Edit"}
        </Button>
        {onRegenerate && (
          <Button size="sm" variant="ghost" onClick={onRegenerate}>
            <RotateCw className="size-3.5" />
            Regenerate
          </Button>
        )}
        <span className="text-muted-foreground ml-auto text-[11px]">You send it — this never does.</span>
      </div>
    </div>
  );
}
