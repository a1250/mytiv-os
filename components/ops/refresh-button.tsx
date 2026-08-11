"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Reads are cached for 60s in the service, so this is honest about latency. */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className={cn(
        "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
      )}
    >
      <RotateCw className={cn("size-3.5", pending && "animate-spin")} />
      {pending ? "Refreshing" : "Refresh"}
    </button>
  );
}
