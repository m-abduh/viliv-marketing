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
    "Sunday mornings deserve an unhurried kitchen.",
    "The smell of coffee is its own kind of welcome.",
    "A calm counter makes cooking feel lighter.",
    "Dinner is nicer when everything has its place.",
  ],
  bedding: [
    "A bed that feels like a deep breath at the end of the day.",
    "The best mornings start slowly, under a softer blanket.",
    "There is a quiet luxury in making the bed properly.",
    "Cool sheets and warm light — a small nightly ritual.",
  ],
  lighting: [
    "Evenings feel longer when the light is warm.",
    "A lamp in the corner changes the whole mood of a room.",
    "Soft light makes the ordinary part of the day feel special.",
    "The right glow turns a room into a place to linger.",
  ],
  smart: [
    "Small conveniences leave more room for the good parts of the day.",
    "The best technology at home is the kind you barely notice.",
    "A quiet home is a comfortable home.",
    "Little automations that let the evening run itself.",
  ],
  ambience: [
    "The atmosphere of a room is made of small, quiet details.",
    "A candle, a soft chair, and nowhere else to be.",
    "Some corners of the house ask you to slow down.",
    "A room feels different when it smells like something familiar.",
  ],
  candle: [
    "A candle turns an ordinary evening into a moment.",
    "There is something calming about a small, steady flame.",
    "The last hour of the day deserves a softer light.",
    "A familiar scent can make the whole house feel warmer.",
  ],
  charging: [
    "A tidy charging spot makes the morning feel less rushed.",
    "Everything ready by the door, without the tangle.",
    "One small corner for cables keeps the rest of the room calm.",
    "The quiet convenience of always being charged.",
  ],
  cable: [
    "Less clutter, more room to breathe.",
    "A tidy desk is a small daily kindness.",
    "When the cables disappear, the space feels calmer.",
    "Everything in reach, nothing in the way.",
  ],
  stand: [
    "A desk that meets you at eye level feels like a small relief.",
    "Comfort at the desk makes the afternoon go gentler.",
    "The right height changes how the whole day feels.",
    "Work feels lighter when the setup fits you.",
  ],
  ergo: [
    "Comfort is not a luxury — it is how a good day feels.",
    "A chair that supports you makes long afternoons easier.",
    "Small adjustments, a much softer day.",
    "Your desk can be a place you enjoy sitting.",
  ],
  organizer: [
    "A place for everything, and a calmer morning.",
    "The drawer that opens without a fight.",
    "Order at home is a quiet kind of comfort.",
    "Small containers, a noticeably lighter space.",
  ],
  storage: [
    "Good storage makes a room feel like it can breathe.",
    "Everything you need, tucked away with care.",
    "A calm home starts with a place for things.",
    "Less visible clutter, more room to relax.",
  ],
  decor: [
    "The details are what make a room feel like yours.",
    "A small object can change the whole feeling of a shelf.",
    "A home feels warmer when it reflects the people in it.",
    "Little touches that make a space feel settled.",
  ],
  gaming: [
    "A comfortable corner makes the evening play feel better.",
    "Warm light, a good chair, and time to yourself.",
    "The setup that makes staying in feel like a treat.",
    "Small comforts for long, happy sessions.",
  ],
  bathroom: [
    "A bathroom that feels like a small retreat.",
    "The first ten minutes of the day can feel calm.",
    "Warm towels and soft light — a quiet start.",
    "A tidy counter makes the whole routine gentler.",
  ],
  dining: [
    "The table is where the day slows down.",
    "A set table makes an ordinary meal feel considered.",
    "Dinner together is worth a little care.",
    "Small details make a shared meal feel warmer.",
  ],
  coffee: [
    "The first cup is better when the ritual is slow.",
    "A quiet kitchen and a warm mug.",
    "Mornings feel kinder with a good cup in hand.",
    "The small ritual that starts the day well.",
  ],
};

export const GENERAL_HOOKS = [
  "Small comforts that make staying in feel like a treat.",
  "A home feels warmer when the little things are taken care of.",
  "The quiet details that make an ordinary day nicer.",
  "Slow mornings, soft light, and nowhere to rush.",
  "The corners of home that ask you to stay a little longer.",
  "Little rituals that make the everyday feel considered.",
  "Comfort is made of small, ordinary things.",
  "A calmer home, one small detail at a time.",
  "The feeling of a room that is ready for you.",
  "Simple pleasures worth keeping close at home.",
  "The softest part of the day, at home.",
  "Things that make an evening in feel complete.",
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