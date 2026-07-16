// next.config.mjs - copy to the Next app root.
//
// The deploy workflow sets NEXT_PUBLIC_BASE_PATH from GitHub's `configure-pages` `base_path` output:
// empty for a custom domain / user-org site, "/<repo>" for a project site. The app reads the SAME var
// (a) here, to set Next's basePath/assetPrefix (so routes, next/link, and _next assets get the prefix),
// and (b) in `_docs-image.tsx`, so the hero's raw /assets/... src gets the prefix too. Unset (local
// build) -> root-served.
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
export default {
    output: "export",
    images: { unoptimized: true },
    ...(base ? { basePath: base, assetPrefix: base } : {}),
};
