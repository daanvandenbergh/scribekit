/**
 * Docs-domain type definitions. The framework-free primitives many modules share
 * (`SiteConfig`, `LocaleConfig`, `TocEntry`, `PageMetadata`, `SitemapEntry`) live in
 * `../shared/types.js` and are re-exported here so every `./types.js` import inside this module
 * (and any `../docs/types.js` import from the React components) resolves in one place.
 *
 * Unlike a blog (a flat, date-sorted list), docs are a *structured* corpus: every page declares
 * its own place in a sidebar of **tabs -> groups -> ordered pages** via front-matter, from which
 * `Docs` assembles the navigation tree, breadcrumbs, and prev/next.
 */

import type { LocaleConfig, SiteConfig } from "../shared/types.js";

export type { LocaleConfig, PageMetadata, SiteConfig, SitemapEntry, TocEntry } from "../shared/types.js";

/**
 * Front-matter for a documentation page, normalised from the MDX file's YAML header. The three
 * structural fields (`tab`, `group`, `order`) place the page in the sidebar; everything else is
 * presentation/SEO. All structural fields are optional so a single-file docs folder "just works"
 * (one implicit tab, one ungrouped list).
 */
export interface DocMeta {
    /** URL slug: the page's directory name (`<slug>/`). */
    slug: string;
    /**
     * Language code of this page, derived from its file name within the page folder: the default
     * locale for `<defaultLocale><extension>` (or the `post<extension>` fallback), else the
     * `<code><extension>` file's stem.
     */
    lang: string;
    /** Page title (the H1 and the default sidebar label). Falls back to the slug when omitted. */
    title: string;
    /** One-sentence summary, used for the lead, meta description, and OG/Twitter. */
    description: string;
    /**
     * Top-level section this page belongs to (the secondary tab-nav, e.g. `"Documentation"`,
     * `"API reference"`). Pages sharing a `tab` are grouped under it; when no page sets a `tab`
     * there is a single implicit tab and the tab bar is hidden. Defaults to the implicit tab.
     */
    tab?: string | undefined;
    /**
     * Sidebar group this page belongs to (the uppercase group heading, e.g. `"Get started"`,
     * `"Configuration"`). Pages sharing a `group` are listed together under it. Defaults to the
     * ungrouped bucket (rendered with no heading).
     */
    group?: string | undefined;
    /**
     * Sort position within the page's group (ascending). Pages without an `order` sort after
     * ordered ones, then alphabetically by title, so an unordered folder is still deterministic.
     */
    order?: number | undefined;
    /**
     * Icon identifier for the sidebar item (a free-form name the frontend maps to an SVG, e.g.
     * `"rocket"`). The backend passes it through untouched; it never renders an icon itself.
     */
    icon?: string | undefined;
    /** Sidebar label override; defaults to {@link DocMeta.title} when unset. */
    label?: string | undefined;
    /** SEO keywords. */
    keywords?: string[] | undefined;
    /** Optional hero / OG image path served from the site root, e.g. `/assets/docs/<slug>/hero.jpg`. */
    image?: string | undefined;
    /** Optional first-published date as an ISO `YYYY-MM-DD` string. */
    date?: string | undefined;
    /** Last-updated date as an ISO `YYYY-MM-DD` string (shown in the page meta row). */
    updated?: string | undefined;
    /** Estimated whole-minute reading time, precomputed from the body at parse time. */
    readingTime?: number | undefined;
    /**
     * When `true`, the page is still routable and readable via a direct link (it stays in
     * `getDocRefs`, so `generateStaticParams` keeps rendering it) but is hidden from discovery:
     * omitted from the navigation tree (and therefore prev/next and the index), dropped from the
     * sitemap, and served with `robots: noindex` so search engines do not index it. Useful for
     * drafts and deep-linked pages you do not want surfaced in the nav or crawled.
     */
    hidden?: boolean | undefined;
}

/**
 * A parsed documentation page: its normalised front-matter plus the raw MDX body.
 */
export interface Doc {
    /** Normalised front-matter. */
    meta: DocMeta;
    /** The MDX body (front-matter stripped), ready for `<MDXRemote>`. */
    content: string;
}

/**
 * One entry in a `tabs`/`groups` ordering config: either a bare id (matching a page's `tab`/
 * `group` value) or an `{ id, label }` pair when the display label should differ from the id.
 */
export type NavConfigEntry = string | { id: string; label?: string | undefined };

/**
 * A resolved sidebar navigation item - one documentation page as it appears in the nav tree,
 * carrying everything the frontend needs to render and link it (all serializable, so it can
 * cross the server -> client component boundary).
 */
export interface NavItem {
    /** The page slug. */
    slug: string;
    /** The page title. */
    title: string;
    /** The sidebar label ({@link DocMeta.label} when set, else the title). */
    label: string;
    /** Icon identifier passed through from front-matter, if any. */
    icon?: string | undefined;
    /** Root-relative URL for the page, built via the shared `localePath`. */
    href: string;
    /** The page's language code. */
    lang: string;
    /** The tab id this item belongs to (empty string for the implicit single tab). */
    tab?: string | undefined;
    /** The group id this item belongs to (empty string for the ungrouped bucket). */
    group?: string | undefined;
    /** The raw front-matter `order` (undefined when unset); the resolved sort order is applied at build time. */
    order?: number | undefined;
}

