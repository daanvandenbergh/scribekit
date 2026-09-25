import { describe, expect, it } from "vitest";
import { absoluteUrl, buildSitemap, hreflangMap, localeOrigin, metadataUrl, ogLocale, ogLocaleFor, pageUrl, sitePath } from "../seo.js";
import type { SiteConfig } from "../types.js";

/** Site config with a default locale, exercising the i18n sitemap paths. */
const SITE_I18N: SiteConfig = { siteUrl: "https://example.com", brandName: "Example", defaultLocale: "en" };

describe("absoluteUrl", () => {
    it("resolves a root-relative path against the site origin", () => {
        expect(absoluteUrl("https://example.com", "/docs/x/")).toBe("https://example.com/docs/x/");
    });

    it("passes an already-absolute URL through", () => {
        expect(absoluteUrl("https://example.com", "https://cdn.example.com/a.jpg")).toBe(
            "https://cdn.example.com/a.jpg",
        );
    });

    it("prepends a sub-path carried by the site origin instead of discarding it", () => {
        expect(absoluteUrl("https://user.github.io/repo", "/docs/x")).toBe("https://user.github.io/repo/docs/x");
        expect(absoluteUrl("https://user.github.io/repo/", "/docs/x")).toBe("https://user.github.io/repo/docs/x");
        // A pure joiner: it preserves whatever shape the path has, trailing slash or not.
        expect(absoluteUrl("https://user.github.io/repo", "/docs/x/")).toBe("https://user.github.io/repo/docs/x/");
        expect(absoluteUrl("https://user.github.io/repo", "/")).toBe("https://user.github.io/repo/");
    });

    it("leaves an already-absolute URL alone even when the origin has a sub-path", () => {
        expect(absoluteUrl("https://user.github.io/repo", "https://cdn.example.com/a.jpg")).toBe(
            "https://cdn.example.com/a.jpg",
        );
    });
});

describe("ogLocaleFor", () => {
    it("prefers the locale's own BCP 47 tag over maximizing its bare code", () => {
        // The silent bug this exists for: `en` maximizes to `en_US`, so a site whose locale set says
        // `en-GB` announced American English to every platform that reads og:locale.
        const locales = [{ code: "en", dateLocale: "en-GB" }, { code: "nl", dateLocale: "nl-NL" }];
        expect(ogLocaleFor(locales, "en")).toBe("en_GB");
        expect(ogLocaleFor(locales, "nl")).toBe("nl_NL");
        // Proves the assertion above is not vacuous - the bare code really does resolve elsewhere.
        expect(ogLocale("en")).toBe("en_US");
    });

    it("falls back to the bare code when the locale declares no tag, or is not configured at all", () => {
        expect(ogLocaleFor([{ code: "en" }], "en")).toBe("en_US");
        expect(ogLocaleFor([{ code: "en", dateLocale: "en-GB" }], "fr")).toBe("fr_FR");
        expect(ogLocaleFor(undefined, "en")).toBe("en_US");
        expect(ogLocaleFor([], "de")).toBe("de_DE");
    });
});

describe("ogLocale", () => {
    it("territory-qualifies a bare language subtag", () => {
        expect(ogLocale("en")).toBe("en_US");
        expect(ogLocale("fr")).toBe("fr_FR");
        expect(ogLocale("de")).toBe("de_DE");
    });

    it("preserves a tag that already carries a region", () => {
        expect(ogLocale("pt-BR")).toBe("pt_BR");
    });

    it("passes an unmappable or invalid code through unchanged", () => {
        // `zz` is structurally valid but unassigned: no territory is derivable.
        expect(ogLocale("zz")).toBe("zz");
        expect(ogLocale("not a locale")).toBe("not a locale");
    });
});

describe("hreflangMap", () => {
    const urlFor = (lang: string): string => (lang === "en" ? "/x" : `/${lang}/x`);

    it("returns undefined for zero or one translation", () => {
        expect(hreflangMap([], "en", urlFor)).toBeUndefined();
        expect(hreflangMap(["en"], "en", urlFor)).toBeUndefined();
    });

    it("maps each language and adds x-default pointing at the default locale", () => {
        expect(hreflangMap(["en", "fr"], "en", urlFor)).toEqual({
            en: "/x",
            fr: "/fr/x",
            "x-default": "/x",
        });
    });

    it("falls back x-default to the first translation when the default locale is absent", () => {
        expect(hreflangMap(["fr", "de"], "en", urlFor)).toEqual({
            fr: "/fr/x",
            de: "/de/x",
            "x-default": "/fr/x",
        });
    });
});

