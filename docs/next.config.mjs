// scribekit docs site. The deploy workflow feeds NEXT_PUBLIC_BASE_PATH from configure-pages'
// base_path ("/scribekit" for the project site, empty for root hosting); next.config and the hero
// <img> (_docs-image) both read it, so raw /assets hero paths resolve under the subpath.
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
export default {
    output: "export",
    // Must match the Docs/Blog instance's `trailingSlash` (both default to true): this writes
    // <slug>/index.html, so the host serves /slug/ and redirects /slug to it.
    trailingSlash: true,
    images: { unoptimized: true },
    ...(base ? { basePath: base, assetPrefix: base } : {}),
};
