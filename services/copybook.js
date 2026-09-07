// Content pool for the no-AI path: hook formulas, per-category tips with a
// supporting sub-line, and closing outros. All copy stays on-brand for VILIV:
// problem -> curiosity -> transformation, never a bare product list.
// "{n}" in a hook is replaced with the number of product slides.

export const HOOK_POOL = [
  "Your Home Doesn't Need More Stuff.",
  "It Needs Better Stuff.",
  "Your Space Could Feel So Much Better.",
  "The Little Things Your Home Is Missing.",
  "Small Upgrades, Better Living.",
  "Better Spaces Start With Better Choices.",
  "Curated Finds for Better Living.",
  "Thoughtfully Chosen for Everyday Life.",
  "The Everyday Upgrade Edit.",
  "Your Daily Routine Could Be Easier.",
  "{n} Things You'll Wish You Bought Sooner.",
  "{n} Things That Just Make Sense.",
  "The Products That Solve Annoying Problems.",
  "Things You Didn't Know You Needed.",
  "Make Everyday Life Easier.",
];

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