describe("buildSitemap", () => {
    /** Translations lookup for a corpus where `a` is en+fr and `b` is en-only. */
    const translationsOf = (slug: string): string[] => (slug === "a" ? ["en", "fr"] : ["en"]);
    const REFS = [
        { slug: "a", lang: "en" },
        { slug: "a", lang: "fr" },
        { slug: "b", lang: "en" },
    ];

    it("emits one absolute-URL entry per (slug, lang), in order", () => {
        const entries = buildSitemap(REFS, SITE_I18N, translationsOf);
        expect(entries.map((e) => e.url)).toEqual([
            "https://example.com/blog/a/",
            "https://example.com/fr/blog/a/",
            "https://example.com/blog/b/",
        ]);
    });

    it("attaches the full hreflang map (with x-default) to every translated page", () => {
        const [en, fr] = buildSitemap(REFS, SITE_I18N, translationsOf);
        const languages = {
            en: "https://example.com/blog/a/",
            fr: "https://example.com/fr/blog/a/",
            "x-default": "https://example.com/blog/a/",
        };
        expect(en!.alternates?.languages).toEqual(languages);
        expect(fr!.alternates?.languages).toEqual(languages);
    });

    it("omits alternates for an untranslated page", () => {
        const b = buildSitemap(REFS, SITE_I18N, translationsOf)[2];
        expect(b!.alternates).toBeUndefined();
    });

    it("falls back x-default to the first translation when the default locale is absent", () => {
        const entries = buildSitemap([{ slug: "a", lang: "fr" }], SITE_I18N, () => ["fr", "de"]);
        expect(entries[0]!.alternates?.languages?.["x-default"]).toBe("https://example.com/fr/blog/a/");
    });

    it("respects basePath and prefixDefaultLocale", () => {
        const site: SiteConfig = { ...SITE_I18N, basePath: "/articles/", prefixDefaultLocale: true };
        const entries = buildSitemap([{ slug: "a", lang: "en" }], site, translationsOf);
        expect(entries[0]!.url).toBe("https://example.com/en/articles/a/");
        expect(entries[0]!.alternates?.languages).toEqual({
            en: "https://example.com/en/articles/a/",
            fr: "https://example.com/fr/articles/a/",
            "x-default": "https://example.com/en/articles/a/",
        });
    });

    it("returns an empty array for no refs", () => {
        expect(buildSitemap([], SITE_I18N, translationsOf)).toEqual([]);
    });
});

describe("domain-per-locale URL primitives", () => {
    /** A three-domain site: nl default, no trailing slash. */
    const DOMAINS: SiteConfig = {
        siteUrl: "https://example.nl",
        brandName: "Example",
        defaultLocale: "nl",
        trailingSlash: false,
        localeOrigins: { nl: "https://example.nl", de: "https://example.de", fr: "https://example.fr" },
    };

    it("localeOrigin picks the locale's own origin, falling back to siteUrl", () => {
        expect(localeOrigin(DOMAINS, "de")).toBe("https://example.de");
        expect(localeOrigin(DOMAINS, "xx")).toBe("https://example.nl");
        expect(localeOrigin(SITE_I18N, "fr")).toBe("https://example.com");
    });

    it("sitePath drops the locale prefix only on a domain-per-locale site", () => {
        expect(sitePath(DOMAINS, "nl", "de", "post")).toBe("/blog/post");
        expect(sitePath(DOMAINS, "nl", "fr")).toBe("/blog");
        expect(sitePath(SITE_I18N, "en", "fr", "post")).toBe("/fr/blog/post/");
    });

    it("pageUrl puts the path on the locale's origin", () => {
        expect(pageUrl(DOMAINS, "nl", "de", "post")).toBe("https://example.de/blog/post");
        expect(pageUrl(SITE_I18N, "en", "fr", "post")).toBe("https://example.com/fr/blog/post/");
    });

    it("metadataUrl is root-relative on one origin and absolute across domains", () => {
        expect(metadataUrl(SITE_I18N, "en", "fr", "post")).toBe("/fr/blog/post/");
        expect(metadataUrl(DOMAINS, "nl", "fr", "post")).toBe("https://example.fr/blog/post");
    });

    it("buildSitemap puts each entry and every alternate on its locale's domain", () => {
        const entries = buildSitemap(
            [
                { slug: "post", lang: "nl" },
                { slug: "post", lang: "de" },
                { slug: "solo", lang: "fr" },
            ],
            DOMAINS,
            (slug) => (slug === "post" ? ["nl", "de"] : ["fr"]),
        );
        const alternates = {
            nl: "https://example.nl/blog/post",
            de: "https://example.de/blog/post",
            "x-default": "https://example.nl/blog/post",
        };
        expect(entries).toEqual([
            { url: "https://example.nl/blog/post", alternates: { languages: alternates } },
            { url: "https://example.de/blog/post", alternates: { languages: alternates } },
            { url: "https://example.fr/blog/solo" },
        ]);
    });
});
