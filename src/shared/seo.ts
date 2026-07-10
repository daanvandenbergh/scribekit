/**
 * Pure, fs-free SEO primitives shared by every content module's own SEO builders (`blog/seo.ts`,
 * `docs/seo.ts`): absolute-URL resolution, the `og:locale` territory map, the hreflang/`x-default`
 * alternates builder, and the i18n sitemap builder. No `next` or `react` import - the returned
 * sitemap is a structural {@link SitemapEntry}[] assignable to `MetadataRoute.Sitemap`, and
 * JSON-LD is returned by the per-module builders as plain objects.
 *
 * URLs are built exclusively via {@link localePath} from `./locales.js`, the same helper the
 * React components use, so the canonical/hreflang metadata can never drift from the rendered
 * links.
 */

import { localePath } from "./locales.js";
import type { SiteConfig, SitemapEntry } from "./types.js";

/** A schema.org JSON-LD document (a plain, JSON-serialisable object graph). */
export type JsonLd = Record<string, unknown>;

/** Fallback locale used only when neither `site.defaultLocale` nor a page language is known. */
export const FALLBACK_LOCALE = "en";

/**
 * Resolves a root-relative path (or absolute URL) to an absolute URL against the site origin.
 *
 * @param siteUrl - the absolute site origin (`SiteConfig.siteUrl`).
 * @param pathOrUrl - a root-relative path (e.g. `/docs/x`) or an already-absolute URL.
 * @returns the absolute URL string.
 */
export function absoluteUrl(siteUrl: string, pathOrUrl: string): string {
    return new URL(pathOrUrl, siteUrl).toString();
}

/**
 * Maps a language subtag to the territory-qualified locale Open Graph expects (`fr` -> `fr_FR`,
 * `en` -> `en_US`), deriving the territory from the platform's CLDR likely-subtags data via
 * `Intl.Locale`. A tag that already carries a region is preserved (`pt-BR` -> `pt_BR`); a tag
 * with no known territory, or a structurally invalid one, falls back to the bare code unchanged.
 *
 * @param lang - the language code (from a page's `lang` or a locale's `code`).
 * @returns the `language_TERRITORY` string for `og:locale`, or the bare `lang` when no territory
 *   can be derived.
 */
export function ogLocale(lang: string): string {
    try {
        const loc = new Intl.Locale(lang).maximize();
        return loc.region ? `${loc.language}_${loc.region}` : loc.language;
    } catch {
        return lang;
    }
}

/**
 * Builds an hreflang `hreflang -> url` map from a page's translations, including an `x-default`
 * entry pointing at the default locale (or the first translation when the default is not among
 * them). Returns `undefined` when the page has one or no translation, so single-language pages
 * emit no hreflang tags. The single place the hreflang/`x-default` rules live, shared by the page
 * metadata, the index metadata, and the sitemap.
 *
 * @param translations - the language codes the page is available in, default-locale first.
 * @param defaultLocale - the locale served as the `x-default` target.
 * @param urlFor - maps a language code to that translation's URL (root-relative or absolute).
 * @returns a `hreflang -> url` map (including `x-default`), or `undefined` when not translated.
 */
export function hreflangMap(
    translations: string[],
    defaultLocale: string,
    urlFor: (lang: string) => string,
): Record<string, string> | undefined {
    if (translations.length <= 1) {
        return undefined;
    }
    const languages: Record<string, string> = {};
    for (const lang of translations) {
        languages[lang] = urlFor(lang);
    }
    languages["x-default"] = urlFor(translations.includes(defaultLocale) ? defaultLocale : translations[0]);
    return languages;
}

/**
 * Builds i18n sitemap entries: one per `(slug, lang)` page, each with its absolute URL and -
 * when the slug is translated - the full hreflang `alternates.languages` map (every translation
 * plus `x-default`, as absolute URLs). Feed the result straight to a Next.js `sitemap.ts` for an
 * i18n-correct sitemap. Untranslated pages get a bare `{ url }` with no `alternates`.
 *
 * @param refs - every `(slug, lang)` pair to emit (typically `Blog.getPostRefs()` / `Docs.getDocRefs()`).
 * @param site - the site configuration; `siteUrl` makes the URLs absolute.
 * @param translationsOf - maps a slug to the language codes it exists in, default-locale first
 *   (typically `Blog.getTranslations` / `Docs.getTranslations`).
 * @returns one {@link SitemapEntry} per ref, in the order given.
 */
export function buildSitemap(
    refs: { slug: string; lang: string }[],
    site: SiteConfig,
    translationsOf: (slug: string) => string[],
): SitemapEntry[] {
    const defaultLocale = site.defaultLocale ?? FALLBACK_LOCALE;
    const urlFor = (lang: string, slug: string): string =>
        absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang, slug }));
    return refs.map((ref) => {
        const languages = hreflangMap(translationsOf(ref.slug), defaultLocale, (lang) => urlFor(lang, ref.slug));
        const entry: SitemapEntry = { url: urlFor(ref.lang, ref.slug) };
        if (languages) {
            entry.alternates = { languages };
        }
        return entry;
    });
}
