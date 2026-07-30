"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import JSZip from "jszip";
import { useApi, useT } from "@/components/studio-provider";
import { drawSlide, loadSlideImage, exportFilename, type SlideData } from "@/lib/services/slideRenderer";
import { ASPECTS } from "@/lib/services/carouselEngine";

type Slide = SlideData & { id: string; slideNumber: number; slideRole: string; generatedImageUrl: string | null; importedImageUrl: string | null };
type Project = { id: string; title: string; aspectRatio: string; captionInstagram: string; captionLinkedin: string; hashtags: string };

export default function CarouselEditorPage() {
  const api = useApi();
  const t = useT();
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function load() {
    const data = (await api.carousel.get(params.id)) as { project: Project; slides: Slide[] };
    setProject(data.project);
    setSlides(data.slides);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  const activeSlide = slides?.[activeIdx];
  const [generating, setGenerating] = useState(false);
  const [imageNote, setImageNote] = useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSlide || !project || !canvasRef.current) return;
    loadSlideImage(activeSlide.generatedImageUrl || activeSlide.importedImageUrl, activeSlide.background_style).then((img) => {
      if (canvasRef.current) {
        drawSlide(canvasRef.current, activeSlide, { aspect: project.aspectRatio, slideIndex: activeIdx + 1, slideTotal: slides!.length }, img);
      }
    });
  }, [activeSlide, project, activeIdx, slides]);

  async function handleFieldChange(field: keyof SlideData, value: string) {
    if (!activeSlide || !slides) return;
    const updated = { ...activeSlide, [field]: value };
    setSlides(slides.map((s, i) => (i === activeIdx ? updated : s)));
    await api.carousel.updateSlide(activeSlide.id, { [toColumnName(field)]: value });
  }

  function toColumnName(field: keyof SlideData) {
    return field === "body_text" ? "bodyText" : field === "text_position" ? "textPosition" : field === "background_style" ? "backgroundStyle" : field;
  }

  async function handleExportZip() {
    if (!slides || !project) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      const { w, h } = ASPECTS[project.aspectRatio] || ASPECTS["4:5"];
      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const img = await loadSlideImage(slide.generatedImageUrl || slide.importedImageUrl, slide.background_style);
        drawSlide(offscreen, slide, { aspect: project.aspectRatio, slideIndex: i + 1, slideTotal: slides.length }, img);
        const blob: Blob = await new Promise((resolve) => offscreen.toBlob((b) => resolve(b!), "image/png"));
        zip.file(exportFilename(project.title, i + 1), blob);
      }

      zip.file("caption-instagram.txt", project.captionInstagram);
      zip.file("caption-linkedin.txt", project.captionLinkedin);
      zip.file("hashtags.txt", project.hashtags);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      await api.carousel.update(project.id, { status: "exported" });
    } finally {
      setExporting(false);
    }
  }

  async function handleGenerateImage() {
    if (!activeSlide) return;
    setGenerating(true);
    setImageNote(null);
    try {
      // pendingRequestId resumes a generation whose earlier poll ran out of
      // time — re-submitting instead would spend a second set of credits.
      const res = (await api.visual.generateSlide(
        activeSlide.id,
        pendingRequestId ? { requestId: pendingRequestId } : {}
      )) as { ok: boolean; url?: string; error?: string; pending?: boolean; requestId?: string };

      if (res.ok && res.url) {
        setPendingRequestId(null);
        setSlides((prev) => prev?.map((s) => (s.id === activeSlide.id ? { ...s, generatedImageUrl: res.url! } : s)) ?? prev);
        setImageNote(null);
      } else if (res.pending && res.requestId) {
        setPendingRequestId(res.requestId);
        setImageNote(`${res.error} ${t("Press again to check.")}`);
      } else {
        setImageNote(res.error ?? t("Generation failed."));
      }
    } catch (err) {
      setImageNote(err instanceof Error ? err.message : t("Generation failed."));
    }
    setGenerating(false);
  }

  if (!project || !slides || !activeSlide) return <div className="page">{t("Loading…")}</div>;

  return (
    <div className="page">
      <h1>{project.title}</h1>

      <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
        <div>
          <canvas ref={canvasRef} style={{ width: 320, borderRadius: 12, border: "1px solid var(--border)" }} />
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {slides.map((s, i) => (
              <button key={s.id} className={i === activeIdx ? "" : "secondary"} onClick={() => setActiveIdx(i)}>
                {i + 1}
              </button>
            ))}
          </div>
          <button onClick={handleGenerateImage} disabled={generating} className="secondary" style={{ marginTop: 14, width: "100%" }}>
            {generating ? t("Generating…") : t("Generate background")}
          </button>
          {imageNote && <p className="empty">{imageNote}</p>}
          <button onClick={handleExportZip} disabled={exporting} style={{ marginTop: 8, width: "100%" }}>
            {exporting ? t("Exporting…") : t("Export ZIP")}
          </button>
        </div>

        <div className="settings-form" style={{ flex: 1 }}>
          <div className="settings-field">
            <label>{t("Headline")}</label>
            <input value={activeSlide.headline} onChange={(e) => handleFieldChange("headline", e.target.value)} />
          </div>
          <div className="settings-field">
            <label>{t("Body")}</label>
            <textarea
              value={activeSlide.body_text}
              onChange={(e) => handleFieldChange("body_text", e.target.value)}
              rows={4}
              style={{ width: "100%", background: "var(--panel)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}
            />
          </div>
          <div className="settings-field">
            <label>{t("Label")}</label>
            <input value={activeSlide.label} onChange={(e) => handleFieldChange("label", e.target.value)} />
          </div>
          {activeSlide.cta !== undefined && (
            <div className="settings-field">
              <label>{t("CTA")}</label>
              <input value={activeSlide.cta} onChange={(e) => handleFieldChange("cta", e.target.value)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
