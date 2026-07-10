import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Blog } from "../blog.js";
import { readingMinutes } from "../../shared/content.js";
import { DuplicatePostError, PostNotFoundError } from "../errors.js";
import type { SiteConfig } from "../types.js";

/** Directory of this test file, used to resolve the fixture folders. */
const HERE = path.dirname(fileURLToPath(import.meta.url));
/** Fixture content directory (`<slug>/post.mdx` posts). */
const CONTENT_DIR = path.join(HERE, "fixtures/content");
/** Fixture content directory holding a single `<slug>/post.md` post. */
const CONTENT_MD_DIR = path.join(HERE, "fixtures/content-md");
/** Fixture content directory: English default as `post.mdx` (getting-started) and `en.mdx` (ops), plus French `fr.mdx`. */
const CONTENT_I18N_DIR = path.join(HERE, "fixtures/content-i18n");
/** Fixture content directory whose `<slug>/post.mdx` + `<slug>/en.mdx` collide on `(slug, lang)`. */
const CONTENT_COLLISION_DIR = path.join(HERE, "fixtures/content-collision");
/** Fixture content directory with a locale-named default post (`<slug>/en.mdx`) and NO configured locales. */
const CONTENT_DEFAULT_CODE_DIR = path.join(HERE, "fixtures/content-default-code");
/** Fixture content directory with a post whose `date`/`updated` are unquoted YAML dates (parsed as `Date`). */
const CONTENT_UNQUOTED_DATE_DIR = path.join(HERE, "fixtures/content-unquoted-date");
/** Fixture content directory with a post whose title/description/tags are unquoted YAML numbers. */
const CONTENT_TYPED_SCALARS_DIR = path.join(HERE, "fixtures/content-typed-scalars");

/** Site config used by the SEO-method tests. */
const SITE: SiteConfig = { siteUrl: "https://example.com", brandName: "Example" };

/**
 * Builds a `Blog` pointed at the fixture content, optionally with assets/site.
 *
 * @param opts - overrides merged into the base fixture config.
 * @returns a configured `Blog` instance.
 */
function makeBlog(opts: Partial<ConstructorParameters<typeof Blog>[0]> = {}): Blog {
    return new Blog({ contentDir: CONTENT_DIR, ...opts });
}

describe("Blog.getPostSlugs", () => {
    it("lists only directories that contain a post file (ignoring sidecars and stray files)", () => {
        // `content/notes.txt` (stray root file) and `how-many-calls/hero.js` (sidecar) must not leak.
        const slugs = makeBlog().getPostSlugs().sort();
        expect(slugs).toEqual(["answering-service", "bare", "how-many-calls"]);
    });

    it("returns an empty array when the content directory does not exist", () => {
        const blog = new Blog({ contentDir: path.join(HERE, "fixtures/does-not-exist") });
        expect(blog.getPostSlugs()).toEqual([]);
    });

    it("honours a custom extension", () => {
        const blog = new Blog({ contentDir: CONTENT_MD_DIR, extension: ".md" });
        expect(blog.getPostSlugs()).toEqual(["alpha"]);
    });
});

