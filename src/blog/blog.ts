import "server-only";
import path from "node:path";
import { ContentStore, type ContentEntry } from "../content-store/index.js";
import { formatDate, isoDateString } from "../shared/format.js";
import { coerceText, readingMinutes, tableOfContents } from "../shared/content.js";
import { buildSitemap, type JsonLd } from "../shared/seo.js";
import { collectCategories } from "./categories.js";
import { similarPosts } from "./similar.js";
import { DuplicatePostError, PostNotFoundError } from "./errors.js";
import { buildOverviewMetadata, buildPostMetadata, overviewJsonLd, postJsonLd } from "./seo.js";
import type { BlogConfig, LocaleConfig, PageMetadata, Post, PostMeta, SiteConfig, SitemapEntry, TocEntry } from "./types.js";

/**
 * Reads and normalises MDX blog posts from a content directory, and builds their SEO
 * metadata and JSON-LD. Instantiate once with your content directory and site config, then
 * import that instance into your Next.js `/blog` and `/blog/[slug]` route files.
 *
 * Multi-language: leave `locales` unset for a single-language blog (behaviour is unchanged).
 * When `locales` is set, a post in a non-default language lives in the post's own `<slug>/`
 * folder as `<code><extension>` (e.g. `fr.mdx`), beside the default-language
 * `<defaultLocale><extension>` (e.g. `en.mdx`; the language-neutral `post<extension>` also
 * works); it is served under `<basePath>/<code>/<slug>` with hreflang/`og:locale` linking the
 * translations.
 *
 * The class is Node-only (it reads the filesystem) and is marked `server-only`; keep it in
 * server components / route files, and pass the resulting `Post`/`PostMeta` data to the
 * `BlogOverview` / `BlogPage` components as props.
 */
export class Blog {
    /**
     * The filesystem layer: the directory walk, the path-traversal guard, and the memoized read +
     * front-matter parse. Per-instance (never shared between `Blog`s), because what the walk
     * discovers depends on this instance's `locales`/`extension`.
     */
    private readonly store: ContentStore<Post>;
    /**
     * BCP 47 locale used by {@link Blog.formatDate} for the default language. Public so a client
     * child (e.g. `BlogOverviewGrid`) can format dates with the same locale via the pure
     * `formatDate`.
     */
    readonly locale: string;
    /**
     * The languages this blog is published in, with `label` defaulted to `code`. Empty for a
     * single-language blog. Public so the components can render a language switcher.
     */
    readonly locales: LocaleConfig[];
    /**
     * The default locale code: the language served without a URL prefix, and the `x-default`
     * hreflang target. Derived from `defaultLocale`, else the first `locales` entry, else the
     * base subtag of {@link Blog.locale}. Public so route files can build `generateStaticParams`.
     */
    readonly defaultLocale: string;
    /**
     * Whether the default locale is URL-prefixed too (`/en/blog/<slug>` rather than
     * `/blog/<slug>`), so every locale routes through one `[lang]` segment. Public so the
     * components build links that match the SEO metadata.
     */
    readonly prefixDefaultLocale: boolean;
    /**
     * Site config assembled from the flat site attributes passed to the constructor, or
     * `undefined` when `siteUrl`/`brandName` were not provided. Exposed as a public read-only
     * property; the components read it to build their SEO JSON-LD.
     */
    readonly site: SiteConfig | undefined;

