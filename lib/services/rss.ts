/**
 * Ported from electron/services/rss.cjs. The fetch/parse/categorize/score
 * logic is pure and portable as-is; only fetchUrl changed (global fetch
 * instead of Node's https/http — fetch follows redirects automatically, so
 * the manual redirect-following loop the Electron version needed is gone).
 * The DB write (dedupe + insert into news_items) is deliberately NOT here —
 * that lives in lib/db/queries/radar.ts, per the plan's note that the
 * original file mixed pure parsing with a direct SQLite write.
 */

export const DEFAULT_FEEDS = [
  "https://www.theverge.com/rss/index.xml",
  "https://techcrunch.com/category/artificial-intelligence/feed/",
  "https://venturebeat.com/category/ai/feed/",
  "https://arstechnica.com/ai/feed/",
  "https://www.cgchannel.com/feed/",
  "https://www.fxguide.com/feed/",
  "https://www.roadtovr.com/feed/",
  "https://blog.comfy.org/feed",
];

const CATEGORY_RULES: [string, RegExp][] = [
  ["AI Video", /\b(kling|runway|seedance|pika|sora|veo|higgsfield|luma|text-to-video|image-to-video|ai video|video model|video generation|video gen)\b/i],
  ["AI Image Generation", /\b(midjourney|nano banana|imagen|flux|stable diffusion|dall-e|ideogram|text-to-image|image model|image generation|image gen)\b/i],
  ["3D / CGI / VFX", /\b(blender|houdini|unreal|maya|cinema 4d|3d|cgi|vfx|render|nerf|gaussian splat|photogrammetry)\b/i],
  ["XR / AR / WebXR", /\b(webxr|quest|vision pro|augmented reality|virtual reality|mixed reality|\bar\b|\bvr\b|\bxr\b|spatial)\b/i],
  ["Brand Activations", /\b(activation|pop-up|experiential|installation)\b/i],
  ["Creative Campaigns", /\b(campaign|advert|commercial|brand film|super bowl)\b/i],
  ["Automation Tools", /\b(automation|agent|workflow|zapier|n8n|make\.com)\b/i],
  ["New Models", /\b(gpt|claude|gemini|llama|mistral|model release|new model|frontier model|benchmark)\b/i],
  ["Tools for Creators", /\b(comfyui|figma|adobe|premiere|after effects|davinci|capcut|creator|tool)\b/i],
];

const HOT_KEYWORDS = /\b(kling|veo|midjourney|higgsfield|runway|seedance|nano banana|comfyui|sora|flux|blender|unreal)\b/i;
const LAUNCH_WORDS = /\b(launch|release|ships|update|unveil|introduc|announc|beta|new version|upgrade)\b/i;

export const WHY_BY_CATEGORY: Record<string, string> = {
  "AI Video": "Directly relevant to AI-driven customer communication — assess against current workflows.",
  "AI Image Generation": "Could affect marketing/social content production — check brand fidelity.",
  "3D / CGI / VFX": "Lower priority unless it touches visual content production.",
  "XR / AR / WebXR": "Relevant for future interactive guest experiences.",
  "Creative Campaigns": "Market signal — useful as social proof or a reference in client conversations.",
  "Brand Activations": "Case material for marketing — capture any published numbers.",
  "Tools for Creators": "Possible workflow upgrade — worth a timeboxed test.",
  "New Models": "May change what's feasible for AI-driven ops — evaluate against current budget.",
  "Automation Tools": "Could remove manual steps from reservation/communication ops.",
};

export const ACTION_BY_CATEGORY: Record<string, string> = {
  "AI Video": "Run a quick side-by-side against the current pipeline on one asset.",
  "AI Image Generation": "Test with one brand-accurate asset before relying on it.",
  "3D / CGI / VFX": "Benchmark on an existing scene and note quality deltas.",
  "XR / AR / WebXR": "Check device/browser support and note for later.",
  "Creative Campaigns": "Save as a reference and consider a social take from Mytiv's angle.",
  "Brand Activations": "Extract the metrics for future reference.",
  "Tools for Creators": "Timebox a half-day trial and log findings.",
  "New Models": "Read the capability notes and flag anything actionable.",
  "Automation Tools": "Map it against one repetitive task and estimate time saved.",
};

export async function fetchUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "MytivOS/1.0 (internal radar reader)", accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

const pick = (xml: string, tag: string) => {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : "";
};

function clean(text: string) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n))
    .replace(/\s+/g, " ")
    .trim();
}

export type FeedItem = { source: string; title: string; url: string; summary: string; published_at: string };

export function parseFeed(xml: string, feedUrl: string): FeedItem[] {
  const feedTitle = clean(pick(xml.slice(0, 4000), "title")) || new URL(feedUrl).hostname.replace(/^www\./, "");
  const blocks = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/gi)].map((m) => m[0]);
  return blocks
    .map((b) => {
      let link = clean(pick(b, "link"));
      if (!link) {
        const alt = b.match(/<link[^>]*href="([^"]+)"/i);
        link = alt ? alt[1] : "";
      }
      const date = pick(b, "pubDate") || pick(b, "published") || pick(b, "updated") || pick(b, "dc:date");
      const parsed = new Date(clean(date));
      return {
        source: feedTitle,
        title: clean(pick(b, "title")),
        url: link,
        summary: clean(pick(b, "description") || pick(b, "summary") || pick(b, "content")).slice(0, 320),
        published_at: isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10),
      };
    })
    .filter((i) => i.title && i.url);
}

export function categorize(text: string): string | null {
  for (const [cat, re] of CATEGORY_RULES) {
    if (re.test(text)) return cat;
  }
  return null;
}

export function score(text: string, category: string | null): number {
  let s = 3;
  if (HOT_KEYWORDS.test(text)) s += 1;
  if (LAUNCH_WORDS.test(text) && ["AI Video", "AI Image Generation", "New Models", "Tools for Creators"].includes(category || "")) s += 1;
  return Math.min(5, s);
}

export function extractTags(text: string): string {
  const tags = new Set<string>();
  const all = text.match(new RegExp(HOT_KEYWORDS.source, "gi")) || [];
  all.forEach((t) => tags.add(t.toLowerCase().replace(/\s+/g, "-")));
  return [...tags].slice(0, 4).join(",");
}
