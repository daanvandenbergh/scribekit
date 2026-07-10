// In-repo demo: import the built package directly from ../dist (no symlink).
// A real app would import { Blog } from "@daanvandenbergh/scribekit".
import { Blog } from "../../../../dist/index.js";

/**
 * The single configured Blog instance for the demo. Each post is a folder demo/blog/<slug>/ with
 * one file per language named by its locale - en.mdx (default) and fr.mdx (translation); the route
 * files derive everything (post list, dates, SEO metadata, JSON-LD, hreflang) from this instance.
 *
 * The whole blog is one `app/[lang]/blog/...` route tree. The default locale (en) stays
 * unprefixed at `/blog/...`; `proxy.ts` rewrites `/blog/...` onto the `/en/blog/...` route
 * and redirects `/en/blog/...` back to the clean `/blog/...`. This module is colocated with the
 * routes; the leading `_` keeps Next from treating it as a route.
 */
export const blog = new Blog({
    contentDir: "./blog", // resolved against the demo's cwd -> demo/blog
    siteUrl: "https://demo.example.com",
    brandName: "Claude Code Blog demo",
    // Multi-language: English (default, demo/blog/<slug>/en.mdx) + French (demo/blog/<slug>/fr.mdx).
    locales: [
        { code: "en", label: "English" },
        { code: "fr", label: "Français", dateLocale: "fr-FR" },
    ],
    defaultLocale: "en",
});
