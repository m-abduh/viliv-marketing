import "dotenv/config";
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { rmSync, unlinkSync } from "fs";
import { startScheduler, getSettings } from "./scheduler.js";
import { runPipeline } from "./pipeline.js";
import { store } from "./db.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;
const OUT_DIR = join(__dirname, "output");

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static: rendered carousel slide images (served so Buffer can fetch them via PUBLIC_URL)
app.use("/carousel", express.static(join(__dirname, "output")));

const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get("/", ah(async (req, res) => {
  const [accounts, posts, categories, products] = await Promise.all([
    store.listAccounts(),
    store.listPosts(),
    store.listCategories(),
    store.listProducts(),
  ]);
  const failed = posts.filter((p) => p.status === "failed").length;
  res.render("index", {
    accounts,
    posts,
    failed,
    categories,
    products,
    settings: await getSettings(),
  });
}));

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ---------- Accounts ----------
app.get("/api/accounts", ah(async (req, res) => {
  res.json(await store.listAccounts());
}));

app.get("/api/accounts/:id", ah(async (req, res) => {
  const acc = await store.getAccount(Number(req.params.id));
  if (!acc) return res.status(404).json({ error: "not found" });
  res.json(acc);
}));

app.post("/api/accounts", ah(async (req, res) => {
  const { name, buffer_token } = req.body || {};
  if (!name || !buffer_token) return res.status(400).json({ error: "name and buffer_token required" });
  try {
    res.json(await store.createAccount({ name: name.trim(), buffer_token: buffer_token.trim() }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

app.put("/api/accounts/:id", ah(async (req, res) => {
  const { name, buffer_token } = req.body || {};
  const existing = await store.getAccount(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: "not found" });
  const updated = await store.updateAccount(existing.id, {
    name: name !== undefined ? name : existing.name,
    buffer_token: buffer_token !== undefined ? buffer_token : existing.buffer_token,
  });
  res.json(updated);
}));

app.delete("/api/accounts/:id", ah(async (req, res) => {
  await store.deleteAccount(Number(req.params.id));
  res.json({ ok: true });
}));

app.post("/api/accounts/reorder", ah(async (req, res) => {
  await store.reorderAccounts(req.body?.ids || []);
  res.json({ ok: true });
}));

// ---------- Categories (read-only) ----------
app.get("/api/categories", ah(async (req, res) => {
  res.json(await store.listCategories());
}));

// ---------- Products (read-only) ----------
app.get("/api/products", ah(async (req, res) => {
  const categoryId = req.query.category ? req.query.category : undefined;
  res.json(await store.listProducts({ categoryId }));
}));

// ---------- Posts ----------
app.get("/api/posts", ah(async (req, res) => {
  const accountId = req.query.account_id ? Number(req.query.account_id) : undefined;
  res.json(await store.listPosts({ accountId }));
}));

app.get("/api/posts/:id", ah(async (req, res) => {
  const p = await store.getPost(Number(req.params.id));
  if (!p) return res.status(404).json({ error: "not found" });
  res.json(p);
}));

app.post("/api/posts/:id/retry", ah(async (req, res) => {
  const result = await runPipeline({ postId: Number(req.params.id) });
  res.json(result);
}));

app.delete("/api/posts/:id", ah(async (req, res) => {
  const p = await store.getPost(Number(req.params.id));
  if (p && p.images_dir) {
    try { rmSync(join(OUT_DIR, p.images_dir), { recursive: true, force: true }); } catch {}
  }
  await store.deletePost(Number(req.params.id));
  res.json({ ok: true });
}));

// Manually run the next rotation slot now (generate -> render -> post to Buffer)
// ?no_ai=1 builds the carousel locally from DB products without calling OpenRouter.
app.post("/api/generate", ah(async (req, res) => {
  const useAI = req.query.no_ai !== "1";
  const result = await runPipeline({ useAI });
  res.json(result);
}));

// ---------- Settings ----------
app.get("/api/settings", ah(async (req, res) => {
  const [ppd, tz, ws, we, scheds] = await Promise.all([
    store.getSetting("posts_per_day", "3"),
    store.getSetting("tz", process.env.TZ || "America/New_York"),
    store.getSetting("window_start", "06:00"),
    store.getSetting("window_end", "22:00"),
    getSettings(),
  ]);
  res.json({
    posts_per_day: ppd,
    tz,
    window_start: ws,
    window_end: we,
    schedules: scheds.schedules,
  });
}));

app.put("/api/settings", ah(async (req, res) => {
  const body = req.body || {};
  if (body.posts_per_day !== undefined) await store.setSetting("posts_per_day", body.posts_per_day);
  if (body.tz !== undefined) await store.setSetting("tz", body.tz);
  if (body.window_start !== undefined) await store.setSetting("window_start", body.window_start);
  if (body.window_end !== undefined) await store.setSetting("window_end", body.window_end);
  res.json(await getSettings());
}));

app.post("/generate", ah(async (req, res) => {
  const result = await runPipeline({ postId: req.body?.postId });
  res.json(result);
}));

app.post("/delete", (req, res) => {
  const { file } = req.body;
  if (!file) return res.status(400).json({ error: "Missing file name" });
  const safe = file.replace(/[^a-zA-Z0-9._-]/g, "");
  try {
    unlinkSync(join(__dirname, "output", safe));
    res.redirect("/");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((err, _req, res, _next) => {
  const msg = err && err.message ? err.message : "Terjadi kesalahan.";
  res.status(err.status || 500).json({ error: msg });
});

async function main() {
  await store.listCategories(); // ensure DB reachable
  app.listen(PORT, () => {
    console.log(`[server] Viliv marketing backend on :${PORT}`);
    if (process.env.DISABLE_SCHEDULER !== "1") {
      startScheduler();
    }
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});