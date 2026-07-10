import type { MetadataRoute } from "next";
import { blog } from "./[lang]/blog/_blog";
import { docs } from "./[lang]/docs/_docs";

/**
 * The site's sitemap: every blog post and docs page, each with its absolute URL and (for
 * translated pages) its full hreflang alternates. Both content sections expose the same
 * `sitemapEntries()` shape, so merging them is a single spread. Next renders this at /sitemap.xml.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    return [...blog.sitemapEntries(), ...docs.sitemapEntries()];
}
