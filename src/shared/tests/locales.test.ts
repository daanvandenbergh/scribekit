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
        expect(localePath({ basePath: "/blog", defaultLocale: "en", lang: "en", slug: "post" })).toBe("/blog/post/");
    });

    it("prefixes a non-default locale with its code at the front of the path", () => {
        expect(localePath({ basePath: "/blog", defaultLocale: "en", lang: "fr", slug: "post" })).toBe(
            "/fr/blog/post/",
        );
    });

    it("builds a default-locale overview URL when slug is omitted", () => {
        expect(localePath({ basePath: "/blog", defaultLocale: "en", lang: "en" })).toBe("/blog/");
    });

    it("builds a non-default overview URL when slug is omitted", () => {
        expect(localePath({ basePath: "/blog", defaultLocale: "en", lang: "fr" })).toBe("/fr/blog/");
    });

    it("normalises the base path (default + trailing slash)", () => {
        expect(localePath({ basePath: undefined, defaultLocale: "en", lang: "en", slug: "x" })).toBe("/blog/x/");
        expect(localePath({ basePath: "/articles/", defaultLocale: "en", lang: "fr", slug: "x" })).toBe(
            "/fr/articles/x/",
        );
    });

    it("prefixes the default locale too when prefixDefaultLocale is set", () => {
        expect(
            localePath({ basePath: "/blog", defaultLocale: "en", lang: "en", slug: "post", prefixDefaultLocale: true }),
        ).toBe("/en/blog/post/");
        expect(
            localePath({ basePath: "/blog", defaultLocale: "en", lang: "en", prefixDefaultLocale: true }),
        ).toBe("/en/blog/");
        // A non-default locale is prefixed regardless of the flag.
        expect(
            localePath({ basePath: "/blog", defaultLocale: "en", lang: "fr", slug: "post", prefixDefaultLocale: true }),
        ).toBe("/fr/blog/post/");
    });

    it("builds docs-style paths from a /docs base", () => {
        expect(localePath({ basePath: "/docs", defaultLocale: "en", lang: "en", slug: "quickstart" })).toBe(
            "/docs/quickstart/",
        );
        expect(localePath({ basePath: "/docs", defaultLocale: "en", lang: "fr", slug: "quickstart" })).toBe(
            "/fr/docs/quickstart/",
        );
    });

    it("mounts at the site root when the base path is empty", () => {
        for (const basePath of ["", "/"]) {
            expect(localePath({ basePath, defaultLocale: "en", lang: "en", slug: "quickstart" })).toBe("/quickstart/");
            // The index must be "/", not "" - an empty href would resolve to the current page.
            expect(localePath({ basePath, defaultLocale: "en", lang: "en" })).toBe("/");
            expect(localePath({ basePath, defaultLocale: "en", lang: "fr", slug: "quickstart" })).toBe(
                "/fr/quickstart/",
            );
            expect(localePath({ basePath, defaultLocale: "en", lang: "fr" })).toBe("/fr/");
            expect(localePath({ basePath, defaultLocale: "en", lang: "en", prefixDefaultLocale: true })).toBe("/en/");
        }
    });

    describe("trailingSlash", () => {
        it("defaults to true - the URL form Next's trailingSlash: true serves", () => {
            expect(localePath({ basePath: "/docs", defaultLocale: "en", lang: "en", slug: "x" })).toBe("/docs/x/");
            expect(localePath({ basePath: "/docs", defaultLocale: "en", lang: "en", slug: "x", trailingSlash: undefined })).toBe(
                "/docs/x/",
            );
        });

        it("omits the slash when false, for a host serving bare paths", () => {
            const off = { trailingSlash: false as const, defaultLocale: "en" };
            expect(localePath({ ...off, basePath: "/docs", lang: "en", slug: "x" })).toBe("/docs/x");
            expect(localePath({ ...off, basePath: "/docs", lang: "fr", slug: "x" })).toBe("/fr/docs/x");
            // The index follows the flag too: under trailingSlash:false the export writes
            // `docs.html`, so `/docs/` would 404 - the bare form is the one that resolves.
            expect(localePath({ ...off, basePath: "/docs", lang: "en" })).toBe("/docs");
            expect(localePath({ ...off, basePath: "/docs", lang: "fr" })).toBe("/fr/docs");
            expect(localePath({ ...off, basePath: "", lang: "fr" })).toBe("/fr");
        });

        it("keeps the site root exactly / under either setting", () => {
            // "/" is already its own trailing slash; "//" would be a different, broken URL.
            for (const trailingSlash of [true, false]) {
                expect(localePath({ basePath: "", defaultLocale: "en", lang: "en", trailingSlash })).toBe("/");
                expect(localePath({ basePath: "/", defaultLocale: "en", lang: "en", trailingSlash })).toBe("/");
            }
        });

        it("never doubles a slash, whatever the base path's own shape", () => {
            for (const basePath of ["/docs", "/docs/", "docs"]) {
                for (const trailingSlash of [true, false]) {
                    const url = localePath({ basePath, defaultLocale: "en", lang: "en", slug: "x", trailingSlash });
                    expect(url).not.toContain("//");
                }
            }
        });
    });
});
