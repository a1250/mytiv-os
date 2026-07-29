/**
 * Ported from electron/services/webSearch.cjs — pure DuckDuckGo HTML-scraping
 * search, no Electron dependency, converted from CJS (require/module.exports)
 * to ESM. Logic and regexes are unchanged.
 *
 * COMPLIANCE: ordinary public web searches only. Never logs into any
 * platform, never bypasses access controls. Callers must never fetch content
 * from NEVER_FETCH domains.
 */
import { fetchUrl } from "./rss";

export const NEVER_FETCH = ["linkedin.com", "licdn.com", "facebook.com", "instagram.com"];

export const decode = (s: string) =>
  String(s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/\s+/g, " ")
    .trim();

function realUrl(href: string): string | null {
  try {
    if (href.startsWith("//")) href = "https:" + href;
    const u = new URL(href, "https://duckduckgo.com");
    if (u.pathname.startsWith("/l/")) {
      const uddg = u.searchParams.get("uddg");
      return uddg ? decodeURIComponent(uddg) : null;
    }
    return u.protocol.startsWith("http") ? u.href : null;
  } catch {
    return null;
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

type RawResult = { href: string; title: string; snippet: string };

function parseHtmlResults(html: string): RawResult[] {
  const results: RawResult[] = [];
  const linkRe = /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const matches = [...html.matchAll(linkRe)];
  matches.forEach((m, i) => {
    const sliceEnd = i + 1 < matches.length ? matches[i + 1].index! : html.length;
    const chunk = html.slice(m.index!, sliceEnd);
    const snip = chunk.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/(a|div|span)>/);
    results.push({ href: m[1], title: decode(m[2]), snippet: decode(snip ? snip[1] : "") });
  });
  return results;
}

function parseLiteResults(html: string): RawResult[] {
  const results: RawResult[] = [];
  const linkRe = /<a[^>]*rel=["']nofollow["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/g;
  const matches = [...html.matchAll(linkRe)];
  matches.forEach((m, i) => {
    const sliceEnd = i + 1 < matches.length ? matches[i + 1].index! : html.length;
    const chunk = html.slice(m.index!, sliceEnd);
    const snip = chunk.match(/class=["']result-snippet["'][^>]*>([\s\S]*?)<\/td>/);
    results.push({ href: m[1], title: decode(m[2]), snippet: decode(snip ? snip[1] : "") });
  });
  return results;
}

export type SearchResult = { url: string; domain: string; title: string; snippet: string };

/** Throws with a `.throttled` flag on rate limiting (DDG answers HTTP 202). */
export async function searchWeb(query: string): Promise<SearchResult[]> {
  const q = encodeURIComponent(query.trim());
  let raw: RawResult[] = [];
  let lastErr: Error | null = null;
  try {
    raw = parseHtmlResults(await fetchUrl(`https://html.duckduckgo.com/html/?q=${q}`));
  } catch (err) {
    lastErr = err as Error;
  }
  if (raw.length < 3) {
    try {
      raw = parseLiteResults(await fetchUrl(`https://lite.duckduckgo.com/lite/?q=${q}`));
    } catch (err) {
      lastErr = err as Error;
    }
  }
  if (raw.length === 0 && lastErr) {
    const e = new Error(`search unreachable: ${lastErr.message}`) as Error & { throttled?: boolean };
    e.throttled = /202/.test(lastErr.message);
    throw e;
  }

  const seen = new Set<string>();
  const out: SearchResult[] = [];
  for (const r of raw) {
    const url = realUrl(r.href);
    if (!url || !r.title) continue;
    const domain = domainOf(url);
    if (!domain || domain.includes("duckduckgo.com")) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, domain, title: r.title, snippet: r.snippet });
  }
  return out;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export type MultiSearchResult = { query: string; ok: boolean; items: SearchResult[]; error?: string; throttled?: boolean };

/** Runs several searches sequentially with a delay to respect rate limits. */
export async function searchWebMulti(queries: string[], { delayMs = 3000 } = {}): Promise<MultiSearchResult[]> {
  const results: MultiSearchResult[] = [];
  for (let i = 0; i < queries.length; i++) {
    if (i > 0) await sleep(delayMs);
    try {
      results.push({ query: queries[i], ok: true, items: await searchWeb(queries[i]) });
    } catch (err) {
      const e = err as Error & { throttled?: boolean };
      results.push({ query: queries[i], ok: false, error: e.message, throttled: !!e.throttled, items: [] });
    }
  }
  return results;
}
