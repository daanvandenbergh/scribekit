import { describe, expect, it } from "vitest";
import { buildDocMetadata, buildIndexMetadata, docJsonLd, indexJsonLd } from "../seo.js";
import type { DocMeta, NavItem, SiteConfig } from "../types.js";

/** A fully-populated doc page used across the metadata/JSON-LD assertions. */
const DOC: DocMeta = {
    slug: "greeting-and-voice",
    lang: "en",
    title: "Greeting & voice",
    description: "Configure how your assistant greets callers.",
    group: "Configuration",
    keywords: ["greeting", "voice"],
    image: "/assets/docs/greeting-and-voice/hero.jpg",
    updated: "2026-07-03",
};

/** Base site config; docs always carry a concrete `/docs` base path. */
const SITE: SiteConfig = { siteUrl: "https://example.com", brandName: "Example", basePath: "/docs" };

/** Site config with a default locale, for the multi-language builders. */
const SITE_I18N: SiteConfig = { ...SITE, defaultLocale: "en" };

/** Site config that stitches docs into a host site's existing schema.org graph by `@id`. */
const SITE_LINKED: SiteConfig = {
    ...SITE,
    organizationId: "https://example.com/#organization",
    authorId: "https://example.com/#person",
    websiteId: "https://example.com/#website",
};

describe("buildDocMetadata", () => {
    it("builds title, description, keywords, canonical and metadataBase", () => {
        const meta = buildDocMetadata(DOC, SITE);
        expect(meta.title).toBe("Greeting & voice | Example");
        expect(meta.description).toBe("Configure how your assistant greets callers.");
        expect(meta.keywords).toEqual(["greeting", "voice"]);
        expect(meta.metadataBase?.toString()).toBe("https://example.com/");
        expect(meta.alternates?.canonical).toBe("/docs/greeting-and-voice");
    });

    it("attributes to defaultAuthor then brandName (docs have no per-page author)", () => {
        expect(buildDocMetadata(DOC, SITE).authors).toEqual([{ name: "Example" }]);
        expect(buildDocMetadata(DOC, { ...SITE, defaultAuthor: "Docs Team" }).authors).toEqual([{ name: "Docs Team" }]);
    });

    it("builds article OpenGraph and summary_large_image Twitter tags with images", () => {
        const meta = buildDocMetadata(DOC, SITE);
        expect(meta.openGraph?.type).toBe("article");
        expect(meta.openGraph?.url).toBe("/docs/greeting-and-voice");
        expect(meta.openGraph?.modifiedTime).toBe("2026-07-03");
        expect(meta.openGraph?.images).toEqual([{ url: "/assets/docs/greeting-and-voice/hero.jpg" }]);
        expect(meta.twitter?.images).toEqual(["/assets/docs/greeting-and-voice/hero.jpg"]);
    });

    it("omits publishedTime/modifiedTime/images when no dates or image are set", () => {
        const meta = buildDocMetadata({ ...DOC, updated: undefined, date: undefined, image: undefined }, SITE);
        expect(meta.openGraph?.publishedTime).toBeUndefined();
        expect(meta.openGraph?.modifiedTime).toBeUndefined();
        expect(meta.openGraph?.images).toBeUndefined();
        expect(meta.twitter?.images).toBeUndefined();
    });

    it("falls back modifiedTime to the publish date when there is no update", () => {
        const meta = buildDocMetadata({ ...DOC, updated: undefined, date: "2026-06-01" }, SITE);
        expect(meta.openGraph?.publishedTime).toBe("2026-06-01");
        expect(meta.openGraph?.modifiedTime).toBe("2026-06-01");
    });

    it("respects a custom basePath", () => {
        expect(buildDocMetadata(DOC, { ...SITE, basePath: "/handbook/" }).alternates?.canonical).toBe(
            "/handbook/greeting-and-voice",
        );
    });

    it("emits hreflang languages + x-default and og:locale for a translated page", () => {
        const meta = buildDocMetadata(DOC, SITE_I18N, ["en", "fr"]);
        expect(meta.alternates?.languages).toEqual({
            en: "/docs/greeting-and-voice",
            fr: "/fr/docs/greeting-and-voice",
            "x-default": "/docs/greeting-and-voice",
        });
        expect(meta.openGraph?.locale).toBe("en_US");
        expect(meta.openGraph?.alternateLocale).toEqual(["fr_FR"]);
    });

    it("prefixes the canonical for a non-default language", () => {
        const meta = buildDocMetadata({ ...DOC, lang: "fr" }, SITE_I18N, ["en", "fr"]);
        expect(meta.alternates?.canonical).toBe("/fr/docs/greeting-and-voice");
        expect(meta.openGraph?.locale).toBe("fr_FR");
    });

    it("omits hreflang for a single-language page", () => {
        expect(buildDocMetadata(DOC, SITE_I18N).alternates?.languages).toBeUndefined();
    });

    it("marks a hidden page noindex and leaves a visible page indexable", () => {
        expect(buildDocMetadata({ ...DOC, hidden: true }, SITE).robots).toEqual({ index: false });
        expect(buildDocMetadata(DOC, SITE).robots).toBeUndefined();
    });
});

