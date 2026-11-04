// Content pool for the no-AI path: warm hooks, per-category comfort rituals
// with a supporting sub-line, and closing outros. All copy stays on-brand for
// VILIV: a calm, comforting home moment first, product second. Never a flaw,
// warning, scare tactic or guilt trip.
//
// Hooks are story-led and SITUATION-SPECIFIC (like "Sunday mornings deserve an
// unhurried kitchen") — never generic taglines and never a criticism of the
// reader's home. The carrier picks the pool that matches the dominant category
// of the chosen slides so the cover hook relates to what's actually shown.

export const HOOKS_BY_SITUATION = {
  kitchen: [
    "The one small thing that makes Sunday mornings feel unhurried.",
    "There's a corner of the kitchen that finally feels finished.",
    "A small detail that changes how dinner feels.",
    "The smallest thing on the counter does the most work.",
  ],
  bedding: [
    "The one small thing that makes a bed feel like a deep breath.",
    "There's a detail on the bed you notice every single night.",
    "A small change that makes mornings start slower.",
    "The thing you'd take with you if you moved.",
  ],
  lighting: [
    "One small light changes how evenings feel.",
    "There's a corner of the room that finally feels right.",
    "It's not the overhead light — it's the detail nobody notices.",
    "The one thing to switch on before settling in.",
  ],
  smart: [
    "The small thing at home you never think about anymore.",
    "One quiet upgrade lets the whole evening run itself.",
    "A little detail that makes the house feel a step ahead.",
    "The convenience you notice every single day without trying.",
  ],
  ambience: [
    "The one detail that changes the mood of a room.",
    "There's a corner of the house that asks you to slow down.",
    "A small thing that makes the room smell like home.",
    "It's not the furniture — it's the detail in the air.",
  ],
  candle: [
    "The small thing that turns an ordinary evening into a moment.",
    "There's a scent in the room worth looking forward to every night.",
    "One little glow that makes the last hour feel softer.",
    "The detail that makes the whole house feel warmer.",
  ],
  charging: [
    "The small thing that makes mornings feel less rushed.",
    "There's a corner by the door that finally feels tidy.",
    "One little detail that keeps the cables out of sight.",
    "The quiet convenience you notice every morning.",
  ],
  cable: [
    "The one change that makes a desk feel calm.",
    "There's a detail on the desk that keeps everything in reach.",
    "A small thing that makes the cables disappear.",
    "It's not the monitor — it's the detail underneath.",
  ],
  stand: [
    "The one detail that makes a desk feel right.",
    "A small change that makes long afternoons easier.",
    "The thing that finally puts the screen at the right height.",
    "A small adjustment that changes how work feels.",
  ],
  ergo: [
    "The one thing that makes a desk a place you enjoy sitting.",
    "There's a detail that makes long afternoons feel lighter.",
    "A small change that makes comfort feel normal.",
    "The little upgrade your back notices every day.",
  ],
  organizer: [
    "The one detail that makes mornings calmer.",
    "There's a drawer that finally opens without a fight.",
    "A small thing that gives everything a place.",
    "The little change that makes the room feel lighter.",
  ],
  storage: [
    "The one thing that makes a room feel like it can breathe.",
    "There's a corner that finally hides everything neatly.",
    "A small change that clears the visual noise.",
    "The detail that makes the space feel calm again.",
  ],
  decor: [
    "The small detail that makes a room feel like yours.",
    "There's one object on the shelf that changes the whole feeling.",
    "A little touch that makes a space feel settled.",
    "The thing guests always ask about.",
  ],
  gaming: [
    "The one detail that makes evenings in feel better.",
    "There's a corner of the room set up just for you.",
    "A small upgrade that makes long sessions comfortable.",
    "The little thing that makes staying in feel like a treat.",
  ],
  bathroom: [
    "The one detail that makes a bathroom feel like a retreat.",
    "A small change that makes the first ten minutes calmer.",
    "A tiny upgrade you notice every morning.",
    "The thing that makes the routine feel gentler.",
  ],
  dining: [
    "The one detail that makes dinner feel considered.",
    "There's a small thing on the table that changes the meal.",
    "A little touch that makes shared dinners warmer.",
    "The detail that makes the day slow down at the table.",
  ],
  coffee: [
    "The one small thing that makes mornings feel slower.",
    "There's a ritual in the kitchen worth looking forward to.",
    "A tiny detail that makes the first cup better.",
    "It's not the beans — it's the thing beside the mug.",
  ],
};

