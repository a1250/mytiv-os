import { CheckCircle2, PlugZap, TimerOff, type LucideIcon } from "lucide-react";

type Tone = "calm" | "warning";

function Panel({
  icon: Icon,
  title,
  body,
  tone = "calm",
}: {
  icon: LucideIcon;
  title: string;
  body: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="bg-card border-border flex flex-col items-center gap-2 rounded-xl border px-6 py-12 text-center">
      <Icon className={tone === "warning" ? "text-warning size-6" : "text-success size-6"} strokeWidth={1.75} />
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-muted-foreground max-w-md text-xs leading-relaxed">{body}</div>
    </div>
  );
}

/** An empty table reads as a broken screen. Say it in words instead. */
export function NothingStuck({ thresholdDays }: { thresholdDays: number }) {
  return (
    <Panel
      icon={CheckCircle2}
      title="Nothing is stuck"
      body={`Every open task has been touched in the last ${thresholdDays} days.`}
    />
  );
}

export function ClickUpNotConfigured() {
  return (
    <Panel
      icon={PlugZap}
      tone="warning"
      title="ClickUp is not connected"
      body={
        <>
          Add <code className="text-foreground">CLICKUP_API_TOKEN</code> and{" "}
          <code className="text-foreground">CLICKUP_WORKSPACE_ID</code> to <code className="text-foreground">.env.local</code>{" "}
          and restart the dev server. Server-side only — never <code className="text-foreground">NEXT_PUBLIC_*</code>.
        </>
      }
    />
  );
}

export function ClickUpRateLimited({ retryAfterSeconds }: { retryAfterSeconds: number | null }) {
  const minutes = retryAfterSeconds ? Math.ceil(retryAfterSeconds / 60) : null;
  return (
    <Panel
      icon={TimerOff}
      tone="warning"
      title="ClickUp rate limit reached"
      body={
        minutes
          ? `The workspace token is throttled for roughly ${minutes} more minutes. This screen is showing nothing, not saying nothing is wrong.`
          : "The workspace token is throttled. This screen is showing nothing, not saying nothing is wrong."
      }
    />
  );
}

export function ClickUpFailed({ message }: { message: string }) {
  return <Panel icon={TimerOff} tone="warning" title="ClickUp request failed" body={message} />;
}
