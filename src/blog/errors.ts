/**
 * Blog-domain error types. This file is fs-free (no `node:fs`, no `server-only`) so the
 * React components can import `PostNotFoundError` for an `instanceof` check without pulling
 * the Node-only backend into the client import graph.
 */

/**
 * Thrown by `Blog.getPost` when no post file exists for the requested slug. Consumers (or
 * `BlogPage`) catch this to call Next.js's `notFound()` and render a 404.
 */
export class PostNotFoundError extends Error {
    /** The slug that could not be resolved to a post file. */
    readonly slug: string;

    /**
     * @param slug - the slug that was requested but not found.
     */
    constructor(slug: string) {
        super(`No blog post found for slug "${slug}".`);
        this.name = "PostNotFoundError";
        this.slug = slug;
    }
}

/**
 * Thrown when two files in one post folder resolve to the same `(slug, lang)` pair - for example
 * `getting-started/post.mdx` and `getting-started/en.mdx` when the default locale is `en` (both
 * claim the default-language post). Surfaced by `Blog.getPostRefs`/`Blog.getAllPosts` (and
 * therefore at build time via `generateStaticParams`), so the ambiguity fails loudly instead of
 * one file silently winning.
 */
export class DuplicatePostError extends Error {
    /** The slug shared by the two conflicting files. */
    readonly slug: string;
    /** The language code shared by the two conflicting files. */
    readonly lang: string;
    /** The two conflicting file paths, relative to the content directory. */
    readonly files: [string, string];

    /**
     * @param slug - the shared slug.
     * @param lang - the shared language code.
     * @param a - the first conflicting file path (relative to the content directory).
     * @param b - the second conflicting file path (relative to the content directory).
     */
    constructor(slug: string, lang: string, a: string, b: string) {
        super(`Two files resolve to the same post (slug "${slug}", lang "${lang}"): "${a}" and "${b}".`);
        this.name = "DuplicatePostError";
        this.slug = slug;
        this.lang = lang;
        this.files = [a, b];
    }
}
