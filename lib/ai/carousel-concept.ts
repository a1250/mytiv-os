/**
 * Optional Claude pass over a deterministic carousel concept. Runs server-side
 * because the concept is generated and persisted in one request.
 *
 * The deterministic concept decides the structure — slide count, roles, and
 * their order. Claude only rewrites the copy inside that structure, and a slide
 * keeps its deterministic text for any field Claude returns empty or malformed.
 */
import { complete } from "@/lib/ai/claude";
import type { buildCarouselConcept } from "@/lib/services/carouselEngine";

type Concept = ReturnType<typeof buildCarouselConcept> & { source?: string };

export async function enrichCarouselConcept(
  businessId: string,
  concept: Concept,
  opts: {
    system: string;
    brandName: string;
    accentColor: string;
    topic: string;
    summary?: string;
    platform: string;
    tone: string;
    audience?: string;
  }
): Promise<{ concept: Concept; aiError: string | null }> {
  const roles = concept.slides.map((s) => s.slide_role).join(", ");

  const result = await complete(businessId, {
    system: opts.system,
    maxTokens: 2400,
    json: true,
    prompt: [
      `Create a ${concept.slides.length}-slide ${opts.platform} carousel for ${opts.brandName} about:`,
      `Topic: ${opts.topic}`,
      opts.summary ? `Summary: ${opts.summary}` : "",
      `Tone: ${opts.tone}.${opts.audience ? ` Audience: ${opts.audience}.` : ""}`,
      `Slide roles in order: ${roles}.`,
      `Rules: editorial and premium, no hype, no invented facts, headlines max 8 words, body max 30 words.`,
      `Image prompts must describe TEXT-FREE background visuals leaving negative space for overlay text, using ${opts.accentColor} only as a small accent.`,
      `Return JSON: {"slides":[{"headline":"","body_text":"","label":"","cta":"","visual_direction":"","image_prompt":""}] (exactly ${concept.slides.length}, same role order),`,
      `"captions":{"instagram":"","linkedin":"","short":"","professional":""},"hashtags":"#... (max 8)"}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (!result.ok) return { concept, aiError: result.error };

  try {
    const parsed = JSON.parse(result.text);

    // A slide count mismatch means the roles no longer line up — discarding the
    // whole response is safer than pairing copy to the wrong slide role.
    if (!Array.isArray(parsed.slides) || parsed.slides.length !== concept.slides.length) {
      return { concept, aiError: "Claude returned the wrong number of slides." };
    }

    const str = (v: unknown, min = 1) => (typeof v === "string" && v.trim().length >= min ? v.trim() : null);

    concept.slides = concept.slides.map((slide, i) => {
      const c = parsed.slides[i] ?? {};
      return {
        ...slide,
        headline: str(c.headline) ?? slide.headline,
        body_text: str(c.body_text) ?? slide.body_text,
        label: str(c.label) ?? slide.label,
        cta: str(c.cta) ?? slide.cta,
        visual_direction: str(c.visual_direction) ?? slide.visual_direction,
        // An image prompt too short to describe a scene is worse than the
        // deterministic one, which at least carries the brand direction.
        image_prompt: str(c.image_prompt, 40) ?? slide.image_prompt,
      };
    });

    for (const key of ["instagram", "linkedin", "short", "professional"] as const) {
      const caption = str(parsed.captions?.[key], 20);
      if (caption) concept.captions[key] = caption;
    }
    if (typeof parsed.hashtags === "string" && parsed.hashtags.includes("#")) {
      concept.hashtags = parsed.hashtags;
    }

    concept.source = "claude";
    return { concept, aiError: null };
  } catch {
    return { concept, aiError: "Claude returned text that was not valid JSON." };
  }
}
