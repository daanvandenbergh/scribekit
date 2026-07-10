// In-repo demo: import from ../dist (no symlink); a real app uses the package name "/react".
import { BlogPage } from "../../../../../dist/react/index.js";
import { PostNotFoundError } from "../../../../../dist/index.js";
import { Link } from "../_link";
import { notFound } from "next/navigation";
import { blog } from "../_blog";

/** Unknown (lang, slug) pairs 404 at the router instead of rendering on demand. */
export const dynamicParams = false;

/** Prerender one page per post per language (/en/blog/<slug>, /fr/blog/<slug>). */
export function generateStaticParams() {
    return blog.getPostRefs().map((ref) => ({ lang: ref.lang, slug: ref.slug }));
}

/** Per-post SEO metadata. Falls back to a "not found" title. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
    const { lang, slug } = await params;
    try {
        return blog.postMetadata(blog.getPost(slug, lang));
    } catch {
        return { title: "Post not found" };
    }
}

/**
 * A post at /<lang>/blog/<slug>. The default language is reached via a `proxy.ts` rewrite
 * (/blog/<slug> -> /en/blog/<slug>), which renders on demand, so we guard the unknown-slug case
 * with `notFound()` rather than relying only on `dynamicParams = false`.
 */
export default async function BlogPostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
    const { lang, slug } = await params;
    try {
        blog.getPost(slug, lang);
    } catch (err) {
        if (err instanceof PostNotFoundError) {
            notFound();
        }
        throw err;
    }
    return <BlogPage blog={blog} slug={slug} lang={lang} linkComponent={Link} />;
}
