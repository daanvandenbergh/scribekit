// In-repo demo: import from ../dist (no symlink); a real app uses the package name "/react".
import { DocsPage } from "../../../../../dist/react/index.js";
import { DocNotFoundError } from "../../../../../dist/index.js";
import { Link } from "../../blog/_link";
import { notFound, permanentRedirect } from "next/navigation";
import { docs } from "../_docs";

/** Unknown (lang, slug) pairs 404 at the router instead of rendering on demand. */
export const dynamicParams = false;

/**
 * Prerender one page per doc per language (/en/docs/<slug>), plus every renamed slug from the
 * `redirects` config. The redirect refs are not optional: `dynamicParams = false` means an
 * unrendered slug 404s at the router, so an old slug would never reach the component that redirects it.
 */
export function generateStaticParams() {
    return [...docs.getDocRefs(), ...docs.getRedirectRefs()].map((ref) => ({ lang: ref.lang, slug: ref.slug }));
}

/** Per-page SEO metadata. Falls back to a "not found" title. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
    const { lang, slug } = await params;
    try {
        return docs.docMetadata(docs.getDoc(slug, lang));
    } catch {
        return { title: "Page not found" };
    }
}

/**
 * A docs page at /<lang>/docs/<slug>. The default language is reached via a `proxy.ts` rewrite
 * (/docs/<slug> -> /en/docs/<slug>), which renders on demand, so we guard the unknown-slug case
 * with `notFound()` rather than relying only on `dynamicParams = false`.
 *
 * A slug with no page is not always a 404: when it is an old, renamed slug listed in the `redirects`
 * config, `getRedirect` hands back its new URL and we serve a permanent 308 instead.
 */
export default async function DocSlugPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
    const { lang, slug } = await params;
    try {
        docs.getDoc(slug, lang);
    } catch (err) {
        if (err instanceof DocNotFoundError) {
            const renamedTo = docs.getRedirect(slug, lang);
            if (renamedTo) {
                permanentRedirect(renamedTo);
            }
            notFound();
        }
        throw err;
    }
    return <DocsPage docs={docs} slug={slug} lang={lang} linkComponent={Link} />;
}
