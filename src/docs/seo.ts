/**
 * Pure, fs-free docs SEO builders: Next.js-compatible page metadata and schema.org JSON-LD for
 * the docs index and individual documentation pages. No `next` or `react` import - the returned
 * metadata is a structural {@link PageMetadata} assignable to Next's `Metadata`, and JSON-LD is a
 * plain object for the consumer to serialise into a `<script type="application/ld+json">`.
 *
 * A documentation page is modelled as a `TechArticle` (rather than a blog's `BlogPosting`). The
 * generic SEO primitives (`absoluteUrl`, `ogLocale`, `hreflangMap`) and the i18n sitemap builder
 * live in `../shared/seo.js` and are shared with the blog; URLs are built exclusively via
 * {@link localePath} so the canonical/hreflang metadata can never drift from the rendered links.
 */

import { localePath } from "../shared/locales.js";
import { absoluteUrl, ogLocale, hreflangMap, FALLBACK_LOCALE, type JsonLd } from "../shared/seo.js";
import type { DocMeta, NavItem, PageMetadata, SiteConfig } from "./types.js";

export type { JsonLd };

/** Human-readable name for the docs section, used in titles and breadcrumbs. */
const SECTION_NAME = "Docs";

/**
 * The author to attribute a page to: the site default, else the brand (docs pages have no
 * per-page author of their own).
 *
 * @param site - the site configuration.
 * @returns the resolved author name.
 */
function authorOf(site: SiteConfig): string {
    return site.defaultAuthor ?? site.brandName;
}

/**
 * The docs index description, falling back to a generic brand string.
 *
 * @param site - the site configuration.
 * @returns the description used for the index metadata and CollectionPage.
 */
function indexDescription(site: SiteConfig): string {
    return site.description ?? `The ${site.brandName} documentation.`;
}

/**
 * Builds the hreflang `alternates.languages` map for a page from its translations. Returns
 * `undefined` when the page is not translated, so single-language pages emit no hreflang tags.
 *
 * @param meta - the page's front-matter.
 * @param site - the site configuration.
 * @param translations - the language codes the slug is available in.
 * @param defaultLocale - the locale served without a URL prefix.
 * @returns a `hreflang -> path` map, or `undefined` when there is only one translation.
 */
function docLanguages(
    meta: DocMeta,
    site: SiteConfig,
    translations: string[],
    defaultLocale: string,
): Record<string, string> | undefined {
    return hreflangMap(translations, defaultLocale, (lang) =>
        localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang, slug: meta.slug }));
}

/**
 * Builds the hreflang `alternates.languages` map for the docs index across every configured
 * locale's index URL, with an `x-default` entry for the default locale. Returns `undefined` for
 * a single-language docs site.
 *
 * @param site - the site configuration.
 * @param langs - the configured locale codes.
 * @param defaultLocale - the locale served without a URL prefix.
 * @returns a `hreflang -> path` map, or `undefined` when fewer than two locales exist.
 */
function indexLanguages(
    site: SiteConfig,
    langs: string[],
    defaultLocale: string,
): Record<string, string> | undefined {
    if (langs.length <= 1) {
        return undefined;
    }
    const languages: Record<string, string> = {};
    for (const lang of langs) {
        languages[lang] = localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang });
    }
    languages["x-default"] = localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: defaultLocale });
    return languages;
}

/**
 * Builds Next.js page metadata for a single documentation page from its front-matter.
 *
 * Sets `metadataBase` from `site.siteUrl`, a root-relative canonical, hreflang
 * `alternates.languages` for the page's translations, and OpenGraph `article` (with `og:locale`)
 * + Twitter `summary_large_image` tags.
 *
 * A `hidden` page additionally carries `robots: { index: false }` (noindex), so a draft or
 * deep-linked page is kept out of search-engine indexes even though it stays routable (and is
 * likewise dropped from the sitemap - see {@link import("./docs.js").Docs.sitemapEntries}).
 *
 * @param meta - the page's normalised front-matter.
 * @param site - the site configuration.
 * @param translations - the language codes this slug is available in. Defaults to just the page's
 *   own language (no hreflang alternates emitted).
 * @returns the page metadata, assignable to Next's `Metadata`.
 */
