import { t, has, para, listLine, cleanAvoid, V4_LOOK } from './util.js';

/** Generic profile — structured universal prompt for unlisted tools. */
export default {
  id: 'generic',
  name: 'Generic AI Tool',
  kind: 'both',
  kbVersion: 'KB 2026-07',
  goodAt: ['A clean structured starting point for any new tool'],
  badAt: ['Tool-specific parameters — add a dedicated profile when a tool becomes a regular'],
  syntax: ['Labeled blocks: SUBJECT / SCENE / CAMERA / LIGHT / STYLE / MOTION / AVOID — most tools parse this fine.'],
  bestPractices: [
    'Start from this structure, then learn the tool\'s quirks and promote it to its own KB profile.',
    'Keep subject motion and camera motion in separate lines — the single most transferable rule.'
  ],
  negativeHandling: 'Included as an AVOID block; move it to a dedicated field if the tool has one.',
  imageRefs: 'Note references explicitly; attach them however the tool supports.',
  videoRefs: 'Same.',
  aspectHandling: 'Stated in the settings block.',
  durationHandling: 'Stated in the settings block.',
  cameraSyntax: 'Standard film grammar.',
  consistencyRules: 'Repeat locked attributes verbatim between generations.',
  failureCases: ['Unknown — log findings in test notes and graduate the tool to its own profile.'],
  structure: 'Labeled blocks, one concern per line.',
  examples: [],

  build(fields, outputType) {
    const lines = [];
    const push = (label, v) => { if (has(v)) lines.push(`${label}: ${t(v)}`); };
    push('SUBJECT', fields.subject);
    push('BRAND/PRODUCT', fields.brand);
    push('SCENE', fields.environment);
    push('ACTION / MOTION', fields.action);
    push('CAMERA', [t(fields.camera), t(fields.lens)].filter(Boolean).join(', '));
    push('CAMERA MOVEMENT', has(fields.movement) ? fields.movement : 'locked camera, no movement');
    push('LIGHTING', fields.lighting);
    push('STYLE / MOOD', [t(fields.style), t(fields.mood)].filter(Boolean).join(' · '));
    push('MATERIALS', fields.materials);
    push('PALETTE', fields.palette);
    push('REFERENCES', fields.references);
    push('KEEP CONSISTENT', fields.consistency);
    push('TEXT ACCURACY', fields.textAccuracy);
    lines.push(`QUALITY BAR: ${V4_LOOK}`);
    if (has(fields.avoid)) lines.push(`AVOID: ${cleanAvoid(fields.avoid)}`);

    const settings = [
      has(fields.aspect) ? `Aspect: ${t(fields.aspect)}` : '',
      has(fields.duration) ? `Duration: ${t(fields.duration)}` : ''
    ].filter(Boolean).join(' · ');

    const out = [{ id: 'prompt', label: 'Structured prompt', text: lines.join('\n') }];
    if (settings) out.push({ id: 'settings', label: 'Settings', text: settings });
    if (outputType === 'negative') {
      return [{ id: 'negative', label: 'Avoid list', text: cleanAvoid(fields.avoid) || 'blur, distortion, watermark, extra objects, morphing' }];
    }
    if (has(fields.notes)) out.push({ id: 'notes', label: 'Notes to self', text: t(fields.notes) });
    return out;
  }
};
