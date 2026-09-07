import "dotenv/config";
import { store } from "./db.mjs";
import { generatePost } from "./services/openrouter.js";
import { productPageUrl } from "./services/links.js";
import { OUTRO_POOL, tipPoolFor, hookPoolFor } from "./services/copybook.js";
import { renderCarouselToOutput } from "./services/renderer.mjs";
import { getChannels, createCarouselPost } from "./services/buffer.js";

const MIN_SLIDES = 3;
const MAX_SLIDES = 6;

const MAX_ATTEMPTS = Number(process.env.RETRY_ATTEMPTS || 3);
const RETRY_DELAY_MS = Number(process.env.RETRY_DELAY_MS || 5000);

// Round-robin theme rotation across catalog categories, persisted so posts
// cycle through every category instead of the AI always picking one.
// Stores the last theme SLUG (stable even if a category's display name changes)
// so the rotation stays meaningful when categories are renamed/reordered.
async function nextTheme(catalog) {
  const rotation = await store.getSettingJSON("theme_rotation", null);
  const cats = catalog || [];
  if (!cats.length) return null;

  const lastSlug = rotation && typeof rotation.themeSlug === "string" ? rotation.themeSlug : null;
  // Rotate to the category after the last used slug; if it's gone, restart top.
  const startIdx = lastSlug ? cats.findIndex((c) => c.slug === lastSlug) + 1 : 0;
  const idx = startIdx < cats.length ? startIdx : 0;

  const theme = cats[idx];
  await store.setSettingJSON("theme_rotation", { themeSlug: theme.slug });
  return theme.name;
}
export { nextTheme };

export async function nextSlot() {
  const accounts = await store.listAccounts();
  if (!accounts.length) return null;

  const rotation = await store.getSettingJSON("rotation", null);
  const r = rotation && typeof rotation.accountIndex === "number" ? rotation : { accountIndex: 0 };
  const account = accounts[r.accountIndex % accounts.length];
  return { account };
}

export async function runPipeline({ postId, useAI } = {}) {
  if (postId) {
    return runManualRetry(postId);
  }

  const slot = await nextSlot();
  if (!slot) {
    return { error: "No accounts configured" };
  }
  const { account } = slot;
  const accounts = await store.listAccounts();

  let post = await store.createPost(account, { theme: "", status: "pending" });

  let result;
  try {
    result = await generateAndPost(post, { account, useAI });

    // Advance rotation only after a successful slot
    const rotation = await store.getSettingJSON("rotation", null);
    const accountIndex = ((rotation && typeof rotation.accountIndex === "number" ? rotation.accountIndex : 0) + 1) % accounts.length;
    await store.setSettingJSON("rotation", { accountIndex });
  } catch (err) {
    console.error("[pipeline] slot failed:", err.message);
    try { await store.updatePost(post.id, { status: "failed", last_error: err.message }); } catch {}
    result = { error: err.message };
  }

  return { result, post: (await store.getPost(post.id)) || post };
}

async function generateAndPost(post, { account, useAI }) {
  // Build the full catalog: each category with its active products (from DB).
  const categories = await store.listCategories();
  if (!categories.length) throw new Error("No categories seeded — run seed first");
  const catalog = [];
  for (const c of categories) {
    const products = (await store.listActiveProductsByCategory(c.id)).filter((p) => p.imageUrl);
    if (products.length) catalog.push({ id: c.id, name: c.name, slug: c.slug, products });
  }
  if (!catalog.length) throw new Error("No active products with images in any category — run seed first");

  // Product page base (configurable in site settings); links become <base>/<product-slug>
  const siteBase = String(await store.getSetting("site_url", "viliv.store"))
    .trim()
    .replace(/\/+$/, "");

  // Rotate the theme across categories so generated posts are not monotonous
  // (the AI tends to always pick its favorite category. We lock a rotating
  // theme but still let the AI choose products freely across the catalog).
  const theme = useAI ? await nextTheme(catalog) : null;
  const gen = useAI
    ? await generatePost({ accountName: account.name, categories: catalog, siteBase, forceTheme: theme })
    : generateLocalPost(catalog, siteBase);

  post = await store.updatePost(post.id, {
    theme: gen.category,
    hook: gen.hook,
    slides: JSON.stringify(gen.slides),
    outro: JSON.stringify(gen.outro ? [gen.outro] : []),
    caption: gen.caption,
    content_json: gen.content_json,
  });

  const slides = gen.slides;
  const contentChecksum = (gen.hook + "|" + JSON.stringify(slides)).trim();

  // Dedupe: skip if exactly the same content was already posted for this account
  const all = await store.listPosts({ accountId: account.id });
  const dup = all.find((v) => {
    try {
      const s = v.slides ? JSON.parse(v.slides) : [];
      return v.status === "success" && s && (v.hook + "|" + JSON.stringify(s)) === contentChecksum;
    } catch {
      return false;
    }
  });
  if (dup) {
    await store.deletePost(post.id);
    return { status: "dup", skipped: true };
  }

  if (!slides.length) {
    throw new Error("No active products in this category");
  }

  // Render carousel images with Playwright
  const rendered = await renderCarouselToOutput({ ...post, slides, outro: gen.outro }, `${Date.now()}`);
  const files = rendered.map((r) => r.name);
  post = await store.updatePost(post.id, {
    images_dir: rendered[0]?.name.split("/")[0] || "",
    image_files: JSON.stringify(files),
  });

  return uploadWithRetry(post, files);
}

