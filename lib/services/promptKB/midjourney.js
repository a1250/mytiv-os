import { t, has, para, listLine, cleanAvoid } from './util.js';

/** Midjourney — image generation. KB v7-era syntax. */
export default {
  id: 'midjourney',
  name: 'Midjourney',
  kind: 'image',
  kbVersion: 'v7 · KB 2026-07',
  goodAt: ['Aesthetic quality and art direction', 'Stylized + editorial looks', 'Moodboard exploration at speed', 'Style consistency via --sref'],
  badAt: ['Exact logo/label text (expect retouch)', 'Precise packaging geometry', 'Multi-step instructed edits', 'Hebrew text of any kind'],
  syntax: [
    'Single-line prompt: comma-separated descriptive phrases, most important first.',
    'Parameters go at the END: --ar W:H, --style raw, --s 0–1000, --c 0–100, --no item1, item2.',
    'Weights with :: (phrase::2) — use sparingly.',
    '--oref <image URL> + --ow 0–1000 for product/character likeness (omni-reference).',
    '--sref <image URL> + --sw for style transfer from a reference.'
  ],
  bestPractices: [
    'For product work: --style raw and a LOW stylize value (--s 0–100) to stop MJ re-designing the product.',
    'Front-load the subject; MJ weights early tokens more.',
    'Describe the light like a photographer (source, direction, quality) — MJ responds strongly.',
    'Keep prompts under ~60 words; MJ ignores long tails.'
  ],
  negativeHandling: 'Use --no followed by a comma list (--no text, watermark, hands). No full negative-prompt field. Never write "no X" inside the prompt body — MJ may render the X.',
  imageRefs: 'Product likeness: --oref with --ow 200–400 for packshots. Style: --sref. Plain image URLs at the prompt start act as loose image prompts.',
  videoRefs: 'MJ animates its own images (low/high motion). Generate the still first, then animate with a short motion sentence.',
  aspectHandling: '--ar 1:1, 4:5, 16:9, 9:16, 21:9 etc. Default is 1:1 — always set it explicitly.',
  durationHandling: 'N/A for stills. MJ video clips are short (~5s) extensions of a still.',
  cameraSyntax: 'Describe as photography vocabulary in-prompt: "85mm lens", "low angle hero shot", "macro". No parameter syntax for camera.',
  consistencyRules: 'Same --oref + same seed (--seed N) + minimal wording changes between variations. For campaigns, lock a --sref style code.',
  failureCases: [
    'Label text becomes decorative gibberish — plan a retouch pass.',
    'High --s values redesign the product shape.',
    '"no X" written in prose renders the X.'
  ],
  structure: '[subject + product], [environment], [lighting], [camera/lens], [style/mood], [palette/materials] --ar … --style raw --s … --no …',
  examples: [
    {
      label: 'Cosmetics macro',
      text: 'frosted glass serum bottle macro, droplet on dropper tip, warm studio sweep, soft key light with thin specular rim, 100mm macro lens, premium beauty editorial, champagne gold accents --ar 4:5 --style raw --s 50 --no text, watermark, hands, plastic look'
    }
  ],

  build(fields, outputType) {
    const phrases = [
      t(fields.subject),
      has(fields.brand) ? `${t(fields.brand)} product` : '',
      t(fields.environment),
      t(fields.lighting),
      [t(fields.camera), t(fields.lens)].filter(Boolean).join(', '),
      t(fields.style),
      t(fields.mood),
      t(fields.materials),
      t(fields.palette)
    ].filter(Boolean).join(', ');

    const params = [];
    if (has(fields.aspect)) params.push(`--ar ${t(fields.aspect)}`);
    params.push('--style raw', '--s 50');
    const avoid = cleanAvoid(fields.avoid);
    const noList = ['text artifacts', 'watermark', avoid].filter(Boolean).join(', ');
    params.push(`--no ${noList}`);

    const promptLine = `${phrases} ${params.join(' ')}`.replace(/\s+/g, ' ').trim();
    const out = [];

    if (outputType === 'negative') {
      return [{ id: 'negative', label: 'Negative (--no) parameter', text: `--no ${noList}` },
        { id: 'note', label: 'Note', text: 'Midjourney has no negative-prompt field — everything unwanted goes into --no as a comma list. Never write "no X" in the prompt body.' }];
    }

    out.push({ id: 'prompt', label: outputType === 'last_frame' ? 'Last-frame image prompt' : outputType === 'first_frame' ? 'First-frame image prompt' : 'Midjourney prompt', text: promptLine });

    if (has(fields.references) || has(fields.consistency)) {
      out.push({
        id: 'refs', label: 'Reference setup',
        text: para(
          has(fields.references) ? `Attach reference: ${listLine(fields.references)} via --oref <url> --ow 300 for product likeness` : '',
          has(fields.consistency) ? `Consistency: ${t(fields.consistency)} — reuse the same --oref, add --seed <n>, and keep wording changes minimal between variations` : ''
        )
      });
    }

    if (['video', 'image_to_video', 'full_package'].includes(outputType)) {
      out.push({
        id: 'animate', label: 'MJ Animate (video from this still)',
        text: para(
          `Generate the still first, then animate with: "${has(fields.action) ? t(fields.action) : 'subtle ambient motion, product perfectly still'}"`,
          has(fields.movement) && !/none|locked|static/i.test(fields.movement) ? `Camera: ${t(fields.movement)} — use High Motion` : 'Use Low Motion for a locked, premium feel',
          'For serious video work, hand the still to Kling / Higgsfield / Veo instead — MJ video is a sketch tool.'
        )
      });
    }

    if (has(fields.textAccuracy)) {
      out.push({ id: 'warn', label: '⚠ Text accuracy', text: `Requirement: ${t(fields.textAccuracy)}. Midjourney cannot guarantee exact label/logo text — plan a retouch pass, or generate this asset with Nano Banana Pro instead.` });
    }
    if (has(fields.notes)) out.push({ id: 'notes', label: 'Notes to self', text: t(fields.notes) });
    return out;
  }
};
