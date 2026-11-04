import { productPageUrl } from "./links.js";
import { hookPoolFor, GENERAL_HOOKS, finalizeCaption } from "./copybook.js";

const MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";

const DEFAULT_PROMPT = `You are a senior copywriter for VILIV, a curator of quiet comforts for the home. Below is the full catalog of products grouped by lifestyle category.

CRITICAL BRAND RULE — READ THIS FIRST:
VILIV sells equipment for the rooms of a home: kitchen, bedroom, bathroom, living room, dining area, home office, closet, balcony.
The entire catalog above is indoor home equipment. EVERY hook, tip, caption and outro you write MUST describe a situation INSIDE someone's home.

NEVER write about any of these — they are off-brand and will be rejected:
- cars, driving, dashboards, trunks, road trips, parking
- commuting, travelling, flights, airports, hotels, luggage, packing, one-bag travel
- picnics, beaches, camping, hiking, the outdoors
- gyms, workouts, running, sports, fitness gear
- school, office cubicles, commuting
If a moment feels "on the go", rewrite it as a moment in a room at home.

VILIV is an INDOOR HOME brand. Cars, travel and the outdoors are never the setting.

VOICE — COMFORT, NOT CRITICISM:
VILIV writes like a calm friend describing a nice moment at home, never like an ad that points out what is wrong with the reader's life.
- The hook is an invitation into a warm, comfortable home moment. Lead with how a room feels — calm, soft, slow, warm, unhurried — not with a flaw, problem, fear or warning.
- NEVER make the reader feel bad about their home, routine or habits. No guilt, no urgency, no scare tactics.
- Do NOT write hooks like "Your bedroom is tidy but it still feels like it's waiting for something", "If your mornings feel like a rush, get these first", "The 2am wake-up your mattress is causing", or "Your kitchen counter is doing three jobs". Those frame the reader's home as wrong.
- The product is part of a pleasant story, never the cure for a problem.
- Story first, product second: a small ritual, a quiet detail, a feeling.

Your job:
1. Choose ONE lifestyle story / theme. Pick a primary category name to signal the theme, but you are FREE to pick products from ANY category in the catalog if they support the same story.
2. Pick 3 to 6 products — from anywhere in the catalog — that best serve that single lifestyle story (use their EXACT names from the catalog, never invent). Pick at least 3, no more than 6. Vary your picks between generates so posts are not always the same products.
3. Write a short, warm carousel post — a small story about a comfortable moment at home.

IMPORTANT: VILIV is NOT a "best products" affiliate account. It is a curator with taste. Frame each product as the detail that completes a comforting moment, not as a fix and not as an item to buy. The caption tells a warm story; it never diagnoses the reader.

CLOSE THE CAPTION WITH A BIO POINTER. Instagram and TikTok do not allow clickable links in captions, so the bio link is the only way a viewer reaches a product page. Every caption MUST end with one short line pointing there — "Link in bio to shop." / "Full list in bio." / "Tap the link in bio." Write it as a calm, helpful nudge, never "BUY NOW", never urgency, never all caps.

Return ONLY valid JSON matching EXACTLY this shape:
{
  "category": "primary theme category name — use an exact category name from the catalog",
  "products": ["exact product names you picked (use the names as listed in the catalog — may span multiple categories)"],
  "hook": "a short, warm headline that opens a comfortable home moment. It should feel like the first line of a story, not a warning or a problem (e.g. \\"A slow morning starts with softer light\\" or \\"The quiet ten minutes after dinner\\"), NOT a product list",
  "tips": [
    { "title": "short comfort ritual (e.g. \\"Pour the first cup slowly\\")",
      "subtitle": "one short warm line (e.g. \\"The quietest part of the morning.\\")" }
  ],
  "outro": "a short, warm closing line for the last slide (e.g. \\"Slow down. Settle in.\\" or \\"Small comforts. Better days.\\")",
  "caption": "one short personal paragraph for the social post caption that tells a warm little story. End it with a soft, low-pressure pointer to the product list, e.g. \\"Link in bio to shop.\\" or \\"Full list in bio.\\" — one short sentence, no hashtags, no @ mentions, no urgency or sales hype"
}

Rules:
- "products" lists the exact product names you chose. "tips" must have the SAME length and ORDER as "products": tips[i] describes product i's comfort ritual.
- Each "tips[i].title" is the headline on the slide; the product is shown below it as part of the moment.
- The "hook" is a warm, sensory line about a moment at home. Examples of the RIGHT voice:
  - "Sunday mornings deserve an unhurried kitchen."
  - "Evenings feel longer when the light is warm."
  - "A bed that feels like a deep breath at the end of the day."
  - "The quiet ten minutes after dinner."
  - "The corner where you read deserves its own small ritual."
  - "A candle turns an ordinary evening into a moment."
  NEVER write a hook that points out a problem or flaw ("your X is wasting space", "your desk is making work harder"), makes the reader feel rushed, guilty or afraid ("if your mornings feel like a rush", "the 2am wake-up your mattress is causing"), or uses urgency ("get these first", "before it's too late"). No negativity, no scare tactics.
  Avoid generic lines like "Curated Finds for Better Living." or "Upgrade Your Everyday."
  Also avoid: "pack for a trip", "in your car", "commute", "flight", "hotel", "picnic", "camping", "the gym". Those settings are forbidden.
- Tips are small comfort rituals, not corrections. Write "Soften the light" / "Let the room settle.", not "Fix your lighting" or "Stop doing X".
- Do NOT add hashtags inside the caption. Keep it personal and warm.
- The caption MUST end with a "link in bio" pointer. This is the only path from post to product, so never end on a bare lifestyle line.
- Only ONE bio pointer per caption, and it goes last.
- No emojis. Warm, observant, no hype.
- Vary the chosen products and hook across different generations.`;

