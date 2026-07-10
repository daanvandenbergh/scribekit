/**
 * Pure, fs-free blog SEO builders: Next.js-compatible page metadata and schema.org JSON-LD for
 * the blog index and individual posts. No `next` or `react` import - the returned metadata is a
 * structural {@link PageMetadata} that stays assignable to Next's `Metadata`, and JSON-LD is
 * returned as a plain object for the consumer to serialise into a
 * `<script type="application/ld+json">`.
 *
 * The generic SEO primitives (`absoluteUrl`, `ogLocale`, `hreflangMap`, the i18n `buildSitemap`)
 * live in `../shared/seo.js` and are shared with the docs module; URLs are built exclusively via
 * {@link localePath}, the same helper the React components use, so the canonical/hreflang
 * metadata can never drift from the rendered links. For a single-language blog the output is
 * unchanged: `defaultLocale` falls back to the post's own `lang`, so every URL is the unprefixed
 * `<basePath>/<slug>`.
 */

import { localePath } from "../shared/locales.js";
import { absoluteUrl, ogLocale, hreflangMap, FALLBACK_LOCALE, type JsonLd } from "../shared/seo.js";
import type { PageMetadata, PostMeta, SiteConfig } from "./types.js";

export type { JsonLd };

/**
 * The author to attribute a post to: its own author, else the site default, else the brand.
 *
 * @param meta - the post's front-matter.
 * @param site - the site configuration.
 * @returns the resolved author name.
 */
function authorOf(meta: PostMeta, site: SiteConfig): string {
    return meta.author ?? site.defaultAuthor ?? site.brandName;
}

/**
 * The blog index description, falling back to a generic brand string.
 *
 * @param site - the site configuration.
 * @returns the description used for the index metadata and CollectionPage.
 */
function overviewDescription(site: SiteConfig): string {
    return site.description ?? `The ${site.brandName} blog.`;
}

/**
 * Builds the hreflang `alternates.languages` map for a post from its translations. Returns
 * `undefined` when the post is not translated, so single-language posts emit no hreflang tags.
 *
 * @param meta - the post's front-matter.
 * @param site - the site configuration.
 * @param translations - the language codes the slug is available in.
 * @param defaultLocale - the locale served without a URL prefix.
 * @returns a `hreflang -> path` map, or `undefined` when there is only one translation.
 */
function postLanguages(
    meta: PostMeta,
    site: SiteConfig,
    translations: string[],
    defaultLocale: string,
): Record<string, string> | undefined {
    return hreflangMap(translations, defaultLocale, (lang) =>
        localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang, slug: meta.slug }));
}

/**
 * Builds the hreflang `alternates.languages` map for the blog index across every configured
 * locale's overview URL, with an `x-default` entry for the default locale. Returns `undefined`
 * for a single-language blog.
 *
 * @param site - the site configuration.
 * @param langs - the configured locale codes.
 * @param defaultLocale - the locale served without a URL prefix.
 * @returns a `hreflang -> path` map, or `undefined` when fewer than two locales exist.
 */
function overviewLanguages(
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
 * Builds Next.js page metadata for a single post from its front-matter.
 *
 * Sets `metadataBase` from `site.siteUrl` (so relative canonical/OG image paths resolve), a
 * root-relative canonical, hreflang `alternates.languages` for the post's translations, and
 * OpenGraph `article` (with `og:locale`) + Twitter `summary_large_image` tags.
 *
 * @param meta - the post's normalised front-matter.
 * @param site - the site configuration.
 * @param translations - the language codes this slug is available in. Defaults to just the
 *   post's own language (no hreflang alternates emitted).
 * @returns the page metadata, assignable to Next's `Metadata`.
 */
export function buildPostMetadata(
    meta: PostMeta,
    site: SiteConfig,
    translations: string[] = [meta.lang],
): PageMetadata {
    const defaultLocale = site.defaultLocale ?? meta.lang;
    const author = authorOf(meta, site);
    const url = localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: meta.lang, slug: meta.slug });
    const languages = postLanguages(meta, site, translations, defaultLocale);
    const alternateLocale = translations.filter((lang) => lang !== meta.lang);
    return {
        metadataBase: new URL(site.siteUrl),
        title: `${meta.title} | ${site.brandName}`,
        description: meta.description,
        keywords: meta.keywords,
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
 * Builds Next.js page metadata for the blog index page of one language.
 *
 * @param site - the site configuration.
 * @param lang - the language whose index this is. Defaults to `site.defaultLocale`.
 * @param langs - every configured locale code, used to build the hreflang alternates. Defaults
 *   to none (no hreflang emitted, single-language behaviour).
 * @returns the page metadata, assignable to Next's `Metadata`.
 */
export function buildOverviewMetadata(site: SiteConfig, lang?: string, langs: string[] = []): PageMetadata {
    const resolvedLang = lang ?? site.defaultLocale ?? FALLBACK_LOCALE;
    const defaultLocale = site.defaultLocale ?? resolvedLang;
    const description = overviewDescription(site);
    const url = localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: resolvedLang });
    const languages = overviewLanguages(site, langs, defaultLocale);
    return {
        metadataBase: new URL(site.siteUrl),
        title: `Blog | ${site.brandName}`,
        description,
        alternates: { canonical: url, languages },
        openGraph: {
            type: "website",
            url,
            siteName: site.brandName,
            title: `${site.brandName} Blog`,
            description,
            locale: ogLocale(resolvedLang),
        },
        twitter: { card: "summary_large_image" },
    };
}

