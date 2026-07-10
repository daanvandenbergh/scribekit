/**
 * Shared, framework-free type definitions used by every content module (blog, docs, ...).
 * This file is fs-free and free of any `next`/`react` import so it can be shared by the Node
 * backends, the pure SEO builders, and the React components without coupling any of them to
 * `node:fs`.
 */

/**
 * One language a content section is published in. Passed as `locales` on a module config; the
 * `code` is both the URL/hreflang subtag and the content file's stem inside a page folder - a
 * page in this language lives at `<contentDir>/<slug>/<code><extension>` (e.g. `en.mdx`,
 * `fr.mdx`). The default locale's file may also be the language-neutral `<slug>/post<extension>`.
 */
export interface LocaleConfig {
    /** URL/hreflang subtag; also the content file's stem, e.g. `"fr"` for `<slug>/fr.mdx`. */
    code: string;
    /** Human-readable name for the language switcher (e.g. `"Français"`). Defaults to `code`. */
    label?: string | undefined;
    /** BCP 47 locale used to format this language's dates. Defaults to `code`, then the instance `locale`. */
    dateLocale?: string | undefined;
}

/**
 * A single entry in a page's table of contents (heading minimap), derived from the MDX
 * body's ATX headings. The `id` is the anchor slug: the same `slugify` is used both here
 * and when the matching heading is rendered, so `<a href="#id">` always resolves.
 */
export interface TocEntry {
    /** Heading level: `2` for `##` (title), `3` for `###` (subtitle). */
    depth: 2 | 3;
    /** The heading's visible text (closing `#`s and surrounding whitespace stripped). */
    text: string;
    /** Anchor id for the heading, produced by `slugify(text)`. */
    id: string;
}

/**
 * Site-level configuration used to build SEO metadata and JSON-LD. Passed once to a `Blog` or
 * `Docs` instance (or directly to the pure builders) so titles, canonical URLs, and structured
 * data resolve to the consumer's real domain and brand.
 */
export interface SiteConfig {
    /** Absolute site origin, e.g. `https://example.com`. Used for `metadataBase` and absolute JSON-LD URLs. */
    siteUrl: string;
    /** Brand/site name, used in title suffixes, `openGraph.siteName`, and the JSON-LD publisher. */
    brandName: string;
    /** Author used when a page omits its own. Defaults to `brandName`. */
    defaultAuthor?: string | undefined;
    /** Route the section is mounted at, used to build page URLs. Defaults to `/blog` for a blog, `/docs` for docs. */
    basePath?: string | undefined;
    /** Description for the index page's metadata and CollectionPage JSON-LD. */
    description?: string | undefined;
    /**
     * Default locale code: the locale whose pages are served without a URL prefix (and the
     * `x-default` hreflang target). The pure SEO builders need it to decide which locale omits
     * the prefix; the backend class sets it from `defaultLocale`/`locales`/`locale`.
     */
    defaultLocale?: string | undefined;
    /**
     * When `true`, the default locale is also URL-prefixed with its code (`/en/blog/<slug>`
     * instead of `/blog/<slug>`), so every locale routes through a single `[lang]` segment.
     * Defaults to `false` (the default locale is served unprefixed).
     */
    prefixDefaultLocale?: boolean | undefined;
    /**
     * `@id` of an `Organization` the host site already defines in its own site-wide JSON-LD
     * (e.g. `https://example.com/#organization`). When set, the content article's `publisher`
     * and the index `CollectionPage.publisher` reference it by `@id` (`{ "@id": organizationId }`)
     * instead of inlining a standalone `Organization` node - so search engines merge the section
     * into the host's single knowledge-graph entity rather than seeing a duplicate. Leave unset
     * to keep the self-contained inlined publisher.
     */
    organizationId?: string | undefined;
    /**
     * `@id` of a `Person` (or `Organization`) the host site already defines as the section's
     * author (e.g. `https://example.com/#person`). When set, the content article's `author`
     * references it by `@id` (`{ "@id": authorId }`) instead of inlining a name-only
     * `Organization` - letting a named human author entity carry authorship. Leave unset to keep
     * the inlined author.
     */
    authorId?: string | undefined;
    /**
     * `@id` of a `WebSite` the host site already defines (e.g. `https://example.com/#website`).
     * When set, the content article and the index `CollectionPage` gain an `isPartOf` reference
     * to it (`{ "@id": websiteId }`), tying the section into the site's WebSite entity. Leave
     * unset to omit `isPartOf`.
     */
    websiteId?: string | undefined;
}

/**
 * A structural subset of Next.js's `Metadata` type, covering only the fields the SEO
 * builders set. Declared locally so this package has no type dependency on `next`; the
 * returned objects remain assignable to `Metadata` in a consumer's `generateMetadata`.
 */
export interface PageMetadata {
    /** Base URL that relative `canonical`/OG image paths resolve against. */
    metadataBase?: URL | undefined;
    /** SEO/browser title. */
    title?: string | undefined;
    /** Meta description. */
    description?: string | undefined;
    /** SEO keywords. */
    keywords?: string[] | undefined;
    /**
     * Robots indexing directives. Set `{ index: false }` to keep a page out of search-engine
     * indexes (e.g. a `hidden` docs page): Next renders it as
     * `<meta name="robots" content="noindex">`. Omitted for a normally-indexed page.
     */
    robots?: { index?: boolean | undefined; follow?: boolean | undefined } | undefined;
    /** Author list. */
    authors?: { name: string }[] | undefined;
    /**
     * Canonical URL plus per-language alternates. `canonical` and every `languages` value are
     * root-relative (resolved against `metadataBase`); `languages` is a `hreflang -> path` map
     * (including `"x-default"`) that Next renders as `<link rel="alternate" hreflang>` tags.
     */
    alternates?:
        | { canonical?: string | undefined; languages?: Record<string, string> | undefined }
        | undefined;
    /** OpenGraph fields. */
    openGraph?:
        | {
              type?: string | undefined;
              url?: string | undefined;
              siteName?: string | undefined;
              title?: string | undefined;
              description?: string | undefined;
              publishedTime?: string | undefined;
              modifiedTime?: string | undefined;
              authors?: string[] | undefined;
              images?: { url: string }[] | undefined;
              /** Language of this page's content (e.g. `"fr"`), emitted as `og:locale`. */
              locale?: string | undefined;
              /** Languages this page is also available in, emitted as `og:locale:alternate`. */
              alternateLocale?: string[] | undefined;
          }
        | undefined;
    /** Twitter card fields. */
    twitter?:
        | {
              card?: string | undefined;
              title?: string | undefined;
              description?: string | undefined;
              images?: string[] | undefined;
          }
        | undefined;
}

/**
 * A structural subset of one entry in Next.js's `MetadataRoute.Sitemap`, covering only the
 * fields the sitemap builder sets. Declared locally so this package has no type dependency on
 * `next`; the returned array stays assignable to a `sitemap.ts`'s return type.
 */
export interface SitemapEntry {
    /** Absolute URL of the page (sitemap URLs must be absolute; `metadataBase` does not apply). */
    url: string;
    /**
     * Per-language alternates for this page, a `hreflang -> absolute-url` map (including
     * `"x-default"`) that Next renders as `<xhtml:link rel="alternate" hreflang>`. Omitted for an
     * untranslated page.
     */
    alternates?: { languages?: Record<string, string> | undefined } | undefined;
}
