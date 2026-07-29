import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "@react-pdf/renderer";
import { formatILSPdf, formatDatePdf, computeTotals } from "@/lib/pdf-helpers";

type Proposal = {
  id?: string;
  clientName: string;
  clientCompany?: string;
  date?: string | null;
  projectOverview?: string;
  services?: Array<{
    id?: string;
    title: string;
    description?: string;
    setupFee: number;
    monthlyFee: number;
    monthlyBreakdown?: string;
    monthlyBlockTitle?: string;
  }>;
  notes?: string;
  validUntil?: string | null;
  vatRate: number;
  includeVat: boolean;
  retainerMode?: boolean;
};

Font.register({
  family: "Heebo",
  fonts: [
    { src: "/fonts/Heebo-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Heebo-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Heebo-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Heebo-Bold.ttf", fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  cyan: "#22D3CC",
  blue: "#0EA5E9",
  green: "#4ADE80",
  white: "#FFFFFF",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Heebo",
    fontSize: 10,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 48,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  logoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  companyName: {
    fontWeight: 700,
    fontSize: 13,
  },
  dateText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  gradientBar: {
    marginTop: 10,
    marginBottom: 28,
  },
  titleBlock: {
    marginBottom: 22,
  },
  h1: {
    fontWeight: 700,
    fontSize: 26,
    textAlign: "right",
    marginBottom: 6,
  },
  clientLine: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  clientText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  clientName: {
    fontWeight: 600,
    color: COLORS.textPrimary,
    marginRight: 4,
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: COLORS.textMuted,
    textAlign: "right",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 20,
  },
  bodyText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: "right",
    lineHeight: 1.6,
  },
  serviceCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    backgroundColor: "#FAFAFA",
    marginBottom: 10,
    overflow: "hidden",
  },
  serviceCardFirst: {
    borderColor: "#EEEEEE",
    backgroundColor: "#FAFAFA",
  },
  serviceCardMain: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    padding: 14,
  },
  serviceInfo: {
    flex: 1,
    paddingLeft: 14,
  },
  serviceTitle: {
    fontWeight: 700,
    fontSize: 12,
    textAlign: "right",
    marginBottom: 4,
    color: COLORS.textPrimary,
  },
  serviceDesc: {
    fontSize: 9,
    color: "#4A5568",
    textAlign: "right",
    lineHeight: 1.6,
  },
  servicePrices: {
    width: 88,
    flexShrink: 0,
    alignItems: "flex-end",
    borderLeftWidth: 1,
    borderLeftColor: "#E8ECF0",
    paddingLeft: 12,
  },
  priceLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  monthlyBlock: {
    backgroundColor: "#F5F7FA",
    padding: 12,
  },
  monthlyBlockTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.textPrimary,
    textAlign: "right",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  monthlyBlockBody: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
  },
  monthlyFeaturesCol: {
    flex: 1,
  },
  monthlyFeatureRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  checkmark: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: 700,
    marginLeft: 5,
  },
  featureText: {
    fontSize: 8,
    color: "#4A5568",
    lineHeight: 1.6,
  },
  monthlyPriceCol: {
    flexShrink: 0,
    alignItems: "flex-start",
    paddingLeft: 14,
    marginLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#E2E8F0",
  },
  monthlyPrice: {
    fontSize: 13,
    fontWeight: 700,
    color: "#2D3748",
  },
  monthlyPriceSuffix: {
    fontSize: 8,
    color: COLORS.textMuted,
    textAlign: "left",
    marginTop: 2,
  },
  priceValue: {
    fontSize: 10,
    fontWeight: 600,
    color: "#2D3748",
  },
  summaryBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#22D3CC33",
    backgroundColor: "#0EA5E908",
    padding: 14,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 5,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  summaryValueRow: {
    flexDirection: "row",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 500,
    color: "#0F172A",
  },
  summarySign: {
    fontSize: 10,
    fontWeight: 500,
    color: "#0F172A",
    marginLeft: 2,
  },
  totalSign: {
    fontSize: 14,
    fontWeight: 700,
    color: "#22D3CC",
    marginLeft: 2,
  },
  notesBox: {
    backgroundColor: "#F5F2EA",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 600,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.cyan,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
});

function Price({ amount, style }: { amount: number; style?: any }) {
  return <Text style={style}>₪ {formatILSPdf(amount)}</Text>;
}

