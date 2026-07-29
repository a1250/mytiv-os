import { t, has, para, listLine, cleanAvoid, V4_LOOK } from './util.js';

/** Seedance 2.0 — video generation, strongest at multi-beat / multi-shot motion. */
export default {
  id: 'seedance',
  name: 'Seedance 2.0',
  kind: 'video',
  kbVersion: '2.0 · KB 2026-07',
  goodAt: ['Multi-shot / multi-beat sequences in one generation', 'Dynamic, athletic camera movement', 'Complex subject motion and action', 'Time-structured prompts (0–3s / 3–7s …)', 'Reference images for subject + style'],
  badAt: ['Locked ultra-still product shots (Kling is safer)', 'Exact on-screen text', 'Very long single takes beyond its duration cap'],
  syntax: [
    'Time-based structure works natively: "0–3s: … 3–7s: … 7–10s: …".',
    'Multi-shot syntax: label beats as Shot 1 / Shot 2 with camera + action per shot.',
    'Rich camera vocabulary understood: dolly, crane, whip pan, FPV, handheld, orbit, rack focus.',
    'References: attach subject/style images and refer to them ("the car from the reference").',
    'Aspect 16:9 / 9:16 / 1:1; durations roughly 5–12s depending on mode.'
  ],
  bestPractices: [
    'Give each time-beat ONE camera behaviour and ONE action — Seedance chains them smoothly.',
    'Name the transition between beats ("continuous take", "match cut") or it will guess.',
    'Put atmosphere (weather, particles, light shifts) inside the beats, not as a global afterthought.',
    'For one-shot commercials, write the camera path as a single continuous journey.'
  ],
  negativeHandling: 'Supports a negative/avoid list — keep it short and concrete (warped wheels, jelly physics, morphing, text artifacts).',
  imageRefs: 'Subject reference images keep identity across beats; a style frame steers grade/texture. Reference + prompt beats is the strongest combo.',
  videoRefs: 'Motion/video reference support in 2.0 — note the reference clip\'s role explicitly when used.',
  aspectHandling: 'Set per generation. Vertical (9:16) handles fast motion well — good for social-first.',
  durationHandling: 'State total duration and structure beats to fill it exactly; unallocated seconds produce drift.',
  cameraSyntax: 'Explicit film language per beat: "low tracking shot", "crane up to aerial", "180° orbit", "speed ramp".',
  consistencyRules: 'Repeat locked subject attributes in every beat ("the same matte grey SUV") + attach the subject reference.',
  failureCases: [
    'Unstructured long prompts → random cutting.',
    'Two subjects doing complex actions simultaneously → identity swaps.',
    'Physics exaggeration on wheels/liquids when speed is described vaguely — give speeds/directions.'
  ],
  structure: 'Shot summary → timed beats (camera + action each) → atmosphere/light → style line → avoid list → settings.',
  examples: [
    {
      label: 'One-shot car commercial',
      text: 'One continuous shot, 10s, 16:9. The same matte grey electric SUV throughout.\n0–3s: low tracking shot beside the front wheel as the SUV cuts through drifting sand mist on a dawn coastal road.\n3–7s: camera accelerates and sweeps alongside the body at speed, reflections rolling over the paint.\n7–10s: crane up to a wide aerial as the sun breaks the horizon, long shadows across the road.\nDawn cross-light, atmospheric haze, premium automotive commercial, anamorphic feel, subtle film grain.\nAvoid: warped wheels, jelly physics, cuts, changing car design.'
    }
  ],

  build(fields, outputType) {
    if (outputType === 'first_frame' || outputType === 'last_frame') {
      const which = outputType === 'first_frame' ? 'first' : 'last';
      return [{
        id: 'frame', label: `${which === 'first' ? 'First' : 'Last'}-frame plan`,
        text: para(
          `Generate the ${which} frame as a still (Nano Banana Pro / Midjourney) at ${has(fields.aspect) ? t(fields.aspect) : 'the target ratio'} and attach it as a reference image`,
          `Frame content: ${t(fields.subject)}`,
          which === 'first' ? 'Compose the opening state of beat 1' : 'Compose the final resolved state of the last beat'
        )
      }];
    }

    const duration = /12|10/.test(t(fields.duration)) ? t(fields.duration).match(/\d+/)[0] + 's' : (has(fields.duration) ? t(fields.duration) : '10s');
    const hasTiming = /\d\s*[–-]\s*\d+s|\d+s\s*:/.test(t(fields.action));

    const header = [
      /one.?shot|continuous/i.test(`${t(fields.camera)} ${t(fields.movement)} ${t(fields.action)}`) ? 'One continuous shot' : 'Structured sequence',
      duration,
      has(fields.aspect) ? t(fields.aspect) : '16:9',
      has(fields.brand) ? `Featuring ${t(fields.brand)} — identity locked throughout` : ''
    ].filter(Boolean).join(', ') + '.';

    const beats = hasTiming
      ? t(fields.action)
      : para(
          `Beat 1 (opening): ${has(fields.subject) ? t(fields.subject) : 'establish the subject'}${has(fields.camera) ? ` — ${t(fields.camera)}` : ''}`,
          has(fields.action) ? `Beat 2 (development): ${t(fields.action)}${has(fields.movement) ? ` — camera: ${t(fields.movement)}` : ''}` : '',
          'Beat 3 (resolve): motion settles into the final hero composition'
        );

    const atmosphere = para(
      has(fields.environment) ? `Setting: ${t(fields.environment)}` : '',
      has(fields.lighting) ? `Light: ${t(fields.lighting)}` : '',
      [t(fields.style), t(fields.mood), t(fields.palette)].filter(Boolean).join(', '),
      V4_LOOK
    );

    const avoid = ['warped geometry', 'jelly physics', 'morphing', 'unintended cuts', 'text artifacts', cleanAvoid(fields.avoid)]
      .filter(Boolean).join(', ');

    if (outputType === 'negative') {
      return [{ id: 'negative', label: 'Avoid list', text: `Avoid: ${avoid}` }];
    }

    const out = [
      { id: 'prompt', label: 'Seedance 2.0 prompt', text: [header, beats, atmosphere, `Avoid: ${avoid}`].filter(Boolean).join('\n\n') }
    ];

    if (outputType === 'image_to_video' || has(fields.references)) {
      out.push({
        id: 'refs', label: 'References',
        text: para(
          `Attach: ${has(fields.references) ? listLine(fields.references) : 'subject reference image'} — refer to it as "the subject from the reference"`,
          has(fields.consistency) ? `Locked across all beats: ${t(fields.consistency)}` : 'Repeat the subject description identically in every beat'
        )
      });
    }
    if (!hasTiming) {
      out.push({ id: 'tip', label: 'Timing tip', text: `Convert the beats to explicit timestamps filling ${duration} exactly (e.g. 0–3s / 3–7s / 7–${duration}) — Seedance follows timed structure much more precisely.` });
    }
    if (has(fields.notes)) out.push({ id: 'notes', label: 'Notes to self', text: t(fields.notes) });
    return out;
  }
};
