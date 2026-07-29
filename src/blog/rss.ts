/**
 * Pure, fs-free RSS 2.0 feed builder for the blog - the feed counterpart of `buildSitemap`.
 * No `next` or `react` import: the feed is returned as a complete XML string for the consumer
 * to serve from a route handler (`new Response(xml, { headers: { "Content-Type":
 * "application/rss+xml; charset=utf-8" } })`), which also works in a Next static export
 * (`export const dynamic = "force-static"`).
 *
 * One feed per locale, mounted by convention at `<locale index path>/rss.xml` (e.g.
 * `/blog/rss.xml`, or `/en/rss.xml` under `prefixDefaultLocale`) - the same `localePath` the
 * links, canonicals and sitemap use, so the feed's URLs can never drift from the rendered site.
 */

import { localePath } from "../shared/locales.js";
import { absoluteUrl, FALLBACK_LOCALE } from "../shared/seo.js";
import { overviewDescription } from "./seo.js";
import type { PostMeta, SiteConfig } from "./types.js";

/**
 * Escapes a string for use in XML text content or an attribute value.
 *
 * @param value - the raw string.
 * @returns the string with `& < > " '` replaced by their XML entities.
 */
function escapeXml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Formats an ISO `YYYY-MM-DD` front-matter date as the RFC 1123 date RSS requires,
 * pinned to midnight UTC (front-matter dates carry no time or zone).
 *
 * @param isoDate - the post's `date` front-matter.
 * @returns the RFC 1123 date string (e.g. `Sun, 28 Jun 2026 00:00:00 GMT`).
 */
function rfc1123(isoDate: string): string {
    return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

/**
 * The root-relative path a locale's feed is mounted at by convention:
 * `<locale index path>/rss.xml` (e.g. `/blog/rss.xml`, `/en/rss.xml`).
 *
 * @param site - the site configuration.
 * @param lang - the locale code.
 * @returns the root-relative feed path.
 */
export function rssFeedPath(site: SiteConfig, lang: string): string {
    const defaultLocale = site.defaultLocale ?? FALLBACK_LOCALE;
    const index = localePath({
        basePath: site.basePath,
        defaultLocale,
        prefixDefaultLocale: site.prefixDefaultLocale,
        lang,
    });
    return `${index}/rss.xml`;
}

/**
 * Builds one locale's complete RSS 2.0 document from its posts' metadata.
 *
 * The channel is the locale's blog index (title from `brandName`, description from
 * `site.description` with the same fallback the overview metadata uses); each item carries the
 * post's absolute URL as both `link` and permalink `guid`, its description, its categories, and
 * a `pubDate` when the post declares a date. The channel's `lastBuildDate` is the newest post
 * date, so an unchanged blog produces a byte-identical feed - readers and crawlers see a new
 * build only when a post actually changed.
 *
 * @param posts - the locale's posts' metadata (typically `Blog.getAllPosts(lang)`), newest first.
 * @param site - the site configuration; `siteUrl` makes every URL absolute.
 * @param lang - the locale code the feed is for. Defaults to the site's default locale.
 * @returns the XML document, ready to serve as `application/rss+xml`.
 */
export function buildRssFeed(posts: PostMeta[], site: SiteConfig, lang?: string): string {
    const defaultLocale = site.defaultLocale ?? FALLBACK_LOCALE;
    const resolved = lang ?? defaultLocale;
    const indexUrl = absoluteUrl(
        site.siteUrl,
        localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: resolved }),
    );
    const selfUrl = absoluteUrl(site.siteUrl, rssFeedPath(site, resolved));
    const urlFor = (slug: string): string =>
        absoluteUrl(
            site.siteUrl,
            localePath({ basePath: site.basePath, defaultLocale, prefixDefaultLocale: site.prefixDefaultLocale, lang: resolved, slug }),
        );

    const dated = posts.filter((post) => post.date !== "").map((post) => post.date);
    const newest = dated.length > 0 ? dated.reduce((a, b) => (a > b ? a : b)) : undefined;

    const items = posts.map((post) => {
        const url = urlFor(post.slug);
        const lines = [
            `        <item>`,
            `            <title>${escapeXml(post.title)}</title>`,
            `            <link>${escapeXml(url)}</link>`,
            `            <guid isPermaLink="true">${escapeXml(url)}</guid>`,
            `            <description>${escapeXml(post.description)}</description>`,
        ];
        for (const category of post.categories ?? []) {
            lines.push(`            <category>${escapeXml(category)}</category>`);
        }
        if (post.date !== "") {
            lines.push(`            <pubDate>${rfc1123(post.date)}</pubDate>`);
        }
        lines.push(`        </item>`);
        return lines.join("\n");
    });

    const channel = [
        `        <title>${escapeXml(site.brandName)}</title>`,
        `        <link>${escapeXml(indexUrl)}</link>`,
        `        <description>${escapeXml(overviewDescription(site))}</description>`,
        `        <language>${escapeXml(resolved.toLowerCase())}</language>`,
        ...(newest !== undefined ? [`        <lastBuildDate>${rfc1123(newest)}</lastBuildDate>`] : []),
        `        <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml"/>`,
        ...items,
    ].join("\n");

    return [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
        `    <channel>`,
        channel,
        `    </channel>`,
        `</rss>`,
        ``,
    ].join("\n");
}
