// In-repo demo: import the built package directly from ../dist (no symlink).
// A real app would import { Docs } from "@daanvandenbergh/scribekit".
import { Docs } from "../../../../dist/index.js";

/**
 * The single configured Docs instance for the demo. Each page is a folder demo/docs/<slug>/ with
 * an en.mdx body carrying `tab`/`group`/`order`/`icon` front-matter; the route files derive the
 * navigation tree, breadcrumbs, prev/next, SEO metadata, and JSON-LD from this instance.
 *
 * The whole docs site is one `app/[lang]/docs/...` route tree. The default locale (en) stays
 * unprefixed at `/docs/...`; `proxy.ts` rewrites `/docs/...` onto the `/en/docs/...` route and
 * redirects `/en/docs/...` back to the clean `/docs/...`. `tabs`/`groups` set the display order of
 * the sidebar sections; anything not listed sorts after by its pages' order. This module is
 * colocated with the routes; the leading `_` keeps Next from treating it as a route.
 */
export const docs = new Docs({
    contentDir: "./docs", // resolved against the demo's cwd -> demo/docs
    siteUrl: "https://demo.example.com",
    brandName: "Scribekit",
    description: "Documentation for @daanvandenbergh/scribekit - a full docs site built from MDX.",
    // Bilingual: English (default, <slug>/en.mdx) + French (<slug>/fr.mdx, served at /fr/docs/...).
    // The DocsLanguagePicker in the navbar auto-appears because there is more than one locale.
    locales: [
        { code: "en", label: "English" },
        { code: "fr", label: "Français", dateLocale: "fr-FR" },
    ],
    defaultLocale: "en",
    locale: "en-GB",
    // Display order for the top-level tabs and the sidebar group headings.
    tabs: ["Documentation", "Guides"],
    groups: ["Get started", "Configuration", "Recipes"],
    // The page folder is the URL, so renaming one changes its public URL. Listing the old slug here
    // keeps it alive as a 308: /docs/getting-started -> /docs/quickstart (and /fr/... -> /fr/...).
    // The [slug] route serves it - see its generateStaticParams + permanentRedirect.
    redirects: { "getting-started": "quickstart" },
});
