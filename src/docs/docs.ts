import "server-only";
import path from "node:path";
import { ContentStore, type ContentEntry } from "../content-store/index.js";
import { formatDate, isoDateString } from "../shared/format.js";
import { localePath } from "../shared/locales.js";
import { coerceText, readingMinutes, tableOfContents } from "../shared/content.js";
import { buildSitemap, type JsonLd } from "../shared/seo.js";
import { adjacentFor, breadcrumbFor, buildNavTree, flattenNav } from "./navigation.js";
import { DocNotFoundError, DuplicateDocError } from "./errors.js";
import { buildDocMetadata, buildIndexMetadata, docJsonLd as buildDocJsonLd, indexJsonLd as buildIndexJsonLd } from "./seo.js";
import type { Adjacent, Breadcrumb, Doc, DocMeta, DocsConfig, LocaleConfig, NavConfigEntry, NavTree, PageMetadata, SiteConfig, SitemapEntry, TocEntry } from "./types.js";

/**
 * Reads and normalises MDX documentation pages from a content directory, assembles their
 * navigation tree (tabs -> groups -> ordered pages, from front-matter), and builds their SEO
 * metadata and JSON-LD. Instantiate once with your content directory and site config, then import
 * that instance into your Next.js docs route files.
 *
 * The structural counterpart of `Blog`: where a blog is a flat list sorted newest-first, docs are
 * a structured corpus whose order and grouping come from each page's `tab`/`group`/`order`
 * front-matter. Multi-language behaves exactly like the blog: leave `locales` unset for a
 * single-language docs site; when set, a page's non-default language lives beside its default
 * (`<slug>/fr.mdx` next to `<slug>/en.mdx`) and is served under `<basePath>/<code>/<slug>`.
 *
 * The class is Node-only (it reads the filesystem) and is marked `server-only`; keep it in
 * server components / route files and pass the resulting data to the React components as props.
 */
export class Docs {
    /**
     * The filesystem layer: the directory walk, the path-traversal guard, and the memoized read +
     * front-matter parse. Per-instance (never shared between `Docs`), because what the walk
     * discovers depends on this instance's `locales`/`extension`.
     */
    private readonly store: ContentStore<Doc>;
    /** The route the docs are mounted at (e.g. `/docs`), used to build every page URL. */
    private readonly basePath: string;
    /**
     * BCP 47 locale used by {@link Docs.formatDate} for the default language. Public so a client
     * child can format dates with the same locale via the pure `formatDate`.
     */
    readonly locale: string;
    /**
     * The languages this documentation is published in, with `label` defaulted to `code`. Empty
     * for a single-language docs site. Public so the components can render a language switcher.
     */
    readonly locales: LocaleConfig[];
    /**
     * The default locale code: the language served without a URL prefix, and the `x-default`
     * hreflang target. Public so route files can build `generateStaticParams`.
     */
    readonly defaultLocale: string;
    /**
     * Whether the default locale is URL-prefixed too (`/en/docs/<slug>` rather than
     * `/docs/<slug>`). Public so the components build links that match the SEO metadata.
     */
    readonly prefixDefaultLocale: boolean;
    /** Optional tab display order + labels, passed through to the navigation builder. */
    readonly tabs: NavConfigEntry[];
    /** Optional group display order + labels, passed through to the navigation builder. */
    readonly groups: NavConfigEntry[];
    /**
     * Old slug -> new slug for renamed pages. A `Map` (not the raw config object) so a lookup keyed
     * by an untrusted URL slug can never reach `Object.prototype` - `/docs/constructor` must miss,
     * not resolve to a function.
     */
    private readonly redirects: Map<string, string>;
    /**
     * Site config assembled from the flat site attributes passed to the constructor, or
     * `undefined` when `siteUrl`/`brandName` were not provided. Its `basePath` is always the
     * resolved docs base (default `/docs`), so URL building never falls back to the blog default.
     */
    readonly site: SiteConfig | undefined;

