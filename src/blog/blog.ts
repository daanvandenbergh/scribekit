import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { formatDate, isoDateString } from "../shared/format.js";
import { coerceText, readingMinutes, tableOfContents } from "../shared/content.js";
import { buildSitemap, type JsonLd } from "../shared/seo.js";
import { collectCategories } from "./categories.js";
import { similarPosts } from "./similar.js";
import { DuplicatePostError, PostNotFoundError } from "./errors.js";
import { buildOverviewMetadata, buildPostMetadata, overviewJsonLd, postJsonLd } from "./seo.js";
import type { BlogConfig, LocaleConfig, PageMetadata, Post, PostMeta, SiteConfig, SitemapEntry, TocEntry } from "./types.js";

/**
 * One post file discovered on disk: its slug, language, and path relative to the content
 * directory. Produced by {@link Blog.entries}, the single place the folder layout is walked.
 */
interface PostEntry {
    /** The post slug (the post's directory name). */
    slug: string;
    /** The language code (the default locale for `post<ext>`, else the file's `<code>` stem). */
    lang: string;
    /** The file path relative to the content directory (e.g. `x/post.mdx` or `x/fr.mdx`). */
    file: string;
}

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
    /** Absolute path to the directory holding post files. */
    private readonly contentDir: string;
    /** Post file extension, including the leading dot. */
    private readonly extension: string;
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
        this.contentDir = path.resolve(config.contentDir);
        this.extension = config.extension ?? ".mdx";
        this.locale = config.locale ?? "en-GB";
        this.locales = (config.locales ?? []).map((l) => ({
            code: l.code,
            label: l.label ?? l.code,
            dateLocale: l.dateLocale,
        }));
        this.defaultLocale = config.defaultLocale ?? config.locales?.[0]?.code ?? this.locale.split("-")[0] ?? "en";
        this.prefixDefaultLocale = config.prefixDefaultLocale ?? false;
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
     * Walks the content directory once: each immediate subdirectory is a post `<slug>/` folder.
     * Inside it, the default-language post is `<defaultLocale><extension>` (recommended, e.g.
     * `en.mdx`) or the language-neutral `post<extension>` fallback, and each non-default
     * `<code><extension>` (for a configured locale) is that locale's entry. This is the only
     * place the on-disk layout is read. Files whose stem is not `post`, the default locale, or a
     * configured locale code, and any deeper nesting, are ignored.
     *
     * @returns every discovered post entry; empty when the content directory does not exist.
     * @throws {@link DuplicatePostError} when two files resolve to the same `(slug, lang)`
     *   (e.g. both `post<ext>` and `<defaultLocale><ext>` in one folder).
     */
    private entries(): PostEntry[] {
        if (!fs.existsSync(this.contentDir)) {
            return [];
        }
        const seen = new Map<string, PostEntry>();
        const add = (slug: string, lang: string, file: string): void => {
            const key = `${slug}/${lang}`;
            const prior = seen.get(key);
            if (prior) {
                throw new DuplicatePostError(slug, lang, prior.file, file);
            }
            seen.set(key, { slug, lang, file });
        };
        for (const dirent of fs.readdirSync(this.contentDir, { withFileTypes: true })) {
            if (!dirent.isDirectory()) {
                continue;
            }
            const slug = dirent.name;
            const dir = path.join(this.contentDir, slug);
            // Default-language post: the language-neutral `post<ext>` and/or the recommended
            // `<defaultLocale><ext>` (e.g. `en.mdx`). Both resolve to the default post - checked
            // regardless of whether the default locale is in `locales`, so a locale-named default
            // works even for a single-language blog - and having both is a collision.
            if (fs.existsSync(path.join(dir, `post${this.extension}`))) {
                add(slug, this.defaultLocale, `${slug}/post${this.extension}`);
            }
            if (fs.existsSync(path.join(dir, `${this.defaultLocale}${this.extension}`))) {
                add(slug, this.defaultLocale, `${slug}/${this.defaultLocale}${this.extension}`);
            }
            // Each configured non-default locale: `<code><ext>` (e.g. `fr.mdx`).
            for (const { code } of this.locales) {
                if (code === this.defaultLocale) {
                    continue;
                }
                if (fs.existsSync(path.join(dir, `${code}${this.extension}`))) {
                    add(slug, code, `${slug}/${code}${this.extension}`);
                }
            }
        }
        return [...seen.values()];
    }

    /**
     * Resolves a content-relative file path to an absolute path confined to the content
     * directory. The single path-traversal guard: a `slug`/`lang` containing `..` or a path
     * separator (e.g. a crafted route param `../../etc/foo`) would otherwise let `getPost` read
     * a file outside `contentDir`, so any path that escapes the directory is rejected here.
     *
     * @param file - the file path relative to the content directory.
     * @returns the absolute path when it stays inside `contentDir`, else `undefined`.
     */
    private resolveWithin(file: string): string | undefined {
        const abs = path.resolve(this.contentDir, file);
        if (abs !== this.contentDir && !abs.startsWith(this.contentDir + path.sep)) {
            return undefined;
        }
        return abs;
    }

    /**
     * Reads and normalises a single post file into a {@link Post}.
     *
     * @param file - the file path relative to the content directory.
     * @param slug - the post slug.
     * @param lang - the post's language code.
     * @returns the post's normalised front-matter and MDX body.
     * @throws {@link PostNotFoundError} when the path escapes the content directory.
     */
    private readPostFile(file: string, slug: string, lang: string): Post {
        const abs = this.resolveWithin(file);
        if (!abs) {
            throw new PostNotFoundError(slug);
        }
        const raw = fs.readFileSync(abs, "utf8");
        const { content, data } = matter(raw);
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
        const resolved = lang ?? this.defaultLocale;
        const candidates =
            resolved === this.defaultLocale
                ? [`${slug}/${resolved}${this.extension}`, `${slug}/post${this.extension}`]
                : [`${slug}/${resolved}${this.extension}`];
        for (const file of candidates) {
            const abs = this.resolveWithin(file);
            if (abs && fs.existsSync(abs)) {
                return this.readPostFile(file, slug, resolved);
            }
        }
        throw new PostNotFoundError(slug);
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
            .map((e) => this.readPostFile(e.file, e.slug, e.lang).meta)
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
        const cache = new Map<string, string[]>();
        const translationsOf = (slug: string): string[] => {
            let langs = cache.get(slug);
            if (!langs) {
                langs = this.getTranslations(slug);
                cache.set(slug, langs);
            }
            return langs;
        };
        return buildSitemap(this.getPostRefs(), this.requireSite(), translationsOf);
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
