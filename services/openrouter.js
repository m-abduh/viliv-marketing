const MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

const DEFAULT_PROMPT = `You are a senior copywriter for VILIV, a lifestyle brand and sharp curator. Below is a curated catalog of products grouped by lifestyle category — these are the SOLUTIONS to a lifestyle problem.

Your job:
1. Choose ONE lifestyle category from the catalog that makes the most compelling, scroll-stopping story.
2. Pick 3 to 6 products from that category that fit the story best (use their EXACT names from the catalog — never invent). Pick at least 3, no more than 6.
3. Write a short, punchy carousel post around them.

Return ONLY valid JSON matching EXACTLY this shape:
{
  "category": "exact category name chosen from the catalog",
  "products": ["exact product names you picked from that category (use the names as listed)"],
  "hook": "a 7-14 word lifestyle headline that frames the problem/outcome (e.g. \\"7 Things That Make a Small Apartment Feel Bigger\\")",
  "caption": "one short personal paragraph for the social post caption (no hashtags, no @ mentions)"
}

Rules:
- Choose exactly ONE category. Products MUST be real names from that category in the catalog.
- The hook leads with the lifestyle outcome, not a brand/product name.
- Do NOT add hashtags inside the caption. Keep it personal and useful.
- No emojis. Factual, practical, no hype.`;

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
export async function generatePost({ accountName, categories }) {
  const catalog = (categories || []).map((c) => `${c.name}:\n` +
    (c.products || []).map((p) => `  - ${p.name}`).join("\n")).join("\n\n");

  const userPrompt = `Brand channel: ${accountName}

Here is the full curated catalog by lifestyle category:
${catalog || "- (none)"}

${DEFAULT_PROMPT}`;

  const text = await askAI(userPrompt);
  const parsed = extractJSON(text);

  // Resolve a category: prefer one the AI explicitly chose, else first with products.
  const chunkName = parsed.category || parsed.category_name;
  let chosen = (categories || []).find((c) => c.name === chunkName || c.slug === chunkName);
  if (!chosen || !(chosen.products || []).length) {
    chosen = (categories || []).find((c) => (c.products || []).length) || (categories || [])[0] || null;
  }
  const pool = (chosen && chosen.products) || [];

  // AI picks which products from the chosen category fit the story (by name/order).
  const pickNames = Array.isArray(parsed.products) ? parsed.products.map((p) => (typeof p === "string" ? p : p.name || p.title)) : [];
  const ordered = pickNames.length
    ? pool
        .map((p, i) => ({ p, i }))
        .sort((a, b) => (pickNames.indexOf(a.p.name) === -1 ? 1 : 0) - (pickNames.indexOf(b.p.name) === -1 ? 1 : 0) || a.i - b.i)
        .map((x) => x.p)
        .filter((p) => pickNames.includes(p.name))
    : pool;
  const MIN_SLIDES = 3;
  const MAX_SLIDES = 6;
  const used = (ordered.length ? ordered : pool).slice(0, MAX_SLIDES);

  // Top-up from other categories so we always have at least MIN_SLIDES.
  if (used.length < MIN_SLIDES) {
    const all = (categories || []).flatMap((c) => c.products || []);
    const seen = new Set(used.map((p) => p.id));
    for (const p of all) {
      if (used.length >= MIN_SLIDES) break;
      if (seen.has(p.id)) continue;
      used.push(p);
      seen.add(p.id);
    }
  }

  const slides = used.map((p) => ({
    productId: p.id,
    title: p.name,
    image: p.imageUrl || "",
    link: p.affiliateUrl || "",
    category: chosen ? chosen.name : "",
  }));

  return {
    hook: String(parsed.hook || parsed.title || ""),
    slides,
    caption: String(parsed.caption || "").trim() + " #viliv",
    content_json: JSON.stringify(parsed),
    category: chosen ? chosen.name : "",
  };
}