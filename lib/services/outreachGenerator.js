/**
 * Outreach draft generator — pure functions, no AI calls yet.
 * Later this file becomes the seam for Claude API generation:
 * same inputs (lead + tone + kind), same output shape.
 */
import { firstName, addDays, todayISO } from '../date-utils';

// What Mytiv offers per opportunity type.
const OFFERS = {
  'AI Content': {
    en: 'AI-driven content — from generative product films to full brand worlds',
    he: 'תוכן מבוסס AI — מסרטוני מוצר גנרטיביים ועד עולמות מותג שלמים'
  },
  'Product Video': {
    en: 'cinematic product films that make a product feel iconic',
    he: 'סרטוני מוצר סינמטיים שגורמים למוצר להרגיש אייקוני'
  },
  'CGI / 3D': {
    en: 'high-end CGI and 3D visuals',
    he: 'ויז׳ואלים תלת־ממדיים ו-CGI ברמה הגבוהה ביותר'
  },
  'Social Campaign': {
    en: 'scroll-stopping social campaigns built with an AI-accelerated pipeline',
    he: 'קמפיינים לסושיאל שעוצרים את הגלילה, עם פייפליין מואץ AI'
  },
  'Interactive / XR': {
    en: 'interactive and XR experiences that people remember',
    he: 'חוויות אינטראקטיביות ו-XR שאנשים זוכרים'
  },
  'Website / Digital': {
    en: 'immersive digital and web experiences',
    he: 'חוויות דיגיטל ווב אימרסיביות'
  },
  'Brand Content': {
    en: 'brand content with a cinematic edge',
    he: 'תוכן מותג עם נגיעה קולנועית'
  },
  'Production Services': {
    en: 'end-to-end production with an AI-accelerated pipeline',
    he: 'הפקה מקצה לקצה עם פייפליין מואץ AI'
  },
  'Other': {
    en: 'creative technology — AI content, CGI and interactive experiences',
    he: 'קריאייטיב־טק: תוכן AI, CGI וחוויות אינטראקטיביות'
  }
};

// Industry-specific opening hooks.
const HOOKS = {
  'Beauty': {
    en: 'Beauty brands are winning right now with CGI and AI-driven product visuals — and your products deserve that level of craft.',
    he: 'מותגי ביוטי מנצחים היום עם ויז׳ואלים של CGI ו-AI — והמוצרים שלכם בדיוק ברמה שמצדיקה את זה.'
  },
  'Fashion': {
    en: 'Fashion is moving to motion-first storytelling — stills alone don\'t carry a drop anymore.',
    he: 'עולם האופנה עובר לסטוריטלינג מבוסס תנועה — סטילס לבד כבר לא מספיק להשקה.'
  },
  'Tech': {
    en: 'Tech products are hard to make feel human — that\'s exactly the kind of challenge we like.',
    he: 'למוצרי טק קשה לתת תחושה אנושית — וזה בדיוק סוג האתגר שאנחנו אוהבים.'
  },
  'Food & Beverage': {
    en: 'F&B feeds are full of static renders — liquid CGI and AI motion are an instant differentiator.',
    he: 'הפידים של מותגי מזון ומשקאות מלאים ברנדרים סטטיים — CGI נוזלי ותנועת AI זה בידול מיידי.'
  },
  'Health & Fitness': {
    en: 'Fitness content is crowded — cinematic product storytelling is how brands cut through.',
    he: 'תוכן פיטנס זה שוק צפוף — סטוריטלינג סינמטי הוא הדרך לבלוט.'
  },
  'Culture & Arts': {
    en: 'Cultural institutions are discovering what AR and interactive layers do for visitor experience.',
    he: 'מוסדות תרבות מגלים מה שכבת AR ואינטראקטיב עושה לחוויית המבקר.'
  },
  'Automotive': {
    en: 'Automotive visuals are being rebuilt around CGI + AI pipelines — faster, more flexible, more cinematic.',
    he: 'עולם הרכב עובר לפייפליינים של CGI ו-AI — מהיר יותר, גמיש יותר, סינמטי יותר.'
  },
  'Real Estate': {
    en: 'Real-estate marketing is shifting from renders to cinematic, emotional films.',
    he: 'שיווק נדל״ן עובר מרנדרים לסרטים סינמטיים ורגשיים.'
  },
  'Agency': {
    en: 'Agencies are under pressure to deliver AI-grade production without building the pipeline in-house.',
    he: 'סוכנויות נדרשות היום להפקות ברמת AI — בלי לבנות את הפייפליין אצלן.'
  },
  'Retail': {
    en: 'Retail brands that move to motion-first content are seeing the difference in every metric.',
    he: 'מותגי ריטייל שעוברים לתוכן מבוסס תנועה רואים את ההבדל בכל מדד.'
  },
  'Hospitality': {
    en: 'Hospitality sells a feeling — cinematic content is the shortest path to it.',
    he: 'אירוח מוכר תחושה — ותוכן סינמטי הוא הדרך הקצרה אליה.'
  },
  'Other': {
    en: 'Brands that adopt AI-accelerated content pipelines are simply moving faster than everyone else.',
    he: 'מותגים שמאמצים פייפליין תוכן מבוסס AI פשוט זזים מהר יותר מכולם.'
  }
};