export function buildDocMetadata(
    meta: DocMeta,
    site: SiteConfig,
    translations: string[] = [meta.lang],
): PageMetadata {
    const defaultLocale = site.defaultLocale ?? meta.lang;
    const author = authorOf(site);
    const url = localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: meta.lang, slug: meta.slug });
    const languages = docLanguages(meta, site, translations, defaultLocale);
    const alternateLocale = translations.filter((lang) => lang !== meta.lang);
    return {
        metadataBase: new URL(site.siteUrl),
        title: `${meta.title} | ${site.brandName}`,
        description: meta.description,
        keywords: meta.keywords,
        ...(meta.hidden ? { robots: { index: false } } : {}),
        authors: [{ name: author }],
        alternates: { canonical: url, languages },
        openGraph: {
            type: "article",
            url,
            siteName: site.brandName,
            title: meta.title,
            description: meta.description,
            publishedTime: meta.date || undefined,
            modifiedTime: meta.updated ?? (meta.date || undefined),
            authors: [author],
            images: meta.image ? [{ url: meta.image }] : undefined,
            locale: ogLocale(meta.lang),
            alternateLocale: alternateLocale.length > 0 ? alternateLocale.map(ogLocale) : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: meta.title,
            description: meta.description,
            images: meta.image ? [meta.image] : undefined,
        },
    };
}

/**
 * Builds Next.js page metadata for the docs index page of one language.
 *
 * @param site - the site configuration.
 * @param lang - the language whose index this is. Defaults to `site.defaultLocale`.
 * @param langs - every configured locale code, used to build the hreflang alternates. Defaults
 *   to none (no hreflang emitted, single-language behaviour).
 * @returns the page metadata, assignable to Next's `Metadata`.
 */
export function buildIndexMetadata(site: SiteConfig, lang?: string, langs: string[] = []): PageMetadata {
    const resolvedLang = lang ?? site.defaultLocale ?? FALLBACK_LOCALE;
    const defaultLocale = site.defaultLocale ?? resolvedLang;
    const description = indexDescription(site);
    const url = localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: resolvedLang });
    const languages = indexLanguages(site, langs, defaultLocale);
    return {
        metadataBase: new URL(site.siteUrl),
        title: `${SECTION_NAME} | ${site.brandName}`,
        description,
        alternates: { canonical: url, languages },
        openGraph: {
            type: "website",
            url,
            siteName: site.brandName,
            title: `${site.brandName} ${SECTION_NAME}`,
            description,
            locale: ogLocale(resolvedLang),
        },
        twitter: { card: "summary_large_image" },
    };
}

/**
 * Builds schema.org JSON-LD for a single documentation page: a `TechArticle` (with `inLanguage`)
 * plus a `BreadcrumbList` (`Home > Docs > [group] > page`). All URLs are fully absolute (built
 * from `site.siteUrl`), because `metadataBase` does not apply to JSON-LD.
 *
 * When the slug is translated, the `TechArticle` also links its siblings: the original-language
 * version carries a `workTranslation` array of the other versions, and every translation carries a
 * `translationOfWork` reference back to the original (each a self-describing `{ @type, @id, url,
 * inLanguage }` node), mirroring the blog's cross-links.
 *
 * @param meta - the page's normalised front-matter.
 * @param site - the site configuration.
 * @param translations - the language codes this slug is available in, default-locale first.
 *   Defaults to just the page's own language (no translation cross-links emitted).
 * @returns the JSON-LD `@graph` document.
 */
