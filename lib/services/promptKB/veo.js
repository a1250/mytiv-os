import { t, has, para, sentence, listLine, V4_LOOK } from './util.js';

/** Veo — Google video generation with native audio. */
export default {
  id: 'veo',
  name: 'Veo',
  kind: 'video',
  kbVersion: '3.x · KB 2026-07',
  goodAt: ['Prompt adherence + physics realism', 'Native audio: ambience, SFX, spoken dialogue', 'Cinematic single shots with strong composition', 'Image-to-video from a reference frame'],
  badAt: ['Precise brand text in frame', 'Long clips (plan around ~8s)', 'Unwanted subtitles unless told otherwise'],
  syntax: [
    'One rich cinematic paragraph: subject → context → action → style → camera motion → composition → ambiance.',
    'Audio is prompted in-line: "Audio: rain on metal, distant thunder". Dialogue in quotes with the speaker described.',
    'Append "(no subtitles)" — Veo loves adding captions otherwise.',
    'Phrase exclusions positively; "no X" phrasing is weak.',
    'Structured/JSON-like shot descriptions also work for complex setups.'
  ],
  bestPractices: [
    'Write it like a shot description from a treatment — Veo rewards film language.',
    'Specify the camera move precisely once ("slow push-in from a low angle") — do not stack moves.',
    'Always write an Audio line; silence is a wasted differentiator.',
    'For product work, anchor with an image reference and describe only motion + light.'
  ],
  negativeHandling: 'No negative field. Convert to positive statements ("the table is clean and empty") and always end with "(no subtitles)".',
  imageRefs: 'Image-to-video: the reference frame defines look/composition; the prompt describes motion, light change and audio.',
  videoRefs: 'N/A in the standard flow.',
  aspectHandling: '16:9 and 9:16. State composition intent in-prompt ("centered hero composition, generous negative space").',
  durationHandling: '~8s per generation. Structure: one establishing beat + one development, no more.',
  cameraSyntax: 'Film grammar in prose: dolly, push-in, tracking, crane, aerial, handheld, rack focus, slow motion.',
  consistencyRules: 'Reuse the reference frame + identical subject wording across takes. Brand text: keep it in the reference, ask Veo not to alter it.',
  failureCases: [
    'Subtitles burned in — forgot "(no subtitles)".',
    'Two camera moves stacked → jittery hybrid.',
    'Text-heavy labels drift — add type in post.'
  ],
  structure: 'Cinematic paragraph + Audio line + "(no subtitles)".',
  examples: [
    {
      label: 'Typography reveal',
      text: 'On a true black void, bold white headline text assembles from thin streaks of light, letters settling with a soft optical bloom, then holding perfectly still for reading. Locked camera, centered composition, premium title-sequence style, subtle film grain. The text reads exactly "IDEAS, ENGINEERED TO MOVE" and must be spelled precisely. Audio: a low cinematic swell resolving into silence. (no subtitles)'
    }
  ],

  build(fields, outputType) {
    if (outputType === 'first_frame' || outputType === 'last_frame') {
      return [{
        id: 'frame', label: `${outputType === 'first_frame' ? 'First' : 'Last'}-frame plan`,
        text: para(
          `Generate the frame as a still (Nano Banana Pro recommended for brand text) at ${has(fields.aspect) ? t(fields.aspect) : '16:9'}`,
          `Frame content: ${t(fields.subject)}`,
          'Then use it as the Veo image reference with the motion prompt'
        )
      }];
    }

    if (outputType === 'negative') {
      return [{
        id: 'negative', label: 'Exclusions (Veo style)',
        text: para(
          'Veo has no negative prompt — state the wanted state positively',
          has(fields.avoid) ? `Convert: "${listLine(fields.avoid)}" → describe the frame without these elements explicitly` : '',
          'Always end the prompt with "(no subtitles)"'
        )
      }];
    }

    const isI2V = outputType === 'image_to_video';
    const body = para(
      isI2V ? `Starting from the reference image (${has(fields.references) ? listLine(fields.references) : 'approved still'}): ${t(fields.subject)}` : t(fields.subject),
      has(fields.environment) ? `Setting: ${t(fields.environment)}` : '',
      has(fields.action) ? `Action: ${t(fields.action)}` : 'Action: restrained, elegant motion',
      has(fields.movement) && !/none|locked|static/i.test(fields.movement)
        ? `Camera: ${t(fields.movement)} — a single, clean move`
        : 'Camera: locked, no camera movement',
      has(fields.camera) ? `Framing: ${t(fields.camera)}${has(fields.lens) ? `, ${t(fields.lens)}` : ''}` : '',
      has(fields.lighting) ? `Lighting: ${t(fields.lighting)}` : '',
      [t(fields.style), t(fields.mood), t(fields.palette)].filter(Boolean).join(', '),
      has(fields.consistency) ? `Unchanged throughout: ${t(fields.consistency)}` : '',
      has(fields.textAccuracy) ? `Any visible text must be spelled precisely: ${t(fields.textAccuracy)}` : '',
      has(fields.avoid) ? `The frame stays free of ${listLine(fields.avoid)}` : '',
      V4_LOOK
    );

    const audio = `Audio: ${has(fields.notes) && /audio|sound|sfx|music/i.test(fields.notes)
      ? t(fields.notes).replace(/^.*?(audio|sound|sfx|music)[:\s]*/i, '')
      : 'subtle scene-appropriate ambience with one soft accent at the key moment'}`;

    const out = [{
      id: 'prompt',
      label: isI2V ? 'Veo prompt (image-to-video)' : 'Veo prompt',
      text: `${body}\n\n${sentence(audio)} (no subtitles)`
    }];

    out.push({
      id: 'settings', label: 'Settings',
      text: [
        `Aspect: ${has(fields.aspect) ? t(fields.aspect) : '16:9'}`,
        `Duration: ~8s per generation${has(fields.duration) && !/8/.test(fields.duration) ? ` — requested ${t(fields.duration)}: plan as multiple takes cut together` : ''}`,
        isI2V ? 'Mode: image-to-video with the reference frame attached' : 'Mode: text-to-video'
      ].join('\n')
    });

    if (has(fields.notes) && !/audio|sound|sfx|music/i.test(fields.notes)) {
      out.push({ id: 'notes', label: 'Notes to self', text: t(fields.notes) });
    }
    return out;
  }
};