    /**
     * @param config - directory paths and options; see {@link DocsConfig}.
     */
    constructor(config: DocsConfig) {
        this.basePath = config.basePath ?? "/docs";
        this.locale = config.locale ?? "en-GB";
        this.locales = (config.locales ?? []).map((l) => ({
            code: l.code,
            label: l.label ?? l.code,
            dateLocale: l.dateLocale,
        }));
        this.defaultLocale = config.defaultLocale ?? config.locales?.[0]?.code ?? this.locale.split("-")[0] ?? "en";
        this.prefixDefaultLocale = config.prefixDefaultLocale ?? false;
        this.tabs = config.tabs ?? [];
        this.groups = config.groups ?? [];
        this.redirects = new Map(Object.entries(config.redirects ?? {}));
        this.store = new ContentStore({
            contentDir: path.resolve(config.contentDir),
            extension: config.extension ?? ".mdx",
            defaultLocale: this.defaultLocale,
            localeCodes: this.locales.map((l) => l.code),
            parse: ({ content, data }, slug, lang) => this.toDoc(content, data, slug, lang),
            onDuplicate: (slug, lang, a, b) => new DuplicateDocError(slug, lang, a, b),
        });
        this.site =
            config.siteUrl !== undefined && config.brandName !== undefined
                ? {
                      siteUrl: config.siteUrl,
                      brandName: config.brandName,
                      defaultAuthor: config.defaultAuthor,
                      basePath: this.basePath,
                      description: config.description,
                      defaultLocale: this.defaultLocale,
                      prefixDefaultLocale: this.prefixDefaultLocale,
                      organizationId: config.organizationId,
                      authorId: config.authorId,
                      websiteId: config.websiteId,
                  }
                : undefined;
    }

    /**
     * Every page file discovered on disk. Delegates to the shared content store, which owns the
     * folder-layout rules; see `ContentStore.entries`.
     *
     * @returns every discovered page entry; empty when the content directory does not exist.
     * @throws {@link DuplicateDocError} when two files resolve to the same `(slug, lang)`.
     */
    private entries(): ContentEntry[] {
        return this.store.entries();
    }

    /**
     * Reads an entry from the walk and normalises it into a {@link Doc}.
     *
     * @param entry - the entry to read, from {@link Docs.entries}.
     * @returns the page's normalised front-matter and MDX body.
     * @throws {@link DocNotFoundError} when the entry's file has vanished or its path escapes the
     *   content directory.
     */
    private readEntry(entry: ContentEntry): Doc {
        const doc = this.store.readEntry(entry);
        if (!doc) {
            throw new DocNotFoundError(entry.slug);
        }
        return doc;
    }

    /**
     * Normalises one parsed page file into a {@link Doc}: the domain mapping from raw front-matter
     * to {@link DocMeta}. The store hands back uninterpreted `gray-matter` output; every default,
     * coercion, and fallback below is the docs' own concern.
     *
     * @param content - the MDX body, front-matter stripped.
     * @param data - the raw parsed front-matter.
     * @param slug - the page slug.
     * @param lang - the page's language code.
     * @returns the page's normalised front-matter and MDX body.
     */
    private toDoc(content: string, data: Record<string, unknown>, slug: string, lang: string): Doc {
        return {
            content,
            meta: {
                slug,
                lang,
                title: coerceText(data.title) ?? slug,
                description: coerceText(data.description) ?? "",
                tab: coerceText(data.tab),
                group: coerceText(data.group),
                order: typeof data.order === "number" && Number.isFinite(data.order) ? data.order : undefined,
                icon: typeof data.icon === "string" ? data.icon : undefined,
                label: coerceText(data.label),
                keywords: Array.isArray(data.keywords)
                    ? data.keywords.map(coerceText).filter((k): k is string => k !== undefined)
                    : undefined,
                image: typeof data.image === "string" ? data.image : undefined,
                date: isoDateString(data.date),
                updated: isoDateString(data.updated),
                readingTime: readingMinutes(content),
                hidden: data.hidden === true ? true : undefined,
            },
        };
    }

    /**
     * Lists the distinct slugs of every page in the content directory, across all languages.
     *
     * @returns the slugs (each appearing once even when translated); empty when the directory
     *   does not exist yet.
     * @throws {@link DuplicateDocError} when two files resolve to the same `(slug, lang)`.
     */
    getDocSlugs(): string[] {
        return [...new Set(this.entries().map((e) => e.slug))];
    }

    /**
     * Lists every `(slug, lang)` pair in the content directory - the exhaustive set of pages
     * (including `hidden` ones, which are routable), suitable for a route file's
     * `generateStaticParams`. `hidden` pages are intentionally kept here (so a direct link still
     * renders) but are excluded from {@link Docs.sitemapEntries} and served `noindex`.
     *
     * @returns every page's slug and language; empty when the directory does not exist yet.
     * @throws {@link DuplicateDocError} when two files resolve to the same `(slug, lang)`.
     */
    getDocRefs(): { slug: string; lang: string }[] {
        return this.entries().map((e) => ({ slug: e.slug, lang: e.lang }));
    }

