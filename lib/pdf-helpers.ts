type ProposalRecord = {
  clientName: string | null;
  clientCompany?: string | null;
  date?: string | null;
  services?: Array<{ setupFee: number; monthlyFee: number }>;
  vatRate: number | null;
  includeVat: boolean | null;
};

export function formatILSPdf(amount: number): string {
  return amount.toLocaleString("en-US");
}

export function formatDatePdf(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function computeTotals(proposal: ProposalRecord) {
  const services = proposal.services ?? [];
  const totalSetup = services.reduce((s, i) => s + (i.setupFee ?? 0), 0);
  const totalMonthly = services.reduce((s, i) => s + (i.monthlyFee ?? 0), 0);
  const firstYearTotal = totalSetup + totalMonthly * 12;
  const vatAmount = Math.round(firstYearTotal * ((proposal.vatRate ?? 18) / 100));
  const grandTotal = proposal.includeVat ? firstYearTotal : firstYearTotal + vatAmount;
  return { totalSetup, totalMonthly, firstYearTotal, vatAmount, grandTotal };
}

export function pdfFileName(proposal: ProposalRecord): string {
  const company = (proposal.clientCompany || proposal.clientName || "client")
    .replace(/\s+/g, "-")
    .replace(/[^\wא-ת-]/g, "");
  const dateStr = proposal.date || new Date().toISOString().split("T")[0];
  return `mytiv-proposal-${company}-${dateStr}.pdf`;
}