    /**
     * @param config - directory paths and options; see {@link BlogConfig}.
     */
    constructor(config: BlogConfig) {
        this.locale = config.locale ?? "en-GB";
        this.locales = (config.locales ?? []).map((l) => ({
            code: l.code,
            label: l.label ?? l.code,
            dateLocale: l.dateLocale,
        }));
        this.defaultLocale = config.defaultLocale ?? config.locales?.[0]?.code ?? this.locale.split("-")[0] ?? "en";
        this.prefixDefaultLocale = config.prefixDefaultLocale ?? false;
        this.store = new ContentStore({
            contentDir: path.resolve(config.contentDir),
            extension: config.extension ?? ".mdx",
            defaultLocale: this.defaultLocale,
            localeCodes: this.locales.map((l) => l.code),
            parse: ({ content, data }, slug, lang) => this.toPost(content, data, slug, lang),
            onDuplicate: (slug, lang, a, b) => new DuplicatePostError(slug, lang, a, b),
        });
        this.site =
            config.siteUrl !== undefined && config.brandName !== undefined
                ? {
                      siteUrl: config.siteUrl,
                      brandName: config.brandName,
                      defaultAuthor: config.defaultAuthor,
                      basePath: config.basePath,
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
     * Every post file discovered on disk. Delegates to the shared content store, which owns the
     * folder-layout rules; see `ContentStore.entries`.
     *
     * @returns every discovered post entry; empty when the content directory does not exist.
     * @throws {@link DuplicatePostError} when two files resolve to the same `(slug, lang)`
     *   (e.g. both `post<ext>` and `<defaultLocale><ext>` in one folder).
     */
    private entries(): ContentEntry[] {
        return this.store.entries();
    }

    /**
     * Reads an entry from the walk and normalises it into a {@link Post}.
     *
     * @param entry - the entry to read, from {@link Blog.entries}.
     * @returns the post's normalised front-matter and MDX body.
     * @throws {@link PostNotFoundError} when the entry's file has vanished or its path escapes the
     *   content directory.
     */
    private readEntry(entry: ContentEntry): Post {
        const post = this.store.readEntry(entry);
        if (!post) {
            throw new PostNotFoundError(entry.slug);
        }
        return post;
    }

    /**
     * Normalises one parsed post file into a {@link Post}: the domain mapping from raw front-matter
     * to {@link PostMeta}. The store hands back uninterpreted `gray-matter` output; every default,
     * coercion, and fallback below is the blog's own concern.
     *
     * @param content - the MDX body, front-matter stripped.
     * @param data - the raw parsed front-matter.
     * @param slug - the post slug.
     * @param lang - the post's language code.
     * @returns the post's normalised front-matter and MDX body.
     */
    private toPost(content: string, data: Record<string, unknown>, slug: string, lang: string): Post {
        return {
            content,
            meta: {
                slug,
                lang,
                title: coerceText(data.title) ?? slug,
                date: isoDateString(data.date) ?? "",
                description: coerceText(data.description) ?? "",
                keywords: Array.isArray(data.keywords)
                    ? data.keywords.map(coerceText).filter((k): k is string => k !== undefined)
                    : undefined,
                categories: Array.isArray(data.categories)
                    ? data.categories.map(coerceText).filter((c): c is string => c !== undefined)
                    : undefined,
                readingTime: readingMinutes(content),
                author: typeof data.author === "string" ? data.author : undefined,
                authorImage: typeof data["author-image"] === "string" ? data["author-image"] : undefined,
                image: typeof data.image === "string" ? data.image : undefined,
                updated: isoDateString(data.updated),
            },
        };
    }

    /**
     * Lists the distinct slugs of every post in the content directory, across all languages.
     *
     * @returns the slugs (each appearing once even when translated); empty when the directory
     *   does not exist yet.
     * @throws {@link DuplicatePostError} when two files resolve to the same `(slug, lang)`.
     */
    getPostSlugs(): string[] {
        return [...new Set(this.entries().map((e) => e.slug))];
    }

    /**
     * Lists every `(slug, lang)` pair in the content directory - the exhaustive set of pages,
     * suitable for a route file's `generateStaticParams`.
     *
     * @returns every post's slug and language; empty when the directory does not exist yet.
     * @throws {@link DuplicatePostError} when two files resolve to the same `(slug, lang)`.
     */
    getPostRefs(): { slug: string; lang: string }[] {
        return this.entries().map((e) => ({ slug: e.slug, lang: e.lang }));
    }

    /**
     * Reads and parses a single post by slug and (optional) language.
     *
     * @param slug - the post slug (the post's directory name).
     * @param lang - the language code. Defaults to the blog's default locale. The default locale
     *   resolves to `<slug>/<default><ext>` (recommended), falling back to `<slug>/post<ext>`; any
     *   other locale resolves to `<slug>/<lang><ext>`.
     * @returns the post's normalised front-matter and MDX body.
     * @throws {@link PostNotFoundError} when no file exists for the slug in that language.
     */
    getPost(slug: string, lang?: string): Post {
        const post = this.store.read(slug, lang ?? this.defaultLocale);
        if (!post) {
            throw new PostNotFoundError(slug);
        }
        return post;
    }

    /**
     * Reads every post's front-matter for one language, newest first.
     *
     * @param lang - the language code. Defaults to the blog's default locale.
     * @returns the language's posts' metadata sorted by `date` descending.
     * @throws {@link DuplicatePostError} when two files resolve to the same `(slug, lang)`.
     */
    getAllPosts(lang?: string): PostMeta[] {
        const resolved = lang ?? this.defaultLocale;
        return this.entries()
            .filter((e) => e.lang === resolved)
            .map((e) => this.readEntry(e).meta)
            .sort((a, b) => (a.date < b.date ? 1 : -1));
    }

    /**
     * Lists the language codes a given slug is available in, the default locale first and then in
     * configured order. Drives the hreflang alternates and the `BlogPage` language switcher.
     *
     * @param slug - the post slug.
     * @returns the available language codes (a single entry when the post is not translated).
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
     * Lists every distinct category across a language's posts, sorted alphabetically. Useful for
     * building a category nav; the overview derives its own filter buttons from the posts it
     * renders.
     *
     * @param lang - the language code. Defaults to the blog's default locale.
     * @returns the distinct category labels, sorted; empty when no post declares one.
     */
    getAllCategories(lang?: string): string[] {
        return collectCategories(this.getAllPosts(lang));
    }

    /**
     * The BCP 47 locale used to format a given language's dates: the locale's own `dateLocale`
     * when set, else the blog's `locale` for the default language, else the language code itself.
     *
     * @param lang - the language code. Defaults to the blog's default locale.
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
     * @param lang - the language code. Defaults to the blog's default locale.
     * @returns the formatted date, or the original string when empty/unparseable.
     */
    formatDate(iso: string, lang?: string): string {
        return formatDate(iso, this.dateLocale(lang));
    }

    /**
     * Estimates a post's reading time in whole minutes (floored at 1).
     *
     * @param post - the post (typically from {@link Blog.getPost}).
     * @returns the estimated reading time in minutes.
     */
    readingMinutes(post: Post): number {
        return readingMinutes(post.content);
    }

    /**
     * Extracts a post's table-of-contents minimap from its `##`/`###` headings, in order.
     *
     * @param post - the post (typically from {@link Blog.getPost}).
     * @returns the headings as {@link TocEntry} objects; empty when the body has none.
     */
    tableOfContents(post: Post): TocEntry[] {
        return tableOfContents(post.content);
    }

    /**
     * Finds the posts most similar to the given one by weighted-term cosine similarity over
     * their metadata, newest-first as a tie-break. The post itself is excluded, and only posts in
     * the same language are considered.
     *
     * @param post - the post to find neighbours for.
     * @param limit - the maximum number of similar posts to return. Defaults to `3`.
     * @returns the closest posts' metadata; empty when nothing meaningfully overlaps.
     */
    similarPosts(post: Post, limit?: number): PostMeta[] {
        return similarPosts(post.meta, this.getAllPosts(post.meta.lang), limit);
    }

    /**
     * Builds Next.js page metadata for a single post, including hreflang alternates for its
     * translations and `og:locale`.
     *
     * @param post - the post (typically from {@link Blog.getPost}).
     * @returns metadata assignable to Next's `Metadata`.
     * @throws when the instance was created without a `site` config.
     */
    postMetadata(post: Post): PageMetadata {
        return buildPostMetadata(post.meta, this.requireSite(), this.getTranslations(post.meta.slug));
    }

    /**
     * Builds Next.js page metadata for the blog index of one language.
     *
     * @param lang - the language code. Defaults to the blog's default locale.
     * @returns metadata assignable to Next's `Metadata`.
     * @throws when the instance was created without a `site` config.
     */
    overviewMetadata(lang?: string): PageMetadata {
        return buildOverviewMetadata(
            this.requireSite(),
            lang ?? this.defaultLocale,
            this.locales.map((l) => l.code),
        );
    }

    /**
     * Builds schema.org JSON-LD for a single post, including `translationOfWork`/`workTranslation`
     * cross-links to its translations.
     *
     * @param post - the post (typically from {@link Blog.getPost}).
     * @returns the JSON-LD document to serialise into a `<script type="application/ld+json">`.
     * @throws when the instance was created without a `site` config.
     */
    postJsonLd(post: Post): JsonLd {
        return postJsonLd(post.meta, this.requireSite(), this.getTranslations(post.meta.slug));
    }

    /**
     * Builds schema.org JSON-LD for the blog index of one language.
     *
     * @param posts - the language's posts' metadata (typically from {@link Blog.getAllPosts}).
     * @param lang - the language code. Defaults to the blog's default locale.
     * @returns the JSON-LD document to serialise into a `<script type="application/ld+json">`.
     * @throws when the instance was created without a `site` config.
     */
    overviewJsonLd(posts: PostMeta[], lang?: string): JsonLd {
        return overviewJsonLd(posts, this.requireSite(), lang ?? this.defaultLocale);
    }

    /**
     * Builds i18n sitemap entries - one per `(slug, lang)` page, each with its absolute URL and,
     * when translated, its full hreflang `alternates.languages` map (every translation plus
     * `x-default`). Return it straight from a Next.js `sitemap.ts` for an i18n-correct sitemap.
     *
     * @returns one entry per post page; empty when the content directory does not exist yet.
     * @throws {@link DuplicatePostError} when two files resolve to the same `(slug, lang)`.
     * @throws when the instance was created without a `site` config.
     */
    sitemapEntries(): SitemapEntry[] {
        return buildSitemap(this.getPostRefs(), this.requireSite(), (slug) => this.getTranslations(slug));
    }

    /**
     * Returns the site config, throwing a clear error when it was not provided.
     *
     * @returns the site config.
     * @throws when no `site` config was passed to the constructor.
     */
    private requireSite(): SiteConfig {
        if (!this.site) {
            throw new Error("This Blog was created without a `site` config; pass `site` to use the SEO helpers.");
        }
        return this.site;
    }
}
