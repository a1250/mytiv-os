/**
 * Ported from electron/services/contactDiscovery.cjs, CJS→ESM only — every
 * compliance guarantee from the source file is preserved unchanged:
 *  - Never fetches linkedin.com (or other NEVER_FETCH platforms). LinkedIn
 *    URLs found in search results are stored as links for MANUAL review only.
 *  - Never logs into anything, never bypasses access controls or CAPTCHAs.
 *  - Never invents an email as fact: pattern-guessed addresses are labeled
 *    'pattern_guess' (unverified) and only suggested when the company itself
 *    publishes emails that reveal a pattern.
 */
import { searchWebMulti, domainOf, decode, NEVER_FETCH } from "./webSearch";
import { fetchUrl } from "./rss";

const GENERIC_LOCALPARTS = [
  "info", "hello", "contact", "office", "sales", "press", "support",
  "team", "hi", "studio", "mail", "admin", "jobs", "careers", "pr", "partnerships", "marketing",
];

const SENIORITY_RULES: [string, RegExp][] = [
  ["C-level", /\b(chief|cmo|ceo|coo|cco|cto)\b/i],
  ["Founder", /\b(founder|co-founder|owner)\b/i],
  ["Director", /\b(director|vp|vice president|managing)\b/i],
  ["Head", /\bhead of\b/i],
  ["Manager", /\b(manager|lead)\b/i],
];

const DEPARTMENT_RULES: [string, RegExp][] = [
  ["Marketing", /market|growth|cmo/i],
  ["Creative", /creative|art director|design/i],
  ["Content", /content|social|community/i],
  ["Production", /produc(er|tion)/i],
  ["Innovation", /innovat|technolog|digital|experient/i],
  ["Partnerships", /partner|business development|new business/i],
  ["Executive", /ceo|founder|owner|managing director|general manager/i],
];

const ANGLE_BY_OPPORTUNITY: Record<string, string> = {
  "AI Content": "show how AI-driven visuals cut production cost per asset while keeping brand control",
  "Product Video": "pitch a cinematic product film that makes the hero product feel premium",
  "CGI / 3D": "pitch CGI product work that is impossible to shoot practically",
  "Social Campaign": "pitch a scroll-stopping motion package sized for their channels",
  "Interactive / XR": "pitch an interactive/AR layer that turns their audience into participants",
  "Brand Content": "pitch a brand film that upgrades how the company presents itself",
  "Production Services": "offer Mytiv as an AI-accelerated production partner for overflow work",
  "Website / Digital": "pitch motion and 3D that upgrades their digital presence",
  Other: "open with a specific idea for their current campaign",
};

