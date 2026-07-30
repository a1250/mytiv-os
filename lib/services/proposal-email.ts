/**
 * Builds the cover email that goes out with a proposal PDF. Pure — no DB, no
 * network — so the wording can be checked without a Google connection, and the
 * caller decides whether the result becomes a stored draft, a Gmail draft, or
 * just text the user copies.
 */
import { computeTotals, formatDatePdf } from "@/lib/pdf-helpers";

type ServiceLine = { title: string; setupFee: number; monthlyFee: number };

export type ProposalForEmail = {
  title: string;
  clientName: string | null;
  clientCompany?: string | null;
  services?: ServiceLine[] | null;
  validUntil?: string | null;
  vatRate: number | null;
  includeVat: boolean | null;
  retainerMode?: boolean | null;
};

const ils = (n: number) => `₪ ${n.toLocaleString("en-US")}`;

export function buildProposalEmail(proposal: ProposalForEmail, brandName: string) {
  const services = proposal.services ?? [];
  const { totalSetup, totalMonthly, grandTotal } = computeTotals({
    clientName: proposal.clientName,
    services,
    vatRate: proposal.vatRate,
    includeVat: proposal.includeVat,
  });

  const greetingName = proposal.clientName?.trim() || proposal.clientCompany?.trim() || "";
  // "מאת" rather than the מ- prefix: the prefix glues onto a Latin brand name ("מMytiv").
  const subject = `הצעת מחיר מאת ${brandName}${proposal.clientCompany ? ` עבור ${proposal.clientCompany}` : ""}`;

  const lines: string[] = [];
  lines.push(greetingName ? `שלום ${greetingName},` : "שלום,");
  lines.push("");
  lines.push(
    services.length > 0
      ? "מצורפת הצעת המחיר שהכנו עבורכם. להלן תמצית:"
      : "מצורפת הצעת המחיר שהכנו עבורכם."
  );
  lines.push("");

  for (const s of services) {
    const parts: string[] = [];
    if (s.setupFee > 0) parts.push(`הקמה ${ils(s.setupFee)}`);
    if (s.monthlyFee > 0) parts.push(`${ils(s.monthlyFee)} לחודש`);
    lines.push(`• ${s.title}${parts.length ? ` — ${parts.join(", ")}` : ""}`);
  }

  if (services.length > 0) {
    lines.push("");
    if (proposal.retainerMode) {
      // Retainer proposals are quoted as two commitments, not one annual figure.
      if (totalSetup > 0) lines.push(`תשלום חד-פעמי להקמה: ${ils(totalSetup)}`);
      if (totalMonthly > 0) lines.push(`חיוב חודשי מתמשך: ${ils(totalMonthly)}`);
    } else {
      lines.push(`סה״כ לתשלום: ${ils(grandTotal)}${proposal.includeVat ? " (כולל מע״מ)" : ""}`);
    }
  }

  if (proposal.validUntil) {
    lines.push("");
    lines.push(`ההצעה בתוקף עד ${formatDatePdf(proposal.validUntil)}.`);
  }

  lines.push("");
  lines.push("אשמח לענות על כל שאלה ולהתאים את ההצעה לצרכים שלכם.");
  lines.push("");
  lines.push("בברכה,");
  lines.push(brandName);

  return { subject, body: lines.join("\n") };
}
