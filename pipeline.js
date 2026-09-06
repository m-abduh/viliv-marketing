import "dotenv/config";
import { store } from "./db.mjs";
import { generatePost } from "./services/openrouter.js";
import { renderCarouselToOutput } from "./services/renderer.mjs";
import { getChannels, createCarouselPost } from "./services/buffer.js";

const MAX_ATTEMPTS = Number(process.env.RETRY_ATTEMPTS || 3);
const RETRY_DELAY_MS = Number(process.env.RETRY_DELAY_MS || 5000);

export async function nextSlot() {
  const accounts = await store.listAccounts();
  if (!accounts.length) return null;

  const rotation = await store.getSettingJSON("rotation", null);
  const r = rotation && typeof rotation.accountIndex === "number" ? rotation : { accountIndex: 0 };
  const account = accounts[r.accountIndex % accounts.length];
  return { account };
}

export async function runPipeline({ postId } = {}) {
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
    result = await generateAndPost(post, { account });

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

async function generateAndPost(post, { account }) {
  // Build the full catalog: each category with its active products (from DB).
  const categories = await store.listCategories();
  if (!categories.length) throw new Error("No categories seeded — run seed first");
  const catalog = [];
  for (const c of categories) {
    const products = (await store.listActiveProductsByCategory(c.id)).filter((p) => p.imageUrl);
    if (products.length) catalog.push({ id: c.id, name: c.name, slug: c.slug, products });
  }
  if (!catalog.length) throw new Error("No active products with images in any category — run seed first");

  const gen = await generatePost({ accountName: account.name, categories: catalog });

  post = await store.updatePost(post.id, {
    theme: gen.category,
    hook: gen.hook,
    slides: JSON.stringify(gen.slides),
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
  const rendered = await renderCarouselToOutput({ ...post, slides }, `${Date.now()}`);
  const files = rendered.map((r) => r.name);
  post = await store.updatePost(post.id, {
    images_dir: rendered[0]?.name.split("/")[0] || "",
    image_files: JSON.stringify(files),
  });

  return uploadWithRetry(post, files);
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