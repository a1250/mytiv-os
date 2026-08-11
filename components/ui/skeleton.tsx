import { cn } from "@/lib/utils";

/** Shows the shape of the content while ClickUp is slow, so nothing jumps on arrival. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("bg-muted animate-pulse rounded-md", className)} {...props} />;
}

export { Skeleton };
