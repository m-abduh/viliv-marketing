import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILDER = join(__dirname, "..", "builder");
const OUT_ROOT = join(__dirname, "..", "output");

if (!existsSync(OUT_ROOT)) mkdirSync(OUT_ROOT, { recursive: true });

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

function bgCSS(image, index) {
  if (image && image.trim()) {
    return escapeAttr(`url('${image.trim()}')`);
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

    // Slide 1: cover
    const coverBg = (list[0] && list[0].image) || "";
    let coverHtml = renderTemplate(coverTpl, {
      kicker: theme || "Curated by",
      hook: escapeAttr(hook || ""),
      bg: bgCSS(coverBg, 0),
    });
    htmls.push(coverHtml);

    // Slides 2+: content
    list.forEach((s, i) => {
      const idx = i + 1;
      let h = renderTemplate(slideTpl, {
        img: bgCSS(s.image, idx),
        badge: idx === 1 ? "Viliv Pick" : "",
        index: `${idx}`,
        title: escapeAttr(s.title || ""),
        link: escapeAttr(s.link || "Shop now"),
      });
      htmls.push(h);
    });

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