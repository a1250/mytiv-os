"use client";

import { useDemo } from "./demo-store";

/**
 * Who and what the Work screens name: people, projects and each source's capability map. The demo resolves to its
 * fixtures; a business scope to its real members and projects (from the Work read model). Components read names
 * through this — never from fixtures — so a business never shows a fictional person.
 */
export const useDirectory = () => useDemo().directory;
