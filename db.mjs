import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaClient as MarketingClient } from "./prisma/generated/marketing/index.js";

// Catalog client — shared viliv Postgres DB (READ-ONLY, managed by viliv).
export const prisma = new PrismaClient();

// Marketing client — local SQLite DB for this project (settings/accounts/posts).
const mkt = new MarketingClient();

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
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),

  // ---- Products (read-only — data managed via viliv) ----
  listProducts: ({ categoryId } = {}) =>
    prisma.product.findMany({
      where: { ...(categoryId ? { categoryId } : {}) },
      include: { category: true },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    }),
  listActiveProductsByCategory: (categoryId) =>
    prisma.product.findMany({
      where: { categoryId, isActive: true },
      orderBy: { createdAt: "asc" },
    }),

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
        content_json: data.content_json ?? null,
        images_dir: data.images_dir ?? null,
        image_files: data.image_files ?? null,
        status: data.status || "pending",
        attempts: 0,
      },
    }),
  async updatePost(id, patch) {
    const data = {};
    const allowed = ["theme", "hook", "slides", "caption", "content_json", "images_dir", "image_files", "status", "attempts", "last_error", "posted_at"];
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