    /**
     * Resolves a requested slug through the `redirects` map to the slug it should land on.
     *
     * Three rules, in order: a slug that still exists on disk is **never** redirected (a real page
     * always wins, so a stale entry is inert); a chain is followed to its end, so `{ a: "b",
     * b: "c" }` resolves `a` straight to `c` in a single hop, and a destination that is itself a
     * real page ends the chain there; a cycle (including the self-redirect `{ a: "a" }`) resolves
     * to nothing, so the URL 404s instead of looping forever.
     *
     * @param slug - the requested page slug (untrusted - it comes from the URL).
     * @returns the destination slug, or `undefined` when the slug is not redirected.
     * @throws {@link DuplicateDocError} when two files resolve to the same `(slug, lang)`.
     */
    private redirectTarget(slug: string): string | undefined {
        const real = new Set(this.getDocSlugs());
        if (real.has(slug) || !this.redirects.has(slug)) {
            return undefined;
        }
        const seen = new Set<string>([slug]);
        let current = slug;
        for (;;) {
            const next = this.redirects.get(current);
            if (next === undefined) {
                return current; // Chain ends: `current` is not itself redirected.
            }
            if (seen.has(next)) {
                return undefined; // Cycle: no redirect at all, rather than an infinite loop.
            }
            seen.add(next);
            current = next;
            if (real.has(current)) {
                return current; // Chain ends: a real page is never redirected onwards.
            }
        }
    }

    /**
     * The URL a renamed page's old slug should permanently redirect to, ready to hand straight to
     * Next's `permanentRedirect()` - it is already locale-prefixed and `basePath`-rooted, so the
     * route file needs no path knowledge of its own. Configure the renames via
     * {@link DocsConfig.redirects}.
     *
     * @param slug - the requested page slug (untrusted - it comes from the URL).
     * @param lang - the language code. Defaults to the docs' default locale.
     * @returns the root-relative destination URL, or `undefined` when the slug is not redirected
     *   (unknown, still a real page, or part of a cycle) - in which case the route should 404.
     * @throws {@link DuplicateDocError} when two files resolve to the same `(slug, lang)`.
     */
    getRedirect(slug: string, lang?: string): string | undefined {
        const target = this.redirectTarget(slug);
        if (target === undefined) {
            return undefined;
        }
        return localePath({
            basePath: this.basePath,
            defaultLocale: this.defaultLocale,
            lang: lang ?? this.defaultLocale,
            slug: target,
            prefixDefaultLocale: this.prefixDefaultLocale,
        });
    }

    /**
     * Lists every `(old slug, lang)` pair that {@link Docs.getRedirect} would redirect - the
     * counterpart of {@link Docs.getDocRefs}, and the reason a redirect ever fires: a route file
     * with `dynamicParams = false` 404s an unrendered slug **at the router**, so an old slug must
     * be prerendered for its page component to run and redirect. Spread both into
     * `generateStaticParams`:
     *
     * ```ts
     * export function generateStaticParams() {
     *     return [...docs.getDocRefs(), ...docs.getRedirectRefs()];
     * }
     * ```
     *
     * Inert entries are skipped (a source slug that still exists as a real page, or one in a
     * cycle), so nothing is rendered that would not actually redirect.
     *
     * @returns one entry per redirected slug per configured language (just the default locale for a
     *   single-language docs site); empty when no `redirects` were configured.
     * @throws {@link DuplicateDocError} when two files resolve to the same `(slug, lang)`.
     */
    getRedirectRefs(): { slug: string; lang: string }[] {
        const langs = this.locales.length > 0 ? this.locales.map((l) => l.code) : [this.defaultLocale];
        return [...this.redirects.keys()]
            .filter((slug) => this.redirectTarget(slug) !== undefined)
            .flatMap((slug) => langs.map((lang) => ({ slug, lang })));
    }

    /**
     * Reads and parses a single page by slug and (optional) language.
     *
     * @param slug - the page slug (the page's directory name).
     * @param lang - the language code. Defaults to the docs' default locale. The default locale
     *   resolves to `<slug>/<default><ext>` (recommended), falling back to `<slug>/post<ext>`; any
     *   other locale resolves to `<slug>/<lang><ext>`.
     * @returns the page's normalised front-matter and MDX body.
     * @throws {@link DocNotFoundError} when no file exists for the slug in that language.
     */
    getDoc(slug: string, lang?: string): Doc {
        const doc = this.store.read(slug, lang ?? this.defaultLocale);
        if (!doc) {
            throw new DocNotFoundError(slug);
        }
        return doc;
    }

