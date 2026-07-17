/**
 * Type definitions for the content-store module - the filesystem layer shared by the `Blog` and
 * `Docs` backends. These types describe the on-disk layout and the raw parse result only; the
 * domain-level shapes (`PostMeta`, `DocMeta`, ...) are each module's own concern and are built by
 * `Blog`/`Docs` from a {@link ParsedFile}.
 */

/**
 * One content file discovered on disk: its slug, language, and path relative to the content
 * directory. Produced by `ContentStore.entries`, the single place the folder layout is walked.
 */
export interface ContentEntry {
    /** The slug (the content item's directory name). */
    slug: string;
    /** The language code (the default locale for `post<ext>`, else the file's `<code>` stem). */
    lang: string;
    /** The file path relative to the content directory (e.g. `x/post.mdx` or `x/fr.mdx`). */
    file: string;
}

/**
 * The raw result of reading and front-matter-parsing one content file: exactly `gray-matter`'s
 * output, with no domain interpretation applied. Handed to a {@link ContentStoreConfig.parse} so
 * `Blog` and `Docs` can normalise it into their own shape.
 */
export interface ParsedFile {
    /** The body (front-matter stripped), ready for `<MDXRemote>`. */
    content: string;
    /** The raw parsed YAML front-matter, uninterpreted. */
    data: Record<string, unknown>;
}

/**
 * Configuration for a {@link import("./content-store.js").ContentStore}. Supplied by the owning
 * `Blog`/`Docs` instance from its own already-resolved config, so the store never re-derives
 * defaults and never reads a `SiteConfig`.
 *
 * @typeParam T - the caller's domain type for one content item (`Post` for the blog, `Doc` for the
 *   docs). The store never inspects it; it only caches what {@link ContentStoreConfig.parse} returns.
 */
export interface ContentStoreConfig<T> {
    /**
     * Absolute path to the directory holding one `<slug>/` folder per content item. Must already be
     * resolved by the caller (`Blog`/`Docs` do this via `path.resolve` in their constructors); the
     * store performs no `process.cwd()` resolution of its own.
     */
    contentDir: string;
    /** Content file extension, including the leading dot (e.g. `.mdx`). */
    extension: string;
    /** The default locale code: the language served without a URL prefix. */
    defaultLocale: string;
    /**
     * The configured non-default locale codes to look for as `<code><extension>`. The default locale
     * is always probed regardless of whether it appears here, so a locale-named default file works
     * even for a single-language site.
     */
    localeCodes: string[];
    /**
     * Normalises one parsed file into the caller's domain type - `Blog` builds a `Post`, `Docs`
     * builds a `Doc`. Injected rather than imported so the store stays domain-agnostic while still
     * caching the *finished* value.
     *
     * This is the layer the cache sits at, deliberately. Turning a file into a `Post`/`Doc` costs
     * several times more than reading it off disk (the reading-time estimate alone scans the whole
     * body, ~56us against ~15us for the read), and callers ask for the whole corpus repeatedly - so
     * a cache holding only the raw parse would leave the expensive half to re-run every time. The
     * store therefore caches `T`, not the `ParsedFile` it came from.
     *
     * Must be a pure function of its arguments: it is called once per file per change, and every
     * later call for an unchanged file replays its result.
     *
     * @param parsed - the file's raw body and front-matter.
     * @param slug - the item's slug.
     * @param lang - the item's language code.
     * @returns the caller's domain representation of the item.
     */
    parse: (parsed: ParsedFile, slug: string, lang: string) => T;
    /**
     * Builds the domain error thrown when two files in one folder resolve to the same
     * `(slug, lang)`. Injected rather than imported so the store stays domain-agnostic: `Blog`
     * passes `DuplicatePostError`, `Docs` passes `DuplicateDocError`, and neither module's error
     * type nor message changes.
     *
     * @param slug - the slug shared by the two conflicting files.
     * @param lang - the language code shared by the two conflicting files.
     * @param a - the first conflicting file path, relative to the content directory.
     * @param b - the second conflicting file path, relative to the content directory.
     * @returns the error to throw.
     */
    onDuplicate: (slug: string, lang: string, a: string, b: string) => Error;
}
