/**
 * Public surface of the shared primitives module: the framework-free content/date/URL helpers,
 * the generic SEO builders (i18n sitemap + `JsonLd` type), and the shared domain types. Both the
 * `blog` and `docs` modules build on these, and they are re-exported from the package root so
 * `@daanvandenbergh/scribekit` consumers keep importing `slugify`, `formatDate`, `localePath`,
 * `buildSitemap`, and the shared types exactly as before.
 *
 * The internal SEO primitives (`absoluteUrl`, `ogLocale`, `hreflangMap`) are intentionally not
 * re-exported here - they are imported directly from `./seo.js` by each module's own SEO builders
 * and are not part of the package's public API.
 */

export { readingMinutes, slugify, tableOfContents } from "./content.js";
export { formatDate, isoDateString } from "./format.js";
export { localePath, normalizeBasePath } from "./locales.js";
export { buildSitemap, type JsonLd } from "./seo.js";
export type { LocaleConfig, PageMetadata, SiteConfig, SitemapEntry, TocEntry } from "./types.js";
