import { describe, expect, it } from "vitest";
import { buildOverviewMetadata, buildPostMetadata, overviewJsonLd, postJsonLd } from "../seo.js";
import type { PostMeta, SiteConfig } from "../types.js";

/** A fully-populated post used across the metadata/JSON-LD assertions. */
const POST: PostMeta = {
    slug: "hello-world",
    lang: "en",
    title: "Hello World",
    date: "2026-06-28",
    description: "A first post.",
    keywords: ["hello", "world"],
    author: "Jane Doe",
    image: "/assets/blog/hello-world.jpg",
    updated: "2026-07-07",
};

/** Base site config. */
const SITE: SiteConfig = { siteUrl: "https://example.com", brandName: "Example" };

/** Site config with a default locale, for the multi-language builders. */
const SITE_I18N: SiteConfig = { siteUrl: "https://example.com", brandName: "Example", defaultLocale: "en" };

/** Site config that stitches the blog into a host site's existing schema.org graph by `@id`. */
const SITE_LINKED: SiteConfig = {
    ...SITE,
    organizationId: "https://example.com/#organization",
    authorId: "https://example.com/#person",
    websiteId: "https://example.com/#website",
};

describe("buildPostMetadata", () => {
    it("builds title, description, keywords, canonical and metadataBase", () => {
        const meta = buildPostMetadata(POST, SITE);
        expect(meta.title).toBe("Hello World | Example");
        expect(meta.description).toBe("A first post.");
        expect(meta.keywords).toEqual(["hello", "world"]);
        expect(meta.metadataBase?.toString()).toBe("https://example.com/");
        expect(meta.alternates?.canonical).toBe("/blog/hello-world");
        expect(meta.authors).toEqual([{ name: "Jane Doe" }]);
    });

    it("builds article OpenGraph and summary_large_image Twitter tags with images", () => {
        const meta = buildPostMetadata(POST, SITE);
        expect(meta.openGraph?.type).toBe("article");
        expect(meta.openGraph?.url).toBe("/blog/hello-world");
        expect(meta.openGraph?.publishedTime).toBe("2026-06-28");
        expect(meta.openGraph?.modifiedTime).toBe("2026-07-07");
        expect(meta.openGraph?.images).toEqual([{ url: "/assets/blog/hello-world.jpg" }]);
        expect(meta.twitter?.card).toBe("summary_large_image");
        expect(meta.twitter?.images).toEqual(["/assets/blog/hello-world.jpg"]);
    });

    it("falls back modifiedTime to publish date and omits images when no image", () => {
        const meta = buildPostMetadata({ ...POST, updated: undefined, image: undefined }, SITE);
        expect(meta.openGraph?.modifiedTime).toBe("2026-06-28");
        expect(meta.openGraph?.images).toBeUndefined();
        expect(meta.twitter?.images).toBeUndefined();
    });

    it("uses defaultAuthor then brandName when the post has no author", () => {
        expect(buildPostMetadata({ ...POST, author: undefined }, SITE).authors).toEqual([{ name: "Example" }]);
        expect(
            buildPostMetadata({ ...POST, author: undefined }, { ...SITE, defaultAuthor: "Editorial" }).authors,
        ).toEqual([{ name: "Editorial" }]);
    });

    it("respects a custom basePath (with trailing slash normalised)", () => {
        expect(buildPostMetadata(POST, { ...SITE, basePath: "/articles/" }).alternates?.canonical).toBe(
            "/articles/hello-world",
        );
    });
});

describe("buildOverviewMetadata", () => {
    it("builds the index title, canonical, and website OpenGraph", () => {
        const meta = buildOverviewMetadata({ ...SITE, description: "Our blog." });
        expect(meta.title).toBe("Blog | Example");
        expect(meta.description).toBe("Our blog.");
        expect(meta.alternates?.canonical).toBe("/blog");
        expect(meta.openGraph?.type).toBe("website");
        expect(meta.openGraph?.title).toBe("Example Blog");
        expect(meta.twitter?.card).toBe("summary_large_image");
    });
});

