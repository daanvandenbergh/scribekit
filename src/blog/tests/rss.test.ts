import { describe, expect, it } from "vitest";
import { buildRssFeed, rssFeedPath } from "../rss.js";
import type { PostMeta, SiteConfig } from "../types.js";

/** A fully-populated post used across the feed assertions. */
const POST: PostMeta = {
    slug: "hello-world",
    lang: "en",
    title: "Hello World",
    date: "2026-06-28",
    description: "A first post.",
    categories: ["News"],
};

/** An older second post, to assert ordering-independent lastBuildDate. */
const OLDER: PostMeta = {
    slug: "older-post",
    lang: "en",
    title: "Older Post",
    date: "2026-01-02",
    description: "An older post.",
};

/** Base site config (unprefixed default locale, default `/blog` base path). */
const SITE: SiteConfig = { siteUrl: "https://example.com", brandName: "Example", defaultLocale: "en" };

/** Site config shaped like a blog that owns its origin and prefixes every locale. */
const SITE_PREFIXED: SiteConfig = {
    ...SITE,
    basePath: "/",
    prefixDefaultLocale: true,
    description: "Posts about examples.",
};

describe("rssFeedPath", () => {
    it("mounts the feed beside the locale's index page", () => {
        expect(rssFeedPath(SITE, "en")).toBe("/blog/rss.xml");
        expect(rssFeedPath(SITE, "nl")).toBe("/nl/blog/rss.xml");
    });

    it("prefixes the default locale under prefixDefaultLocale with a root base path", () => {
        expect(rssFeedPath(SITE_PREFIXED, "en")).toBe("/en/rss.xml");
        expect(rssFeedPath(SITE_PREFIXED, "nl")).toBe("/nl/rss.xml");
    });
});

describe("buildRssFeed", () => {
    it("builds a channel with title, index link, language, self link and the site description", () => {
        const xml = buildRssFeed([POST], SITE_PREFIXED, "en");
        expect(xml).toContain("<title>Example</title>");
        expect(xml).toContain("<link>https://example.com/en</link>");
        expect(xml).toContain("<description>Posts about examples.</description>");
        expect(xml).toContain("<language>en</language>");
        expect(xml).toContain(
            '<atom:link href="https://example.com/en/rss.xml" rel="self" type="application/rss+xml"/>',
        );
    });

    it("falls back the channel description to the same generic string as the overview metadata", () => {
        expect(buildRssFeed([], SITE, "en")).toContain("<description>The Example blog.</description>");
    });

    it("builds one item per post with permalink guid, categories and an RFC 1123 pubDate", () => {
        const xml = buildRssFeed([POST], SITE, "en");
        expect(xml).toContain("<link>https://example.com/blog/hello-world</link>");
        expect(xml).toContain('<guid isPermaLink="true">https://example.com/blog/hello-world</guid>');
        expect(xml).toContain("<description>A first post.</description>");
        expect(xml).toContain("<category>News</category>");
        expect(xml).toContain("<pubDate>Sun, 28 Jun 2026 00:00:00 GMT</pubDate>");
    });

    it("prefixes non-default locales in every item URL", () => {
        const xml = buildRssFeed([{ ...POST, lang: "nl" }], SITE, "nl");
        expect(xml).toContain("<link>https://example.com/nl/blog/hello-world</link>");
        expect(xml).toContain("<language>nl</language>");
    });

    it("sets lastBuildDate to the newest post date regardless of order", () => {
        const xml = buildRssFeed([OLDER, POST], SITE, "en");
        expect(xml).toContain("<lastBuildDate>Sun, 28 Jun 2026 00:00:00 GMT</lastBuildDate>");
    });

    it("omits pubDate for an undated post and lastBuildDate when no post has a date", () => {
        const xml = buildRssFeed([{ ...POST, date: "" }], SITE, "en");
        expect(xml).not.toContain("<pubDate>");
        expect(xml).not.toContain("<lastBuildDate>");
    });

    it("escapes XML special characters in titles, descriptions and categories", () => {
        const xml = buildRssFeed(
            [{ ...POST, title: `Tom & Jerry <"live">`, description: "It's <b>bold</b>", categories: ["A&B"] }],
            SITE,
            "en",
        );
        expect(xml).toContain("<title>Tom &amp; Jerry &lt;&quot;live&quot;&gt;</title>");
        expect(xml).toContain("<description>It&apos;s &lt;b&gt;bold&lt;/b&gt;</description>");
        expect(xml).toContain("<category>A&amp;B</category>");
        expect(xml).not.toContain("<b>");
    });

    it("produces a well-formed document for an empty blog", () => {
        const xml = buildRssFeed([], SITE, "en");
        expect(xml.startsWith(`<?xml version="1.0" encoding="UTF-8"?>`)).toBe(true);
        expect(xml).toContain(`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`);
        expect(xml).not.toContain("<item>");
        expect(xml.trimEnd().endsWith("</rss>")).toBe(true);
    });

    it("defaults the feed locale to the site's default locale", () => {
        const xml = buildRssFeed([POST], SITE);
        expect(xml).toContain("<language>en</language>");
        expect(xml).toContain("<link>https://example.com/blog</link>");
    });
});
