import { describe, expect, it } from "vitest";
import { localePath, normalizeBasePath } from "../locales.js";

describe("normalizeBasePath", () => {
    it("defaults to /blog when unset", () => {
        expect(normalizeBasePath(undefined)).toBe("/blog");
    });

    it("strips a trailing slash", () => {
        expect(normalizeBasePath("/articles/")).toBe("/articles");
    });

    it("adds a leading slash when missing", () => {
        expect(normalizeBasePath("blog")).toBe("/blog");
    });

    it("collapses a bare slash to an empty base (root mount)", () => {
        expect(normalizeBasePath("/")).toBe("");
    });
});

describe("localePath", () => {
    it("serves the default locale unprefixed", () => {
        expect(localePath({ basePath: "/blog", defaultLocale: "en", lang: "en", slug: "post" })).toBe("/blog/post");
    });

    it("prefixes a non-default locale with its code at the front of the path", () => {
        expect(localePath({ basePath: "/blog", defaultLocale: "en", lang: "fr", slug: "post" })).toBe(
            "/fr/blog/post",
        );
    });

    it("builds a default-locale overview URL when slug is omitted", () => {
        expect(localePath({ basePath: "/blog", defaultLocale: "en", lang: "en" })).toBe("/blog");
    });

    it("builds a non-default overview URL when slug is omitted", () => {
        expect(localePath({ basePath: "/blog", defaultLocale: "en", lang: "fr" })).toBe("/fr/blog");
    });

    it("normalises the base path (default + trailing slash)", () => {
        expect(localePath({ basePath: undefined, defaultLocale: "en", lang: "en", slug: "x" })).toBe("/blog/x");
        expect(localePath({ basePath: "/articles/", defaultLocale: "en", lang: "fr", slug: "x" })).toBe(
            "/fr/articles/x",
        );
    });

    it("prefixes the default locale too when prefixDefaultLocale is set", () => {
        expect(
            localePath({ basePath: "/blog", defaultLocale: "en", lang: "en", slug: "post", prefixDefaultLocale: true }),
        ).toBe("/en/blog/post");
        expect(
            localePath({ basePath: "/blog", defaultLocale: "en", lang: "en", prefixDefaultLocale: true }),
        ).toBe("/en/blog");
        // A non-default locale is prefixed regardless of the flag.
        expect(
            localePath({ basePath: "/blog", defaultLocale: "en", lang: "fr", slug: "post", prefixDefaultLocale: true }),
        ).toBe("/fr/blog/post");
    });

    it("builds docs-style paths from a /docs base", () => {
        expect(localePath({ basePath: "/docs", defaultLocale: "en", lang: "en", slug: "quickstart" })).toBe(
            "/docs/quickstart",
        );
        expect(localePath({ basePath: "/docs", defaultLocale: "en", lang: "fr", slug: "quickstart" })).toBe(
            "/fr/docs/quickstart",
        );
    });
});