describe("postJsonLd", () => {
    it("builds a BlogPosting + BreadcrumbList with fully-absolute URLs", () => {
        const ld = postJsonLd(POST, SITE);
        const graph = ld["@graph"] as Record<string, unknown>[];
        const posting = graph[0]!;
        expect(ld["@context"]).toBe("https://schema.org");
        expect(posting["@type"]).toBe("BlogPosting");
        expect(posting["@id"]).toBe("https://example.com/blog/hello-world");
        expect(posting.url).toBe("https://example.com/blog/hello-world");
        expect(posting.image).toBe("https://example.com/assets/blog/hello-world.jpg");
        expect(posting.datePublished).toBe("2026-06-28");
        expect(posting.dateModified).toBe("2026-07-07");
        expect(posting.publisher).toEqual({ "@type": "Organization", name: "Example", url: "https://example.com" });

        const breadcrumb = graph[1]!;
        expect(breadcrumb["@type"]).toBe("BreadcrumbList");
        const items = breadcrumb.itemListElement as Record<string, unknown>[];
        expect(items.map((i) => i.item)).toEqual([
            "https://example.com",
            "https://example.com/blog",
            "https://example.com/blog/hello-world",
        ]);
    });

    it("omits image when the post has none", () => {
        const graph = postJsonLd({ ...POST, image: undefined }, SITE)["@graph"] as Record<string, unknown>[];
        expect(graph[0]!).not.toHaveProperty("image");
    });
});

describe("postJsonLd (@id references)", () => {
    it("references the host organization, author, and website by @id when ids are set", () => {
        const posting = (postJsonLd(POST, SITE_LINKED)["@graph"] as Record<string, unknown>[])[0]!;
        expect(posting.author).toEqual({ "@id": "https://example.com/#person" });
        expect(posting.publisher).toEqual({ "@id": "https://example.com/#organization" });
        expect(posting.isPartOf).toEqual({ "@id": "https://example.com/#website" });
    });

    it("keeps the inlined author/publisher and omits isPartOf when no ids are set", () => {
        const posting = (postJsonLd(POST, SITE)["@graph"] as Record<string, unknown>[])[0]!;
        expect(posting.author).toEqual({ "@type": "Organization", name: "Jane Doe" });
        expect(posting.publisher).toEqual({ "@type": "Organization", name: "Example", url: "https://example.com" });
        expect(posting).not.toHaveProperty("isPartOf");
    });

    it("applies each id independently (only the configured references change)", () => {
        const posting = (
            postJsonLd(POST, { ...SITE, organizationId: "https://example.com/#organization" })["@graph"] as Record<
                string,
                unknown
            >[]
        )[0]!;
        expect(posting.publisher).toEqual({ "@id": "https://example.com/#organization" });
        expect(posting.author).toEqual({ "@type": "Organization", name: "Jane Doe" });
        expect(posting).not.toHaveProperty("isPartOf");
    });
});

describe("overviewJsonLd", () => {
    it("includes an ItemList of posts when posts exist", () => {
        const graph = overviewJsonLd([POST], SITE)["@graph"] as Record<string, unknown>[];
        expect(graph.map((g) => g["@type"])).toEqual(["CollectionPage", "BreadcrumbList", "ItemList"]);
        const itemList = graph[2]!;
        const items = itemList.itemListElement as Record<string, unknown>[];
        expect(items[0]).toEqual({
            "@type": "ListItem",
            position: 1,
            url: "https://example.com/blog/hello-world",
            name: "Hello World",
        });
    });

    it("omits the ItemList when there are no posts", () => {
        const graph = overviewJsonLd([], SITE)["@graph"] as Record<string, unknown>[];
        expect(graph.map((g) => g["@type"])).toEqual(["CollectionPage", "BreadcrumbList"]);
    });
});

