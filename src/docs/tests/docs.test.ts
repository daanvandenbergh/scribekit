import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Docs } from "../docs.js";
import { DocNotFoundError, DuplicateDocError } from "../errors.js";
import { flattenNav } from "../navigation.js";
import type { DocsConfig } from "../types.js";

/** Directory of this test file, used to resolve the fixture folders. */
const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Builds a `Docs` over the rich fixture corpus: two tabs, three groups, an i18n page, an
 * `fr`-only page, a `hidden` draft, and a page with no `order`.
 */
function makeDocs(): Docs {
    return new Docs({
        contentDir: path.join(HERE, "fixtures/docs"),
        siteUrl: "https://example.com",
        brandName: "Example",
        locales: [
            { code: "en", label: "English" },
            { code: "fr", label: "Français", dateLocale: "fr-FR" },
        ],
        defaultLocale: "en",
        tabs: ["Documentation", "API reference"],
        groups: ["Get started", "Configuration", "Auth"],
    });
}

describe("Docs.getDocSlugs / getDocRefs", () => {
    const docs = makeDocs();

    it("lists every distinct slug once", () => {
        expect(docs.getDocSlugs().sort()).toEqual([
            "authentication",
            "availability",
            "call-forwarding",
            "draft",
            "fr-guide",
            "greeting-and-voice",
            "introduction",
            "quickstart",
        ]);
    });

    it("lists every (slug, lang) route, including hidden and fr-only pages", () => {
        const refs = docs.getDocRefs();
        expect(refs).toContainEqual({ slug: "draft", lang: "en" });
        expect(refs).toContainEqual({ slug: "introduction", lang: "fr" });
        expect(refs).toContainEqual({ slug: "fr-guide", lang: "fr" });
        // 7 en pages + 3 fr pages.
        expect(refs).toHaveLength(10);
    });
});

describe("Docs.getDoc", () => {
    const docs = makeDocs();

    it("reads and normalises a page's front-matter and body", () => {
        const doc = docs.getDoc("greeting-and-voice");
        expect(doc.meta.title).toBe("Greeting & voice");
        expect(doc.meta.label).toBe("Greeting");
        expect(doc.meta.tab).toBe("Documentation");
        expect(doc.meta.group).toBe("Configuration");
        expect(doc.meta.order).toBe(2);
        expect(doc.meta.icon).toBe("waveform");
        expect(doc.meta.updated).toBe("2026-07-03");
        expect(doc.meta.image).toBe("/assets/docs/greeting-and-voice/hero.jpg");
        expect(doc.meta.keywords).toEqual(["greeting", "voice"]);
        expect(doc.meta.readingTime).toBeGreaterThanOrEqual(1);
        expect(doc.content).toContain("## Overview");
    });

    it("reads a specific language", () => {
        const doc = docs.getDoc("introduction", "fr");
        expect(doc.meta.lang).toBe("fr");
        expect(doc.meta.description).toBe("Ce qu'est SwiftGuard.");
    });

    it("reads a hidden page (it is routable)", () => {
        expect(docs.getDoc("draft").meta.title).toBe("Draft page");
    });

    it("throws DocNotFoundError for an unknown slug", () => {
        expect(() => docs.getDoc("does-not-exist")).toThrow(DocNotFoundError);
    });

    it("throws DocNotFoundError for a path-traversal slug", () => {
        expect(() => docs.getDoc("../../../etc/passwd")).toThrow(DocNotFoundError);
    });
});

describe("Docs.getTranslations", () => {
    const docs = makeDocs();

    it("returns the default locale first, then configured order", () => {
        expect(docs.getTranslations("introduction")).toEqual(["en", "fr"]);
    });

    it("returns a single language for an untranslated page", () => {
        expect(docs.getTranslations("quickstart")).toEqual(["en"]);
    });

    it("returns only fr for an fr-only page", () => {
        expect(docs.getTranslations("fr-guide")).toEqual(["fr"]);
    });
});

