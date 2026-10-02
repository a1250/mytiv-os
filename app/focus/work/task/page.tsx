import { redirect } from "next/navigation";
import { R } from "@/lib/focus/routes";

/** W4 (task drawer) is not a page of its own: the drawer opens over the project list for the task in `?task=`. */
export default function Page() {
  redirect(R.task("t-post45"));
}
