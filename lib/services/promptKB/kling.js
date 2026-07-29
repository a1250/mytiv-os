import { t, has, para, listLine, cleanAvoid, V4_LOOK } from './util.js';

/** Kling — video generation (text-to-video + image-to-video, start/end frames). */
export default {
  id: 'kling',
  name: 'Kling',
  kind: 'video',
  kbVersion: '2.x · KB 2026-07',
  goodAt: ['Image-to-video with strong start-frame fidelity', 'Start + end frame interpolation', 'Physically plausible product motion', 'Dedicated negative-prompt field', 'Liquid / particle beauty shots'],
  badAt: ['Long multi-scene narratives (one action per clip)', 'On-screen text stability', 'Very fast complex choreography'],
  syntax: [
    'Structure: subject → subject detail → motion → scene → camera → lighting/atmosphere.',
    'Separate NEGATIVE PROMPT field — use it, do not write negatives in the main prompt.',
    'Durations: 5s or 10s. Aspect: 16:9 / 9:16 / 1:1.',
    'Image-to-video: the start frame carries composition; the prompt describes ONLY what moves.',
    'Creativity/CFG slider: lower = obeys prompt + preserves product; higher = invents.'
  ],
  bestPractices: [
    'One clear action per clip. Two at most.',
    'Explicitly separate camera motion from subject motion — Kling follows this well.',
    'For product work say what stays STILL as clearly as what moves.',
    'Use start+end frames for reveals and transformations — prompt then only describes the path between them.'
  ],
  negativeHandling: 'Native negative field. Standard studio list: blur, distortion, morphing, warped logo, extra objects, flicker, low quality — plus shot-specific items.',
  imageRefs: 'Start frame (image-to-video) is the primary workflow; end frame optional for interpolated moves. Elements/face reference features exist for characters.',
  videoRefs: 'Motion brush / trajectory tools in the UI control regional motion — note it in the prompt plan when precision matters.',
  aspectHandling: 'Set in UI (16:9, 9:16, 1:1). With a start frame, the frame\'s ratio wins — generate the still in the target ratio.',
  durationHandling: '5s or 10s. Pacing note in-prompt helps: "slow, continuous motion across the full clip".',
  cameraSyntax: 'Natural language: "slow dolly in", "orbit right 90 degrees", "locked camera, no camera movement". Also dedicated camera controls in UI.',
  consistencyRules: 'Start frame = single source of truth. Add "the product geometry and label remain exactly as in the start frame, zero warping".',
  failureCases: [
    'Multiple simultaneous actions → motion soup.',
    'High creativity values melt product geometry.',
    'Text in frame degrades over the clip — keep type off AI video or add in post.'
  ],
  structure: 'PROMPT (subject, motion, scene, light) + CAMERA + NEGATIVE + SETTINGS (duration/aspect/creativity).',
  examples: [
    {
      label: 'Product reveal (image-to-video)',
      text: 'PROMPT: The serum bottle from the start frame stands perfectly still. A warm beam of light sweeps slowly from left to right across it, micro dust particles drift in the beam. At the end the full soft key light comes up. The bottle does not move.\nCAMERA: Locked camera, no camera movement.\nNEGATIVE: morphing, warping, label distortion, extra objects, flicker, blur\nSETTINGS: 5s · 16:9 · low creativity'
    }
  ],

  build(fields, outputType) {
    if (outputType === 'first_frame' || outputType === 'last_frame') {
      const which = outputType === 'first_frame' ? 'start' : 'end';
      return [{
        id: 'frame', label: `${which === 'start' ? 'Start' : 'End'}-frame plan (generate the still elsewhere)`,
        text: para(
          `Kling consumes ${which} frames — generate the still in Nano Banana Pro or Midjourney at ${has(fields.aspect) ? t(fields.aspect) : 'the target ratio'}`,
          `Frame content: ${t(fields.subject)}`,
          which === 'start' ? 'Compose the resting state before the motion begins' : `Compose the resolved end state${has(fields.action) ? ` after: ${t(fields.action)}` : ''}`,
          'Switch the target tool to generate that image prompt, then return here for the motion prompt'
        )
      }];
    }

    const isI2V = outputType === 'image_to_video' || (outputType === 'full_package' && has(fields.references));
    const motion = para(
      isI2V ? `The subject from the start frame: ${t(fields.subject)}` : t(fields.subject),
      has(fields.action) ? `Motion: ${t(fields.action)}` : 'Motion: subtle, continuous ambient movement only',
      has(fields.consistency) ? `What stays still/unchanged: ${t(fields.consistency)}` : 'The product stays perfectly still and unchanged',
      !isI2V && has(fields.environment) ? `Scene: ${t(fields.environment)}` : '',
      has(fields.lighting) ? `Lighting: ${t(fields.lighting)}` : '',
      has(fields.style) || has(fields.mood) ? `${[t(fields.style), t(fields.mood)].filter(Boolean).join(', ')}` : '',
      V4_LOOK
    );

    const camera = /none|locked|static/i.test(t(fields.movement)) || !has(fields.movement)
      ? 'Locked camera, no camera movement. Only the subject and light move.'
      : `${t(fields.movement)}. Camera motion is separate from subject motion — keep both clean and deliberate.`;

    const negative = ['morphing', 'warping', 'label distortion', 'extra objects', 'flicker', 'blur', cleanAvoid(fields.avoid)]
      .filter(Boolean).join(', ');

    const out = [];
    if (outputType !== 'negative') {
      out.push({ id: 'prompt', label: isI2V ? 'Kling prompt (image-to-video)' : 'Kling prompt (text-to-video)', text: motion });
      out.push({ id: 'camera', label: 'Camera', text: camera });
    }
    out.push({ id: 'negative', label: 'Negative prompt (paste into Kling\'s negative field)', text: negative });
    if (outputType !== 'negative') {
      out.push({
        id: 'settings', label: 'Settings',
        text: [
          `Duration: ${/10/.test(t(fields.duration)) ? '10s' : '5s'}`,
          `Aspect: ${has(fields.aspect) ? t(fields.aspect) : '16:9'}${isI2V ? ' (start frame ratio wins — generate the still in this ratio)' : ''}`,
          'Creativity: LOW for product accuracy, mid only for atmosphere-driven shots',
          isI2V ? `Start frame: ${has(fields.references) ? listLine(fields.references) : 'your approved still'}` : ''
        ].filter(Boolean).join('\n')
      });
      if (has(fields.textAccuracy)) {
        out.push({ id: 'warn', label: '⚠ Text in frame', text: 'On-screen text degrades over Kling clips. Keep label text protected via the start frame + "zero warping" instruction, and add any typography in post.' });
      }
    }
    if (has(fields.notes)) out.push({ id: 'notes', label: 'Notes to self', text: t(fields.notes) });
    return out;
  }
};