describe("overviewJsonLd (@id references)", () => {
    it("adds publisher and isPartOf @id references to the CollectionPage when ids are set", () => {
        const collectionPage = (overviewJsonLd([POST], SITE_LINKED)["@graph"] as Record<string, unknown>[])[0]!;
        expect(collectionPage.publisher).toEqual({ "@id": "https://example.com/#organization" });
        expect(collectionPage.isPartOf).toEqual({ "@id": "https://example.com/#website" });
    });

    it("omits publisher and isPartOf when no ids are set", () => {
        const collectionPage = (overviewJsonLd([POST], SITE)["@graph"] as Record<string, unknown>[])[0]!;
        expect(collectionPage).not.toHaveProperty("publisher");
        expect(collectionPage).not.toHaveProperty("isPartOf");
    });
});

describe("buildPostMetadata (multi-language)", () => {
    it("emits hreflang languages + x-default and og:locale for a translated post", () => {
        const meta = buildPostMetadata({ ...POST, lang: "en" }, SITE_I18N, ["en", "fr"]);
        expect(meta.alternates?.canonical).toBe("/blog/hello-world");
        expect(meta.alternates?.languages).toEqual({
            en: "/blog/hello-world",
            fr: "/fr/blog/hello-world",
            "x-default": "/blog/hello-world",
        });
        expect(meta.openGraph?.locale).toBe("en_US");
        expect(meta.openGraph?.alternateLocale).toEqual(["fr_FR"]);
    });

    it("prefixes the canonical for a non-default language", () => {
        const meta = buildPostMetadata({ ...POST, lang: "fr" }, SITE_I18N, ["en", "fr"]);
        expect(meta.alternates?.canonical).toBe("/fr/blog/hello-world");
        expect(meta.openGraph?.locale).toBe("fr_FR");
        expect(meta.openGraph?.alternateLocale).toEqual(["en_US"]);
    });

    it("falls back x-default to the first translation when the default locale is absent", () => {
        const meta = buildPostMetadata({ ...POST, lang: "fr" }, SITE_I18N, ["fr", "de"]);
        expect(meta.alternates?.languages).toEqual({
            fr: "/fr/blog/hello-world",
            de: "/de/blog/hello-world",
            "x-default": "/fr/blog/hello-world",
        });
    });

    it("omits hreflang and alternateLocale for a single-language post", () => {
        const meta = buildPostMetadata({ ...POST, lang: "en" }, SITE_I18N);
        expect(meta.alternates?.languages).toBeUndefined();
        expect(meta.openGraph?.alternateLocale).toBeUndefined();
    });

    it("territory-qualifies og:locale and passes an unmappable code through unchanged", () => {
        expect(buildPostMetadata({ ...POST, lang: "de" }, SITE_I18N).openGraph?.locale).toBe("de_DE");
        // `zz` is a structurally-valid but unassigned subtag: no territory is derivable.
        expect(buildPostMetadata({ ...POST, lang: "zz" }, SITE_I18N).openGraph?.locale).toBe("zz");
    });

    it("prefixes the default locale too when site.prefixDefaultLocale is set", () => {
        const site: SiteConfig = { ...SITE_I18N, prefixDefaultLocale: true };
        const meta = buildPostMetadata({ ...POST, lang: "en" }, site, ["en", "fr"]);
        expect(meta.alternates?.canonical).toBe("/en/blog/hello-world");
        expect(meta.alternates?.languages).toEqual({
            en: "/en/blog/hello-world",
            fr: "/fr/blog/hello-world",
            "x-default": "/en/blog/hello-world",
        });
    });
});