const t = (map, key, lang) => (map[key] || map['Other'])[lang];

function signature(opts, lang) {
  const owner = (opts.ownerName || '').trim();
  const studio = opts.studioName || 'Mytiv';
  if (lang === 'he') return owner ? `${owner} · ${studio}` : studio;
  return owner ? `${owner} · ${studio}` : `The ${studio} team`;
}

function greetingFor(lead, lang, tone) {
  const name = firstName(lead.contact_name);
  if (lang === 'he') return name ? `היי ${name},` : 'היי,';
  const opener = tone === 'friendly' ? 'Hey' : tone === 'premium' ? 'Hello' : 'Hi';
  return name ? `${opener} ${name},` : `${opener} there,`;
}

export function generateDraft(kind, lead, opts = {}) {
  const tone = opts.tone || 'professional';
  const studio = opts.studioName || 'Mytiv';
  const opp = lead.opportunity_type || 'Other';
  const cat = lead.category || 'Other';
  const offerEn = t(OFFERS, opp, 'en');
  const offerHe = t(OFFERS, opp, 'he');
  const hookEn = t(HOOKS, cat, 'en');
  const hookHe = t(HOOKS, cat, 'he');
  const sig = (lang) => signature({ ...opts, studioName: studio }, lang);

  switch (kind) {
    case 'cold_email_he':
      return {
        language: 'he',
        subject: `${lead.company} × ${studio} — רעיון ששווה 15 דקות`,
        body:
`${greetingFor(lead, 'he', tone)}

${hookHe}

אני מ-${studio} — סטודיו לקריאייטיב וטכנולוגיה מתל אביב שעובד עם מותגים על תוכן AI, CGI וחוויות אינטראקטיביות.

יש לי כמה כיוונים ל${offerHe} שיכולים לעבוד מצוין ל-${lead.company}. אשמח לשלוח רפרנסים רלוונטיים — או לקפוץ לשיחה קצרה של רבע שעה.

תודה,
${sig('he')}`
      };

    case 'cold_email_en':
      return {
        language: 'en',
        subject: `${lead.company} × ${studio} — ${offerEn.split('—')[0].trim()}`,
        body:
`${greetingFor(lead, 'en', tone)}

${hookEn}

I'm reaching out from ${studio}, a creative technology studio in Tel Aviv working across AI content, CGI and interactive experiences for brands.

I'd love to show you what ${offerEn} could look like for ${lead.company}. Happy to send a few relevant references — or jump on a quick 15-minute call.

Best,
${sig('en')}`
      };

    case 'linkedin':
      return {
        language: 'en',
        subject: '',
        body:
`${greetingFor(lead, 'en', 'friendly')} I run ${studio} — a creative-tech studio in Tel Aviv (AI content, CGI, XR). ${hookEn} Would love to connect and share a couple of ideas for ${lead.company}. No pitch pressure — just think there's a real fit.`
      };

    case 'followup':
      return {
        language: 'en',
        subject: `Re: ${lead.company} × ${studio}`,
        body:
`${greetingFor(lead, 'en', tone)}

Just floating this back up — I know inboxes are brutal.

If ${offerEn} is on the table for ${lead.company} this quarter, I'd love 15 minutes to show you what we'd do. If the timing is off, no worries at all — happy to stay in touch.

Best,
${sig('en')}`
      };

    case 'premium':
      return {
        language: 'en',
        subject: `A creative technology partner for ${lead.company}`,
        body:
`${greetingFor(lead, 'en', 'premium')}

${studio} is a Tel Aviv-based creative technology studio operating at the intersection of AI, film and design. We partner with brands and agencies on ${offerEn} — combining generative pipelines with senior, hands-on craft.

Our recent work spans beauty, fashion and consumer technology. I'd welcome the opportunity to share a short, curated selection relevant to ${lead.company}'s upcoming initiatives.

Warm regards,
${sig('en')}`
      };

    case 'brand_direct': {
      const ideas = brandIdeas(lead, offerEn);
      return {
        language: 'en',
        subject: `3 ideas for ${lead.company}`,
        body:
`${greetingFor(lead, 'en', 'direct')}

I'll keep this short. Three things ${studio} would make for ${lead.company} tomorrow:

1. ${ideas[0]}
2. ${ideas[1]}
3. ${ideas[2]}

If any of these lands, I'll send a visual reference for it — one email, no deck.

${sig('en')}`
      };
    }

    default:
      return { language: 'en', subject: '', body: '' };
  }
}