    /**
     * Reads every page's front-matter for one language, in on-disk discovery order (the
     * navigation tree, not this method, applies the sidebar ordering). Includes `hidden` pages.
     *
     * @param lang - the language code. Defaults to the docs' default locale.
     * @returns the language's pages' metadata.
     * @throws {@link DuplicateDocError} when two files resolve to the same `(slug, lang)`.
     */
    getAllDocs(lang?: string): DocMeta[] {
        const resolved = lang ?? this.defaultLocale;
        return this.entries()
            .filter((e) => e.lang === resolved)
            .map((e) => this.readEntry(e).meta);
    }

    /**
     * Lists the language codes a given slug is available in, the default locale first and then in
     * configured order. Drives the hreflang alternates and a language switcher.
     *
     * @param slug - the page slug.
     * @returns the available language codes (a single entry when the page is not translated).
     */
    getTranslations(slug: string): string[] {
        const langs = new Set(this.entries().filter((e) => e.slug === slug).map((e) => e.lang));
        const ordered: string[] = [];
        if (langs.has(this.defaultLocale)) {
            ordered.push(this.defaultLocale);
        }
        for (const { code } of this.locales) {
            if (code !== this.defaultLocale && langs.has(code)) {
                ordered.push(code);
            }
        }
        return ordered;
    }

    /**
     * The languages a slug is *discoverably* published in: {@link Docs.getTranslations} minus any
     * translation whose page is `hidden`. The single set every SEO surface uses - the hreflang
     * alternates ({@link Docs.docMetadata}), the JSON-LD translation cross-links
     * ({@link Docs.docJsonLd}), and the sitemap ({@link Docs.sitemapEntries}) - so a hidden draft is
     * never advertised as, or cross-linked to, a translation of a visible page.
     *
     * @param slug - the page slug.
     * @returns the non-hidden language codes for the slug, default locale first; a fully-`hidden`
     *   slug (its own language included) yields an empty list.
     */
    private visibleTranslations(slug: string): string[] {
        return this.getTranslations(slug).filter((lang) => !this.getDoc(slug, lang).meta.hidden);
    }

    /**
     * Builds the sidebar navigation tree (tabs -> groups -> ordered pages) for one language from
     * every page's `tab`/`group`/`order` front-matter. `hidden` pages are excluded.
     *
     * @param lang - the language code. Defaults to the docs' default locale.
     * @returns the ordered {@link NavTree}.
     */
    getNavTree(lang?: string): NavTree {
        const resolved = lang ?? this.defaultLocale;
        return buildNavTree(this.getAllDocs(resolved), {
            basePath: this.basePath,
            defaultLocale: this.defaultLocale,
            prefixDefaultLocale: this.prefixDefaultLocale,
            tabs: this.tabs,
            groups: this.groups,
        });
    }

    /**
     * Builds a page's breadcrumb (`[tab?, group?, page]`) from the navigation tree.
     *
     * @param slug - the page slug.
     * @param lang - the language code. Defaults to the docs' default locale.
     * @returns the breadcrumb, or `undefined` when the slug is not in the tree (e.g. a `hidden`
     *   or unknown page).
     */
    getBreadcrumb(slug: string, lang?: string): Breadcrumb | undefined {
        return breadcrumbFor(slug, this.getNavTree(lang));
    }

    /**
     * Finds the pages immediately before and after a page in the sidebar reading order (the
     * prev/next footer links).
     *
     * @param slug - the page slug.
     * @param lang - the language code. Defaults to the docs' default locale.
     * @returns the previous and next pages, if any; empty for a `hidden`/unknown slug.
     */
    getAdjacent(slug: string, lang?: string): Adjacent {
        return adjacentFor(slug, flattenNav(this.getNavTree(lang)));
    }

    /**
     * The BCP 47 locale used to format a given language's dates: the locale's own `dateLocale`
     * when set, else the docs' `locale` for the default language, else the language code itself.
     *
     * @param lang - the language code. Defaults to the docs' default locale.
     * @returns the BCP 47 locale to pass to `formatDate` / `toLocaleDateString`.
     */
    dateLocale(lang?: string): string {
        const code = lang ?? this.defaultLocale;
        const found = this.locales.find((l) => l.code === code);
        if (found?.dateLocale) {
            return found.dateLocale;
        }
        if (code === this.defaultLocale) {
            return this.locale;
        }
        return found?.code ?? this.locale;
    }

    /**
     * Formats an ISO `YYYY-MM-DD` date as a long date in the given language's date locale.
     *
     * @param iso - the ISO date string; empty or invalid input is returned as-is.
     * @param lang - the language code. Defaults to the docs' default locale.
     * @returns the formatted date, or the original string when empty/unparseable.
     */
    formatDate(iso: string, lang?: string): string {
        return formatDate(iso, this.dateLocale(lang));
    }