export const GENERAL_HOOKS = [
  "The one small thing that makes staying in feel like a treat.",
  "There's a detail at home you notice every single day.",
  "A small change that makes an ordinary day nicer.",
  "The little thing that makes mornings feel slower.",
  "There's a corner of home you never want to leave.",
  "The one detail that makes the evening feel complete.",
  "It's not the big furniture — it's the thing nobody notices.",
  "The little ritual worth looking forward to at home.",
  "The thing you'd take with you if you moved.",
  "The smallest thing in the room does the most work.",
  "The small comfort worth recommending to anyone.",
  "There's a detail at home that makes you smile every time.",
];

export function hookPoolFor(slug) {
  return HOOKS_BY_SITUATION[slug] || GENERAL_HOOKS;
}

const COPYBOOK = {
  "home-kitchen": {
    tips: [
      { title: "Hide the clutter", sub: "Less visual clutter = a calmer space.", productHint: "" },
      { title: "Fix your lighting", sub: "Layered light makes a room feel bigger.", productHint: "" },
      { title: "Use vertical space", sub: "Unused walls are free square footage.", productHint: "" },
      { title: "Clear your counters", sub: "A clear counter changes how the kitchen feels.", productHint: "" },
      { title: "Choose smarter storage", sub: "Storage that earns its place.", productHint: "" },
      { title: "Make the entry calm", sub: "First impressions shape the whole day.", productHint: "" },
    ],
  },
  "health-wellness": {
    tips: [
      { title: "Make the first hour yours", sub: "A calm morning sets the whole day.", productHint: "" },
      { title: "Simplify your water game", sub: "Hydration you won't forget.", productHint: "" },
      { title: "Fix your sleep basics", sub: "Better sleep starts with better habits.", productHint: "" },
      { title: "Build a routine that sticks", sub: "Consistent beats intense.", productHint: "" },
      { title: "Bring calm routines home", sub: "Your home can support recovery.", productHint: "" },
      { title: "Stop overcomplicating it", sub: "Small consistent actions win.", productHint: "" },
    ],
  },
  "beauty-personal-care": {
    tips: [
      { title: "Streamline your morning", sub: "Fewer steps, same great result.", productHint: "" },
      { title: "Keep your basics consistent", sub: "Good skin loves routine.", productHint: "" },
      { title: "Prep the night before", sub: "Wake up to less work.", productHint: "" },
      { title: "Invest in the essentials", sub: "Quality where it counts.", productHint: "" },
      { title: "Make products last longer", sub: "Smart storage, less waste.", productHint: "" },
      { title: "Edit your collection", sub: "Keep only what you love.", productHint: "" },
    ],
  },
  "electronics-gadgets": {
    tips: [
      { title: "Declutter your desk tech", sub: "Fewer cables, clearer mind.", productHint: "" },
      { title: "Charge smarter", sub: "One dock, everything ready.", productHint: "" },
      { title: "Automate the boring parts", sub: "Let tech do the admin.", productHint: "" },
      { title: "Fix your setup ergonomics", sub: "Comfort is a feature.", productHint: "" },
      { title: "Reduce screen fatigue", sub: "Your eyes will thank you.", productHint: "" },
      { title: "Make your space smarter", sub: "Small sensors, big convenience.", productHint: "" },
    ],
  },
  "tools-diy": {
    tips: [
      { title: "Get your basics right", sub: "The right tool makes the job easy.", productHint: "" },
      { title: "Organize what you own", sub: "Find everything in seconds.", productHint: "" },
      { title: "Measure twice, buy once", sub: "Work smarter, not harder.", productHint: "" },
      { title: "Keep used gear close", sub: "Access matters.", productHint: "" },
      { title: "Protect what you fix", sub: "Little extras, longer life.", productHint: "" },
      { title: "Make maintenance easy", sub: "Small upkeep, big savings.", productHint: "" },
    ],
  },
  "pet-supplies": {
    tips: [
      { title: "Make feeding simpler", sub: "Consistent bowls, happy routine.", productHint: "" },
      { title: "Soften cleanup", sub: "Less mess, more play.", productHint: "" },
      { title: "Give your pet their spot", sub: "A corner that's truly theirs.", productHint: "" },
      { title: "Simplify walks and trips", sub: "Good gear, stress-free outings.", productHint: "" },
      { title: "Keep enrichment fun", sub: "Happy pets are busy pets.", productHint: "" },
      { title: "Comfort first", sub: "A cozy pet is a calmer pet.", productHint: "" },
    ],
  },
  "sports-fitness": {
    tips: [
      { title: "Make space to move", sub: "A clear spot means you'll show up.", productHint: "" },
      { title: "Track the wins", sub: "Progress you can see keeps you going.", productHint: "" },
      { title: "Train at your level", sub: "Start where you are.", productHint: "" },
      { title: "Recover properly", sub: "Recovery is part of training.", productHint: "" },
      { title: "Keep essentials ready", sub: "Grab and go, no excuses.", productHint: "" },
      { title: "Protect your joints", sub: "Smart gear, safer sessions.", productHint: "" },
    ],
  },
  "travel-luggage": {
    tips: [
      { title: "Pack in small wins", sub: "Organized bags, easy access.", productHint: "" },
      { title: "Cut the extra weight", sub: "Carry less, enjoy more.", productHint: "" },
      { title: "Keep essentials reachable", sub: "No more digging at check-in.", productHint: "" },
      { title: "Make commutes easier", sub: "Same bag, smoother trips.", productHint: "" },
      { title: "Protect what you pack", sub: "Your things arrive ready.", productHint: "" },
      { title: "Stay fresh on the move", sub: "Small comforts, long journeys.", productHint: "" },
    ],
  },
  "office-productivity": {
    tips: [
      { title: "Fix your sitting position", sub: "Comfort keeps you focused.", productHint: "" },
      { title: "Raise your screen", sub: "Eye level, fewer aches.", productHint: "" },
      { title: "Get cables under control", sub: "A tidy desk, a tidy mind.", productHint: "" },
      { title: "Improve your lighting", sub: "Bright spaces, better output.", productHint: "" },
      { title: "Clear the visual noise", sub: "Less clutter, faster flow.", productHint: "" },
      { title: "Keep what you need close", sub: "Everything within reach.", productHint: "" },
    ],
  },
  "outdoor-camping": {
    tips: [
      { title: "Set up in minutes", sub: "Less setup, more campfire.", productHint: "" },
      { title: "Stay warm the smart way", sub: "Warm gear, easy nights.", productHint: "" },
      { title: "Eat well outdoors", sub: "Good food, real adventure.", productHint: "" },
      { title: "Pack light but right", sub: "Every gram works for you.", productHint: "" },
      { title: "Beat the elements", sub: "Dry gear, happy camper.", productHint: "" },
      { title: "Keep evenings cozy", sub: "Light, comfort, calm.", productHint: "" },
    ],
  },
};