describe("Docs.getNavTree", () => {
    const docs = makeDocs();

    it("assembles ordered tabs -> groups -> pages, excluding hidden pages", () => {
        const tree = docs.getNavTree();
        expect(tree.multiTab).toBe(true);
        expect(tree.tabs.map((t) => t.id)).toEqual(["Documentation", "API reference"]);

        const documentation = tree.tabs[0]!;
        expect(documentation.groups.map((g) => g.id)).toEqual(["Get started", "Configuration"]);
        expect(documentation.groups[0]!.items.map((i) => i.slug)).toEqual(["introduction", "quickstart"]);
        // Ordered pages first, the order-less "availability" last; "draft" (hidden) excluded.
        expect(documentation.groups[1]!.items.map((i) => i.slug)).toEqual([
            "call-forwarding",
            "greeting-and-voice",
            "availability",
        ]);
        expect(tree.tabs[1]!.groups[0]!.items.map((i) => i.slug)).toEqual(["authentication"]);
    });

    it("uses the sidebar label and the unprefixed default-locale href", () => {
        const item = flattenNav(docs.getNavTree()).find((i) => i.slug === "greeting-and-voice")!;
        expect(item.label).toBe("Greeting");
        expect(item.href).toBe("/docs/greeting-and-voice");
    });

    it("builds a per-language tree with prefixed hrefs (fr)", () => {
        const tree = docs.getNavTree("fr");
        expect(tree.multiTab).toBe(false); // only the Documentation tab has fr pages
        expect(flattenNav(tree).map((i) => i.slug)).toEqual(["introduction", "fr-guide", "greeting-and-voice"]);
        expect(flattenNav(tree).find((i) => i.slug === "introduction")!.href).toBe("/fr/docs/introduction");
    });
});

describe("Docs.getAdjacent", () => {
    const docs = makeDocs();

    it("returns prev/next across group and tab boundaries", () => {
        // Flattened en order: introduction, quickstart, call-forwarding, greeting-and-voice, availability, authentication.
        expect(docs.getAdjacent("quickstart")).toMatchObject({
            prev: { slug: "introduction" },
            next: { slug: "call-forwarding" },
        });
        // availability -> authentication crosses the tab boundary.
        expect(docs.getAdjacent("availability")).toMatchObject({
            prev: { slug: "greeting-and-voice" },
            next: { slug: "authentication" },
        });
    });

    it("has no prev at the start and no next at the end", () => {
        expect(docs.getAdjacent("introduction").prev).toBeUndefined();
        expect(docs.getAdjacent("authentication").next).toBeUndefined();
    });

    it("returns an empty result for a hidden (non-nav) page", () => {
        expect(docs.getAdjacent("draft")).toEqual({});
    });
});

describe("Docs.getBreadcrumb", () => {
    const docs = makeDocs();

    it("returns the tab, group, and page for a nested page", () => {
        const crumb = docs.getBreadcrumb("greeting-and-voice")!;
        expect(crumb.segments.map((s) => s.label)).toEqual(["Documentation", "Configuration", "Greeting & voice"]);
    });

    it("returns undefined for a hidden page", () => {
        expect(docs.getBreadcrumb("draft")).toBeUndefined();
    });
});

describe("Docs.tableOfContents / reading time / dates", () => {
    const docs = makeDocs();

    it("extracts the H2/H3 minimap", () => {
        expect(docs.tableOfContents(docs.getDoc("greeting-and-voice"))).toEqual([
            { depth: 2, text: "Overview", id: "overview" },
            { depth: 2, text: "Choosing a voice", id: "choosing-a-voice" },
        ]);
    });

    it("estimates a reading time of at least one minute", () => {
        expect(docs.readingMinutes(docs.getDoc("introduction"))).toBeGreaterThanOrEqual(1);
    });

    it("formats dates in each language's locale", () => {
        expect(docs.formatDate("2026-07-03")).toBe("3 July 2026");
        expect(docs.dateLocale("fr")).toBe("fr-FR");
        expect(docs.formatDate("2026-07-03", "fr")).toBe("3 juillet 2026");
    });
});

