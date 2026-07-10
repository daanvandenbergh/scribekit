/**
 * Blog-domain type definitions. The framework-free primitives many modules share
 * (`SiteConfig`, `LocaleConfig`, `TocEntry`, `PageMetadata`, `SitemapEntry`) live in
 * `../shared/types.js` and are re-exported here so every existing `./types.js` import in this
 * module (and the React components' `../blog/types.js` imports) keeps resolving unchanged.
 */

import type { LocaleConfig, SiteConfig } from "../shared/types.js";

export type { LocaleConfig, PageMetadata, SiteConfig, SitemapEntry, TocEntry } from "../shared/types.js";

/**
 * Front-matter for a blog post, normalised from the MDX file's YAML header.
 */
export interface PostMeta {
    /** URL slug: the post's directory name (`<slug>/`). */
    slug: string;
    /**
     * Language code of this post, derived from its file name within the post folder: the default
     * locale for `<defaultLocale><extension>` (or the `post<extension>` fallback), else the
     * `<code><extension>` file's stem.
     */
    lang: string;
    /** Post title. Falls back to the slug when the front-matter omits it. */
    title: string;
    /** Publish date as an ISO `YYYY-MM-DD` string (empty when unset). */
    date: string;
    /** One-sentence summary, used for cards, meta description, and OG/Twitter. */
    description: string;
    /** SEO keywords. */
    keywords?: string[] | undefined;
    /** One or more category labels (usually one), used for the overview's filter buttons. */
    categories?: string[] | undefined;
    /** Estimated whole-minute reading time, precomputed from the body at parse time. */
    readingTime?: number | undefined;
    /** Author name; SEO helpers fall back to `SiteConfig.defaultAuthor` when unset. */
    author?: string | undefined;
    /**
     * Author avatar image path served from the site root (front-matter key `author-image`),
     * e.g. `/assets/blog/authors/jane-doe.jpg`. Shown beside the author name in the post's
     * meta row and in the author bio at the end of the post.
     */
    authorImage?: string | undefined;
    /** Hero / OG image path served from the site root, e.g. `/assets/blog/<slug>/hero.en.jpg`. */
    image?: string | undefined;
    /** Last-updated date as an ISO `YYYY-MM-DD` string. */
    updated?: string | undefined;
}

/**
 * A parsed blog post: its normalised front-matter plus the raw MDX body.
 */
export interface Post {
    /** Normalised front-matter. */
    meta: PostMeta;
    /** The MDX body (front-matter stripped), ready for `<MDXRemote>`. */
    content: string;
}

/**
 * Configuration for a {@link import("./blog.js").Blog} instance. The site attributes from
 * {@link SiteConfig} are passed directly (flattened) alongside the content options; provide
 * at least `siteUrl` and `brandName` to enable the SEO methods (`postMetadata`, `postJsonLd`,
 * ...) and JSON-LD.
 */
export interface BlogConfig extends Partial<SiteConfig> {
    /**
     * Directory holding one `<slug>/` folder per post - each with a default-language body named
     * by its locale, `<slug>/<defaultLocale><extension>` (e.g. `en.mdx`; the language-neutral
     * `<slug>/post<extension>` also works), plus optional `<slug>/<lang><extension>` translations -
     * e.g. `./blog`. Relative paths are resolved against `process.cwd()`; absolute paths are used
     * as-is.
     */
    contentDir: string;
    /** Post file extension, including the leading dot. Defaults to `.mdx`. */
    extension?: string | undefined;
    /** BCP 47 locale used by `formatDate`. Defaults to `en-GB`. */
    locale?: string | undefined;
    /**
     * Languages this blog is published in. Leave unset for a single-language blog (behaviour is
     * unchanged). When set, a post in a non-default language lives in the post's own folder as
     * `<slug>/<code><extension>` (e.g. `fr.mdx`) and is served under `<basePath>/<code>/`, with
     * hreflang/`og:locale` linking it to its siblings. The `defaultLocale` (from {@link SiteConfig})
     * is the post's `<slug>/<defaultLocale><extension>` (e.g. `en.mdx`; or `post<extension>`) and is
     * served unprefixed; it defaults to the first entry's `code`.
     */
    locales?: LocaleConfig[] | undefined;
}
