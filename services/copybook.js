// Content pool for the no-AI path: situational hooks, per-category tips with a
// supporting sub-line, and closing outros. All copy stays on-brand for VILIV:
// problem/curiosity -> transformation, never a bare product list.
//
// Hooks are SITUATION-SPECIFIC (like "Your kitchen counter is wasting more
// space" or "If you travel with one bag, make room for these") — never generic
// taglines. The carrier picks the pool that matches the dominant category of
// the chosen slides so the cover hook relates to what's actually shown.

export const HOOKS_BY_SITUATION = {
  "home-kitchen": [
    "Your kitchen counter is wasting more space than you think.",
    "The things I'd buy for a tiny bathroom.",
    "If your closet is always full, look at these.",
    "What actually makes a rental apartment feel better.",
    "The stuff that makes cleaning a small apartment less annoying.",
    "Things that make a tiny balcony actually usable.",
    "What I'd keep beside my bed if I hated getting up at night.",
    "Things that make hosting dinner less chaotic.",
    "The little upgrades that make Sunday feel better.",
    "What makes a backyard hangout feel complete.",
    "What I'd set up before having friends over.",
  ],
  "office-productivity": [
    "Your desk is making work harder than it needs to be.",
    "If you work from cafés, you need these.",
    "If you always eat lunch at your desk, look at these.",
    "If you're always cold in the office, start here.",
  ],
  "travel-luggage": [
    "What I'd pack for a 7-hour flight.",
    "Things that make hotel rooms feel a little more comfortable.",
    "The stuff you'll wish you packed on your next trip.",
    "If you travel with one bag, make room for these.",
    "Things that make airport days noticeably easier.",
  ],
  "outdoor-camping": [
    "What I'd bring to a beach day besides a towel.",
    "Things that make a picnic way less messy.",
    "If you spend weekends outside, these are worth having.",
    "The little things that make camping much more comfortable.",
    "What makes a long day outdoors actually enjoyable.",
    "What I'd pack for a day at the beach with no plans.",
    "What I'd bring to a picnic with no table nearby.",
  ],
  "sports-fitness": [
    "Small upgrades that make your workout less of a chore.",
    "The little things that make moving daily actually enjoyable.",
    "What I'd keep ready for a workout you'll actually show up to.",
  ],
};

export const GENERAL_HOOKS = [
  "Things worth keeping in your car every day.",
  "If you spend an hour commuting, get these first.",
  "The little things that make long drives much easier.",
  "What I'd keep in my bag if I left home all day.",
  "Things that make carrying your stuff around less annoying.",
  "Things that make grocery runs weirdly easier.",
  "The stuff that makes rainy days less annoying.",
  "What I'd buy for someone who's always on the go.",
  "Things that make waiting around surprisingly comfortable.",
  "The small purchases that make busy days easier.",
  "Things that make movie night at home actually better.",
  "Things worth having for a lazy afternoon outside.",
  "If you walk everywhere, these little upgrades matter.",
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
  { title: "Less, but better", sub: "Only keep what earns its place.", productHint: "" },
  { title: "Make it easy to start", sub: "Convenience wins every time.", productHint: "" },
  { title: "Fix the friction point", sub: "Remove the thing that annoys you daily.", productHint: "" },
  { title: "Upgrade the everyday", sub: "Small swaps, better days.", productHint: "" },
  { title: "Create a ritual", sub: "Repetition beats motivation.", productHint: "" },
  { title: "Invest in the basics", sub: "Quality where it counts.", productHint: "" },
];

export const OUTRO_POOL = [
  "Small changes. Better space.",
  "Better living, one find at a time.",
  "Curated by Viliv.",
  "Work better. Feel better.",
  "Upgrade your everyday.",
];

export function tipPoolFor(slug) {
  return COPYBOOK[slug]?.tips || DEFAULT_TIPS;
}