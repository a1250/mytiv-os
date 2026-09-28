/**
 * What a status change carries about its evidence. Pure, shared by the Tasks tab and its tests.
 *
 * Pasting a recording URL is not a review. `evidence_reviewed` is true only when the human took
 * a separate, explicit action saying they watched it — the server (`assertClosure`) then refuses
 * any closing status without both the exact attached URL and that flag. Nothing here can be
 * satisfied by a URL alone.
 */
export const REVIEW_PROMPT = "I watched this recording and verified the definition of done.";

export type StatusChange = { status: string; evidence_url: string; evidence_reviewed: boolean };

/** True when the change needs the reviewer's explicit confirmation before it may be sent. */
export function needsReviewConfirmation(evidenceUrl: string): boolean {
  return evidenceUrl.trim().length > 0;
}

/**
 * `reviewConfirmed` is the result of the explicit confirmation step, asked only when
 * `needsReviewConfirmation` is true. Declining it (or never being asked) never yields
 * a reviewed change — the URL still travels, the claim of review does not.
 */
export function statusChange(status: string, evidenceUrl: string, reviewConfirmed: boolean): StatusChange {
  const url = evidenceUrl.trim();
  return { status, evidence_url: url, evidence_reviewed: needsReviewConfirmation(url) && reviewConfirmed === true };
}