export function docJsonLd(meta: DocMeta, site: SiteConfig, translations: string[] = [meta.lang]): JsonLd {
    const defaultLocale = site.defaultLocale ?? meta.lang;
    const origin = new URL(site.siteUrl).origin;
    const author = authorOf(site);
    const url = absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: meta.lang, slug: meta.slug }));
    const indexUrl = absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: meta.lang }));
    // A self-describing reference to one language's version of this slug.
    const refFor = (lang: string): JsonLd => {
        const u = absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang, slug: meta.slug }));
        return { "@type": "TechArticle", "@id": u, url: u, inLanguage: lang };
    };
    // Original = default locale when translated, else the first translation (mirrors x-default).
    const others = translations.filter((lang) => lang !== meta.lang);
    const original = translations.includes(defaultLocale) ? defaultLocale : translations[0];
    const translationLinks: JsonLd =
        others.length === 0
            ? {}
            : meta.lang === original
              ? { workTranslation: others.map(refFor) }
              : { translationOfWork: refFor(original) };
    // Breadcrumb: Home > Docs > [group name-only] > page.
    const crumbs: JsonLd[] = [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        { "@type": "ListItem", position: 2, name: SECTION_NAME, item: indexUrl },
    ];
    if (meta.group) {
        crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: meta.group });
    }
    crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: meta.title, item: url });
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TechArticle",
                "@id": url,
                url,
                headline: meta.title,
                description: meta.description,
                inLanguage: meta.lang,
                ...translationLinks,
                ...(meta.date ? { datePublished: meta.date } : {}),
                ...((meta.updated ?? meta.date) ? { dateModified: meta.updated ?? meta.date } : {}),
                author: site.authorId ? { "@id": site.authorId } : { "@type": "Organization", name: author },
                publisher: site.organizationId
                    ? { "@id": site.organizationId }
                    : { "@type": "Organization", name: site.brandName, url: origin },
                ...(site.websiteId ? { isPartOf: { "@id": site.websiteId } } : {}),
                ...(meta.image ? { image: absoluteUrl(site.siteUrl, meta.image) } : {}),
            },
            { "@type": "BreadcrumbList", itemListElement: crumbs },
        ],
    };
}

/**
 * Builds schema.org JSON-LD for the docs index of one language: a `CollectionPage`, a
 * `BreadcrumbList` (`Home > Docs`), and (when pages exist) an `ItemList` of the pages in sidebar
 * order. All URLs are fully absolute.
 *
 * @param items - the language's pages as flattened nav items, in sidebar order (typically
 *   `flattenNav(Docs.getNavTree(lang))`).
 * @param site - the site configuration.
 * @param lang - the language whose index this is. Defaults to `site.defaultLocale`.
 * @returns the JSON-LD `@graph` document.
 */
export function indexJsonLd(items: NavItem[], site: SiteConfig, lang?: string): JsonLd {
    const resolvedLang = lang ?? site.defaultLocale ?? FALLBACK_LOCALE;
    const defaultLocale = site.defaultLocale ?? resolvedLang;
    const origin = new URL(site.siteUrl).origin;
    const indexUrl = absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: resolvedLang }));
    const description = indexDescription(site);
    const graph: JsonLd[] = [
        {
            "@type": "CollectionPage",
            "@id": indexUrl,
            url: indexUrl,
            name: `${site.brandName} ${SECTION_NAME}`,
            description,
            ...(site.organizationId ? { publisher: { "@id": site.organizationId } } : {}),
            ...(site.websiteId ? { isPartOf: { "@id": site.websiteId } } : {}),
        },
        {
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: origin },
                { "@type": "ListItem", position: 2, name: SECTION_NAME, item: indexUrl },
            ],
        },
    ];
    if (items.length > 0) {
        graph.push({
            "@type": "ItemList",
            itemListElement: items.map((item, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(site.siteUrl, item.href),
                name: item.title,
            })),
        });
    }
    return { "@context": "https://schema.org", "@graph": graph };
}
