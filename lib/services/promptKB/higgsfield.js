import { t, has, para, listLine, cleanAvoid, V4_LOOK } from './util.js';

// Movement keywords → closest Higgsfield camera preset.
const PRESET_MAP = [
  [/crash\s*zoom|fast zoom|punch/i, 'Crash Zoom In'],
  [/dolly\s*in|push\s*in|slow zoom in/i, 'Dolly In'],
  [/dolly\s*out|pull\s*back|zoom out/i, 'Dolly Out / Pull Back'],
  [/orbit|arc|circle|around/i, 'Arc / 360 Orbit'],
  [/whip|swish/i, 'Whip Pan'],
  [/crane|rise|aerial up|boom/i, 'Crane Up'],
  [/handheld|shake/i, 'Handheld'],
  [/bullet|frozen|matrix/i, 'Bullet Time'],
  [/robo|mechanical|precise arm/i, 'Robo Arm'],
  [/none|locked|static|still/i, 'Static / Locked']
];

/** Higgsfield — preset-driven cinematic camera moves + Soul image model. */
export default {
  id: 'higgsfield',
  name: 'Higgsfield',
  kind: 'video',
  kbVersion: 'KB 2026-07 · studio-tested',
  goodAt: ['Signature cinematic camera moves via presets (crash zoom, orbit, bullet time…)', 'Product hero moments from a single start frame', 'Fast turnaround social-first clips', 'Soul model: realistic fashion/lifestyle stills with preset looks'],
  badAt: ['Long narratives (think 3–5s statements)', 'Precise multi-beat choreography (use Seedance)', 'On-screen text', 'Strict content moderation — wording matters'],
  syntax: [
    'Workflow: start frame (image) + CAMERA PRESET + short prompt describing subject/scene motion.',
    'The preset carries the camera — do NOT fight it with camera language in the prompt.',
    'Prompt stays short (1–3 sentences): subject, environment mood, what subtly moves.',
    'Soul (images): pick a preset look, then a concise scene description.'
  ],
  bestPractices: [
    'Choose the preset FIRST, then write the prompt around it.',
    'Describe subject motion only — the preset owns the camera path.',
    'Generate the start frame in the exact target aspect ratio.',
    'Batch variations by swapping presets on the same start frame — cheapest way to a hero move.'
  ],
  negativeHandling: 'No formal negative field in the preset flow — keep unwanted elements out of the start frame and keep prompts unambiguous.',
  imageRefs: 'Start frame is the product-safety anchor: geometry and label fidelity come from the image, not the prompt.',
  videoRefs: 'Motion presets replace video references for camera; character/motion transfer features exist for people.',
  aspectHandling: 'Inherited from the start frame; social-first work: build 9:16 frames from the start.',
  durationHandling: 'Short clips (~3–5s). Design one bold beat, not a sequence.',
  cameraSyntax: 'Preset names ARE the syntax: Crash Zoom, Dolly In/Out, Arc, Whip Pan, Crane Up, Bullet Time, Robo Arm, Static.',
  consistencyRules: 'All fidelity flows from the start frame. Never ask the prompt to redesign anything visible in it.',
  failureCases: [
    'Moderation flags on brand-adjacent celebrity names, violence-adjacent words, and some skin/body terms — rephrase neutrally.',
    'Long prompts confuse the preset motion.',
    'Rapid re-runs can hit rate limits — space out generations.'
  ],
  structure: 'START FRAME + PRESET + short prompt (subject + subtle motion + mood).',
  examples: [
    {
      label: 'Product crash zoom',
      text: 'PRESET: Crash Zoom In\nPROMPT: The perfume bottle stands on wet black stone in fog. Fine mist drifts; droplets glisten on the glass. Premium, moody, cinematic.\nSTART FRAME: approved 9:16 packshot'
    }
  ],

  build(fields, outputType) {
    const moveText = `${t(fields.movement)} ${t(fields.camera)}`;
    const preset = (PRESET_MAP.find(([re]) => re.test(moveText)) || [null, 'Dolly In'])[1];

    if (outputType === 'first_frame' || outputType === 'last_frame') {
      return [{
        id: 'frame', label: 'Start-frame plan',
        text: para(
          `Higgsfield animates FROM a start frame — generate it in Nano Banana Pro/Midjourney at ${has(fields.aspect) ? t(fields.aspect) : '9:16 or 16:9'}`,
          `Frame content: ${t(fields.subject)}`,
          'All product/label fidelity comes from this frame, so approve it before animating'
        )
      }];
    }

    if (outputType === 'negative') {
      return [{
        id: 'negative', label: 'Exclusion strategy',
        text: para(
          'Higgsfield\'s preset flow has no negative field — control unwanted elements through the start frame and neutral wording',
          has(fields.avoid) ? `Keep out of the start frame: ${listLine(fields.avoid)}` : '',
          'Moderation-safe phrasing: avoid celebrity names, violence-adjacent verbs, and explicit body terms'
        )
      }];
    }

    const prompt = para(
      t(fields.subject),
      has(fields.environment) ? `Environment: ${t(fields.environment)}` : '',
      has(fields.action) ? `Subtle motion: ${t(fields.action)}` : 'Subtle ambient motion only — the product itself stays still',
      has(fields.lighting) ? t(fields.lighting) : '',
      [t(fields.mood), t(fields.style)].filter(Boolean).join(', '),
      V4_LOOK
    );

    const out = [
      { id: 'preset', label: 'Camera preset', text: `${preset}${/Static/.test(preset) ? '' : ' — let the preset own the camera; the prompt below describes only subject/scene motion'}` },
      { id: 'prompt', label: 'Higgsfield prompt (keep it short)', text: prompt },
      {
        id: 'settings', label: 'Setup',
        text: [
          `Start frame: ${has(fields.references) ? listLine(fields.references) : 'approved still in the final aspect ratio'}`,
          `Aspect: ${has(fields.aspect) ? t(fields.aspect) : '9:16'} (inherited from the start frame)`,
          `Duration: one bold beat (~${has(fields.duration) ? t(fields.duration) : '5s'})`,
          'Variations: re-run the same frame with 2–3 different presets and pick the winner'
        ].join('\n')
      }
    ];

    const modRisk = /(gun|blood|fight|knife|celebrity|nude)/i.test(`${t(fields.subject)} ${t(fields.action)}`);
    if (modRisk || has(fields.avoid)) {
      out.push({
        id: 'moderation', label: '⚠ Moderation check',
        text: para(
          modRisk ? 'Wording may trip Higgsfield moderation — rephrase flagged terms neutrally before submitting' : '',
          has(fields.avoid) ? `Also keep out of frame: ${cleanAvoid(fields.avoid)}` : ''
        )
      });
    }
    if (has(fields.notes)) out.push({ id: 'notes', label: 'Notes to self', text: t(fields.notes) });
    return out;
  }
};
