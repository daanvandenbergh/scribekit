/**
 * Docs-domain error types. This file is fs-free (no `node:fs`, no `server-only`) so the
 * React components can import `DocNotFoundError` for an `instanceof` check without pulling the
 * Node-only backend into the client import graph.
 */

/**
 * Thrown by `Docs.getDoc` when no page file exists for the requested slug. Consumers (or a
 * `DocsPage` component) catch this to call Next.js's `notFound()` and render a 404.
 */
export class DocNotFoundError extends Error {
    /** The slug that could not be resolved to a page file. */
    readonly slug: string;

    /**
     * @param slug - the slug that was requested but not found.
     */
    constructor(slug: string) {
        super(`No docs page found for slug "${slug}".`);
        this.name = "DocNotFoundError";
        this.slug = slug;
    }
}

/**
 * Thrown when two files in one page folder resolve to the same `(slug, lang)` pair - for example
 * `quickstart/post.mdx` and `quickstart/en.mdx` when the default locale is `en` (both claim the
 * default-language page). Surfaced by `Docs.getDocRefs`/`Docs.getAllDocs` (and therefore at build
 * time via `generateStaticParams`), so the ambiguity fails loudly instead of one file silently
 * winning.
 */
export class DuplicateDocError extends Error {
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
        super(`Two files resolve to the same docs page (slug "${slug}", lang "${lang}"): "${a}" and "${b}".`);
        this.name = "DuplicateDocError";
        this.slug = slug;
        this.lang = lang;
        this.files = [a, b];
    }
}