// Fisher–Yates shuffle (random each call so consecutive generates vary).
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a carousel post locally, without any AI call. Pulls products from the
// ENTIRE catalog (all categories), shuffles them, picks 3..MAX_SLIDES, and
// assigns each product a lifestyle tip from the copybook (the product is the
// "answer"). Hook + outro are drawn from pools so output varies per generate.
export function generateLocalPost(categories, siteBase = "viliv.store") {
  // Map product id -> category slug so each product gets tips matched to its
  // own category (products may come from different categories after top-up).
  const productCat = new Map();
  const all = [];
  for (const c of categories || []) {
    for (const p of c.products || []) {
      productCat.set(p.id, c.slug);
      all.push(p);
    }
  }

  const used = shuffle(all).slice(0, Math.min(MAX_SLIDES, all.length));

  const chosen = (categories || []).find((c) => (c.products || []).length) || (categories || [])[0] || null;
  const products = used.slice(0, Math.max(MIN_SLIDES, Math.min(MAX_SLIDES, used.length)));

  const usedTips = new Map();
  const slides = products.map((p, i) => {
    const key = productCat.get(p.id) || (chosen ? chosen.slug : "");
    const tipPool = tipPoolFor(key);
    const offset = usedTips.get(key) || 0;
    usedTips.set(key, offset + 1);
    const tip = tipPool[offset % tipPool.length] || { title: p.name, sub: "", productHint: "" };
    return {
      productId: p.id,
      product: p.name,
      title: tip.title || p.name,
      subtitle: tip.sub || "",
      image: p.imageUrl || "",
      link: productPageUrl(p.slug, siteBase),
      category: (categories || []).find((c) => c.slug === key)?.name || "",
      index: i + 1,
    };
  });

  const hooks = hookPoolFor(dominantSlug(used, productCat));
  const outroLine = OUTRO_POOL[Math.floor(Math.random() * OUTRO_POOL.length)];

  return {
    category: chosen ? chosen.name : "",
    hook: hooks[Math.floor(Math.random() * hooks.length)],
    slides,
    outro: { line: outroLine },
    caption: `${hooks[0]} Curated by Viliv.`,
    content_json: "",
  };
}

// The category slug that appears in the most chosen products (drives the cover
// hook pool so the headline matches what the carousel is actually about).
function dominantSlug(products, productCat) {
  const counts = new Map();
  for (const p of products || []) {
    const key = (productCat && productCat.get(p.id)) || "";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}

async function uploadWithRetry(post, files) {
  const account = await store.getAccount(post.account_id);
  const token = account.buffer_token;
  const publicUrl = process.env.PUBLIC_URL;

  let lastErr = null;
  try {
    post = await store.incrementAttempts(post.id);
    if (!token || !publicUrl) {
      throw new Error(`Skipping Buffer publish (PUBLIC_URL${token ? " not set" : " & token not set"})`);
    }
    if (!files || !files.length) throw new Error("No rendered images to upload");

    const imageUrls = files.map((f) => `${publicUrl}/carousel/${f}`);

    const { channels } = await getChannels(token);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const results = [];
        for (const ch of channels) {
          // YouTube is skipped: Buffer does not support carousels there.
          if (ch.service === "youtube") continue;
          await createCarouselPost(token, ch.id, post.caption, imageUrls, ch.service);
          results.push({ channel: ch.name, service: ch.service, ok: true });
          console.log(`[pipeline] Posted carousel to ${ch.name} (${ch.service})`);
        }
        post = await store.updatePost(post.id, { status: "success", posted_at: new Date().toISOString(), last_error: null });
        return { status: "success", channels: results };
      } catch (err) {
        lastErr = err.message;
        console.error(`[pipeline] upload attempt ${attempt + 1} failed: ${err.message}`);
        if (attempt < MAX_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    }
  } catch (err) {
    lastErr = err.message;
    console.error(`[pipeline] upload failed: ${err.message}`);
  }

  post = await store.updatePost(post.id, { status: "failed", last_error: lastErr });
  return { status: "failed", error: lastErr };
}

export async function runManualRetry(postId) {
  let post = await store.getPost(postId);
  if (!post) return { error: "Post not found" };
  if (post.status === "success") return { status: "already-success" };

  const account = await store.getAccount(post.account_id);
  if (!account) return { error: "Account not found" };

  // If images were never rendered, re-run the whole slot content.
  if (!post.image_files) {
    return runPipeline({});
  }

  post = await store.updatePost(post.id, { status: "pending", last_error: null });
  const files = safeFiles(post.image_files);
  const result = await uploadWithRetry(post, files);
  return { result, post };
}

function safeFiles(image_files) {
  try {
    const arr = JSON.parse(image_files || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}