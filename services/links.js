// Product page URL helper: links built from the configurable site base
// (setting `site_url`, default "viliv.store") + the product slug.
// Example: site_url="viliv.store", slug=23 -> "viliv.store/23"
export function productPageUrl(slug, siteBase = "viliv.store") {
  const base = String(siteBase || "viliv.store").trim().replace(/\/+$/, "");
  return `${base}/${slug}`;
}