describe("Blog.getPost", () => {
    it("parses full front-matter", () => {
        const { meta, content } = makeBlog().getPost("how-many-calls");
        expect(meta).toEqual({
            slug: "how-many-calls",
            lang: "en",
            title: "How many calls do plumbers miss",
            description: "Missed calls are the quietest leak in a plumbing business.",
            keywords: ["missed calls plumber", "plumber answering service"],
            categories: ["Operations"],
            readingTime: readingMinutes(content),
            author: "Jane Doe",
            authorImage: "/assets/blog/authors/jane-doe.svg",
            date: "2026-06-28",
            image: "/assets/blog/how-many-calls/hero.en.jpg",
            updated: "2026-07-07",
        });
        expect(content).toContain("## Intro");
        expect(content).not.toContain("title:");
    });

    it("parses categories as a string array and drops non-string entries", () => {
        expect(makeBlog().getPost("answering-service").meta.categories).toEqual(["Guides", "Operations"]);
        expect(makeBlog().getPost("how-many-calls").meta.categories).toEqual(["Operations"]);
    });

    it("computes readingTime from the body (always >= 1 minute)", () => {
        const { meta, content } = makeBlog().getPost("answering-service");
        expect(meta.readingTime).toBe(readingMinutes(content));
        expect(meta.readingTime).toBeGreaterThanOrEqual(1);
    });

    it("falls back to slug for title and empty strings for missing date/description", () => {
        const { meta } = makeBlog().getPost("bare");
        expect(meta.title).toBe("bare");
        expect(meta.date).toBe("");
        expect(meta.description).toBe("");
        expect(meta.keywords).toBeUndefined();
        expect(meta.categories).toBeUndefined();
        expect(meta.readingTime).toBeGreaterThanOrEqual(1);
        expect(meta.author).toBeUndefined();
        expect(meta.authorImage).toBeUndefined();
        expect(meta.image).toBeUndefined();
        expect(meta.updated).toBeUndefined();
    });

    it("throws PostNotFoundError for an unknown slug", () => {
        expect(() => makeBlog().getPost("nope")).toThrow(PostNotFoundError);
        try {
            makeBlog().getPost("nope");
        } catch (err) {
            expect(err).toBeInstanceOf(PostNotFoundError);
            expect((err as PostNotFoundError).slug).toBe("nope");
        }
    });

    it("refuses to escape the content directory via a traversal slug or lang (path traversal)", () => {
        // `../content-i18n/ops/en.mdx` really exists on disk, so without the containment guard
        // `getPost` would resolve, read, and serve a file from outside the blog's content dir.
        // The guard must 404 instead - both when the traversal rides in on the slug...
        const blog = makeBlog();
        expect(() => blog.getPost("../content-i18n/ops")).toThrow(PostNotFoundError);
        // ...and when it rides in on the (also route-derived) lang segment.
        expect(() => blog.getPost("bare", "../../content-i18n/ops/en")).toThrow(PostNotFoundError);
    });

    it("normalises an unquoted YAML date (parsed as a Date) to a YYYY-MM-DD string", () => {
        // `date: 2026-06-28` (no quotes) is a native YAML date, so gray-matter yields a `Date`;
        // without coercion the string guard would drop it to "" and the post would lose its date.
        const blog = new Blog({ contentDir: CONTENT_UNQUOTED_DATE_DIR });
        const { meta } = blog.getPost("plain-date");
        expect(meta.date).toBe("2026-06-28");
        expect(meta.updated).toBe("2026-07-07");
    });

    it("coerces unquoted numeric title/description and numeric keyword/category members to strings", () => {
        // `title: 2026`, `description: 404`, and numeric tag members are native YAML numbers, so a
        // bare `typeof === "string"` guard would drop the title to the slug, the description to "",
        // and silently discard the numeric tags. They must survive as their string form instead.
        const blog = new Blog({ contentDir: CONTENT_TYPED_SCALARS_DIR });
        const { meta } = blog.getPost("numeric");
        expect(meta.title).toBe("2026");
        expect(meta.description).toBe("404");
        expect(meta.keywords).toEqual(["2026", "seo"]);
        expect(meta.categories).toEqual(["2024", "Guides"]);
    });

    it("coerces a date-shaped title/description and date-shaped keyword/category members to YYYY-MM-DD", () => {
        // `title: 2026-06-28`, `description: 2026-07-01`, and date-shaped tag members are native YAML
        // `Date`s (not strings/numbers), so a guard that only handled string+number would drop the
        // title to the slug, the description to "", and discard the tags. They must survive as their
        // `YYYY-MM-DD` string form instead (the same archetype as the numeric case, one variant over).
        const blog = new Blog({ contentDir: CONTENT_TYPED_SCALARS_DIR });
        const { meta } = blog.getPost("date-shaped");
        expect(meta.title).toBe("2026-06-28");
        expect(meta.description).toBe("2026-07-01");
        expect(meta.keywords).toEqual(["2026-06-28", "seo"]);
        expect(meta.categories).toEqual(["2024-01-15", "Guides"]);
    });

    it("takes image straight from front-matter, or undefined when omitted", () => {
        expect(makeBlog().getPost("how-many-calls").meta.image).toBe("/assets/blog/how-many-calls/hero.en.jpg");
        expect(makeBlog().getPost("answering-service").meta.image).toBeUndefined();
    });

    it("takes the author avatar from the author-image front-matter key, or undefined when omitted", () => {
        expect(makeBlog().getPost("how-many-calls").meta.authorImage).toBe("/assets/blog/authors/jane-doe.svg");
        expect(makeBlog().getPost("answering-service").meta.authorImage).toBeUndefined();
    });
});

