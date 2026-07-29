import { and, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { carouselProjects, carouselSlides } from "../schema";
import { deleteAsset } from "../../blob";
import { buildCarouselConcept } from "../../services/carouselEngine";

export async function listCarousels(businessId: string) {
  const rows = await db
    .select({
      id: carouselProjects.id,
      title: carouselProjects.title,
      platform: carouselProjects.platform,
      status: carouselProjects.status,
      slideCount: carouselProjects.slideCount,
      updatedAt: carouselProjects.updatedAt,
      actualSlides: sql<number>`count(${carouselSlides.id})`.as("actual_slides"),
    })
    .from(carouselProjects)
    .leftJoin(carouselSlides, eq(carouselSlides.carouselId, carouselProjects.id))
    .where(eq(carouselProjects.businessId, businessId))
    .groupBy(carouselProjects.id);
  return rows;
}

export async function getCarousel(businessId: string, id: string) {
  const [project] = await db
    .select()
    .from(carouselProjects)
    .where(and(eq(carouselProjects.businessId, businessId), eq(carouselProjects.id, id)))
    .limit(1);
  if (!project) return null;
  const slides = await db
    .select()
    .from(carouselSlides)
    .where(eq(carouselSlides.carouselId, id))
    .orderBy(carouselSlides.slideNumber);
  return { project, slides };
}

/** Generates the full concept deterministically (buildCarouselConcept) and persists project + slides in one call. */
export async function createCarousel(
  businessId: string,
  data: {
    title: string;
    sourceType: string;
    sourcePayload: Record<string, string>;
    platform?: string;
    aspectRatio?: string;
    slideCount?: number;
    tone?: string;
    audience?: string;
  }
) {
  const concept = buildCarouselConcept({
    sourceType: data.sourceType,
    payload: data.sourcePayload,
    slideCount: data.slideCount ?? 4,
    tone: data.tone ?? "editorial",
    audience: data.audience ?? "",
    aspect: data.aspectRatio ?? "4:5",
  });

  const [project] = await db
    .insert(carouselProjects)
    .values({
      businessId,
      title: data.title,
      sourceType: data.sourceType,
      sourcePayload: data.sourcePayload,
      platform: data.platform ?? "instagram",
      aspectRatio: data.aspectRatio ?? "4:5",
      slideCount: concept.slides.length,
      tone: data.tone ?? "editorial",
      audience: data.audience ?? "",
      status: "draft",
      captionInstagram: concept.captions.instagram,
      captionLinkedin: concept.captions.linkedin,
      captionShort: concept.captions.short,
      captionProfessional: concept.captions.professional,
      hashtags: concept.hashtags,
    })
    .returning();

  const slideRows = concept.slides.map((s) => ({
    businessId,
    carouselId: project.id,
    slideNumber: s.slide_number,
    slideRole: s.slide_role,
    headline: s.headline,
    bodyText: s.body_text,
    label: s.label,
    cta: s.cta,
    visualDirection: s.visual_direction,
    imagePrompt: s.image_prompt,
    negativePrompt: s.negative_prompt,
    layoutStyle: s.layout_style,
    textPosition: s.text_position,
    backgroundStyle: s.background_style,
    sourceCredit: s.source_credit,
  }));
  await db.insert(carouselSlides).values(slideRows);

  return getCarousel(businessId, project.id);
}

export async function updateCarousel(businessId: string, id: string, patch: Record<string, unknown>) {
  const [project] = await db
    .update(carouselProjects)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(carouselProjects.businessId, businessId), eq(carouselProjects.id, id)))
    .returning();
  return project;
}

export async function updateSlide(businessId: string, slideId: string, patch: Record<string, unknown>) {
  const [slide] = await db
    .update(carouselSlides)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(carouselSlides.businessId, businessId), eq(carouselSlides.id, slideId)))
    .returning();
  if (slide) {
    await db.update(carouselProjects).set({ updatedAt: new Date() }).where(eq(carouselProjects.id, slide.carouselId));
  }
  return slide;
}

export async function removeCarousel(businessId: string, id: string) {
  const [owned] = await db
    .select({ id: carouselProjects.id })
    .from(carouselProjects)
    .where(and(eq(carouselProjects.businessId, businessId), eq(carouselProjects.id, id)))
    .limit(1);
  if (!owned) return;

  const slides = await db.select().from(carouselSlides).where(eq(carouselSlides.carouselId, id));
  for (const s of slides) {
    if (s.generatedImageUrl) await deleteAsset(s.generatedImageUrl);
    if (s.importedImageUrl) await deleteAsset(s.importedImageUrl);
  }
  await db.delete(carouselSlides).where(eq(carouselSlides.carouselId, id));
  await db.delete(carouselProjects).where(eq(carouselProjects.id, id));
}
