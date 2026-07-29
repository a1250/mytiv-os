/**
 * Light port of electron/services/urlMeta.cjs's metadata half — used by
 * leadDiscovery to enrich brand candidates with title/description. The
 * image-download half doesn't apply here (leadDiscovery always skips
 * images); the Inspiration Board's own upload flow (lib/blob.ts) covers
 * image needs elsewhere.
 */
import { fetchUrl } from "./rss";

const meta = (html: string, prop: string) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i");
  const reRev = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
  const m = html.match(re) || html.match(reRev);
  return m ? m[1].trim() : "";
};

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));

export async function fetchUrlMeta(url: string): Promise<{ title: string; description: string; source: string }> {
  if (!/^https?:\/\//i.test(url)) throw new Error("not an http(s) URL");
  const html = (await fetchUrl(url)).slice(0, 300000);

  const title = decode(meta(html, "og:title") || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ""])[1].trim());
  const description = decode(meta(html, "og:description") || meta(html, "description"));
  const source = decode(meta(html, "og:site_name")) || new URL(url).hostname.replace(/^www\./, "");

  return { title, description: description.slice(0, 400), source };
}
