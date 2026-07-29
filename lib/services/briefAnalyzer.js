/**
 * Client Brief Analyzer — heuristic implementation (offline, deterministic).
 * Turns a messy client message into a structured brief. When a real AI
 * provider is connected this becomes a single API call with the same
 * output shape, so the UI never changes.
 */

const DELIVERABLE_PATTERNS = [
  [/\b(video|videos|film|clip|reel)\b/i, 'Video content'],
  [/\b(still|stills|photo|image|images|packshot|key visual)\b/i, 'Stills / key visuals'],
  [/\b(3d|cgi|render)\b/i, '3D / CGI assets'],
  [/\b(ar|augmented|webxr|interactive|filter)\b/i, 'AR / interactive'],
  [/\b(social|instagram|tiktok|reels|stories)\b/i, 'Social-first formats'],
  [/\b(logo|animation|motion|typography)\b/i, 'Motion / logo animation'],
  [/\b(campaign)\b/i, 'Campaign package'],
  [/\b(website|landing)\b/i, 'Web / digital']
];

const RUSH_WORDS = /\b(asap|urgent|tomorrow|this week|yesterday|rush|immediately|דחוף|מחר|השבוע)\b/i;
const VAGUE_WORDS = /\b(something cool|something nice|wow|viral|amazing|creative stuff|whatever works|משהו מגניב|משהו יפה)\b/i;

function extractBudget(text) {
  const m = text.match(/(?:₪|\$|€|nis|ils|usd|eur|shekel|שקל|תקציב)\s*[:\-]?\s*([\d,]+k?)/i) ||
            text.match(/([\d,]{4,}|\d+k)\s*(?:₪|\$|€|nis|ils|usd|shekels?|שקלים)/i);
  if (m) return m[0].trim();
  if (/not huge|small budget|tight budget|limited budget|לא גדול|קטן/i.test(text)) return 'Framed as limited — no number given';
  return '';
}

function extractDeadline(text) {
  const m = text.match(/\b(?:by|until|before|in|within|עד|בעוד)\s+([\d]+\s*(?:days?|weeks?|months?|ימים|שבועות)|(?:mon|tues|wednes|thurs|fri|satur|sun)day|[\d]{1,2}[./][\d]{1,2})/i) ||
            text.match(/\b([\d]+\s*(?:days?|weeks?))\b/i);
  if (m) return m[0].trim();
  if (RUSH_WORDS.test(text)) return 'Urgent — exact date not given';
  return '';
}

