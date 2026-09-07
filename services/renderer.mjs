import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { get as httpsGet } from "https";
import { get as httpGet } from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILDER = join(__dirname, "..", "builder");
const OUT_ROOT = join(__dirname, "..", "output");

if (!existsSync(OUT_ROOT)) mkdirSync(OUT_ROOT, { recursive: true });

const IMAGE_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

// Resolve remote image URLs (following redirects) into embedded data URIs so
// Playwright never waits on / fails to load cross-origin images in file:// pages.
// Family 4 is forced: IPv6 Happy-Eyeballs resolution fails on this host.
const imageCache = new Map();
function dataUriFor(url) {
  if (!url || !url.trim()) return Promise.resolve("");
  return new Promise((resolve) => {
    const key = url.trim();
    if (imageCache.has(key)) return resolve(imageCache.get(key));

    const download = (u, redirectsLeft) => {
      const isHttps = u.startsWith("https://");
      const get = isHttps ? httpsGet : httpGet;
      get(u, { family: 4, headers: { "User-Agent": IMAGE_UA } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
            res.resume();
            const next = new URL(res.headers.location, u).toString();
            return download(next, redirectsLeft - 1);
          }
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            res.resume();
            console.warn(`[renderer] image failed (${u}): HTTP ${res.statusCode}`);
            imageCache.set(key, "");
            return resolve("");
          }
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const buf = Buffer.concat(chunks);
            const ct = (res.headers["content-type"] || "image/jpeg").split(";")[0].trim();
            const data = `data:${ct};base64,${buf.toString("base64")}`;
            imageCache.set(key, data);
            resolve(data);
          });
        }).on("error", (e) => {
          console.warn(`[renderer] image fetch error (${u}): ${e.message}`);
          imageCache.set(key, "");
          resolve("");
        });
    };
    download(key, 5);
  });
}

// Themed placeholder gradients (dummy image source until real product images land).
const PLACEHOLDERS = [
  "linear-gradient(135deg,#6a11cb,#2575fc)",
  "linear-gradient(135deg,#f7971e,#ffd200)",
  "linear-gradient(135deg,#11998e,#38ef7d)",
  "linear-gradient(135deg,#fc466b,#3f5efb)",
  "linear-gradient(135deg,#f857a6,#ff5858)",
  "linear-gradient(135deg,#5f2c82,#49a09d)",
  "linear-gradient(135deg,#ee9ca7,#ffdde1)",
  "linear-gradient(135deg,#0f2027,#2c5364)",
];

function renderTemplate(tpl, data) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    data[key] != null ? String(data[key]) : ""
  );
}

function escapeAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Build a CSS background value from a data URL-safe SVG placeholder.
function placeholderCSS(index) {
  const g = PLACEHOLDERS[index % PLACEHOLDERS.length];
  return escapeAttr(g);
}

async function bgCSS(image, index) {
  if (image && image.trim()) {
    const data = await dataUriFor(image);
    if (data) return escapeAttr(`url('${data}')`);
    console.warn(`[renderer] using placeholder for missing image: ${image}`);
  }
  return placeholderCSS(index);
}

/**
 * Render a carousel to PNG images with Playwright.
 * @param {object} post - { hook, slides: [{title,image,link}], theme, account }
 * @param {string} outDir - absolute directory to write slide images into
 * @returns {Promise<string[]>} relative paths of rendered PNGs (slide 1..N)
 */
export async function renderCarousel({ hook, slides, theme, account }, outDir) {
  mkdirSync(outDir, { recursive: true });
  const coverTpl = readFileSync(join(BUILDER, "cover.html"), "utf-8");
  const slideTpl = readFileSync(join(BUILDER, "slide.html"), "utf-8");

  const list = slides && slides.length ? slides : [];
  const total = list.length + 1; // +1 cover slide

  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 2,
  });

  const files = [];
  try {
    const htmls = [];

    // Slide 1: cover — uses an existing slide's image (last slide by default,
    // so it never duplicates the first slide's urlImage). Fallback to brand
    // gradient if there are no slides with an image.
    const coverSlide = list.slice().reverse().find((s) => s.image && s.image.trim());
    const coverBg = coverSlide ? coverSlide.image : "";
    let coverHtml = renderTemplate(coverTpl, {
      kicker: theme || "Curated by",
      hook: escapeAttr(hook || ""),
      bg: await bgCSS(coverBg, 0),
    });
    htmls.push(coverHtml);

    // Slides 2+: content
    for (const [i, s] of list.entries()) {
      const idx = i + 1;
      let h = renderTemplate(slideTpl, {
        img: await bgCSS(s.image, idx),
        index: `${idx}`,
        title: escapeAttr(s.title || ""),
        link: escapeAttr(s.link || "Shop now"),
      });
      htmls.push(h);
    }

    for (let i = 0; i < htmls.length; i++) {
      const file = `${i + 1}.png`;
      const htmlPath = i === 0
        ? join(BUILDER, "_cover.html")
        : join(BUILDER, `_slide_${i + 1}.html`);
      writeFileSync(htmlPath, htmls[i], "utf-8");
      await page.goto("file://" + htmlPath, { waitUntil: "networkidle" });
      await page.waitForTimeout(250);
      await page.screenshot({ path: join(outDir, file) });
      files.push(file);
    }
  } finally {
    await browser.close();
  }

  return files.map((f) => join(outDir, f));
}

// Render one post's carousel into output/<postId>/ folder, return relative paths.
export async function renderCarouselToOutput(post, outputFolderName) {
  const accountName = post.account_name || "viliv";
  const base = `${accountName.replace(/[^a-zA-Z0-9-_]+/g, "-")}-${outputFolderName}`;
  const dir = join(OUT_ROOT, base);
  const paths = await renderCarousel(
    {
      hook: post.hook,
      slides: post.slides,
      theme: post.theme || "",
      account: accountName,
    },
    dir
  );
  return paths.map((p) => ({ absolute: p, name: join(base, p.split(/[\\/]/).pop()) }));
}