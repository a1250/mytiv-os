/**
 * Prompt engine — routes prompt generation to the tool-specific knowledge
 * profiles in ./promptKB/. Each tool has its own syntax rules and build logic;
 * nothing here produces a "generic prompt for all tools".
 *
 * To add a new tool: create src/services/promptKB/<tool>.js exporting the same
 * profile shape, then register it in PROFILES below. To update syntax for an
 * existing tool, edit its KB file and bump kbVersion.
 */
import midjourney from './promptKB/midjourney.js';
import nanoBananaPro from './promptKB/nanoBananaPro.js';
import kling from './promptKB/kling.js';
import seedance from './promptKB/seedance.js';
import higgsfield from './promptKB/higgsfield.js';
import veo from './promptKB/veo.js';
import generic from './promptKB/generic.js';

export const PROFILES = [nanoBananaPro, midjourney, kling, seedance, higgsfield, veo, generic];

export const getProfile = (id) => PROFILES.find((p) => p.id === id) || generic;

export const PROJECT_TYPES = [
  'Product image', 'Product video', 'Cosmetics campaign', 'Car commercial',
  'AI fashion editorial', '3D logo animation', 'Music video scene',
  'Typography animation', 'Social media ad', 'Lifestyle scene',
  'CGI / VFX shot', 'XR / interactive concept', 'Other'
];

export const OUTPUT_TYPES = [
  { id: 'image', label: 'Image prompt' },
  { id: 'video', label: 'Video prompt' },
  { id: 'first_frame', label: 'First-frame prompt' },
  { id: 'last_frame', label: 'Last-frame prompt' },
  { id: 'image_to_video', label: 'Image-to-video' },
  { id: 'text_to_video', label: 'Text-to-video' },
  { id: 'negative', label: 'Negative prompt' },
  { id: 'full_package', label: 'Full package' }
];

// Field definitions drive the builder form. Grouped for a calm UI.
export const FIELD_GROUPS = [
  {
    label: 'Core', fields: [
      { id: 'subject', label: 'Main subject', textarea: true, placeholder: 'What is in the frame — be concrete' },
      { id: 'brand', label: 'Brand / product name', placeholder: 'e.g. Atlas Glow Serum' },
      { id: 'action', label: 'Action / motion', textarea: true, placeholder: 'What moves, and how (video) / implied energy (image)' }
    ]
  },
  {
    label: 'Look', fields: [
      { id: 'style', label: 'Visual style', placeholder: 'e.g. premium beauty editorial, anamorphic commercial' },
      { id: 'mood', label: 'Mood', placeholder: 'e.g. serene, kinetic, expensive' },
      { id: 'lighting', label: 'Lighting', placeholder: 'source, direction, quality' },
      { id: 'palette', label: 'Color palette', placeholder: 'e.g. champagne gold, deep amber' },
      { id: 'materials', label: 'Materials / textures', placeholder: 'e.g. frosted glass, brushed metal' }
    ]
  },
  {
    label: 'Camera', fields: [
      { id: 'camera', label: 'Camera angle / framing', placeholder: 'e.g. low-angle hero, macro top-down' },
      { id: 'lens', label: 'Lens', placeholder: 'e.g. 100mm macro, 35mm anamorphic' },
      { id: 'movement', label: 'Camera movement', placeholder: 'e.g. locked / slow dolly in / 90° orbit' },
      { id: 'aspect', label: 'Aspect ratio', placeholder: '16:9 · 9:16 · 4:5 · 1:1' },
      { id: 'duration', label: 'Duration', placeholder: 'e.g. 5s, 10s' }
    ]
  },
  {
    label: 'World', fields: [
      { id: 'environment', label: 'Location / environment', textarea: true, placeholder: 'Where this lives' },
      { id: 'references', label: 'References', textarea: true, placeholder: 'Reference images/links you will attach in the tool' }
    ]
  },
  {
    label: 'Guardrails', fields: [
      { id: 'consistency', label: 'Consistency rules', textarea: true, placeholder: 'What must never change (product shape, label, character…)' },
      { id: 'textAccuracy', label: 'Required text / logo accuracy', placeholder: 'Exact text that must render correctly' },
      { id: 'avoid', label: 'Things to avoid', textarea: true, placeholder: 'Comma list — the engine formats it per tool' },
      { id: 'notes', label: 'Notes', textarea: true, placeholder: 'Anything else (audio for Veo, internal notes…)' }
    ]
  }
];

const VIDEO_TOOLS = ['kling', 'seedance', 'higgsfield', 'veo'];

/** Main entry: returns [{id, label, text}] sections, tool-specific. */
export function buildPromptPackage(toolId, fields, outputType) {
  const profile = getProfile(toolId);
  // text_to_video normalizes to 'video' inside profiles.
  const type = outputType === 'text_to_video' ? 'video' : outputType;
  if (type === 'full_package') {
    const main = profile.build(fields, profile.kind === 'image' ? 'image' : 'video');
    const negative = profile.build(fields, 'negative')
      .filter((s) => !main.some((m) => m.id === s.id));
    return [...main, ...negative];
  }
  return profile.build(fields, type);
}

/** Mytiv quality checklist — evaluated against the filled fields. */
export function qualityChecklist(toolId, fields, outputType) {
  const isVideo = VIDEO_TOOLS.includes(toolId) || ['video', 'image_to_video', 'text_to_video'].includes(outputType);
  const f = (k) => String(fields[k] || '').trim();
  const checks = [
    { ok: !!f('subject'), text: 'Main subject is concrete and specific' },
    { ok: !!f('lighting'), text: 'Lighting described like a cinematographer (premium look depends on it)' },
    { ok: !!f('aspect'), text: 'Aspect ratio set explicitly' },
    { ok: !f('brand') || !!f('consistency') || !!f('references'), text: 'Brand work: product shape locked via consistency rules or a reference' },
    { ok: !f('textAccuracy') || toolId === 'nano_banana_pro' || toolId === 'veo', text: 'Exact text requested on a tool that can render it (Nano Banana Pro is the text specialist)' },
    { ok: !!f('avoid'), text: '"Things to avoid" filled — mirrored text, warped packaging, generic AI look' }
  ];
  if (isVideo) {
    checks.push(
      { ok: !!f('movement') || /locked|none|static/i.test(f('camera')), text: 'Camera movement stated (or explicitly locked)' },
      { ok: !!f('action'), text: 'Subject motion described separately from camera motion' },
      { ok: !!f('duration'), text: 'Duration set' },
      { ok: !/10s|12s|15s/.test(f('duration')) || /\d\s*[–-]\s*\d+s|\d+s\s*:|beat|shot \d/i.test(f('action')), text: 'Clips over 5s use a time-based structure in the action field' }
    );
  }
  return checks;
}