const DEFAULT_TIPS = [
  { title: "Make a small ritual", sub: "A few quiet minutes, just for you.", productHint: "" },
  { title: "Let the light soften", sub: "Warm light changes how a room feels.", productHint: "" },
  { title: "Keep it within reach", sub: "Comfort lives in the small conveniences.", productHint: "" },
  { title: "Choose what feels good", sub: "Quality you notice every day.", productHint: "" },
  { title: "Leave a little space", sub: "Room to breathe makes a home calmer.", productHint: "" },
  { title: "Enjoy the ordinary", sub: "Small comforts, better days.", productHint: "" },
];

export const OUTRO_POOL = [
  "Small comforts. Better days.",
  "A calmer home, one detail at a time.",
  "Curated by Viliv.",
  "Slow down. Settle in.",
  "Make room for the good part of the day.",
];

// ---- Bio CTA -------------------------------------------------------------
// Every caption ends with a soft pointer to the storefront in the profile bio.
// Instagram/TikTok do not allow clickable links in captions, so "link in bio"
// is the only route from a post to a product page. Rotated from a pool so the
// feed does not read like a machine, but always present exactly once.
export const BIO_CTA_POOL = [
  "Link in bio to shop.",
  "Full list in bio.",
  "Tap the link in bio to see everything.",
  "Everything in the bio link.",
  "Link in bio for the full setup.",
  "Shop the full list in bio.",
];

// Guard against a second CTA when the AI already wrote one, and against
// double-append if a caption is passed through twice. Matches the whole pool
// plus the phrasings the model may produce on its own ("bio link", "in my bio",
// "in the bio"), so the CTA is never stacked.
const CTA_PATTERN = /\b(?:link|list|shop|tap|everything)\s+(?:is\s+)?(?:in|on)\s+(?:the\s+|my\s+)?bio\b|\bbio\s+link\b|\bin\s+(?:the\s+|my\s+)?bio\b/i;

function alreadyHasCTA(text) {
  return CTA_PATTERN.test(text);
}

/**
 * Append the bio CTA (and the #viliv tag) to a caption exactly once.
 * @param {string} caption - AI-written or local caption body
 * @returns {string} caption ending with a bio CTA and the #viliv hashtag
 */
export function finalizeCaption(caption) {
  const body = String(caption || "").trim().replace(/\s+/g, " ");
  if (!body) return `Everything curated by Viliv. ${BIO_CTA_POOL[0]} #viliv`;

  if (alreadyHasCTA(body)) {
    return /#viliv/.test(body) ? body : `${body} #viliv`;
  }

  const cta = BIO_CTA_POOL[Math.floor(Math.random() * BIO_CTA_POOL.length)];
  return `${body} ${cta} #viliv`;
}

export function tipPoolFor(slug) {
  return COPYBOOK[slug]?.tips || DEFAULT_TIPS;
}