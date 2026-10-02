import Link from "next/link";
import type { Loadable } from "@/lib/focus/contracts/loadable";
import type { StuckItem } from "@/lib/focus/contracts/today";
import { LoadableView } from "@/components/focus/ui/feedback";

/** "מה תקוע" — warning panel listing what blocks progress, each with its next step when there is one. */
export function StuckPanel({ stuck, title = "מה תקוע" }: { stuck: Loadable<StuckItem[]>; title?: string }) {
  return (
    <section className="f-stuck" aria-labelledby="stuck-title">
      <LoadableView value={stuck} label={title} compact>
        {(items) => (
          <>
            <h3 id="stuck-title" className="f-stuck__title">{title} · {items.length}</h3>
            {items.map((s) => (
              <p key={s.id} className="f-stuck__item">
                {s.text}{s.action && <> <Link href={s.action.href} className="f-stuck__link">{s.action.label}</Link></>}
              </p>
            ))}
          </>
        )}
      </LoadableView>
    </section>
  );
}
