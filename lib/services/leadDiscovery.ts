/**
 * Ported from electron/services/leadDiscovery.cjs, CJS→ESM only — logic,
 * regexes, and scoring are unchanged. This is a research assistant, not an
 * oracle: results are candidates for human review, and the UI says so.
 */
import { searchWeb } from "./webSearch";
import { fetchUrlMeta } from "./urlMeta";

const SKIP_DOMAINS = [
  "duckduckgo.com", "wikipedia.org", "wikimedia.org", "reddit.com", "quora.com",
  "amazon.", "ebay.", "aliexpress.", "youtube.com", "youtu.be", "pinterest.", "yelp.",
  "tripadvisor.", "glassdoor.", "indeed.", "google.", "bing.com", "yahoo.", "twitter.com", "x.com",
];
const SOCIAL_DOMAINS = ["instagram.com", "linkedin.com", "facebook.com", "tiktok.com"];

const ROUNDUP_RE = /\b(top\s?\d+|\d+\s?(best|top)|best\s+\w+\s+(brands?|companies)|list of|roundup|ultimate guide|you (need|should))\b/i;
const DIRECTORY_RE = /\b(director(y|ies)|listings?|database|marketplace|b2b platform)\b/i;

const CATEGORY_KEYWORDS: Record<string, RegExp> = {
  Beauty: /beauty|cosmetic|skincare|skin care|makeup|serum|fragrance/i,
  Fashion: /fashion|apparel|clothing|streetwear|label|wear\b/i,
  "Food & Beverage": /food|beverage|drink|snack|coffee|wine|beer|restaurant/i,
  "Health & Fitness": /fitness|health|wellness|gym|supplement|sport/i,
  "Culture & Arts": /museum|gallery|festival|exhibition|theater|culture/i,
  Automotive: /car|automotive|vehicle|mobility|ev\b|motors/i,
  "Real Estate": /real estate|property|realty|residential|towers?/i,
  Agency: /agency|agencies|creative studio|marketing firm/i,
  Retail: /retail|store|shop|ecommerce|e-commerce/i,
  Hospitality: /hotel|resort|hospitality|boutique stay/i,
  Tech: /tech|software|startup|app|platform|device/i,
};

export const OPPORTUNITY_BY_CATEGORY: Record<string, string> = {
  Beauty: "AI Content", Fashion: "Social Campaign", "Food & Beverage": "CGI / 3D",
  "Health & Fitness": "Product Video", "Culture & Arts": "Interactive / XR",
  Automotive: "Brand Content", "Real Estate": "CGI / 3D", Agency: "Production Services",
  Retail: "Social Campaign", Hospitality: "Brand Content", Tech: "Product Video",
  Other: "AI Content",
};

const PITCH_BY_CATEGORY: Record<string, string> = {
  Beauty: "strong fit for AI product visuals and CGI liquid work",
  Fashion: "fit for a motion-first drop campaign",
  "Food & Beverage": "fit for liquid CGI and appetite-driven product film",
  "Health & Fitness": "fit for cinematic product storytelling",
  "Culture & Arts": "fit for an AR / interactive visitor layer",
  Automotive: "fit for CGI-hybrid brand film work",
  "Real Estate": "fit for cinematic property films and CGI visualization",
  Agency: "potential white-label production partner",
  Retail: "fit for scroll-stopping social content",
  Hospitality: "fit for atmosphere-driven cinematic content",
  Tech: "fit for making a technical product feel human on film",
  Other: "candidate for AI-accelerated brand content",
};

function classify(domain: string, text: string): "social" | "roundup" | "directory" | "brand" {
  if (SOCIAL_DOMAINS.some((d) => domain.includes(d))) return "social";
  if (ROUNDUP_RE.test(text)) return "roundup";
  if (DIRECTORY_RE.test(text)) return "directory";
  return "brand";
}

function scoreCandidate(kind: string, text: string, category: string) {
  let score = 3;
  if (kind === "brand") score += 1;
  if (kind === "roundup" || kind === "directory") score -= 1;
  const kw = CATEGORY_KEYWORDS[category];
  if (kw && kw.test(text)) score += 1;
  return Math.max(1, Math.min(5, score));
}

function whyFits(kind: string, category: string) {
  const pitch = PITCH_BY_CATEGORY[category] || PITCH_BY_CATEGORY["Other"];
  switch (kind) {
    case "brand":
      return `Likely ${category || "brand"} site — ${pitch}.`;
    case "roundup":
      return "Roundup article — open it and mine the individual brand names, then add those directly.";
    case "directory":
      return "Directory page — a source of leads, not a lead itself.";
    case "social":
      return `Social profile — review the brand's presence; ${pitch}.`;
    default:
      return "";
  }
}

function guessCompany(title: string, meta: { source?: string } | null) {
  if (meta && meta.source && !meta.source.includes(".")) return meta.source;
  const first = title.split(/\s*[|–—•·:-]\s+/)[0].trim();
  return (first.length > 2 && first.length < 60 ? first : title).slice(0, 60);
}

export type LeadCandidate = {
  url: string;
  domain: string;
  kind: string;
  title: string;
  snippet: string;
  score: number;
  opportunity: string;
  why: string;
  company: string;
};

export async function discoverLeads({ query, category = "", limit = 12 }: { query: string; category?: string; limit?: number }): Promise<LeadCandidate[]> {
  const raw = await searchWeb(query);

  const seen = new Set<string>();
  const candidates: LeadCandidate[] = [];
  for (const r of raw) {
    if (seen.has(r.domain)) continue;
    if (SKIP_DOMAINS.some((d) => r.domain.includes(d))) continue;
    seen.add(r.domain);

    const text = `${r.title} ${r.snippet}`;
    const kind = classify(r.domain, text);
    candidates.push({
      url: r.url,
      domain: r.domain,
      kind,
      title: r.title,
      snippet: r.snippet.slice(0, 220),
      score: scoreCandidate(kind, text, category),
      opportunity: OPPORTUNITY_BY_CATEGORY[category] || "AI Content",
      why: whyFits(kind, category),
      company: guessCompany(r.title, null),
    });
  }

  candidates.sort((a, b) => Number(b.kind === "brand") - Number(a.kind === "brand") || b.score - a.score);
  const top = candidates.slice(0, limit);

  const brands = top.filter((c) => c.kind === "brand").slice(0, 8);
  await Promise.allSettled(
    brands.map(async (c) => {
      try {
        const meta = await fetchUrlMeta(c.url);
        if (meta.title) c.company = guessCompany(meta.title, meta);
        if (meta.description) c.snippet = meta.description.slice(0, 220);
      } catch {
        /* best-effort enrichment */
      }
    })
  );

  return top;
}