// @react-pdf mirrors bracket glyphs in RTL context — pre-swap so double-mirror = correct
function mirrorBrackets(s: string): string {
  const map: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{" };
  return s.replace(/[()[\]{}]/g, (c) => map[c] ?? c);
}

function tokenizeLine(line: string): string[] {
  const tokens: string[] = [];
  for (const word of line.trim().split(/\s+/)) {
    const lead = word.match(/^[(\[{]+/)?.[0] ?? "";
    const trail = word.match(/[)\]}.,:;!?]+$/)?.[0] ?? "";
    const core = word.slice(lead.length, word.length - trail.length);
    if (lead) tokens.push(mirrorBrackets(lead));
    if (core) tokens.push(core);
    if (trail) tokens.push(mirrorBrackets(trail));
  }
  return tokens.filter(Boolean);
}

function HebrewText({ text, style }: { text: string; style?: any }) {
  if (!text) return null;
  return (
    <View style={{ width: "100%" }}>
      {text.split("\n").map((line, i) =>
        line.trim() === "" ? (
          <View key={i} style={{ height: 8 }} />
        ) : (
          <View key={i} style={{ flexDirection: "row-reverse", flexWrap: "wrap", marginBottom: 2 }}>
            {tokenizeLine(line).map((token, j) => (
              <Text key={j} style={[style, { marginLeft: 2 }]}>{token}</Text>
            ))}
          </View>
        )
      )}
    </View>
  );
}

function renderPdfNoteLine(line: string, i: number) {
  const trimmed = line.trim();
  if (trimmed.startsWith("**")) {
    const content = trimmed.replace(/^\*\*\s?/, "").replace(/\s?\*\*$/, "").trim();
    return (
      <View key={i} style={{ marginBottom: 4, marginTop: i > 0 ? 6 : 0 }}>
        <HebrewText
          text={content || trimmed}
          style={[s.bodyText, { fontWeight: 700, color: COLORS.textPrimary }]}
        />
      </View>
    );
  }
  if (/^[*\-•]\s/.test(trimmed)) {
    const content = trimmed.slice(2);
    return (
      <View key={i} style={{ flexDirection: "row-reverse", alignItems: "flex-start", marginBottom: 3 }}>
        <Text style={{ fontSize: 9, color: COLORS.cyan, marginLeft: 6, fontWeight: 700 }}>·</Text>
        <View style={{ flex: 1, flexDirection: "row-reverse", flexWrap: "wrap" }}>
          {tokenizeLine(content).map((token, ti) => (
            <Text key={ti} style={[s.bodyText, { marginLeft: 2 }]}>{token}</Text>
          ))}
        </View>
      </View>
    );
  }
  if (trimmed === "") return <View key={i} style={{ height: 5 }} />;
  return (
    <View key={i} style={{ marginBottom: 2 }}>
      <HebrewText text={trimmed} style={s.bodyText} />
    </View>
  );
}

function GradientBar() {
  return (
    <View style={s.gradientBar}>
      <Svg width={500} height={4} viewBox="0 0 500 4">
        <Defs>
          <LinearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#0EA5E9" />
            <Stop offset="50%" stopColor="#22D3CC" />
            <Stop offset="100%" stopColor="#4ADE80" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="500" height="4" rx="2" fill="url(#brand)" />
      </Svg>
    </View>
  );
}

export function ProposalPDF({ proposal }: { proposal: Proposal }) {
  const { totalSetup, totalMonthly, firstYearTotal, vatAmount, grandTotal } =
    computeTotals(proposal);

  const isRetainer = proposal.retainerMode === true;
  // Per-block VAT for retainer mode (setup-only immediate payment)
  const setupVat = Math.round(totalSetup * (proposal.vatRate / 100));
  const monthlyVat = Math.round(totalMonthly * (proposal.vatRate / 100));

  const displayDate = proposal.date || new Date().toISOString().split("T")[0];

  return (
    <Document title={`הצעת מחיר - ${proposal.clientName}`} author="Mytiv" language="he">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoRow}>
            <Image src="/mytiv-logo.png" style={s.logo} />
            <Text style={s.companyName}>Mytiv</Text>
          </View>
          <Text style={s.dateText}>{formatDatePdf(displayDate)}</Text>
        </View>

        <GradientBar />

        {/* Title Block */}
        <View style={s.titleBlock}>
          <Text style={s.h1}>הצעת מחיר</Text>
          <View style={s.clientLine}>
            <Text style={s.clientText}>עבור</Text>
            <Text style={s.clientText}>:</Text>
            <Text style={[s.clientText, s.clientName]}>{proposal.clientName}</Text>
            {proposal.clientCompany ? (
              <>
                <Text style={s.clientText}>·</Text>
                <Text style={[s.clientText, { marginRight: 4 }]}>{proposal.clientCompany}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Project Overview */}
        {proposal.projectOverview ? (
          <View>
            <Text style={s.sectionLabel} minPresenceAhead={40}>סקירת הפרויקט</Text>
            <HebrewText text={proposal.projectOverview} style={s.bodyText} />
          </View>
        ) : null}

        {/* Services */}
        {proposal.services && proposal.services.length > 0 ? (
          <View>
            <Text style={s.sectionLabel}>השירותים שלנו</Text>
            {proposal.services.map((service, idx) => {
              const blockTitle = service.monthlyBlockTitle?.trim() || "חבילת תחזוקה ואחסון";
              const items = (service.monthlyBreakdown || "")
                .split(/[,\n]/)
                .map((l) => l.trim())
                .filter(Boolean);
              return (
                <View
                  key={service.id}
                  style={[s.serviceCard, idx === 0 ? s.serviceCardFirst : {}]}
                  wrap={false}
                >
                  <View style={s.serviceCardMain}>
                    <View style={s.servicePrices}>
                      {service.setupFee > 0 && (
                        <View>
                          <Text style={s.priceLabel}>דמי הקמה</Text>
                          <Price amount={service.setupFee} style={s.priceValue} />
                        </View>
                      )}
                    </View>
                    <View style={s.serviceInfo}>
                      <HebrewText text={service.title} style={s.serviceTitle} />
                      {service.description && (
                        <HebrewText text={service.description} style={s.serviceDesc} />
                      )}
                    </View>
                  </View>

                  {service.monthlyFee > 0 && (
                    <View style={s.monthlyBlock}>
                      <Text style={s.monthlyBlockTitle}>{blockTitle}</Text>
                      <View style={s.monthlyBlockBody}>
                        {items.length > 0 ? (
                          <View style={s.monthlyFeaturesCol}>
                            {items.map((item, fi) => (
                              <View key={fi} style={s.monthlyFeatureRow}>
                                <Text style={s.checkmark}>✓</Text>
                                <View style={{ flex: 1, flexDirection: "row-reverse", flexWrap: "wrap" }}>
                                  {tokenizeLine(item).map((token, ti) => (
                                    <Text key={ti} style={[s.featureText, { marginLeft: 2 }]}>{token}</Text>
                                  ))}
                                </View>
                              </View>
                            ))}
                          </View>
                        ) : null}
                        <View style={s.monthlyPriceCol}>
                          <Price amount={service.monthlyFee} style={s.monthlyPrice} />
                          <Text style={s.monthlyPriceSuffix}>לחודש</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Pricing Summary */}
            <View wrap={false}>
              {isRetainer ? (
                /* ── Retainer: two separate blocks ── */
                <>
                  {/* Block A — Immediate / Setup only */}
                  {totalSetup > 0 && (
                    <View style={{ borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#F8FAFC", padding: 12, marginTop: 16, marginBottom: 8 }}>
                      <Text style={{ fontSize: 7, fontWeight: 600, color: COLORS.textMuted, textAlign: "right", textTransform: "uppercase", marginBottom: 10 }}>
                        תשלום חד-פעמי · הקמה
                      </Text>
                      <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-end", marginBottom: proposal.includeVat ? 0 : 6 }}>
                        <Text style={{ fontSize: 8, color: COLORS.textMuted }}>
                          {proposal.includeVat ? "כולל מע״מ" : "ללא מע״מ"}
                        </Text>
                        <Price amount={totalSetup} style={{ fontSize: 18, fontWeight: 700, color: "#1A202C" }} />
                      </View>
                      {!proposal.includeVat && (
                        <>
                          <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 8 }}>
                            <Text style={{ fontSize: 8, color: COLORS.textMuted }}>מע״מ {proposal.vatRate}%</Text>
                            <Price amount={setupVat} style={{ fontSize: 8, color: COLORS.textMuted }} />
                          </View>
                          <View style={s.divider} />
                          <View style={{ flexDirection: "row-reverse", justifyContent: "space-between" }}>
                            <Text style={{ fontSize: 10, fontWeight: 600, color: COLORS.textPrimary }}>סה״כ לתשלום מיידי</Text>
                            <Price amount={totalSetup + setupVat} style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary }} />
                          </View>
                        </>
                      )}
                    </View>
                  )}

                  {/* Block B — Monthly Recurring */}
                  {totalMonthly > 0 && (
                    <View style={{ borderRadius: 8, borderWidth: 1, borderColor: "#22D3CC33", backgroundColor: "#0EA5E908", padding: 12, marginBottom: 0 }}>
                      <Text style={{ fontSize: 7, fontWeight: 600, color: COLORS.textMuted, textAlign: "right", textTransform: "uppercase", marginBottom: 10 }}>
                        חיוב חודשי מחזורי
                      </Text>
                      <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-end", marginBottom: proposal.includeVat ? 0 : 6 }}>
                        <Text style={{ fontSize: 8, color: COLORS.textMuted }}>
                          {proposal.includeVat ? "כולל מע״מ · לחודש" : "ללא מע״מ · לחודש"}
                        </Text>
                        <Price amount={totalMonthly} style={{ fontSize: 18, fontWeight: 700, color: COLORS.cyan }} />
                      </View>
                      {!proposal.includeVat && (
                        <>
                          <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", marginBottom: 8 }}>
                            <Text style={{ fontSize: 8, color: COLORS.textMuted }}>מע״מ {proposal.vatRate}%</Text>
                            <Price amount={monthlyVat} style={{ fontSize: 8, color: COLORS.textMuted }} />
                          </View>
                          <View style={s.divider} />
                          <View style={{ flexDirection: "row-reverse", justifyContent: "space-between" }}>
                            <Text style={{ fontSize: 9, fontWeight: 500, color: COLORS.textMuted }}>סה״כ חודשי</Text>
                            <Price amount={totalMonthly + monthlyVat} style={{ fontSize: 9, fontWeight: 500, color: COLORS.textMuted }} />
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </>
              ) : (
                /* ── Normal mode: single summary box ── */
                <View style={s.summaryBox}>
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>סה״כ דמי הקמה</Text>
                    <Price amount={totalSetup} style={s.summaryValue} />
                  </View>
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>סה״כ חודשי</Text>
                    <Price amount={totalMonthly} style={s.summaryValue} />
                  </View>

                  <View style={s.divider} />

                  {proposal.includeVat ? (
                    <View style={s.summaryRow}>
                      <Text style={s.totalLabel}>סה״כ לתשלום (כולל מע״מ)</Text>
                      <Price amount={grandTotal} style={s.totalValue} />
                    </View>
                  ) : (
                    <>
                      <View style={s.summaryRow}>
                        <Text style={s.summaryLabel}>סה״כ שנה ראשונה (ללא מע״מ)</Text>
                        <Price amount={firstYearTotal} style={s.summaryValue} />
                      </View>
                      <View style={s.summaryRow}>
                        <View style={{ flexDirection: "row-reverse" }}>
                          <Text style={s.summaryLabel}>מע״מ</Text>
                          <Text style={[s.summaryLabel, { marginRight: 2 }]}>{proposal.vatRate}%</Text>
                        </View>
                        <Price amount={vatAmount} style={s.summaryValue} />
                      </View>
                      <View style={s.divider} />
                      <View style={s.summaryRow}>
                        <Text style={s.totalLabel}>סה״כ לתשלום</Text>
                        <Price amount={grandTotal} style={s.totalValue} />
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* Notes — supports ** bold headers and * bullet items */}
        {proposal.notes && (
          <View wrap={false}>
            <Text style={s.sectionLabel}>הערות</Text>
            <View style={s.notesBox}>
              {proposal.notes.split("\n").map((line, i) => renderPdfNoteLine(line, i))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <View style={{ flexDirection: "row-reverse" }}>
            <Text style={s.footerText}>תוקף ההצעה עד: </Text>
            <Text style={[s.footerText, { marginRight: 2 }]}>
              {proposal.validUntil ? formatDatePdf(proposal.validUntil) : ""}
            </Text>
          </View>
          <Text style={s.footerText}>Mytiv · mytiv.co.il</Text>
        </View>
      </Page>
    </Document>
  );
}
