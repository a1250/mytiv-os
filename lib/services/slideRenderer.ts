/**
 * Ported from the Electron app's src/services/slideRenderer.js — the Canvas
 * drawing logic is browser-standard (no Electron dependency) and is
 * untouched. The one touchpoint the plan flagged: loadSlideImage() used to
 * go through api.visual.readImage (an fs→base64 bridge); slides now store a
 * plain Vercel Blob URL directly, so this just loads that URL as an <img>.
 */
import { ASPECTS } from "./carouselEngine";

const BLUE = "#2563EB";
const CHARTREUSE = "#6366F1";
const WHITE = "#F5F6F4";

const GRADIENTS: Record<string, [string, number][]> = {
  gradient_blue: [
    ["#0a1626", 0],
    ["#13254a", 0.55],
    ["#1e40af", 1],
  ],
  gradient_black: [
    ["#000000", 0],
    ["#0a0f16", 0.6],
    ["#122135", 1],
  ],
  gradient_chartreuse: [
    ["#0d0e24", 0],
    ["#171a3d", 0.65],
    ["#312e81", 1],
  ],
};

export type SlideData = {
  headline: string;
  body_text: string;
  label: string;
  cta: string;
  text_position: string;
  background_style: string;
  source_credit: string;
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = probe;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawSlide(
  canvas: HTMLCanvasElement,
  slide: SlideData,
  { aspect = "4:5", slideIndex = 1, slideTotal = 4, showCredit = true } = {},
  bgImage: HTMLImageElement | null = null
) {
  const { w: W, h: H } = ASPECTS[aspect] || ASPECTS["4:5"];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const M = Math.round(W * 0.083);

  if (bgImage) {
    const scale = Math.max(W / bgImage.width, H / bgImage.height);
    const dw = bgImage.width * scale,
      dh = bgImage.height * scale;
    ctx.drawImage(bgImage, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, "rgba(0,0,0,0.30)");
    shade.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
  } else {
    const stops = GRADIENTS[slide.background_style] || GRADIENTS.gradient_blue;
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    stops.forEach(([c, p]) => g.addColorStop(p, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, W * 0.7);
    glow.addColorStop(0, "rgba(37,99,235,0.20)");
    glow.addColorStop(1, "rgba(37,99,235,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = CHARTREUSE;
  ctx.fillRect(M, M, Math.round(W * 0.055), 6);

  const pos = slide.text_position || "bottom_left";
  const centerAlign = (pos.includes("center") && !pos.includes("bottom_")) || pos === "center";
  const maxW = W - M * 2;
  const headlineSize = Math.round(W * (String(slide.headline || "").length > 40 ? 0.062 : 0.078));
  const bodySize = Math.round(W * 0.034);
  const labelSize = Math.round(W * 0.023);

  ctx.textBaseline = "alphabetic";
  ctx.font = `800 ${headlineSize}px 'Bricolage Grotesque', 'Heebo', sans-serif`;
  const headLines = wrap(ctx, slide.headline, maxW);
  ctx.font = `400 ${bodySize}px 'Hanken Grotesk', 'Heebo', sans-serif`;
  const bodyLines = wrap(ctx, slide.body_text, maxW * 0.92);
  const headLH = headlineSize * 1.12,
    bodyLH = bodySize * 1.5;
  const blockH =
    (slide.label ? labelSize + Math.round(W * 0.03) : 0) +
    headLines.length * headLH +
    (bodyLines.length ? Math.round(W * 0.035) + bodyLines.length * bodyLH : 0) +
    (slide.cta ? Math.round(W * 0.05) + bodySize * 1.3 : 0);

  let y: number;
  if (pos.startsWith("top")) y = M + Math.round(W * 0.075);
  else if (pos === "center") y = (H - blockH) / 2 + labelSize;
  else y = H - M - blockH - Math.round(H * 0.055);

  const x = centerAlign ? W / 2 : M;
  ctx.textAlign = centerAlign ? "center" : "left";

  if (slide.label) {
    ctx.font = `700 ${labelSize}px 'Hanken Grotesk', 'Heebo', sans-serif`;
    ctx.fillStyle = CHARTREUSE;
    const spaced = String(slide.label).toUpperCase().split("").join("  ");
    ctx.fillText(spaced, x, y);
    y += labelSize + Math.round(W * 0.03);
  }

  ctx.font = `800 ${headlineSize}px 'Bricolage Grotesque', 'Heebo', sans-serif`;
  ctx.fillStyle = WHITE;
  for (const line of headLines) {
    y += headLH;
    ctx.fillText(line, x, y - headLH * 0.2);
  }

  if (bodyLines.length) {
    y += Math.round(W * 0.035);
    ctx.font = `400 ${bodySize}px 'Hanken Grotesk', 'Heebo', sans-serif`;
    ctx.fillStyle = "rgba(245,246,244,0.86)";
    for (const line of bodyLines) {
      y += bodyLH;
      ctx.fillText(line, x, y - bodyLH * 0.3);
    }
  }

  if (slide.cta) {
    y += Math.round(W * 0.05);
    ctx.font = `700 ${Math.round(bodySize * 0.95)}px 'Hanken Grotesk', 'Heebo', sans-serif`;
    ctx.fillStyle = BLUE;
    ctx.fillText(slide.cta, x, y);
  }

  const footY = H - Math.round(M * 0.72);
  ctx.textAlign = "left";
  ctx.font = `800 ${Math.round(W * 0.026)}px 'Bricolage Grotesque', 'Heebo', sans-serif`;
  ctx.fillStyle = WHITE;
  ctx.fillText("Mytiv", M, footY);

  ctx.textAlign = "right";
  ctx.font = `600 ${Math.round(W * 0.022)}px 'Hanken Grotesk', sans-serif`;
  ctx.fillStyle = "rgba(245,246,244,0.55)";
  ctx.fillText(`${slideIndex} / ${slideTotal}`, W - M, footY);

  if (showCredit && slide.source_credit) {
    ctx.textAlign = centerAlign ? "center" : "left";
    ctx.font = `400 ${Math.round(W * 0.017)}px 'Hanken Grotesk', sans-serif`;
    ctx.fillStyle = "rgba(245,246,244,0.4)";
    ctx.fillText(slide.source_credit, centerAlign ? W / 2 : M, footY - Math.round(W * 0.035));
  }
}

/** Loads a slide's attached image (imported or generated) as an <img>, or null. */
export async function loadSlideImage(imageUrl: string | null | undefined, backgroundStyle: string): Promise<HTMLImageElement | null> {
  if (!imageUrl || backgroundStyle !== "image") return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

export const exportFilename = (title: string, i: number) =>
  `mytiv-carousel-${String(title || "post")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)}-slide-${String(i).padStart(2, "0")}.png`;