/**
 * A sidebar group: a labelled heading plus its ordered {@link NavItem}s.
 */
export interface NavGroup {
    /** The group id (a page's `group` value; empty string for the ungrouped bucket). */
    id: string;
    /** The display label (the config label when provided, else the id). */
    label: string;
    /** The group's pages, in resolved sidebar order. */
    items: NavItem[];
}

/**
 * A top-level tab: a labelled section containing ordered {@link NavGroup}s.
 */
export interface NavTab {
    /** The tab id (a page's `tab` value; empty string for the implicit single tab). */
    id: string;
    /** The display label (the config label when provided, else the id). */
    label: string;
    /** The tab's groups, in resolved order. */
    groups: NavGroup[];
}

/**
 * The full documentation navigation tree for one language: the ordered tabs (each with ordered
 * groups of ordered pages) plus a convenience flag the frontend uses to hide the tab bar.
 */
export interface NavTree {
    /** The tabs, in resolved order. */
    tabs: NavTab[];
    /** `true` when there is more than one tab (so the frontend should render the tab bar). */
    multiTab: boolean;
}

/**
 * One segment of a page's breadcrumb trail.
 */
export interface BreadcrumbSegment {
    /** The segment's visible label. */
    label: string;
    /** Optional link target for the segment (the page segment is the current page and has none). */
    href?: string | undefined;
}

/**
 * A page's breadcrumb: the ordered `[tab?, group?, page]` segments plus the individual labels
 * for callers that only want a piece.
 */
export interface Breadcrumb {
    /** The tab label, when the page is under a named tab. */
    tab?: string | undefined;
    /** The group label, when the page is in a named group. */
    group?: string | undefined;
    /** The page title. */
    title: string;
    /** The ordered segments `[tab?, group?, page]`, ready to render. */
    segments: BreadcrumbSegment[];
}

/**
 * The pages immediately before and after a given page in the flattened reading order (the
 * prev/next footer links). Either side is absent at the ends of the corpus.
 */
export interface Adjacent {
    /** The previous page, or `undefined` at the start. */
    prev?: NavItem | undefined;
    /** The next page, or `undefined` at the end. */
    next?: NavItem | undefined;
}

/**
 * Configuration for a {@link import("./docs.js").Docs} instance. The site attributes from
 * {@link SiteConfig} are passed directly (flattened) alongside the content options; provide at
 * least `siteUrl` and `brandName` to enable the SEO methods (`docMetadata`, `docJsonLd`, ...) and
 * JSON-LD.
 */
export interface DocsConfig extends Partial<SiteConfig> {
    /**
     * Directory holding one `<slug>/` folder per page - each with a default-language body named
     * by its locale, `<slug>/<defaultLocale><extension>` (e.g. `en.mdx`; the language-neutral
     * `<slug>/post<extension>` also works), plus optional `<slug>/<lang><extension>` translations -
     * e.g. `./docs`. Relative paths are resolved against `process.cwd()`; absolute paths are used
     * as-is.
     */
    contentDir: string;
    /** Page file extension, including the leading dot. Defaults to `.mdx`. */
    extension?: string | undefined;
    /** BCP 47 locale used by `formatDate`. Defaults to `en-GB`. */
    locale?: string | undefined;
    /**
     * Languages this documentation is published in. Leave unset for a single-language docs site.
     * When set, a page in a non-default language lives in the page's own folder as
     * `<slug>/<code><extension>` (e.g. `fr.mdx`) and is served under `<basePath>/<code>/`, with
     * hreflang/`og:locale` linking it to its siblings.
     */
    locales?: LocaleConfig[] | undefined;
    /**
     * Optional display order and labels for the top-level tabs. Each entry is a tab id (matching
     * a page's `tab`) or an `{ id, label }` pair. Tabs listed here sort first, in this order;
     * any tab not listed sorts after them by its pages' minimum `order`, then first-seen. Purely
     * presentational - it never changes which pages exist, only how their tabs are ordered/labelled.
     */
    tabs?: NavConfigEntry[] | undefined;
    /**
     * Optional display order and labels for the sidebar groups, same semantics as {@link DocsConfig.tabs}
     * but for the group headings within each tab.
     */
    groups?: NavConfigEntry[] | undefined;
    /**
     * Permanent redirects for pages whose slug has changed, as `{ "<old-slug>": "<new-slug>" }`.
     * Renaming a `<slug>/` folder changes the page's public URL, so list the old slug here to keep
     * it alive; the route file serves it as a 308 via {@link import("./docs.js").Docs.getRedirect}.
     *
     * A **real page always wins**: an entry whose source slug still exists on disk is ignored, so a
     * stale entry can never shadow a live page. Chains resolve to their final destination in one
     * hop (`{ a: "b", b: "c" }` sends `a` straight to `c`), and a cycle yields no redirect (the URL
     * 404s rather than looping).
     */
    redirects?: Record<string, string> | undefined;
}
