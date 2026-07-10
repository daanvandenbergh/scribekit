import { NextResponse, type NextRequest } from "next/server";

/**
 * Serves the default locale at the clean, unprefixed `/<section>/...` while each content section is
 * a single `app/[lang]/<section>/...` route tree. For every section in {@link SECTIONS} (the blog
 * and the docs):
 *
 *  - `/<section>/...`     -> internally rewritten to `/en/<section>/...` (the URL bar is unchanged)
 *  - `/en/<section>/...`  -> redirected to the clean `/<section>/...` (so `/en/` is never served)
 *  - `/fr/<section>/...`  -> served as-is (not matched below)
 *
 * Both branches are decided from the incoming path in one pass, so the rewrite and the redirect
 * never chase each other into a loop (a rewrite does not re-run the proxy).
 *
 * `DEFAULT_LOCALE` / `SECTIONS` are hard-coded here rather than read from `_blog.ts` / `_docs.ts`:
 * the proxy runs on the edge runtime, and the `Blog`/`Docs` classes are `server-only` (they read
 * the filesystem).
 */
const DEFAULT_LOCALE = "en";
const SECTIONS = ["blog", "docs"];

export function proxy(request: NextRequest): NextResponse | undefined {
    const { pathname } = request.nextUrl;
    const prefix = `/${DEFAULT_LOCALE}`;

    for (const section of SECTIONS) {
        // The default locale must not appear in the URL: /en/<section>... -> /<section>... (permanent).
        if (pathname === `${prefix}/${section}` || pathname.startsWith(`${prefix}/${section}/`)) {
            const url = request.nextUrl.clone();
            url.pathname = pathname.slice(prefix.length);
            return NextResponse.redirect(url, 308);
        }
    }

    for (const section of SECTIONS) {
        // Render the unprefixed default via the [lang] tree: /<section>... -> /en/<section>... (URL unchanged).
        if (pathname === `/${section}` || pathname.startsWith(`/${section}/`)) {
            const url = request.nextUrl.clone();
            url.pathname = `${prefix}${pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    return undefined;
}

export const config = {
    matcher: ["/blog", "/blog/:path*", "/en/blog", "/en/blog/:path*", "/docs", "/docs/:path*", "/en/docs", "/en/docs/:path*"],
};
