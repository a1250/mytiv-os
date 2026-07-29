// Shared helpers for tool knowledge profiles.
export const t = (v) => String(v || '').trim();
export const has = (v) => t(v).length > 0;
export const sentence = (s) => { s = t(s); return s ? (/[.!?…]$/.test(s) ? s : s + '.') : ''; };
export const para = (...parts) => parts.map(sentence).filter(Boolean).join(' ');
export const listLine = (v) => t(v).replace(/\n+/g, ', ').replace(/\s*,\s*/g, ', ');
// Normalizes an "avoid" field into a clean comma list (strips leading no/avoid).
export const cleanAvoid = (v) => listLine(v).replace(/\b(no|avoid|don'?t|never)\s+/gi, '').trim();
// The Mytiv house guardrail line, appended to realistic work.
export const V4_LOOK = 'Ultra realistic, premium cinematic lighting, subtle film grain, not cartoonish, avoiding the generic AI look.';
