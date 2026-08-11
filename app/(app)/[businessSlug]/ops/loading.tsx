import { Skeleton } from "@/components/ui/skeleton";

/** Same shape as the loaded screen, so nothing shifts when ClickUp answers. */
export default function OpsLoading() {
  return (
    <div className="ops-root">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-64" />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[74px] rounded-xl" />
        ))}
      </div>

      <Skeleton className="mt-8 h-4 w-32" />
      <div className="mt-3 flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl md:h-12" />
        ))}
      </div>
    </div>
  );
}