const inferSeniority = (title: string) => (SENIORITY_RULES.find(([, re]) => re.test(title)) || ["Other"])[0];
const inferDepartment = (title: string) => (DEPARTMENT_RULES.find(([, re]) => re.test(title)) || ["Other"])[0];

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function looksLikePersonName(name: string, company: string) {
  const words = name.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (/\d|@|www|\.com|Ltd|GmbH|Inc\b/i.test(name)) return false;
  if (!words.every((w) => /^[A-ZÀ-Þא-ת][\w'’.-]*$/.test(w))) return false;
  const lower = name.toLowerCase();
  if (company && (lower.includes(company.toLowerCase()) || company.toLowerCase().includes(lower))) return false;
  return true;
}

type RawCandidate = {
  full_name: string;
  job_title: string;
  linkedin_url: string;
  source_url: string;
  source_type: string;
  raw_snippet: string;
  companyMatch: boolean;
};
type SearchItem = { url: string; domain: string; title: string; snippet: string };

function parseLinkedInResult(r: SearchItem, company: string): RawCandidate | null {
  const cleaned = r.title.replace(/\s*[|·-]\s*LinkedIn.*$/i, "");
  const parts = cleaned.split(/\s+[-–—|]\s+/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  const name = normalizeName(parts[0]);
  if (!looksLikePersonName(name, company)) return null;
  let job = "";
  for (const p of parts.slice(1)) {
    if (company && p.toLowerCase().includes(company.toLowerCase())) continue;
    if (!job && p.length < 70) job = p;
  }
  const text = `${r.title} ${r.snippet}`;
  const companyMatch = company ? new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(text) : false;
  return {
    full_name: name,
    job_title: job,
    linkedin_url: r.url,
    source_url: r.url,
    source_type: "search_result",
    raw_snippet: r.snippet.slice(0, 240),
    companyMatch,
  };
}

function parseLooseResult(r: SearchItem, company: string, roleRe: RegExp): RawCandidate[] {
  const text = `${r.title}. ${r.snippet}`;
  const out: RawCandidate[] = [];
  const re = /([A-ZÀ-Þ][\w'’-]+(?: [A-ZÀ-Þ][\w'’-]+){1,2})\s*[,–—-]\s*([^,.;|]{3,60})/g;
  let m;
  while ((m = re.exec(text)) && out.length < 3) {
    const name = normalizeName(m[1]);
    const job = m[2].trim();
    if (!looksLikePersonName(name, company)) continue;
    if (!roleRe.test(job)) continue;
    out.push({
      full_name: name,
      job_title: job,
      linkedin_url: "",
      source_url: r.url,
      source_type: "press",
      raw_snippet: r.snippet.slice(0, 240),
      companyMatch: true,
    });
  }
  return out;
}

export async function findPublicEmailsForCompany(website: string) {
  const found = new Set<string>();
  if (!website || !/^https?:\/\//i.test(website)) return { emails: [] as string[], generic: [] as string[], personal: [] as string[], pattern: "" };
  const domain = domainOf(website);
  if (NEVER_FETCH.some((d) => domain.includes(d))) return { emails: [] as string[], generic: [] as string[], personal: [] as string[], pattern: "" };

  const base = website.replace(/\/+$/, "");
  const pages = [base, `${base}/contact`, `${base}/about`, `${base}/team`];
  for (const page of pages) {
    try {
      const html = (await fetchUrl(page)).slice(0, 400000);
      const matches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      matches.forEach((e) => {
        const email = e.toLowerCase();
        if (email.endsWith(".png") || email.endsWith(".jpg") || email.endsWith(".svg")) return;
        if (email.split("@")[1] && email.split("@")[1].includes(domain.split(".")[0])) found.add(email);
      });
    } catch {
      /* page missing / unreachable — fine */
    }
  }

  const emails = [...found];
  const generic = emails.filter((e) => GENERIC_LOCALPARTS.includes(e.split("@")[0]));
  const personal = emails.filter((e) => !generic.includes(e));
  return { emails, generic, personal, pattern: detectEmailPattern(personal) };
}

export function detectEmailPattern(personalEmails: string[]) {
  for (const email of personalEmails) {
    const local = email.split("@")[0];
    if (/^[a-z]+\.[a-z]+$/.test(local)) return "{first}.{last}";
    if (/^[a-z]\.[a-z]+$/.test(local)) return "{f}.{last}";
    if (/^[a-z]{2,}$/.test(local)) return "{first}";
  }
  return "";
}

function emailFromPattern(pattern: string, fullName: string, domain: string) {
  const parts = fullName.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length < 2 || !pattern || !domain) return "";
  const [first, last] = [parts[0], parts[parts.length - 1]];
  const local = pattern.replace("{first}", first).replace("{last}", last).replace("{f}", first[0]);
  return `${local}@${domain}`;
}

function scoreContactCandidate(c: RawCandidate, targetRoles: string[]) {
  let confidence = c.linkedin_url ? 3 : 2;
  if (c.companyMatch) confidence += 1;
  if (c.job_title) confidence += c.linkedin_url ? 1 : 0;

  let relevance = 2;
  const titleLower = (c.job_title || "").toLowerCase();
  if (targetRoles.some((role) => titleLower.includes(role.toLowerCase()))) relevance += 2;
  else if (targetRoles.some((role) => role.toLowerCase().split(/\s+/).some((w) => w.length > 3 && titleLower.includes(w)))) relevance += 1;
  if (/head|director|chief|vp|founder|cmo|ceo/i.test(titleLower)) relevance += 1;

  return { confidence: Math.max(1, Math.min(5, confidence)), relevance: Math.max(1, Math.min(5, relevance)) };
}

function whyRelevant(c: RawCandidate, company: string, opportunityType: string) {
  const dept = inferDepartment(c.job_title || "");
  const role = c.job_title || "their role";
  const deptLine = dept === "Other" ? "likely involved in brand decisions" : `owns ${dept.toLowerCase()} decisions`;
  return `${role} at ${company} — ${deptLine}; a natural door for a ${opportunityType || "Mytiv"} conversation.`;
}

export async function discoverContactsForCompany({
  company,
  website = "",
  roles = [] as string[],
  location = "",
  opportunityType = "",
}: {
  company: string;
  website?: string;
  roles?: string[];
  location?: string;
  opportunityType?: string;
}) {
  const targetRoles = roles.length ? roles : ["Marketing Manager", "Brand Manager", "Creative Director", "Founder"];
  const topRoles = targetRoles.slice(0, 3).map((r) => `"${r}"`).join(" OR ");
  const queries = [`site:linkedin.com/in "${company}"`, `"${company}" (${topRoles})${location ? ` ${location}` : ""}`];

  // DDG throttles rapid consecutive searches hard — space them well apart.
  const [searchResults, emailInfo] = await Promise.all([searchWebMulti(queries, { delayMs: 9000 }), findPublicEmailsForCompany(website)]);

  const roleRe = new RegExp(
    targetRoles.map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + "|director|manager|producer|head of|chief|founder|cmo",
    "i"
  );
  const siteDomain = domainOf(website);

  const byName = new Map<string, RawCandidate & { extra_sources: { source_url: string; source_type: string; raw_snippet: string }[] }>();
  const push = (cand: RawCandidate | null) => {
    if (!cand) return;
    const key = cand.full_name.toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      if (!existing.linkedin_url && cand.linkedin_url) existing.linkedin_url = cand.linkedin_url;
      if (!existing.job_title && cand.job_title) existing.job_title = cand.job_title;
      existing.extra_sources.push({ source_url: cand.source_url, source_type: cand.source_type, raw_snippet: cand.raw_snippet });
    } else {
      byName.set(key, { ...cand, extra_sources: [] });
    }
  };

  for (const sr of searchResults) {
    for (const r of sr.items) {
      const domain = domainOf(r.url);
      if (domain.includes("linkedin.com") && /\/in\//.test(r.url)) {
        push(parseLinkedInResult(r, company));
      } else if (!NEVER_FETCH.some((d) => domain.includes(d))) {
        parseLooseResult(r, company, roleRe).forEach((c) => {
          c.source_type = siteDomain && domain === siteDomain ? "company_site" : "press";
          push(c);
        });
      }
    }
  }

  const candidates = [...byName.values()].map((c) => {
    const scores = scoreContactCandidate(c, targetRoles);
    let email = "";
    let email_status = "missing";
    const nameParts = c.full_name.toLowerCase().split(/\s+/);
    const personalHit = emailInfo.personal.find((e) => nameParts.some((p) => p.length > 2 && e.split("@")[0].includes(p)));
    if (personalHit) {
      email = personalHit;
      email_status = "public_verified";
    } else if (emailInfo.pattern && siteDomain) {
      const guess = emailFromPattern(emailInfo.pattern, c.full_name, siteDomain);
      if (guess) {
        email = guess;
        email_status = "pattern_guess";
      }
    }
    if (!email && emailInfo.generic.length) {
      email = emailInfo.generic[0];
      email_status = "company_generic";
    }

    return {
      full_name: c.full_name,
      job_title: decode(c.job_title || ""),
      department: inferDepartment(c.job_title || ""),
      seniority: inferSeniority(c.job_title || ""),
      linkedin_url: c.linkedin_url,
      email,
      email_status,
      source_url: c.source_url,
      source_type: c.source_type,
      raw_snippet: c.raw_snippet,
      extra_sources: c.extra_sources,
      confidence: scores.confidence,
      relevance: scores.relevance,
      why_relevant: whyRelevant(c, company, opportunityType),
      suggested_angle: ANGLE_BY_OPPORTUNITY[opportunityType] || ANGLE_BY_OPPORTUNITY["Other"],
      suggested_service: opportunityType || "AI Content",
      last_checked: new Date().toISOString(),
    };
  });

  candidates.sort((a, b) => b.relevance + b.confidence - (a.relevance + a.confidence));

  const failed = searchResults.filter((s) => !s.ok);
  return {
    candidates: candidates.slice(0, 15),
    companyEmails: emailInfo,
    throttled: failed.some((f) => f.throttled),
    partial: failed.length > 0 && failed.length < searchResults.length,
    failedAll: failed.length === searchResults.length,
  };
}