describe("buildIndexMetadata", () => {
    it("builds the docs index title, canonical, and website OpenGraph", () => {
        const meta = buildIndexMetadata({ ...SITE, description: "Everything you need." });
        expect(meta.title).toBe("Docs | Example");
        expect(meta.description).toBe("Everything you need.");
        expect(meta.alternates?.canonical).toBe("/docs");
        expect(meta.openGraph?.type).toBe("website");
        expect(meta.openGraph?.title).toBe("Example Docs");
    });

    it("falls back to a generated description when none is set", () => {
        expect(buildIndexMetadata(SITE).description).toBe("The Example documentation.");
    });

    it("emits per-locale hreflang for the index across locales", () => {
        const meta = buildIndexMetadata(SITE_I18N, "fr", ["en", "fr"]);
        expect(meta.alternates?.canonical).toBe("/fr/docs");
        expect(meta.alternates?.languages).toEqual({ en: "/docs", fr: "/fr/docs", "x-default": "/docs" });
    });

    it("omits hreflang for a single-locale docs site", () => {
        expect(buildIndexMetadata(SITE_I18N, "en", ["en"]).alternates?.languages).toBeUndefined();
    });
});

describe("docJsonLd", () => {
    it("builds a TechArticle + BreadcrumbList with fully-absolute URLs", () => {
        const graph = docJsonLd(DOC, SITE)["@graph"] as Record<string, unknown>[];
        const article = graph[0]!;
        expect(article["@type"]).toBe("TechArticle");
        expect(article["@id"]).toBe("https://example.com/docs/greeting-and-voice");
        expect(article.url).toBe("https://example.com/docs/greeting-and-voice");
        expect(article.image).toBe("https://example.com/assets/docs/greeting-and-voice/hero.jpg");
        expect(article.dateModified).toBe("2026-07-03");
        expect(article).not.toHaveProperty("datePublished");
        expect(article.publisher).toEqual({ "@type": "Organization", name: "Example", url: "https://example.com" });
    });

    it("puts the group between Docs and the page in the breadcrumb", () => {
        const graph = docJsonLd(DOC, SITE)["@graph"] as Record<string, unknown>[];
        const items = graph[1]!.itemListElement as Record<string, unknown>[];
        expect(items.map((i) => i.name)).toEqual(["Home", "Docs", "Configuration", "Greeting & voice"]);
        expect(items.map((i) => i.position)).toEqual([1, 2, 3, 4]);
        // The group has no URL of its own.
        expect(items[2]).not.toHaveProperty("item");
        expect(items[3]!.item).toBe("https://example.com/docs/greeting-and-voice");
    });

    it("omits the group crumb when the page has no group", () => {
        const graph = docJsonLd({ ...DOC, group: undefined }, SITE)["@graph"] as Record<string, unknown>[];
        const items = graph[1]!.itemListElement as Record<string, unknown>[];
        expect(items.map((i) => i.name)).toEqual(["Home", "Docs", "Greeting & voice"]);
    });

    it("references host organization, author, and website by @id when ids are set", () => {
        const article = (docJsonLd(DOC, SITE_LINKED)["@graph"] as Record<string, unknown>[])[0]!;
        expect(article.author).toEqual({ "@id": "https://example.com/#person" });
        expect(article.publisher).toEqual({ "@id": "https://example.com/#organization" });
        expect(article.isPartOf).toEqual({ "@id": "https://example.com/#website" });
    });

    it("gives the original a workTranslation and a translation a translationOfWork (as TechArticle)", () => {
        const original = (docJsonLd({ ...DOC, lang: "en" }, SITE_I18N, ["en", "fr"])["@graph"] as Record<string, unknown>[])[0]!;
        expect(original.workTranslation).toEqual([
            {
                "@type": "TechArticle",
                "@id": "https://example.com/fr/docs/greeting-and-voice",
                url: "https://example.com/fr/docs/greeting-and-voice",
                inLanguage: "fr",
            },
        ]);
        const translation = (docJsonLd({ ...DOC, lang: "fr" }, SITE_I18N, ["en", "fr"])["@graph"] as Record<string, unknown>[])[0]!;
        expect(translation.translationOfWork).toEqual({
            "@type": "TechArticle",
            "@id": "https://example.com/docs/greeting-and-voice",
            url: "https://example.com/docs/greeting-and-voice",
            inLanguage: "en",
        });
    });

    it("emits no translation cross-links for an untranslated page", () => {
        const article = (docJsonLd(DOC, SITE_I18N)["@graph"] as Record<string, unknown>[])[0]!;
        expect(article).not.toHaveProperty("workTranslation");
        expect(article).not.toHaveProperty("translationOfWork");
    });
});

