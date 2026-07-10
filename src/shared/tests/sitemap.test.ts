import { describe, expect, it } from "vitest";
import { absoluteUrl, buildSitemap, hreflangMap, ogLocale } from "../seo.js";
import type { SiteConfig } from "../types.js";

/** Site config with a default locale, exercising the i18n sitemap paths. */
const SITE_I18N: SiteConfig = { siteUrl: "https://example.com", brandName: "Example", defaultLocale: "en" };

describe("absoluteUrl", () => {
    it("resolves a root-relative path against the site origin", () => {
        expect(absoluteUrl("https://example.com", "/docs/x")).toBe("https://example.com/docs/x");
    });

    it("passes an already-absolute URL through", () => {
        expect(absoluteUrl("https://example.com", "https://cdn.example.com/a.jpg")).toBe(
            "https://cdn.example.com/a.jpg",
        );
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
            "https://example.com/blog/a",
            "https://example.com/fr/blog/a",
            "https://example.com/blog/b",
        ]);
    });

    it("attaches the full hreflang map (with x-default) to every translated page", () => {
        const [en, fr] = buildSitemap(REFS, SITE_I18N, translationsOf);
        const languages = {
            en: "https://example.com/blog/a",
            fr: "https://example.com/fr/blog/a",
            "x-default": "https://example.com/blog/a",
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
        expect(entries[0]!.alternates?.languages?.["x-default"]).toBe("https://example.com/fr/blog/a");
    });

    it("respects basePath and prefixDefaultLocale", () => {
        const site: SiteConfig = { ...SITE_I18N, basePath: "/articles/", prefixDefaultLocale: true };
        const entries = buildSitemap([{ slug: "a", lang: "en" }], site, translationsOf);
        expect(entries[0]!.url).toBe("https://example.com/en/articles/a");
        expect(entries[0]!.alternates?.languages).toEqual({
            en: "https://example.com/en/articles/a",
            fr: "https://example.com/fr/articles/a",
            "x-default": "https://example.com/en/articles/a",
        });
    });

    it("returns an empty array for no refs", () => {
        expect(buildSitemap([], SITE_I18N, translationsOf)).toEqual([]);
    });
});
