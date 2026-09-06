import "dotenv/config";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const store = {
  // ---- Settings ----
  getSetting: (key, fallback = "") =>
    prisma.settings.findUnique({ where: { key } }).then((r) => (r ? r.value : fallback)),
  async setSetting(key, value) {
    await prisma.settings.upsert({
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

  // ---- Accounts ----
  listAccounts: () =>
    prisma.accounts.findMany({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
  getAccount: (id) => prisma.accounts.findUnique({ where: { id } }),
  async createAccount({ name, buffer_token }) {
    const max = await prisma.accounts.aggregate({ _max: { position: true } });
    const pos = (max._max.position ?? -1) + 1;
    return prisma.accounts.create({ data: { name, buffer_token, position: pos } });
  },
  updateAccount: (id, { name, buffer_token }) =>
    prisma.accounts.update({ where: { id }, data: { name, buffer_token } }),
  async deleteAccount(id) {
    await prisma.accounts.delete({ where: { id } });
  },
  async reorderAccounts(ids) {
    await prisma.$transaction(
      ids.map((id, i) => prisma.accounts.update({ where: { id }, data: { position: i } }))
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

  // ---- Posts (carousels) ----
  listPosts: ({ accountId } = {}) =>
    accountId
      ? prisma.posts.findMany({ where: { account_id: accountId }, orderBy: { id: "desc" } })
      : prisma.posts.findMany({ orderBy: { id: "desc" } }),
  getPost: (id) => prisma.posts.findUnique({ where: { id } }),
  createPost: (account, data) =>
    prisma.posts.create({
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
    return prisma.posts.update({ where: { id }, data });
  },
  async deletePost(id) {
    await prisma.posts.delete({ where: { id } });
  },
  incrementAttempts: (id) =>
    prisma.posts.update({ where: { id }, data: { attempts: { increment: 1 } } }),
  countFailed: () => prisma.posts.count({ where: { status: "failed" } }),
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