/**
 * Builds schema.org JSON-LD for a single post: a `BlogPosting` (with `inLanguage`) plus a
 * `BreadcrumbList`. All URLs are fully absolute (built from `site.siteUrl`), because
 * `metadataBase` does not apply to JSON-LD.
 *
 * When the slug is translated, the `BlogPosting` also links its siblings: the original-language
 * version (the default locale, or the first translation when the default is absent) carries a
 * `workTranslation` array of the other versions, and every translation carries a
 * `translationOfWork` reference back to that original. Each reference is a `{ @type, @id, url,
 * inLanguage }` node so a single language's URL and language are self-describing.
 *
 * @param meta - the post's normalised front-matter.
 * @param site - the site configuration.
 * @param translations - the language codes this slug is available in, default-locale first.
 *   Defaults to just the post's own language (no translation cross-links emitted).
 * @returns the JSON-LD `@graph` document.
 */
export function postJsonLd(meta: PostMeta, site: SiteConfig, translations: string[] = [meta.lang]): JsonLd {
    const defaultLocale = site.defaultLocale ?? meta.lang;
    const origin = new URL(site.siteUrl).origin;
    const author = authorOf(meta, site);
    const url = absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: meta.lang, slug: meta.slug }));
    const blogUrl = absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: meta.lang }));
    // A self-describing reference to one language's version of this slug.
    const refFor = (lang: string): JsonLd => {
        const u = absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang, slug: meta.slug }));
        return { "@type": "BlogPosting", "@id": u, url: u, inLanguage: lang };
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
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "@id": url,
                url,
                headline: meta.title,
                description: meta.description,
                inLanguage: meta.lang,
                ...translationLinks,
                datePublished: meta.date || undefined,
                dateModified: meta.updated ?? (meta.date || undefined),
                author: site.authorId ? { "@id": site.authorId } : { "@type": "Organization", name: author },
                publisher: site.organizationId
                    ? { "@id": site.organizationId }
                    : { "@type": "Organization", name: site.brandName, url: origin },
                ...(site.websiteId ? { isPartOf: { "@id": site.websiteId } } : {}),
                ...(meta.image ? { image: absoluteUrl(site.siteUrl, meta.image) } : {}),
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Home", item: origin },
                    { "@type": "ListItem", position: 2, name: "Blog", item: blogUrl },
                    { "@type": "ListItem", position: 3, name: meta.title, item: url },
                ],
            },
        ],
    };
}

/**
 * Builds schema.org JSON-LD for the blog index of one language: a `CollectionPage`, a
 * `BreadcrumbList`, and (when posts exist) an `ItemList` of the posts. All URLs are fully
 * absolute.
 *
 * @param posts - the language's posts' front-matter, in display order.
 * @param site - the site configuration.
 * @param lang - the language whose index this is. Defaults to `site.defaultLocale`.
 * @returns the JSON-LD `@graph` document.
 */
export function overviewJsonLd(posts: PostMeta[], site: SiteConfig, lang?: string): JsonLd {
    const resolvedLang = lang ?? site.defaultLocale ?? FALLBACK_LOCALE;
    const defaultLocale = site.defaultLocale ?? resolvedLang;
    const origin = new URL(site.siteUrl).origin;
    const blogUrl = absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: resolvedLang }));
    const description = overviewDescription(site);
    const graph: JsonLd[] = [
        {
            "@type": "CollectionPage",
            "@id": blogUrl,
            url: blogUrl,
            name: `${site.brandName} Blog`,
            description,
            ...(site.organizationId ? { publisher: { "@id": site.organizationId } } : {}),
            ...(site.websiteId ? { isPartOf: { "@id": site.websiteId } } : {}),
        },
        {
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: origin },
                { "@type": "ListItem", position: 2, name: "Blog", item: blogUrl },
            ],
        },
    ];
    if (posts.length > 0) {
        graph.push({
            "@type": "ItemList",
            itemListElement: posts.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(site.siteUrl, localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: p.lang, slug: p.slug })),
                name: p.title,
            })),
        });
    }
    return { "@context": "https://schema.org", "@graph": graph };
}
