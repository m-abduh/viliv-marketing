import { productPageUrl } from "./links.js";

const MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

const DEFAULT_PROMPT = `You are a senior copywriter for VILIV, a lifestyle brand and sharp curator. Below is the full catalog of products grouped by lifestyle category — these are the SOLUTIONS to a lifestyle problem.

Your job:
1. Choose ONE lifestyle story / theme. Pick a primary category name to signal the theme, but you are FREE to pick products from ANY category in the catalog if they support the same story.
2. Pick 3 to 6 products — from anywhere in the catalog — that best serve that single lifestyle story (use their EXACT names from the catalog, never invent). Pick at least 3, no more than 6. Vary your picks between generates so posts are not always the same products.
3. Write a short, punchy carousel post around them.

IMPORTANT: VILIV is NOT a "best products" affiliate account. It is a curator with taste. Frame each product as the ANSWER to a lifestyle tip, not as an item to buy. The social caption leads with the lifestyle outcome, not a sales pitch.

Return ONLY valid JSON matching EXACTLY this shape:
{
  "category": "primary theme category name — use an exact category name from the catalog",
  "products": ["exact product names you picked (use the names as listed in the catalog — may span multiple categories)"],
  "hook": "a short lifestyle headline that frames the problem or curiosity (e.g. \\"Your Desk Is Making Work Harder\\" or \\"Make Your Small Space Feel Bigger\\"), NOT a product list",
  "tips": [
    { "title": "short tip header (e.g. \\"Raise your monitor\\")",
      "subtitle": "one short supportive line (e.g. \\"Eye level, fewer aches.\\")" }
  ],
  "outro": "a short closing line for the last slide (e.g. \\"Work better. Feel better.\\" or \\"Small changes. Better space.\\")",
  "caption": "one short personal paragraph for the social post caption (no hashtags, no @ mentions, no sales pitch)"
}

Rules:
- "products" lists the exact product names you chose. "tips" must have the SAME length and ORDER as "products": tips[i] describes product i's lifestyle tip.
- Each "tips[i].title" is the tip headline on the slide; the product is shown below it as the answer.
- The hook leads with the lifestyle outcome, never a brand/product name.
- Do NOT add hashtags inside the caption. Keep it personal and useful.
- No emojis. Factual, practical, no hype.
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

function extractJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in AI response");
  return JSON.parse(cleaned.slice(start, end + 1));
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
export async function generatePost({ accountName, categories, siteBase = "viliv.store" }) {
  const catalog = (categories || []).map((c) => `${c.name}:\n` +
    (c.products || []).map((p) => `  - ${p.name}`).join("\n")).join("\n\n");

  const userPrompt = `Brand channel: ${accountName}

Here is the full curated catalog by lifestyle category:
${catalog || "- (none)"}

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

  // Resolve a "chosen" category for the footer/metadata (best effort from AI,
  // else the first category that has products).
  const chunkName = parsed.category || parsed.category_name;
  let chosen =
    (categories || []).find((c) => c.name === chunkName || c.slug === chunkName) ||
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
    hook: String(parsed.hook || parsed.title || ""),
    slides,
    outro: { line: String(parsed.outro || "Better living, one find at a time.") },
    caption: String(parsed.caption || "").trim() + " #viliv",
    content_json: JSON.stringify(parsed),
    category: chosen ? chosen.name : "",
  };
}