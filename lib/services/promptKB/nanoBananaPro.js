import { t, has, para, sentence, listLine, V4_LOOK } from './util.js';

/** Nano Banana Pro — Google image generation/editing (Gemini image family). */
export default {
  id: 'nano_banana_pro',
  name: 'Nano Banana Pro',
  kind: 'image',
  kbVersion: 'Pro · KB 2026-07',
  goodAt: ['Exact text + logo rendering (best in class)', 'Brand/packaging fidelity', 'Multi-reference blending (product + style + scene)', 'Conversational editing — "change X, keep everything else"', 'Character/product consistency across a series'],
  badAt: ['Extreme stylization (MJ is stronger)', 'Very tiny print text', 'Complex mirror/reflection logic'],
  syntax: [
    'Natural-language paragraphs — describe the scene like a director, not keyword soup.',
    'Exact text goes in quotes: the label reads "GLOW SERUM".',
    'Editing mode: give instructions relative to the attached image and state what must NOT change.',
    'Supports multiple reference images in one request — name the role of each.',
    'Aspect ratio + resolution are stated in the prompt or set in the tool (1:1 … 21:9, up to 4K).'
  ],
  bestPractices: [
    'One flowing description beats fragmented keywords.',
    'For packshots: attach the real product photo and instruct "preserve the exact bottle geometry, cap and label".',
    'State text accuracy explicitly and in quotes — this is the tool\'s superpower, use it.',
    'Iterate conversationally: fix one thing per follow-up instruction.'
  ],
  negativeHandling: 'No negative-prompt field. Phrase exclusions positively: instead of "no clutter", write "on a clean, empty surface". Direct "without X" phrasing also works inside the description.',
  imageRefs: 'Strongest reference handling of the image tools: attach product shot(s), style frame and scene reference together and assign each a role in the prompt.',
  videoRefs: 'N/A — image only. Its outputs make excellent start frames for Kling/Higgsfield/Veo.',
  aspectHandling: 'State it plainly: "Compose as a 4:5 portrait" (or set in UI). Recompose existing images by asking for an extension/crop.',
  durationHandling: 'N/A.',
  cameraSyntax: 'Photographic language in prose: lens, angle, distance, depth of field — e.g. "shot on a 100mm macro, f/2.8, slight top-down angle".',
  consistencyRules: 'Reuse the same reference images + repeat the locked attributes verbatim in every prompt of the series ("same bottle, same label, same lighting rig").',
  failureCases: [
    'Micro-text under ~10px equivalent still degrades.',
    'Over-long prompts with contradicting styles average out — keep one clear direction.',
    'Asking for "photorealistic" alone is weak — describe the actual photographic setup.'
  ],
  structure: 'Scene paragraph (subject → environment → light → camera → materials → mood) + exact-text quotes + reference roles + "keep unchanged" locks + aspect.',
  examples: [
    {
      label: 'Brand-accurate packshot',
      text: 'Using the attached product photo as the exact reference, create a premium beauty packshot: the same frosted-glass serum bottle standing on wet black slate, a single droplet rolling off the cap. Soft diffused key from the left, thin cool rim light from behind. Shot on a 100mm macro at f/4. The label must read "ATLAS — GLOW SERUM 30ml" exactly as in the reference, sharp and unwarped. Preserve the exact bottle geometry, cap and label placement. Compose as a 4:5 portrait. Ultra realistic, premium cinematic lighting, subtle film grain.'
    }
  ],

  build(fields, outputType) {
    const editing = has(fields.references) || has(fields.consistency);
    const opening = editing
      ? `Using the attached reference image${listLine(fields.references).includes(',') ? 's' : ''} (${has(fields.references) ? listLine(fields.references) : 'product photo'}) as the exact source of truth, create:`
      : 'Create:';

    const scene = para(
      fields.subject,
      has(fields.brand) ? `The product is ${t(fields.brand)}` : '',
      has(fields.environment) ? `Setting: ${t(fields.environment)}` : '',
      has(fields.lighting) ? `Lighting: ${t(fields.lighting)}` : '',
      has(fields.camera) || has(fields.lens) ? `Shot ${[t(fields.camera), has(fields.lens) ? `on a ${t(fields.lens)}` : ''].filter(Boolean).join(', ')}` : '',
      has(fields.materials) ? `Materials: ${t(fields.materials)}` : '',
      has(fields.palette) ? `Colour palette: ${t(fields.palette)}` : '',
      has(fields.style) ? t(fields.style) : '',
      has(fields.mood) ? `Mood: ${t(fields.mood)}` : ''
    );

    const locks = para(
      has(fields.textAccuracy) ? `Text accuracy is critical: ${t(fields.textAccuracy)} Render all product text exactly, sharp and never mirrored` : '',
      has(fields.consistency) ? `Preserve unchanged: ${t(fields.consistency)}` : '',
      has(fields.avoid) ? `Keep the frame free of: ${listLine(fields.avoid)}` : '',
      has(fields.aspect) ? `Compose as a ${t(fields.aspect)} frame` : '',
      V4_LOOK
    );

    const framing = outputType === 'first_frame'
      ? 'This image is the START FRAME of a video — compose with headroom for the planned motion and keep the subject in its resting position.'
      : outputType === 'last_frame'
        ? 'This image is the END FRAME of a video — compose the final resolved state of the motion.'
        : '';

    const out = [{
      id: 'prompt',
      label: outputType === 'first_frame' ? 'First-frame prompt' : outputType === 'last_frame' ? 'Last-frame prompt' : 'Nano Banana Pro prompt',
      text: [opening, scene, locks, sentence(framing)].filter(Boolean).join('\n\n')
    }];

    if (outputType === 'negative') {
      return [{
        id: 'negative', label: 'Exclusions (positive phrasing)',
        text: para(
          'Nano Banana Pro has no negative prompt — convert exclusions to positive statements:',
          has(fields.avoid) ? `Keep the frame free of ${listLine(fields.avoid)}` : 'Keep the frame clean and uncluttered',
          'The scene contains only the elements described above'
        )
      }];
    }

    if (['video', 'image_to_video', 'full_package'].includes(outputType)) {
      out.push({
        id: 'handoff', label: 'Video handoff',
        text: 'Nano Banana Pro is image-only. Use this output as the start frame in Kling / Higgsfield / Veo — switch the target tool to generate the matching motion prompt.'
      });
    }
    if (has(fields.notes)) out.push({ id: 'notes', label: 'Notes to self', text: t(fields.notes) });
    return out;
  }
};
