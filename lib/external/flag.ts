/**
 * Backend-owned external actions (`/api/[slug]/external/*`, migration 0014) — and with them Focus business mail —
 * exist only where the migration is applied: off everywhere by default, and off the routes answer 404 like any
 * unknown route.
 */
export const externalActionsEnabled = () => process.env.EXTERNAL_ACTIONS_ENABLED === "true";