describe("Blog.getAllPosts", () => {
    it("returns every post's metadata sorted by date descending (empty dates last)", () => {
        const slugs = makeBlog().getAllPosts().map((p) => p.slug);
        expect(slugs).toEqual(["answering-service", "how-many-calls", "bare"]);
    });
});

describe("Blog default-locale file resolution", () => {
    it("accepts the recommended <defaultLocale>.<ext> even with no locales configured", () => {
        // `hello/en.mdx` with no `locales` set: the default locale still derives to `en`, so the
        // locale-named file must resolve as the default post.
        const blog = new Blog({ contentDir: CONTENT_DEFAULT_CODE_DIR });
        expect(blog.defaultLocale).toBe("en");
        expect(blog.getPostSlugs()).toEqual(["hello"]);
        const { meta } = blog.getPost("hello");
        expect(meta.lang).toBe("en");
        expect(meta.title).toBe("Hello");
    });
});

describe("Blog.getAllCategories", () => {
    it("returns the distinct categories across all posts, sorted, de-duped", () => {
        expect(makeBlog().getAllCategories()).toEqual(["Guides", "Operations"]);
    });

    it("returns an empty array when no post declares a category", () => {
        const blog = new Blog({ contentDir: CONTENT_MD_DIR, extension: ".md" });
        expect(blog.getAllCategories()).toEqual([]);
    });
});

describe("Blog.formatDate", () => {
    it("formats an ISO date in the configured locale", () => {
        expect(makeBlog().formatDate("2026-06-28")).toBe("28 June 2026");
    });

    it("uses a custom locale", () => {
        const blog = makeBlog({ locale: "en-US" });
        expect(blog.formatDate("2026-06-28")).toBe("June 28, 2026");
    });
});

describe("Blog.site", () => {
    it("assembles the site config from the flat constructor attributes", () => {
        expect(makeBlog({ siteUrl: SITE.siteUrl, brandName: SITE.brandName, basePath: "/articles" }).site).toEqual({
            siteUrl: SITE.siteUrl,
            brandName: SITE.brandName,
            defaultAuthor: undefined,
            basePath: "/articles",
            description: undefined,
            defaultLocale: "en",
            prefixDefaultLocale: false,
        });
    });

    it("is undefined when siteUrl/brandName are not both provided", () => {
        expect(makeBlog().site).toBeUndefined();
        expect(makeBlog({ siteUrl: SITE.siteUrl }).site).toBeUndefined();
        expect(makeBlog({ brandName: SITE.brandName }).site).toBeUndefined();
    });

    it("forwards the graph-stitching @id references onto the site config", () => {
        const blog = makeBlog({
            siteUrl: SITE.siteUrl,
            brandName: SITE.brandName,
            organizationId: "https://example.com/#organization",
            authorId: "https://example.com/#person",
            websiteId: "https://example.com/#website",
        });
        expect(blog.site?.organizationId).toBe("https://example.com/#organization");
        expect(blog.site?.authorId).toBe("https://example.com/#person");
        expect(blog.site?.websiteId).toBe("https://example.com/#website");
    });
});