describe("Docs SEO methods", () => {
    const docs = makeDocs();

    it("builds page metadata with hreflang for a translated page", () => {
        const meta = docs.docMetadata(docs.getDoc("greeting-and-voice"));
        expect(meta.title).toBe("Greeting & voice | Example");
        expect(meta.alternates?.canonical).toBe("/docs/greeting-and-voice");
        expect(meta.alternates?.languages).toEqual({
            en: "/docs/greeting-and-voice",
            fr: "/fr/docs/greeting-and-voice",
            "x-default": "/docs/greeting-and-voice",
        });
    });

    it("builds the docs index metadata", () => {
        const meta = docs.indexMetadata();
        expect(meta.title).toBe("Docs | Example");
        expect(meta.alternates?.canonical).toBe("/docs");
    });

    it("builds a TechArticle with the group in the breadcrumb, and translation cross-links", () => {
        const graph = docs.docJsonLd(docs.getDoc("greeting-and-voice"))["@graph"] as Record<string, unknown>[];
        expect(graph[0]!["@type"]).toBe("TechArticle");
        expect((graph[1]!.itemListElement as Record<string, unknown>[]).map((i) => i.name)).toEqual([
            "Home",
            "Docs",
            "Configuration",
            "Greeting & voice",
        ]);
        expect(graph[0]!.workTranslation).toBeDefined(); // en is the original of en+fr
    });

    it("builds the index JSON-LD ItemList in sidebar order", () => {
        const graph = docs.indexJsonLd()["@graph"] as Record<string, unknown>[];
        const items = graph[2]!.itemListElement as Record<string, unknown>[];
        expect(items[0]!.url).toBe("https://example.com/docs/introduction");
        expect(items.map((i) => i.name)).toEqual([
            "Introduction",
            "Quickstart",
            "Call forwarding",
            "Greeting & voice",
            "Availability",
            "Authentication",
        ]);
    });

    it("emits one sitemap entry per non-hidden route with hreflang on translated pages", () => {
        const entries = docs.sitemapEntries();
        // 10 routes exist, but the hidden "draft" page is excluded from the sitemap.
        expect(entries).toHaveLength(9);
        const intro = entries.find((e) => e.url === "https://example.com/docs/introduction")!;
        expect(intro.alternates?.languages).toEqual({
            en: "https://example.com/docs/introduction",
            fr: "https://example.com/fr/docs/introduction",
            "x-default": "https://example.com/docs/introduction",
        });
        // A hidden page stays routable (still in getDocRefs) but must never be in the sitemap.
        expect(entries.some((e) => e.url === "https://example.com/docs/draft")).toBe(false);
        expect(docs.getDocRefs()).toContainEqual({ slug: "draft", lang: "en" });
    });

    it("serves a hidden page noindex but leaves visible pages indexable", () => {
        expect(docs.docMetadata(docs.getDoc("draft")).robots).toEqual({ index: false });
        expect(docs.docMetadata(docs.getDoc("greeting-and-voice")).robots).toBeUndefined();
    });
});

describe("Docs - hidden translation", () => {
    /** A slug published in `en` with a `hidden` `fr` draft beside it. */
    const docs = new Docs({
        contentDir: path.join(HERE, "fixtures/docs-hidden-translation"),
        siteUrl: "https://example.com",
        brandName: "Example",
        locales: [{ code: "en" }, { code: "fr" }],
        defaultLocale: "en",
    });

    it("keeps a hidden translation out of the sitemap and the sibling's hreflang alternates", () => {
        const entries = docs.sitemapEntries();
        // Only the visible en route is emitted; the hidden fr draft is dropped...
        expect(entries.map((e) => e.url)).toEqual(["https://example.com/docs/guide"]);
        // ...and the en entry lists no fr alternate (it would otherwise advertise the draft).
        expect(entries[0]!.alternates).toBeUndefined();
    });

    it("does not advertise a hidden translation in a visible page's hreflang or JSON-LD", () => {
        const meta = docs.docMetadata(docs.getDoc("guide", "en"));
        // fr is hidden -> only en is visible -> no hreflang cluster on the indexable en page.
        expect(meta.alternates?.languages).toBeUndefined();
        const article = (docs.docJsonLd(docs.getDoc("guide", "en"))["@graph"] as Record<string, unknown>[])[0]!;
        expect(article).not.toHaveProperty("workTranslation");
        expect(article).not.toHaveProperty("translationOfWork");
    });

    it("still routes the hidden translation directly", () => {
        expect(docs.getDoc("guide", "fr").meta.hidden).toBe(true);
        expect(docs.getDocRefs()).toContainEqual({ slug: "guide", lang: "fr" });
    });
});