export function analyzeBriefHeuristic({ rawText, clientName = '', projectName = '', budget = '', deadline = '', links = '' }) {
  const text = rawText || '';
  const foundBudget = budget || extractBudget(text);
  const foundDeadline = deadline || extractDeadline(text);

  const deliverables = DELIVERABLE_PATTERNS.filter(([re]) => re.test(text)).map(([, label]) => label);
  if (deliverables.length === 0) deliverables.push('Unclear — deliverables not stated explicitly');

  // --- Summary ---
  const summary = [
    `Client${clientName ? ` (${clientName})` : ''} is asking for: ${deliverables.filter((d) => !d.startsWith('Unclear')).join(', ') || 'to be clarified'}.`,
    /launch|השקה/i.test(text) ? 'Context: tied to a product/brand launch.' : '',
    /premium|luxury|high.end|יוקרתי|פרימיום/i.test(text) ? 'Quality bar: explicitly premium.' : '',
    foundDeadline ? `Timeline signal: ${foundDeadline}.` : 'No timeline given.',
    foundBudget ? `Budget signal: ${foundBudget}.` : 'No budget mentioned.'
  ].filter(Boolean);

  // --- Missing info ---
  const missing = [];
  if (!foundBudget || /limited|not huge|Framed/i.test(foundBudget)) missing.push('What is the actual budget range?');
  if (!foundDeadline || /urgent/i.test(foundDeadline)) missing.push('What is the hard deadline (and what drives it)?');
  missing.push('Which formats/ratios are needed (9:16, 1:1, 16:9) and how many of each?');
  missing.push('Where will this run — organic, paid, both? Usage period?');
  if (!/reference|ref|example|כמו|בסטייל/i.test(text)) missing.push('Do you have 1–2 references for the direction you imagine?');
  missing.push('What brand assets exist (product files/CAD, label files, brand book, fonts)?');
  missing.push('Who approves, and how many approval rounds are expected?');

  // --- Risks ---
  const risks = [];
  if (!foundBudget) risks.push({ risk: 'No budget stated — high chance of scope/price mismatch', severity: 'high' });
  if (/premium|luxury/i.test(text) && /not huge|small|limited|tight/i.test(text)) risks.push({ risk: '"Premium" expectations with a limited budget — classic gap, align early', severity: 'high' });
  if (RUSH_WORDS.test(text) || /week|3 weeks|שבוע/i.test(foundDeadline)) risks.push({ risk: 'Tight timeline — reduce scope or approval rounds to fit', severity: 'medium' });
  if (VAGUE_WORDS.test(text)) risks.push({ risk: 'Vague creative expectations — lock a visual reference before quoting', severity: 'medium' });
  if (deliverables.length > 3) risks.push({ risk: 'Many deliverable types implied — clarify priorities before scoping', severity: 'medium' });
  if (!/cad|file|asset|brand book|קבצים/i.test(text)) risks.push({ risk: 'Client-side dependency: brand/product assets not confirmed', severity: 'low' });
  if (risks.length === 0) risks.push({ risk: 'No major red flags detected — verify budget and approvals anyway', severity: 'low' });

  // --- Tasks ---
  const tasks = [
    `Reply to ${clientName || 'the client'} with clarifying questions (draft below)`,
    'Collect 2–3 reference directions to anchor expectations',
    'Request brand/product assets (files, CAD, brand book)',
    'Prepare a tiered quote once budget range is known'
  ];

  // --- Scope suggestion ---
  const scope = `Suggested v1 scope: ${deliverables.filter((d) => !d.startsWith('Unclear'))[0] || 'one hero asset'} as the hero deliverable, cut/adapted into secondary formats. One concept direction, ${RUSH_WORDS.test(text) ? 'a single approval round to protect the timeline' : 'two approval rounds'}.`;

  const proposalStructure = 'Cover → Creative Direction (anchored to an approved reference) → Deliverables list → Process & timeline → Tiered pricing (hero only / hero + cutdowns / full package) → Terms & what is not included.';

  const priceConsiderations = [
    'Production complexity (AI-only vs. CGI hybrid vs. shoot)',
    'Number of final assets and formats',
    'Revision rounds included',
    'Usage rights scope and duration',
    RUSH_WORDS.test(text) || /week/i.test(foundDeadline) ? 'Rush factor for the compressed timeline' : 'Standard turnaround',
    'Client-supplied assets vs. built from scratch'
  ];

  // --- Replies ---
  const q3 = missing.slice(0, 3).map((q, i) => `${i + 1}. ${q}`).join('\n');
  const firstName = clientName.split(/\s+/)[0] || '';
  const replies = {
    en_email: `Hi ${firstName || 'there'},\n\nThanks for reaching out — this sounds like exactly the kind of project we enjoy${/launch/i.test(text) ? ', and launch timing makes it even more interesting' : ''}.\n\nTo come back with accurate directions and pricing, three quick questions:\n${q3}\n\nOnce I have these, we'll send concrete visual directions with matching investment levels within 48 hours.\n\nBest,\nMytiv`,
    he_email: `היי ${firstName || ''},\n\nתודה שפניתם — נשמע בדיוק כמו סוג הפרויקטים שאנחנו אוהבים${/launch|השקה/i.test(text) ? ', ותזמון של השקה עושה את זה אפילו יותר מעניין' : ''}.\n\nכדי לחזור עם כיוונים ומחיר מדויקים, שלוש שאלות קצרות:\n${q3}\n\nברגע שנקבל תשובות — נשלח כיוונים ויזואליים קונקרטיים עם רמות השקעה תואמות תוך 48 שעות.\n\nתודה,\nMytiv`,
    whatsapp: `Sounds great! 🙌 Quick 3 so I can quote right: budget range? which formats & how many? do you have brand/product files? Then you'll get directions + pricing within 48h.`,
    formal: `Dear ${clientName || 'Sir/Madam'},\n\nThank you for your inquiry. To prepare an accurate creative and financial proposal, we kindly request the following details: an indicative budget range; the required deliverables and formats; and the availability of brand assets (product files, label files, brand guidelines).\n\nUpon receipt, we will provide creative directions with corresponding investment levels within two business days.\n\nSincerely,\nMytiv — Creative Production Studio`
  };

  return {
    summary, missing, deliverables, scope, risks, tasks,
    proposalStructure, priceConsiderations, replies,
    detected: { budget: foundBudget, deadline: foundDeadline }
  };
}
