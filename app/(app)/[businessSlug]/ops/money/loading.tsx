import { Skeleton } from "@/components/ui/skeleton";

/** Money reads several ClickUp windows per client, so this one is worth a skeleton. */
export default function MoneyLoading() {
  return (
    <div className="ops-root">
      <Skeleton className="h-6 w-28" />
      <Skeleton className="mt-2 h-4 w-72" />
      <Skeleton className="mt-6 h-40 rounded-xl" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
