// READ-ONLY backup of the viliv catalog (categories + products) to a timestamped JSON file.
// This script never writes to the catalog DB — it only issues findMany() calls.
//
// Unlike db.mjs (which degrades to stale/empty data so the UI stays up), this script
// fails loudly: if the DB cannot be reached, it exits non-zero instead of writing a
// file that looks like a valid but empty backup.

import "dotenv/config";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "../db.mjs";

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
      console.warn(`[backup] attempt ${attempt + 1} failed, retrying...`);
      await new Promise((r) => setTimeout(r, baseDelay * 2 ** attempt));
    }
  }
  throw lastErr;
}

function resolveOutPath(argv) {
  const i = argv.indexOf("--out");
  if (i !== -1 && argv[i + 1]) return resolve(argv[i + 1]);
  const d = new Date();
  const stamp =
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  return resolve(`backup_prisma_${stamp}.json`);
}

async function main() {
  const categories = await withRetry(() => prisma.category.findMany({ orderBy: { createdAt: "asc" } }));
  const products = await withRetry(() =>
    prisma.product.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] })
  );

  if (!Array.isArray(categories) || !Array.isArray(products)) {
    throw new Error("catalog query returned a non-array result — refusing to write backup");
  }
  if (categories.length === 0 || products.length === 0) {
    throw new Error(
      `catalog returned ${categories.length} categories / ${products.length} products — ` +
        "refusing to write an empty backup (the catalog DB may be unreachable)"
    );
  }

  // Integrity checks — a backup that is missing relations is worse than no backup.
  const catIds = new Set(categories.map((c) => c.id));
  const orphan = products.filter((p) => !catIds.has(p.categoryId));
  if (orphan.length) {
    throw new Error(
      `${orphan.length} product(s) reference a categoryId absent from this export: ` +
        orphan.map((p) => `${p.slug}/${p.name}`).join(", ")
    );
  }
  for (const [field, rows] of [
    ["name", products],
    ["slug", products],
    ["imageUrl", products],
    ["affiliateUrl", products],
  ]) {
    const bad = rows.filter((p) => p[field] === null || p[field] === undefined || p[field] === "");
    if (bad.length) throw new Error(`${bad.length} product(s) have empty ${field} — aborting`);
  }

  // Shape matches earlier exports: exported_at + categories (with nested products)
  // + products (with nested category), so any future restore works against both.
  const byCategory = new Map(categories.map((c) => [c.id, []]));
  for (const p of products) byCategory.get(p.categoryId).push(p);

  const payload = {
    exported_at: new Date().toISOString(),
    categories: categories.map((c) => ({ ...c, products: byCategory.get(c.id) })),
    products: products.map((p) => ({
      ...p,
      category: categories.find((c) => c.id === p.categoryId) ?? null,
    })),
  };

  const out = resolveOutPath(process.argv.slice(2));
  writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const active = products.filter((p) => p.isActive).length;
  console.log(`[backup] wrote ${out}`);
  console.log(`[backup] categories: ${categories.length}`);
  console.log(`[backup] products: ${products.length} (active: ${active}, inactive: ${products.length - active})`);
}

try {
  await main();
  await prisma.$disconnect();
  process.exit(0);
} catch (err) {
  console.error(`[backup] FAILED: ${err.message.split("\n")[0]}`);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
}
