"use client";

import { createContext, useContext, type ReactNode } from "react";
import { scopeBase, type FocusScope } from "@/lib/focus/scope";

/**
 * The verified scope, handed down by the server layout (lib/focus/scope.server.ts). Client components read the base
 * for URLs and, later, the business identity for adapters. It is never derived on the client.
 */
export type ClientScope = FocusScope & { base: string };

const Ctx = createContext<ClientScope | null>(null);

export function FocusScopeProvider({ scope, children }: { scope: FocusScope; children: ReactNode }) {
  return <Ctx.Provider value={{ ...scope, base: scopeBase(scope.slug) }}>{children}</Ctx.Provider>;
}

export function useFocusScope(): ClientScope {
  const s = useContext(Ctx);
  if (!s) throw new Error("useFocusScope must be used inside the Focus layout (FocusScopeProvider).");
  return s;
}

/** Prototype controls (screen map, demo reset / role / failure injection, remote-edit) render only in the demo scope. */
export const useIsDemo = () => useFocusScope().kind === "demo";