function isRetryable(e) {
  const m = String((e && e.message) || "");
  return (
    e?.cause?.code === "EAI_AGAIN" ||
    e?.code === "EAI_AGAIN" ||
    e?.type === "system" ||
    m.includes("fetch failed") ||
    /^OpenRouter error 5\d\d/.test(m) ||
    m.includes("temporarily overloaded") ||
    m.startsWith("OpenRouter returned empty response")
  );
}

async function askAI(prompt, retries = 3) {
  const key = process.env.OPENROUTER_KEY;
  if (!key) throw new Error("OPENROUTER_KEY not set");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      signal: controller.signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (data.error || !content) {
      throw new Error(`OpenRouter returned empty response: ${JSON.stringify(data)}`);
    }
    return content;
  } catch (e) {
    if (retries > 0 && isRetryable(e)) {
      const delay = Math.min(30000, 10000 + (3 - retries) * 10000);
      console.log(`OpenRouter transient error, retrying in ${delay / 1000}s... (${retries} left)`);
      await new Promise(r => setTimeout(r, delay));
      return askAI(prompt, retries - 1);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

// Escape raw control characters (raw newlines/tabs the model sometimes emits
// inside JSON string values) as \n / \t so JSON.parse doesn't throw
// "Bad control character in string literal" and fail the whole slot.
function escapeControlCharsInStrings(text) {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of text) {
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      const code = ch.codePointAt(0);
      if (code < 0x20) {
        if (ch === "\n") out += "\\n";
        else if (ch === "\r") out += "\\r";
        else if (ch === "\t") out += "\\t";
        else out += "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
    }
    out += ch;
  }
  return out;
}

function extractJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in AI response");
  const json = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(json);
  } catch (err) {
    // Retry once with control characters escaped inside string values.
    return JSON.parse(escapeControlCharsInStrings(json));
  }
}

/**
 * Cover-title fallback. The free model sometimes returns JSON without the
 * "hook" key, which would leave the first (cover) slide blank. Fall back to a
 * situation-matched hook from the copybook, else to the first tip title.
 */
function fallbackHook(chosen, tips) {
  const pool = chosen?.slug ? hookPoolFor(chosen.slug) : GENERAL_HOOKS;
  if (pool?.length) return pool[Math.floor(Math.random() * pool.length)];
  const firstTip = (tips || []).find((t) => t && t.title);
  if (firstTip) return String(firstTip.title).slice(0, 100);
  return "Little upgrades for a better everyday.";
}