describe("Blog SEO methods", () => {
    it("throw a clear error when no site config was provided", () => {
        const blog = makeBlog();
        const post = blog.getPost("how-many-calls");
        expect(() => blog.postMetadata(post)).toThrow(/site/);
        expect(() => blog.overviewMetadata()).toThrow(/site/);
        expect(() => blog.postJsonLd(post)).toThrow(/site/);
        expect(() => blog.overviewJsonLd([])).toThrow(/site/);
    });

    it("delegate to the pure builders when site config is present", () => {
        const blog = makeBlog({ siteUrl: SITE.siteUrl, brandName: SITE.brandName });
        const post = blog.getPost("how-many-calls");
        expect(blog.postMetadata(post).title).toBe("How many calls do plumbers miss | Example");
        expect(blog.overviewMetadata().title).toBe("Blog | Example");
        expect(blog.postJsonLd(post)["@context"]).toBe("https://schema.org");
        expect(blog.overviewJsonLd(blog.getAllPosts())["@context"]).toBe("https://schema.org");
    });
});

/**
 * Builds a two-language `Blog` (English default as `post.mdx` or `en.mdx`, French `fr.mdx`) pointed
 * at the i18n fixtures.
 *
 * @param opts - overrides merged into the base i18n config (e.g. `siteUrl`/`brandName`).
 * @returns a configured multi-language `Blog` instance.
 */
function makeI18nBlog(opts: Partial<ConstructorParameters<typeof Blog>[0]> = {}): Blog {
    return new Blog({
        contentDir: CONTENT_I18N_DIR,
        locales: [
            { code: "en", label: "English" },
            { code: "fr", label: "Français", dateLocale: "fr-FR" },
        ],
        defaultLocale: "en",
        ...opts,
    });
}