function brandIdeas(lead, offer) {
  const opp = lead.opportunity_type || 'Other';
  const base = {
    'AI Content': [
      'A generative product film — one hero asset, ten platform cuts.',
      'An always-on AI visual system: one shoot, endless seasonal variations.',
      'A "brand world" piece that turns your visual identity into a living space.'
    ],
    'Product Video': [
      'A 30-second cinematic hero film for your flagship product.',
      'A macro-detail cut that makes the product texture the star.',
      'A vertical-first launch teaser built for paid social.'
    ],
    'CGI / 3D': [
      'A full-CGI hero shot no camera could ever capture.',
      'A physics-driven product moment (liquid, particles, light).',
      'A 3D product configurator asset set for web and social.'
    ],
    'Social Campaign': [
      'A motion-first drop campaign: 1 concept, 12 scroll-stopping assets.',
      'A CGI-meets-street visual series built around your identity.',
      'A weekly AI-generated content engine for one quarter.'
    ],
    'Interactive / XR': [
      'A WebAR layer for your next physical activation — no app install.',
      'An interactive 3D experience for your website\'s hero section.',
      'A mixed-reality demo for events and press.'
    ]
  };
  return base[opp] || [
    `A pilot piece of ${offer} — small scope, fast turnaround.`,
    'A motion upgrade for your best-performing static content.',
    'A one-day AI pipeline workshop with your team.'
  ];
}

/** Strategy suggestions shown in the assistant panel. */
export function suggestForLead(lead, opts = {}) {
  const opp = lead.opportunity_type || 'Other';
  const cat = lead.category || 'Other';
  const offerEn = t(OFFERS, opp, 'en');

  const angleByStatus = {
    new: `Open with the ${cat.toLowerCase()} hook — lead with a visual reference, not credentials.`,
    researching: 'Find a warm intro first; cold outreach is plan B for this one.',
    ready_to_contact: `Lead with the strongest ${cat.toLowerCase()} case study and one concrete idea for them.`,
    contacted: 'They\'ve seen the name once — follow up with something visual, not more text.',
    follow_up_needed: 'Short, light follow-up. One sentence of value, one clear ask.',
    replied: 'They\'re warm. Move to a call — propose two concrete time slots.',
    meeting_scheduled: 'Prep a 3-slide mini-deck tailored to their category before the meeting.',
    proposal_sent: 'Gentle nudge with one added-value idea not in the proposal.',
    won: 'Nurture: share relevant work occasionally, ask for referrals at the right moment.',
    lost: 'Park it. Re-approach in a quarter with something new.',
    not_relevant: 'No outreach recommended.'
  };

  const followUpOffset = ['contacted', 'follow_up_needed', 'proposal_sent'].includes(lead.status) ? 3 : 5;

  return {
    angle: angleByStatus[lead.status] || angleByStatus.new,
    service: offerEn.charAt(0).toUpperCase() + offerEn.slice(1),
    subject: `${lead.company} × ${opts.studioName || 'Mytiv'} — ${offerEn.split('—')[0].trim()}`,
    followUpDate: addDays(todayISO(), followUpOffset)
  };
}
