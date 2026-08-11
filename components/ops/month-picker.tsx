"use client";

import { useRouter, usePathname } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Month is a URL parameter so a specific month can be linked and reloaded. */
export function MonthPicker({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 print:hidden">
      <input
        type="month"
        value={month}
        onChange={(e) => router.push(`${pathname}?month=${e.target.value}`)}
        aria-label="Month"
        className="border-border bg-muted text-foreground rounded-lg border px-2.5 py-1.5 text-xs"
      />
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer className="size-3.5" />
        Print
      </Button>
    </div>
  );
}