describe("Docs - edge cases", () => {
    it("treats a missing content directory as empty", () => {
        const docs = new Docs({ contentDir: path.join(HERE, "fixtures/does-not-exist") });
        expect(docs.getDocSlugs()).toEqual([]);
        expect(docs.getDocRefs()).toEqual([]);
        expect(docs.getAllDocs()).toEqual([]);
        expect(docs.getNavTree()).toEqual({ tabs: [], multiTab: false });
    });

    it("throws DuplicateDocError when post.mdx and en.mdx both claim the default locale", () => {
        const docs = new Docs({ contentDir: path.join(HERE, "fixtures/docs-dup"), defaultLocale: "en" });
        expect(() => docs.getDocRefs()).toThrow(DuplicateDocError);
    });

    it("throws when SEO methods are used without a site config", () => {
        const docs = new Docs({ contentDir: path.join(HERE, "fixtures/docs") });
        expect(() => docs.indexMetadata()).toThrow(/without a `site` config/);
    });

    it("defaults the base path to /docs so URLs never fall back to /blog", () => {
        const docs = new Docs({ contentDir: path.join(HERE, "fixtures/docs"), siteUrl: "https://example.com", brandName: "Example" });
        expect(docs.docMetadata(docs.getDoc("quickstart")).alternates?.canonical).toBe("/docs/quickstart");
    });
});

/**
 * Builds a `Docs` over the rich fixture corpus with a `redirects` map, so the renamed-slug cases can
 * be exercised against real pages (`quickstart` and `introduction` exist; the sources do not).
 */
function makeRedirectingDocs(redirects: Record<string, string>, extra?: Partial<DocsConfig>): Docs {
    return new Docs({
        contentDir: path.join(HERE, "fixtures/docs"),
        locales: [
            { code: "en", label: "English" },
            { code: "fr", label: "Français" },
        ],
        defaultLocale: "en",
        redirects,
        ...extra,
    });
}

