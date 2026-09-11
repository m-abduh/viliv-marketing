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
// Downscaled etalase thumbnails (small square PNG data URIs), keyed by URL.
const thumbCache = new Map();

// Friendly link label for product slides: strip protocol/path, e.g.
// "https://viliv.store/gym-roller" -> "on viliv.store →".
function linkLabel(url) {
  const s = String(url || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .replace(/\/.*$/, "");
  return s ? `on ${s} \u2192` : "";
}
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
 * @param {object} post - { hook, slides: [{product,title,subtitle,image,link}], outro, theme, account }
 * @param {string} outDir - absolute directory to write slide images into
 * @returns {Promise<string[]>} relative paths of rendered PNGs (slide 1..N)
 */
export async function renderCarousel({ hook, slides, outro, theme, account }, outDir) {
  mkdirSync(outDir, { recursive: true });
  const coverTpl = readFileSync(join(BUILDER, "cover.html"), "utf-8");
  const slideTpl = readFileSync(join(BUILDER, "slide.html"), "utf-8");
  const outroTpl = readFileSync(join(BUILDER, "outro.html"), "utf-8");

  const list = slides && slides.length ? slides : [];
  const total = list.length + 2; // +1 cover slide, +1 outro

  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1350 },
    // 1x → 1080x1350 PNG (1,458,000 px) fits Buffer's TikTok pixel cap
    // (2,073,600) while staying exactly at Instagram's recommended feed size.
    deviceScaleFactor: 1,
  });
  // Small page used to downscale product images into lightweight etalase
  // thumbnails so slides stay small instead of embedding full-res images.
  const thumbPage = await browser.newPage({ viewport: { width: 120, height: 120 }, deviceScaleFactor: 1 });

  async function thumbDataUri(url) {
    if (!url || !url.trim()) return "";
    if (thumbCache.has(url)) return thumbCache.get(url);
    const big = await dataUriFor(url);
    if (!big) {
      thumbCache.set(url, "");
      return "";
    }
    try {
      await thumbPage.setContent(
        `<body style="margin:0;background:#f2f2f4"><div style="width:120px;height:120px;background-image:url(${big});background-size:cover;background-position:center"></div></body>`
      );
      await thumbPage.waitForTimeout(60);
      const shot = await thumbPage.screenshot({ clip: { x: 0, y: 0, width: 120, height: 120 } });
      const small = `data:image/png;base64,${shot.toString("base64")}`;
      thumbCache.set(url, small);
      return small;
    } catch {
      thumbCache.set(url, big); // fallback: still works, just heavier
      return big;
    }
  }

  const files = [];
  try {
    const htmls = [];

    // Slide 1: cover — uses an existing slide's image (last slide by default,
    // so it never duplicates the first slide's urlImage). Fallback to brand
    // gradient if there are no slides with an image.
    const coverSlide = list.slice().reverse().find((s) => s.image && s.image.trim());
    const coverBg = coverSlide ? coverSlide.image : "";
    // Cover must never render with an empty title — last-resort fallback.
    const coverTitle = (hook || "").trim() || "Little upgrades for a better everyday.";
    let coverHtml = renderTemplate(coverTpl, {
      kicker: theme || "Curated by",
      hook: escapeAttr(coverTitle),
      bg: await bgCSS(coverBg, 0),
    });
    htmls.push(coverHtml);

    // Slides 2..N: content (each product = one tip; the product is the answer).
    // Etalase strip: every product of this carousel (from the slides) with the
    // current one highlighted — product thumbnails are downscaled to stay light.
    const etalaseTile = Math.min(118, Math.floor((1080 - 84 * 2 - (list.length - 1) * 18) / Math.max(1, list.length)));
    const etThumbs = list.length ? await Promise.all(list.map((s) => thumbDataUri(s.image))) : [];

    for (const [i, s] of list.entries()) {
      const idx = i + 1;
      const etalase = list
        .map((s2, j) => {
          const on = j === i ? " on" : "";
          const img = etThumbs[j] ? `<i class="timg" style="background-image:url(&quot;${etThumbs[j]}&quot;)"></i>` : "";
          return `<span class="et${on}"><span class="thumb">${img}</span><em>${String(j + 1).padStart(2, "0")}</em><span class="tname">${escapeAttr(s2.product || s2.title || "")}</span></span>`;
        })
        .join("");
      let h = renderTemplate(slideTpl, {
        img: await bgCSS(s.image, idx),
        index: `${String(idx).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
        kicker: escapeAttr(s.category || s.categoryName || ""),
        title: escapeAttr(s.title || ""),
        product: escapeAttr(s.product || s.title || ""),
        link: linkLabel(s.link),
        etalaseStyle: `--ts:${etalaseTile}px`,
        etalase,
      });
      htmls.push(h);
    }

    // Last slide: outro/closing (no product)
    const outroLine = (outro && outro.line) || "Better living, one find at a time.";
    htmls.push(renderTemplate(outroTpl, {
      line: escapeAttr(outroLine),
    }));

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
      outro: post.outro,
      theme: post.theme || "",
      account: accountName,
    },
    dir
  );
  return paths.map((p) => ({ absolute: p, name: join(base, p.split(/[\\/]/).pop()) }));
}