describe("indexJsonLd", () => {
    const ITEMS: NavItem[] = [
        { slug: "introduction", title: "Introduction", label: "Introduction", href: "/docs/introduction", lang: "en" },
        { slug: "quickstart", title: "Quickstart", label: "Quickstart", href: "/docs/quickstart", lang: "en" },
    ];

    it("includes a CollectionPage, BreadcrumbList, and an ItemList of pages in order", () => {
        const graph = indexJsonLd(ITEMS, SITE)["@graph"] as Record<string, unknown>[];
        expect(graph.map((g) => g["@type"])).toEqual(["CollectionPage", "BreadcrumbList", "ItemList"]);
        const items = graph[2]!.itemListElement as Record<string, unknown>[];
        expect(items[0]).toEqual({
            "@type": "ListItem",
            position: 1,
            url: "https://example.com/docs/introduction",
            name: "Introduction",
        });
        expect(items[1]!.position).toBe(2);
    });

    it("omits the ItemList when there are no pages", () => {
        const graph = indexJsonLd([], SITE)["@graph"] as Record<string, unknown>[];
        expect(graph.map((g) => g["@type"])).toEqual(["CollectionPage", "BreadcrumbList"]);
    });

    it("adds publisher and isPartOf @id references to the CollectionPage when ids are set", () => {
        const collectionPage = (indexJsonLd(ITEMS, SITE_LINKED)["@graph"] as Record<string, unknown>[])[0]!;
        expect(collectionPage.publisher).toEqual({ "@id": "https://example.com/#organization" });
        expect(collectionPage.isPartOf).toEqual({ "@id": "https://example.com/#website" });
    });

    it("builds prefixed absolute URLs from each item's href", () => {
        const frItems: NavItem[] = [
            { slug: "introduction", title: "Introduction", label: "Introduction", href: "/fr/docs/introduction", lang: "fr" },
        ];
        const graph = indexJsonLd(frItems, SITE_I18N, "fr")["@graph"] as Record<string, unknown>[];
        expect(graph[0]!.url).toBe("https://example.com/fr/docs");
        const items = graph[2]!.itemListElement as Record<string, unknown>[];
        expect(items[0]!.url).toBe("https://example.com/fr/docs/introduction");
    });
});