describe("Blog multi-language", () => {
    describe("defaultLocale + locales", () => {
        it("derives defaultLocale from the base subtag of locale when unset", () => {
            expect(new Blog({ contentDir: CONTENT_DIR }).defaultLocale).toBe("en");
            expect(new Blog({ contentDir: CONTENT_DIR, locale: "fr-FR" }).defaultLocale).toBe("fr");
        });

        it("defaults defaultLocale to the first configured locale", () => {
            const blog = new Blog({ contentDir: CONTENT_I18N_DIR, locales: [{ code: "nl" }, { code: "en" }] });
            expect(blog.defaultLocale).toBe("nl");
        });

        it("defaults each locale's label to its code", () => {
            const blog = new Blog({
                contentDir: CONTENT_I18N_DIR,
                locales: [{ code: "en" }, { code: "fr", label: "Français" }],
            });
            expect(blog.locales).toEqual([
                { code: "en", label: "en", dateLocale: undefined },
                { code: "fr", label: "Français", dateLocale: undefined },
            ]);
        });

        it("records defaultLocale on the site config", () => {
            const blog = makeI18nBlog({ siteUrl: "https://example.com", brandName: "Example" });
            expect(blog.site?.defaultLocale).toBe("en");
        });
    });

    describe("getPostRefs / getPostSlugs", () => {
        it("lists every (slug, lang) pair, ignoring unconfigured-locale files", () => {
            const refs = makeI18nBlog().getPostRefs();
            expect(refs).toContainEqual({ slug: "getting-started", lang: "en" });
            expect(refs).toContainEqual({ slug: "ops", lang: "en" });
            expect(refs).toContainEqual({ slug: "getting-started", lang: "fr" });
            expect(refs).toContainEqual({ slug: "only-fr", lang: "fr" });
            expect(refs).toHaveLength(4);
            // `ghost/de.mdx` names an unconfigured locale (`de`) and has no `post.mdx`, so it yields nothing.
            expect(refs.some((r) => r.slug === "ghost")).toBe(false);
        });

        it("lists distinct slugs across languages", () => {
            expect(makeI18nBlog().getPostSlugs().sort()).toEqual(["getting-started", "only-fr", "ops"]);
        });
    });

    describe("getPost", () => {
        it("reads the default-language file at the root and tags meta.lang", () => {
            const { meta } = makeI18nBlog().getPost("getting-started");
            expect(meta.lang).toBe("en");
            expect(meta.title).toBe("Getting started");
        });

        it("reads a translation from its <lang>.mdx file in the post folder", () => {
            const { meta } = makeI18nBlog().getPost("getting-started", "fr");
            expect(meta.lang).toBe("fr");
            expect(meta.title).toBe("Démarrer");
        });

        it("resolves the default post from <defaultLocale>.<ext> (recommended) as well as post.<ext>", () => {
            // `ops` is stored as ops/en.mdx (no post.mdx); `getting-started` uses post.mdx. Both resolve.
            expect(makeI18nBlog().getPost("ops").meta.lang).toBe("en");
            expect(makeI18nBlog().getPost("ops").meta.title).toBe("Operations playbook");
            expect(makeI18nBlog().getPost("getting-started").meta.title).toBe("Getting started");
        });

        it("throws PostNotFoundError for a language the post is not translated into", () => {
            expect(() => makeI18nBlog().getPost("only-fr")).toThrow(PostNotFoundError);
            expect(makeI18nBlog().getPost("only-fr", "fr").meta.title).toBe("Seulement en français");
        });
    });

    describe("getAllPosts", () => {
        it("returns only the requested language's posts, newest first", () => {
            expect(makeI18nBlog().getAllPosts("en").map((p) => p.slug)).toEqual(["getting-started", "ops"]);
            expect(makeI18nBlog().getAllPosts("fr").map((p) => p.slug)).toEqual(["getting-started", "only-fr"]);
        });

        it("defaults to the default locale", () => {
            expect(makeI18nBlog().getAllPosts().map((p) => p.lang)).toEqual(["en", "en"]);
        });
    });

    describe("getTranslations", () => {
        it("lists available languages, default first", () => {
            expect(makeI18nBlog().getTranslations("getting-started")).toEqual(["en", "fr"]);
        });

        it("returns a single entry for an untranslated post", () => {
            expect(makeI18nBlog().getTranslations("ops")).toEqual(["en"]);
            expect(makeI18nBlog().getTranslations("only-fr")).toEqual(["fr"]);
        });
    });

    describe("getAllCategories", () => {
        it("aggregates categories per language", () => {
            expect(makeI18nBlog().getAllCategories("en")).toEqual(["Guides", "Operations"]);
            expect(makeI18nBlog().getAllCategories("fr")).toEqual(["Actus", "Guides"]);
        });
    });

    describe("similarPosts", () => {
        it("only ranks posts in the same language", () => {
            const blog = makeI18nBlog();
            const similar = blog.similarPosts(blog.getPost("getting-started"));
            expect(similar.map((p) => p.slug)).toEqual(["ops"]);
            expect(similar.every((p) => p.lang === "en")).toBe(true);
        });
    });

    describe("dateLocale / formatDate", () => {
        it("uses the instance locale for the default language", () => {
            expect(makeI18nBlog().dateLocale("en")).toBe("en-GB");
            expect(makeI18nBlog().formatDate("2026-06-28", "en")).toBe("28 June 2026");
        });

        it("uses a locale's dateLocale when set", () => {
            expect(makeI18nBlog().dateLocale("fr")).toBe("fr-FR");
            expect(makeI18nBlog().formatDate("2026-06-28", "fr")).toBe("28 juin 2026");
        });

        it("falls back to the code when a non-default locale has no dateLocale", () => {
            const blog = new Blog({
                contentDir: CONTENT_I18N_DIR,
                locales: [{ code: "en" }, { code: "fr" }],
                defaultLocale: "en",
            });
            expect(blog.dateLocale("fr")).toBe("fr");
        });
    });

    describe("DuplicatePostError", () => {
        it("throws when post.<ext> and <default>.<ext> in one folder resolve to the same (slug, lang)", () => {
            const blog = new Blog({
                contentDir: CONTENT_COLLISION_DIR,
                locales: [{ code: "en" }],
                defaultLocale: "en",
            });
            expect(() => blog.getPostRefs()).toThrow(DuplicatePostError);
            try {
                blog.getAllPosts();
                expect.unreachable("expected a DuplicatePostError");
            } catch (err) {
                expect(err).toBeInstanceOf(DuplicatePostError);
                expect((err as DuplicatePostError).slug).toBe("foo");
                expect((err as DuplicatePostError).lang).toBe("en");
                expect((err as DuplicatePostError).files).toContain("foo/post.mdx");
                expect((err as DuplicatePostError).files).toContain("foo/en.mdx");
            }
        });
    });

    describe("SEO methods", () => {
        const seoBlog = (): Blog => makeI18nBlog({ siteUrl: "https://example.com", brandName: "Example" });

        it("emit hreflang alternates + og:locale for a translated post", () => {
            const blog = seoBlog();
            const meta = blog.postMetadata(blog.getPost("getting-started"));
            expect(meta.alternates?.canonical).toBe("/blog/getting-started");
            expect(meta.alternates?.languages).toEqual({
                en: "/blog/getting-started",
                fr: "/fr/blog/getting-started",
                "x-default": "/blog/getting-started",
            });
            expect(meta.openGraph?.locale).toBe("en_US");
            expect(meta.openGraph?.alternateLocale).toEqual(["fr_FR"]);
        });

        it("omit hreflang for an untranslated post", () => {
            const blog = seoBlog();
            const meta = blog.postMetadata(blog.getPost("ops"));
            expect(meta.alternates?.languages).toBeUndefined();
            expect(meta.openGraph?.alternateLocale).toBeUndefined();
        });

        it("build a prefixed canonical + og:locale for a non-default language", () => {
            const blog = seoBlog();
            const meta = blog.postMetadata(blog.getPost("getting-started", "fr"));
            expect(meta.alternates?.canonical).toBe("/fr/blog/getting-started");
            expect(meta.openGraph?.locale).toBe("fr_FR");
        });

        it("emit inLanguage in the post JSON-LD", () => {
            const blog = seoBlog();
            const graph = blog.postJsonLd(blog.getPost("getting-started", "fr"))["@graph"] as Record<
                string,
                unknown
            >[];
            expect(graph[0]!.inLanguage).toBe("fr");
            expect(graph[0]!.url).toBe("https://example.com/fr/blog/getting-started");
        });

        it("emit overview hreflang across locales", () => {
            const blog = seoBlog();
            const meta = blog.overviewMetadata("fr");
            expect(meta.alternates?.canonical).toBe("/fr/blog");
            expect(meta.alternates?.languages).toEqual({
                en: "/blog",
                fr: "/fr/blog",
                "x-default": "/blog",
            });
        });

        it("build sitemap entries with hreflang alternates per (slug, lang)", () => {
            const entries = seoBlog().sitemapEntries();
            const byUrl = (url: string) => entries.find((e) => e.url === url);
            expect(entries).toHaveLength(4);

            const translated = {
                en: "https://example.com/blog/getting-started",
                fr: "https://example.com/fr/blog/getting-started",
                "x-default": "https://example.com/blog/getting-started",
            };
            expect(byUrl("https://example.com/blog/getting-started")?.alternates?.languages).toEqual(translated);
            expect(byUrl("https://example.com/fr/blog/getting-started")?.alternates?.languages).toEqual(translated);

            // Untranslated posts carry no alternates.
            expect(byUrl("https://example.com/blog/ops")?.alternates).toBeUndefined();
            expect(byUrl("https://example.com/fr/blog/only-fr")?.alternates).toBeUndefined();
        });

        it("throw a clear error from sitemapEntries when no site config was provided", () => {
            expect(() => makeI18nBlog().sitemapEntries()).toThrow(/site/);
        });
    });
});
