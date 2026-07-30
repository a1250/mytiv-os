/**
 * Deterministic reply skeleton for a mail thread — the fallback the Claude pass
 * improves on, and what stands when no key is configured. Pure, so the wording
 * is checkable without a Google or Anthropic connection.
 */
export type ThreadMessage = {
  fromName?: string | null;
  fromEmail?: string | null;
  bodyPreview?: string | null;
  snippet?: string | null;
  direction?: string | null;
};

const HEBREW = /[֐-׿]/;

/** Replies in the language the other side wrote in. */
export function detectLanguage(messages: ThreadMessage[]): "he" | "en" {
  const text = messages.map((m) => m.bodyPreview || m.snippet || "").join(" ");
  return HEBREW.test(text) ? "he" : "en";
}

export function buildReplyDraft(
  subject: string,
  messages: ThreadMessage[],
  brandName: string
): { language: "he" | "en"; body: string } {
  const language = detectLanguage(messages);
  const inbound = [...messages].reverse().find((m) => m.direction !== "out");
  const name = (inbound?.fromName || "").split(" ")[0];

  const body =
    language === "he"
      ? [
          name ? `שלום ${name},` : "שלום,",
          "",
          "תודה על הפנייה — קראתי ואשמח להתקדם.",
          "מתאים לך שיחה קצרה השבוע כדי לסגור את הפרטים?",
          "",
          "בברכה,",
          brandName,
        ].join("\n")
      : [
          name ? `Hi ${name},` : "Hi,",
          "",
          "Thanks for getting back to me — happy to move this forward.",
          "Would a short call this week work to nail down the details?",
          "",
          "Best,",
          brandName,
        ].join("\n");

  return { language, body };
}
