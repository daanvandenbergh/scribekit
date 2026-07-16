import Link from "next/link";
import { DocsPage } from "../../../../dist/react/index.js";
import { docs } from "../_docs";
import { BodyLink } from "../_docs-links";
import { BaseImg } from "../_docs-image";

/** Unknown slugs 404 at the router instead of rendering on demand. */
export const dynamicParams = false;

/** Prerender one static page per doc (single-locale, flat /docs/<slug>). */
export function generateStaticParams() {
    return docs.getDocSlugs().map((slug) => ({ slug }));
}

/** Per-page SEO metadata; falls back to a not-found title. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    try {
        return docs.docMetadata(docs.getDoc(slug));
    } catch {
        return { title: "Page not found" };
    }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    // imgComponent + a-override make the hero and in-body links base-path aware (project-site safe).
    return <DocsPage docs={docs} slug={slug} linkComponent={Link} imgComponent={BaseImg} components={{ a: BodyLink }} />;
}