describe("buildOverviewMetadata (multi-language)", () => {
    it("emits per-locale hreflang for the index across locales", () => {
        const meta = buildOverviewMetadata(SITE_I18N, "fr", ["en", "fr"]);
        expect(meta.alternates?.canonical).toBe("/fr/blog");
        expect(meta.alternates?.languages).toEqual({
            en: "/blog",
            fr: "/fr/blog",
            "x-default": "/blog",
        });
        expect(meta.openGraph?.locale).toBe("fr_FR");
    });

    it("omits hreflang for a single-locale blog", () => {
        const meta = buildOverviewMetadata(SITE_I18N, "en", ["en"]);
        expect(meta.alternates?.languages).toBeUndefined();
    });
});

describe("postJsonLd (multi-language)", () => {
    it("sets inLanguage and a prefixed URL for a non-default language", () => {
        const graph = postJsonLd({ ...POST, lang: "fr" }, SITE_I18N)["@graph"] as Record<string, unknown>[];
        expect(graph[0]!.inLanguage).toBe("fr");
        expect(graph[0]!.url).toBe("https://example.com/fr/blog/hello-world");
        const items = graph[1]!.itemListElement as Record<string, unknown>[];
        expect(items[2]!.item).toBe("https://example.com/fr/blog/hello-world");
    });

    it("emits no translation cross-links for an untranslated post", () => {
        const posting = (postJsonLd(POST, SITE_I18N)["@graph"] as Record<string, unknown>[])[0]!;
        expect(posting).not.toHaveProperty("workTranslation");
        expect(posting).not.toHaveProperty("translationOfWork");
    });

    it("gives the original (default-locale) post a workTranslation for each translation", () => {
        const posting = (postJsonLd({ ...POST, lang: "en" }, SITE_I18N, ["en", "fr"])["@graph"] as Record<
            string,
            unknown
        >[])[0]!;
        expect(posting).not.toHaveProperty("translationOfWork");
        expect(posting.workTranslation).toEqual([
            {
                "@type": "BlogPosting",
                "@id": "https://example.com/fr/blog/hello-world",
                url: "https://example.com/fr/blog/hello-world",
                inLanguage: "fr",
            },
        ]);
    });

    it("gives a translation a translationOfWork pointing at the original, and no workTranslation", () => {
        const posting = (postJsonLd({ ...POST, lang: "fr" }, SITE_I18N, ["en", "fr", "de"])["@graph"] as Record<
            string,
            unknown
        >[])[0]!;
        expect(posting).not.toHaveProperty("workTranslation");
        expect(posting.translationOfWork).toEqual({
            "@type": "BlogPosting",
            "@id": "https://example.com/blog/hello-world",
            url: "https://example.com/blog/hello-world",
            inLanguage: "en",
        });
    });

    it("treats the first translation as the original when the default locale is absent", () => {
        const graph = postJsonLd({ ...POST, lang: "fr" }, SITE_I18N, ["fr", "de"])["@graph"] as Record<
            string,
            unknown
        >[];
        const original = graph[0]!;
        expect(original.workTranslation).toEqual([
            {
                "@type": "BlogPosting",
                "@id": "https://example.com/de/blog/hello-world",
                url: "https://example.com/de/blog/hello-world",
                inLanguage: "de",
            },
        ]);
        const translation = (postJsonLd({ ...POST, lang: "de" }, SITE_I18N, ["fr", "de"])["@graph"] as Record<
            string,
            unknown
        >[])[0]!;
        expect(translation.translationOfWork).toEqual({
            "@type": "BlogPosting",
            "@id": "https://example.com/fr/blog/hello-world",
            url: "https://example.com/fr/blog/hello-world",
            inLanguage: "fr",
        });
    });
});

describe("overviewJsonLd (multi-language)", () => {
    it("builds prefixed URLs for a non-default language index", () => {
        const graph = overviewJsonLd([{ ...POST, lang: "fr" }], SITE_I18N, "fr")["@graph"] as Record<
            string,
            unknown
        >[];
        expect(graph[0]!.url).toBe("https://example.com/fr/blog");
        const items = graph[2]!.itemListElement as Record<string, unknown>[];
        expect(items[0]!.url).toBe("https://example.com/fr/blog/hello-world");
    });
});