describe("Docs.getRedirect", () => {
    it("redirects a renamed slug to its new page, unprefixed for the default locale", () => {
        const docs = makeRedirectingDocs({ "getting-started": "quickstart" });
        expect(docs.getRedirect("getting-started")).toBe("/docs/quickstart");
        expect(docs.getRedirect("getting-started", "en")).toBe("/docs/quickstart");
    });

    it("prefixes the destination with a non-default locale", () => {
        const docs = makeRedirectingDocs({ "getting-started": "quickstart" });
        expect(docs.getRedirect("getting-started", "fr")).toBe("/fr/docs/quickstart");
    });

    it("prefixes the default locale too when prefixDefaultLocale is set", () => {
        const docs = makeRedirectingDocs({ "getting-started": "quickstart" }, { prefixDefaultLocale: true });
        expect(docs.getRedirect("getting-started")).toBe("/en/docs/quickstart");
        expect(docs.getRedirect("getting-started", "fr")).toBe("/fr/docs/quickstart");
    });

    it("honours a custom basePath", () => {
        const docs = makeRedirectingDocs({ "getting-started": "quickstart" }, { basePath: "/handbook" });
        expect(docs.getRedirect("getting-started")).toBe("/handbook/quickstart");
        expect(docs.getRedirect("getting-started", "fr")).toBe("/fr/handbook/quickstart");
    });

    it("returns undefined for a slug that is not redirected", () => {
        const docs = makeRedirectingDocs({ "getting-started": "quickstart" });
        expect(docs.getRedirect("nope")).toBeUndefined();
    });

    it("returns undefined when no redirects are configured", () => {
        const docs = new Docs({ contentDir: path.join(HERE, "fixtures/docs") });
        expect(docs.getRedirect("quickstart")).toBeUndefined();
        expect(docs.getRedirect("anything")).toBeUndefined();
    });

    it("lets a real page win over a stale redirect entry that shadows it", () => {
        const docs = makeRedirectingDocs({ quickstart: "introduction" });
        expect(docs.getRedirect("quickstart")).toBeUndefined();
    });

    it("lets an fr-only page win too - a real page in any language is still a real page", () => {
        const docs = makeRedirectingDocs({ "fr-guide": "quickstart" });
        expect(docs.getRedirect("fr-guide", "fr")).toBeUndefined();
    });

    it("follows a chain to its final destination in one hop", () => {
        const docs = makeRedirectingDocs({ a: "b", b: "quickstart" });
        expect(docs.getRedirect("a")).toBe("/docs/quickstart");
        expect(docs.getRedirect("b")).toBe("/docs/quickstart");
    });

    it("ends a chain at the first real page rather than redirecting onwards", () => {
        // `quickstart` exists, so `a -> quickstart` stops there even though `quickstart -> introduction`
        // is in the map (that entry is inert - a real page is never redirected).
        const docs = makeRedirectingDocs({ a: "quickstart", quickstart: "introduction" });
        expect(docs.getRedirect("a")).toBe("/docs/quickstart");
    });

    it("returns undefined for a cycle rather than looping forever", () => {
        const docs = makeRedirectingDocs({ a: "b", b: "a" });
        expect(docs.getRedirect("a")).toBeUndefined();
        expect(docs.getRedirect("b")).toBeUndefined();
    });

    it("returns undefined for a self-redirect", () => {
        const docs = makeRedirectingDocs({ a: "a" });
        expect(docs.getRedirect("a")).toBeUndefined();
    });

    it("still returns an href when the destination page does not exist, so a typo 404s loudly", () => {
        const docs = makeRedirectingDocs({ old: "typo-slug" });
        expect(docs.getRedirect("old")).toBe("/docs/typo-slug");
    });

    it("never resolves an Object.prototype key from the URL", () => {
        const docs = makeRedirectingDocs({ "getting-started": "quickstart" });
        expect(docs.getRedirect("constructor")).toBeUndefined();
        expect(docs.getRedirect("toString")).toBeUndefined();
        expect(docs.getRedirect("__proto__")).toBeUndefined();
    });
});

describe("Docs.getRedirectRefs", () => {
    it("emits one ref per redirected slug per configured language", () => {
        const docs = makeRedirectingDocs({ "getting-started": "quickstart" });
        expect(docs.getRedirectRefs()).toEqual([
            { slug: "getting-started", lang: "en" },
            { slug: "getting-started", lang: "fr" },
        ]);
    });

    it("emits the default locale only for a single-language docs site", () => {
        const docs = new Docs({
            contentDir: path.join(HERE, "fixtures/docs"),
            defaultLocale: "en",
            redirects: { "getting-started": "quickstart" },
        });
        expect(docs.getRedirectRefs()).toEqual([{ slug: "getting-started", lang: "en" }]);
    });

    it("is empty when no redirects are configured", () => {
        const docs = new Docs({ contentDir: path.join(HERE, "fixtures/docs") });
        expect(docs.getRedirectRefs()).toEqual([]);
    });

    it("skips inert entries - a source that is a real page, and a cycle", () => {
        const docs = makeRedirectingDocs({ quickstart: "introduction", a: "b", b: "a", old: "quickstart" });
        expect(docs.getRedirectRefs()).toEqual([
            { slug: "old", lang: "en" },
            { slug: "old", lang: "fr" },
        ]);
    });

    it("is disjoint from getDocRefs, so generateStaticParams can spread both", () => {
        const docs = makeRedirectingDocs({ "getting-started": "quickstart" });
        const pages = new Set(docs.getDocRefs().map((r) => `${r.slug}/${r.lang}`));
        for (const ref of docs.getRedirectRefs()) {
            expect(pages.has(`${ref.slug}/${ref.lang}`)).toBe(false);
        }
    });

    it("treats a missing content directory as having no real pages, so redirects still work", () => {
        const docs = new Docs({
            contentDir: path.join(HERE, "fixtures/does-not-exist"),
            defaultLocale: "en",
            redirects: { old: "new" },
        });
        expect(docs.getRedirect("old")).toBe("/docs/new");
        expect(docs.getRedirectRefs()).toEqual([{ slug: "old", lang: "en" }]);
    });
});