/**
 * Generate a carousel post. The AI picks a lifestyle category from the catalog
 * and chooses a subset of that category's products — all from the DB (the AI
 * never invents products). It then writes the hook + caption for one coherent
 * lifestyle story.
 * @param {object} opts
 * @param {string} opts.accountName
 * @param {Array}  opts.categories  [{id, name, slug, products:[{id,name,imageUrl,affiliateUrl}]}]
 * @returns {{hook, slides, caption, content_json, category}}
 */
export async function generatePost({ accountName, categories, siteBase = "viliv.store", forceTheme = null }) {
  const catalog = (categories || []).map((c) => `${c.name}:\n` +
    (c.products || []).map((p) => `  - ${p.name}`).join("\n")).join("\n\n");

  const themeLine = forceTheme
    ? `\nTHEME FOR THIS POST: "${forceTheme}". Build the lifestyle story around this theme. Pick 3 to 6 products from the "${forceTheme}" category FIRST. Only if that category has fewer than 3 products may you take products from other categories. The hook, tips and caption must clearly reflect the "${forceTheme}" theme.\n`
    : "";

  const userPrompt = `Brand channel: ${accountName}

Here is the full curated catalog by lifestyle category:
${catalog || "- (none)"}
${themeLine}
${DEFAULT_PROMPT}`;

  const text = await askAI(userPrompt);
  const parsed = extractJSON(text);

  const MIN_SLIDES = 3;
  const MAX_SLIDES = 6;

  // The AI may pick products from ANY category. Build one flat pool across the
  // whole catalog plus a lookup of each product's category slug.
  const productCat = new Map(); // id -> { slug, name }
  const all = (categories || []).flatMap((c) =>
    (c.products || []).map((p) => {
      productCat.set(p.id, { slug: c.slug, name: c.name });
      return { ...p, categorySlug: c.slug, categoryName: c.name };
    })
  );

  // Resolve the theme category. If a forceTheme is set, it overrides whatever
  // the AI picked so posts rotate through every category.
  const themeName = forceTheme || parsed.category || parsed.category_name;
  let chosen =
    (categories || []).find((c) => c.name === themeName || c.slug === themeName) ||
    (categories || []).find((c) => (c.products || []).length) ||
    (categories || [])[0] ||
    null;

  // AI picks which products (by exact name) fit the story — from the whole pool.
  const pickNames = Array.isArray(parsed.products)
    ? parsed.products.map((p) => (typeof p === "string" ? p : p.name || p.title))
    : [];
  const nameIndex = new Set(pickNames.map((n) => n.toLowerCase()));
  const picked = pickNames.length
    ? all.filter((p) => nameIndex.has(String(p.name).toLowerCase())).slice(0, MAX_SLIDES)
    : [];
  const used = (picked.length ? picked : []).slice(0, MAX_SLIDES);

  // Top-up from the whole pool so we always have at least MIN_SLIDES.
  if (used.length < MIN_SLIDES) {
    const seen = new Set(used.map((p) => p.id));
    for (const p of all) {
      if (used.length >= MIN_SLIDES) break;
      if (seen.has(p.id)) continue;
      used.push(p);
      seen.add(p.id);
    }
  }

  const tips = Array.isArray(parsed.tips) ? parsed.tips : [];
  const hook = String(parsed.hook || parsed.title || "").trim() || fallbackHook(chosen, tips);

  const slides = used.map((p, i) => {
    const t = tips[i] || {};
    const cat = productCat.get(p.id) || { slug: "", name: "" };
    return {
      productId: p.id,
      product: p.name,
      title: String(t.title || p.name),
      subtitle: String(t.subtitle || ""),
      image: p.imageUrl || "",
      link: productPageUrl(p.slug, siteBase),
      category: cat.name || "",
      index: i + 1,
    };
  });

  return {
    hook,
    slides,
    outro: { line: String(parsed.outro || "Better living, one find at a time.") },
    caption: finalizeCaption(parsed.caption),
    content_json: JSON.stringify(parsed),
    category: chosen ? chosen.name : "",
  };
}