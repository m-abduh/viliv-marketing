import "dotenv/config";
import { setDefaultResultOrder } from "node:dns";
import { PrismaClient } from "@prisma/client";
import { PrismaClient as MarketingClient } from "./prisma/generated/marketing/index.js";

setDefaultResultOrder("ipv4first");

// Catalog client — shared viliv Postgres DB (READ-ONLY, managed by viliv).
export const prisma = new PrismaClient();

// Marketing client — local SQLite DB for this project (settings/accounts/posts).
const mkt = new MarketingClient();

// Remote catalog DB (Prisma Postgres via pooled.db.prisma.io) is reachable only
// intermittently, so catalog queries are retried and fall back to last-good data
// instead of erroring.
const RETRYABLE_HINTS = [
  "can't reach database server",
  "timed out",
  "etimedout",
  "econnrefused",
  "connection refused",
  "econnreset",
  "ehostunreach",
  "connection terminated",
  "connection closed",
  "socket hang up",
  "pool timeout",
  "failed to connect",
];

const isRetryable = (err) => {
  const m = String(err?.message || "").toLowerCase();
  return RETRYABLE_HINTS.some((hint) => m.includes(hint));
};

async function withRetry(fn, { retries = 3, baseDelay = 500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isRetryable(err)) break;
      await new Promise((r) => setTimeout(r, baseDelay * 2 ** attempt));
    }
  }
  throw lastErr;
}

const staleCache = new Map();

async function withCache(key, fetchFn, { ttl = 60_000, fallback } = {}) {
  const hit = staleCache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.data;
  try {
    const data = await withRetry(fetchFn);
    staleCache.set(key, { at: Date.now(), data });
    return data;
  } catch (err) {
    if (hit) {
      console.warn(`[db] ${key}: catalog DB unreachable, serving stale data:`, err.message.split("\n")[0]);
      return hit.data;
    }
    if (fallback !== undefined) {
      console.warn(`[db] ${key}: catalog DB unreachable, serving empty fallback:`, err.message.split("\n")[0]);
      return fallback;
    }
    throw err;
  }
}

const store = {
  // ---- Settings (local SQLite) ----
  getSetting: (key, fallback = "") =>
    mkt.settings.findUnique({ where: { key } }).then((r) => (r ? r.value : fallback)),
  async setSetting(key, value) {
    await mkt.settings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  },
  async getSettingJSON(key, fallback) {
    try { return JSON.parse(await this.getSetting(key, "null")); }
    catch { return fallback; }
  },
  setSettingJSON: (key, value) => store.setSetting(key, JSON.stringify(value)),

  // ---- Accounts (local SQLite) ----
  listAccounts: () =>
    mkt.accounts.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
  getAccount: (id) => mkt.accounts.findUnique({ where: { id } }),
  async createAccount({ name, buffer_token }) {
    const max = await mkt.accounts.aggregate({ _max: { position: true } });
    const pos = (max._max.position ?? -1) + 1;
    return mkt.accounts.create({ data: { name, buffer_token, position: pos } });
  },
  updateAccount: (id, { name, buffer_token }) =>
    mkt.accounts.update({ where: { id }, data: { name, buffer_token } }),
  async deleteAccount(id) {
    await mkt.accounts.delete({ where: { id } });
  },
  async reorderAccounts(ids) {
    await mkt.$transaction(
      ids.map((id, i) => mkt.accounts.update({ where: { id }, data: { position: i } }))
    );
  },

  // ---- Categories (read-only — data managed via viliv) ----
  listCategories: () =>
    withCache(
      "categories",
      () => prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
      { fallback: [] }
    ),

  // ---- Products (read-only — data managed via viliv) ----
  listProducts: ({ categoryId } = {}) =>
    withCache(
      `products:${categoryId || "*"}`,
      () =>
        prisma.product.findMany({
          where: { ...(categoryId ? { categoryId } : {}) },
          include: { category: true },
          orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
        }),
      { fallback: [] }
    ),
  listActiveProductsByCategory: (categoryId) =>
    withCache(
      `products:active:${categoryId}`,
      () =>
        prisma.product.findMany({
          where: { categoryId, isActive: true },
          orderBy: { createdAt: "asc" },
        }),
      { fallback: [] }
    ),

  // ---- Posts (carousels, local SQLite) ----
  listPosts: ({ accountId } = {}) =>
    accountId
      ? mkt.posts.findMany({ where: { account_id: accountId }, orderBy: { id: "desc" } })
      : mkt.posts.findMany({ orderBy: { id: "desc" } }),
  getPost: (id) => mkt.posts.findUnique({ where: { id } }),
  createPost: (account, data) =>
    mkt.posts.create({
      data: {
        account_id: account?.id ?? null,
        account_name: account?.name ?? "",
        theme: data.theme ?? "",
        hook: data.hook ?? null,
        slides: data.slides ?? null,
        caption: data.caption ?? null,
        outro: data.outro ?? null,
        content_json: data.content_json ?? null,
        images_dir: data.images_dir ?? null,
        image_files: data.image_files ?? null,
        status: data.status || "pending",
        attempts: 0,
      },
    }),
  async updatePost(id, patch) {
    const data = {};
    const allowed = ["theme", "hook", "slides", "caption", "outro", "content_json", "upload_log", "images_dir", "image_files", "status", "attempts", "last_error", "posted_at"];
    for (const k of allowed) if (k in patch) data[k] = patch[k];
    return mkt.posts.update({ where: { id }, data });
  },
  async deletePost(id) {
    await mkt.posts.delete({ where: { id } });
  },
  incrementAttempts: (id) =>
    mkt.posts.update({ where: { id }, data: { attempts: { increment: 1 } } }),
  countFailed: () => mkt.posts.count({ where: { status: "failed" } }),
};

export { store };

// Initialize rotation on boot.
(async () => {
  try {
    await store.setSetting("rotation", JSON.stringify({ accountIndex: 0 }));
  } catch (e) {
    console.error("[db] init rotation failed:", e.message);
  }
})();