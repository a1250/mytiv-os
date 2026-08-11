"use client";

import * as React from "react";
import { Check, X, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Every write says so. A status change that silently fails and rolls back is
 * indistinguishable from one that never registered, which is how a board stops
 * being trusted.
 */

type Toast = { id: number; message: string; href?: string; tone: "ok" | "error" };
type ToastContextValue = { toast: (t: Omit<Toast, "id">) => void };

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Toaster>");
  return ctx;
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(0);

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 5000);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-96"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "bg-card pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-lg",
              t.tone === "error" ? "border-danger/40" : "border-border"
            )}
          >
            {t.tone === "error" ? (
              <TriangleAlert className="text-danger mt-0.5 size-4 shrink-0" />
            ) : (
              <Check className="text-success mt-0.5 size-4 shrink-0" />
            )}
            <div className="flex-1 leading-snug">
              {t.message}
              {t.href && (
                <a
                  href={t.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-active ml-1.5 underline underline-offset-2"
                >
                  Open in ClickUp
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