    /**
     * Estimates a page's reading time in whole minutes (floored at 1).
     *
     * @param doc - the page (typically from {@link Docs.getDoc}).
     * @returns the estimated reading time in minutes.
     */
    readingMinutes(doc: Doc): number {
        return readingMinutes(doc.content);
    }

    /**
     * Extracts a page's table-of-contents minimap from its `##`/`###` headings, in order.
     *
     * @param doc - the page (typically from {@link Docs.getDoc}).
     * @returns the headings as {@link TocEntry} objects; empty when the body has none.
     */
    tableOfContents(doc: Doc): TocEntry[] {
        return tableOfContents(doc.content);
    }

    /**
     * Builds Next.js page metadata for a single documentation page, including hreflang alternates
     * for its translations and `og:locale`.
     *
     * @param doc - the page (typically from {@link Docs.getDoc}).
     * @returns metadata assignable to Next's `Metadata`.
     * @throws when the instance was created without a `site` config.
     */
    docMetadata(doc: Doc): PageMetadata {
        return buildDocMetadata(doc.meta, this.requireSite(), this.visibleTranslations(doc.meta.slug));
    }

    /**
     * Builds Next.js page metadata for the docs index of one language.
     *
     * @param lang - the language code. Defaults to the docs' default locale.
     * @returns metadata assignable to Next's `Metadata`.
     * @throws when the instance was created without a `site` config.
     */
    indexMetadata(lang?: string): PageMetadata {
        return buildIndexMetadata(
            this.requireSite(),
            lang ?? this.defaultLocale,
            this.locales.map((l) => l.code),
        );
    }

    /**
     * Builds schema.org JSON-LD for a single page: a `TechArticle` plus a `BreadcrumbList`,
     * including `translationOfWork`/`workTranslation` cross-links to its translations.
     *
     * @param doc - the page (typically from {@link Docs.getDoc}).
     * @returns the JSON-LD document to serialise into a `<script type="application/ld+json">`.
     * @throws when the instance was created without a `site` config.
     */
    docJsonLd(doc: Doc): JsonLd {
        return buildDocJsonLd(doc.meta, this.requireSite(), this.visibleTranslations(doc.meta.slug));
    }

    /**
     * Builds schema.org JSON-LD for the docs index of one language: a `CollectionPage`, a
     * `BreadcrumbList`, and an `ItemList` of the pages in sidebar order.
     *
     * @param lang - the language code. Defaults to the docs' default locale.
     * @returns the JSON-LD document to serialise into a `<script type="application/ld+json">`.
     * @throws when the instance was created without a `site` config.
     */
    indexJsonLd(lang?: string): JsonLd {
        const resolved = lang ?? this.defaultLocale;
        return buildIndexJsonLd(flattenNav(this.getNavTree(resolved)), this.requireSite(), resolved);
    }

    /**
     * Builds i18n sitemap entries - one per non-`hidden` `(slug, lang)` page, each with its
     * absolute URL and, when translated, its full hreflang `alternates.languages` map. Return it
     * straight from a Next.js `sitemap.ts` (merge with the blog's entries if you have both).
     *
     * `hidden` pages stay routable (they remain in {@link Docs.getDocRefs}, so
     * `generateStaticParams` still renders them) and carry `robots: noindex`, but are dropped
     * here - and from any sibling's hreflang alternates - so a draft or deep-linked page is never
     * advertised to search engines, matching their exclusion from the nav tree and index.
     *
     * @returns one entry per non-hidden page; empty when the content directory does not exist yet.
     * @throws {@link DuplicateDocError} when two files resolve to the same `(slug, lang)`.
     * @throws when the instance was created without a `site` config.
     */
    sitemapEntries(): SitemapEntry[] {
        const site = this.requireSite();
        // `hidden` pages (and hidden translations) are dropped via visibleTranslations - the same
        // filter the hreflang/JSON-LD paths use - so a draft is never advertised to search engines.
        // They stay routable (getDocRefs / generateStaticParams) and carry robots:noindex.
        const translationsOf = (slug: string): string[] => this.visibleTranslations(slug);
        const refs = this.getDocSlugs().flatMap((slug) => translationsOf(slug).map((lang) => ({ slug, lang })));
        return buildSitemap(refs, site, translationsOf);
    }

    /**
     * Returns the site config, throwing a clear error when it was not provided.
     *
     * @returns the site config.
     * @throws when no `site` config was passed to the constructor.
     */
    private requireSite(): SiteConfig {
        if (!this.site) {
            throw new Error("This Docs was created without a `site` config; pass `siteUrl` and `brandName` to use the SEO helpers.");
        }
        return this.site;
    }
}
