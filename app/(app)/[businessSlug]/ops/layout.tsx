import { Toaster } from "@/components/ui/toast";

/** Scoped to Ops so the other 16 modules keep their existing chrome untouched. */
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <Toaster>{children}</Toaster>;
}
