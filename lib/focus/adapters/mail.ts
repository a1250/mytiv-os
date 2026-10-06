/**
 * Business mail in Focus: what the persisted Gmail attempts of a thread (newest first, from
 * GET /api/[slug]/external/attempts) mean for the person replying. Pure and client-safe. The server's gate
 * (external_attempt_admit) decides; this only explains it and pre-fills the target check.
 */
export type MailAttempt = { id: string; state: "in_flight" | "confirmed" | "failed" | "unknown"; error: string | null; providerRef: string | null; createdAt: string; settledAt: string | null };
export type SendStatus =
  | { kind: "none" }
  | { kind: "in_flight"; text: string }
  | { kind: "sent"; text: string; at: string }
  | { kind: "failed"; text: string }
  | { kind: "unknown"; text: string; unknownAttemptId: string };

export function sendStatus(attempts: MailAttempt[]): SendStatus {
  const last = attempts[0];
  if (!last) return { kind: "none" };
  if (last.state === "in_flight") return { kind: "in_flight", text: "שליחה בדרך — ממתינים לתשובת Gmail." };
  if (last.state === "confirmed") return { kind: "sent", text: "התשובה האחרונה נשלחה · Gmail אישר.", at: last.settledAt ?? last.createdAt };
  if (last.state === "failed") return { kind: "failed", text: "השליחה האחרונה נכשלה — Gmail סירב. אפשר לנסות שוב." };
  return { kind: "unknown", unknownAttemptId: last.id, text: "לא ידוע אם השליחה האחרונה יצאה (Gmail לא ענה). לפני שליחה חדשה בדקו בתיקיית נשלח ב־Gmail." };
}

/** The send route's refusals, in words. */
export const SEND_REFUSAL: Record<string, string> = {
  in_flight: "שליחה קודמת לשיחה הזו עוד בדרך. נסו שוב בעוד רגע.",
  already_done: "הטיוטה הזו כבר נשלחה. לא נשלח שוב.",
  needs_target_check: "לא ידוע אם השליחה הקודמת יצאה. בדקו בתיקיית נשלח ב־Gmail וסמנו זאת לפני שליחה חדשה.",
  gmail_not_connected: "Gmail לא מחובר לעסק הזה.",
  invalid_recipient: "כתובת הנמען לא תקינה.",
  invalid_body: "אין מה לשלוח.",
  same_origin_required: "הבקשה נחסמה (מקור לא מוכר).",
  request_conflict: "הבקשה כבר נרשמה עם תוכן אחר.",
  not_member: "אין לך גישה לעסק הזה.",
};
export const sendRefusalText = (code: string | undefined) => (code && SEND_REFUSAL[code]) ?? "השליחה לא התבצעה.";
