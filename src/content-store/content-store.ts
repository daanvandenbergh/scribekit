import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { ContentEntry, ContentStoreConfig, ParsedFile } from "./types.js";

/**
 * One cached item, with the file stats it was built from.
 *
 * @typeParam T - the caller's domain type.
 */
interface CacheEntry<T> {
    /** The file's `mtimeMs` at the time it was read. */
    mtimeMs: number;
    /** The file's byte size at the time it was read. */
    size: number;
    /** The caller's normalised value for the file. */
    value: T;
}

/**
 * The filesystem layer behind the `Blog` and `Docs` backends: it walks the content directory,
 * guards every path against traversal, and turns content files into the caller's domain type -
 * memoizing each one until the file changes on disk.
 *
 * Both backends previously carried their own byte-for-byte copy of this logic. It lives here once
 * so the directory layout, the traversal guard, and the cache have a single definition. The store
 * stays domain-agnostic by being generic: it never inspects `T`, it just calls the caller's
 * `parse` and caches what comes back. Everything above one file - sorting, navigation, SEO - stays
 * in the owning module.
 *
 * **Why the cache exists.** A page render asks for the whole corpus more than once (a docs page
 * builds its nav tree for the breadcrumb *and* again for prev/next), so an N-page build rebuilt all
 * N items per page - quadratic. Measured at 200 pages before this: 81,000 reads, 6.9s.
 *
 * **Why it caches `T` and not the raw parse.** Reading a file is the cheap part. Normalising one
 * costs ~4x more than the read (~56us against ~15us, dominated by the reading-time estimate
 * scanning the body), so a cache holding raw `gray-matter` output would have left the expensive
 * half to re-run on every call and stayed quadratic. The cache holds the finished value.
 *
 * **Why it validates instead of trusting.** A `statSync` costs ~2us - a fraction of what it saves -
 * so there is no reason to guess whether a file changed when asking is nearly free. Every read
 * stats the file and rebuilds when `(mtimeMs, size)` moved. That keeps `next dev` live (edit an MDX
 * file, see it immediately, no restart), keeps the request-time `output: "standalone"` deployment
 * correct, and means the code path the tests exercise is exactly the one that ships - no
 * environment gate, no untested branch.
 *
 * The class is Node-only and marked `server-only`: it is the one file in the package that touches
 * `node:fs`, and it must never be reachable from a client component.
 *
 * @typeParam T - the caller's domain type for one content item (`Post`, `Doc`).
 */
export class ContentStore<T> {
    /** Absolute path to the directory holding content folders. */
    private readonly contentDir: string;
    /** Content file extension, including the leading dot. */
    private readonly extension: string;
    /** The default locale code. */
    private readonly defaultLocale: string;
    /** The configured non-default locale codes. */
    private readonly localeCodes: string[];
    /** Normalises a parsed file into the caller's domain type. */
    private readonly parse: ContentStoreConfig<T>["parse"];
    /** Builds the caller's domain-specific duplicate error. */
    private readonly onDuplicate: ContentStoreConfig<T>["onDuplicate"];
    /**
     * Normalised items by absolute path, each validated against the file's `(mtimeMs, size)` on
     * every read. Per-instance, never module-global: two differently-configured instances may point
     * at the same directory (a `Docs` with `fr` configured discovers pages one without it does not),
     * so a shared cache keyed by directory would let one instance's view poison the other's. Keying
     * by absolute path is safe because what a file parses to never depends on the locale/extension
     * config - only `entries` reads that, and `entries` is not cached.
     */
    private readonly cache = new Map<string, CacheEntry<T>>();

    /**
     * @param config - the resolved content directory and layout options; see {@link ContentStoreConfig}.
     */
    constructor(config: ContentStoreConfig<T>) {
        this.contentDir = config.contentDir;
        this.extension = config.extension;
        this.defaultLocale = config.defaultLocale;
        this.localeCodes = config.localeCodes;
        this.parse = config.parse;
        this.onDuplicate = config.onDuplicate;
    }

    /**
     * Walks the content directory once: each immediate subdirectory is a `<slug>/` folder. Inside
     * it, the default-language file is `<defaultLocale><extension>` (recommended, e.g. `en.mdx`) or
     * the language-neutral `post<extension>` fallback, and each non-default `<code><extension>` (for
     * a configured locale) is that locale's entry. This is the only place the on-disk layout is
     * read. Files whose stem is not `post`, the default locale, or a configured locale code, and any
     * deeper nesting, are ignored.
     *
     * Deliberately **not** memoized, for three correctness reasons: a cheap `contentDir`-mtime key
     * would silently miss a translation added to an existing folder; callers rely on it throwing on
     * *every* call rather than once; and caching the empty result for a not-yet-created directory
     * would break the documented promise that pages appear once the folder exists.
     *
     * The returned order follows `fs.readdirSync` discovery order, which is load-bearing: it is the
     * documented final tie-break when two pages share a sort position.
     *
     * ponytail: this walk is now the build's joint-largest cost - 47% of a 200-page build (563k
     * `existsSync` calls), because caching the parsed items removed everything that used to dwarf
     * it. It is O(n^2) not from the walk itself but from how often callers ask: `getNavTree` runs
     * twice per page and `visibleTranslations` once per slug, each triggering a fresh walk. The fix
     * is therefore to cut the *number* of walks in the domain layer (memoize the nav tree per
     * language), not to cache this method - the three reasons above still make that unsafe. The
     * other ~44% is the nav-tree rebuild itself, same root cause. Worth doing past ~500 pages.
     *
     * @returns every discovered entry; empty when the content directory does not exist.
     * @throws the caller's `onDuplicate` error when two files resolve to the same `(slug, lang)`
     *   (e.g. both `post<ext>` and `<defaultLocale><ext>` in one folder).
     */
    entries(): ContentEntry[] {
        if (!fs.existsSync(this.contentDir)) {
            return [];
        }
        const seen = new Map<string, ContentEntry>();
        const add = (slug: string, lang: string, file: string): void => {
            const key = `${slug}/${lang}`;
            const prior = seen.get(key);
            if (prior) {
                throw this.onDuplicate(slug, lang, prior.file, file);
            }
            seen.set(key, { slug, lang, file });
        };
        for (const dirent of fs.readdirSync(this.contentDir, { withFileTypes: true })) {
            if (!dirent.isDirectory()) {
                continue;
            }
            const slug = dirent.name;
            const dir = path.join(this.contentDir, slug);
            // Default-language file: the language-neutral `post<ext>` and/or the recommended
            // `<defaultLocale><ext>` (e.g. `en.mdx`). Both resolve to the default entry - checked
            // regardless of whether the default locale is configured, so a locale-named default
            // works even for a single-language site - and having both is a collision.
            if (fs.existsSync(path.join(dir, `post${this.extension}`))) {
                add(slug, this.defaultLocale, `${slug}/post${this.extension}`);
            }
            if (fs.existsSync(path.join(dir, `${this.defaultLocale}${this.extension}`))) {
                add(slug, this.defaultLocale, `${slug}/${this.defaultLocale}${this.extension}`);
            }
            // Each configured non-default locale: `<code><ext>` (e.g. `fr.mdx`).
            for (const code of this.localeCodes) {
                if (code === this.defaultLocale) {
                    continue;
                }
                if (fs.existsSync(path.join(dir, `${code}${this.extension}`))) {
                    add(slug, code, `${slug}/${code}${this.extension}`);
                }
            }
        }
        return [...seen.values()];
    }

    /**
     * Resolves a content-relative file path to an absolute path confined to the content directory.
     * The single path-traversal guard: a `slug`/`lang` containing `..` or a path separator (e.g. a
     * crafted route param `../../etc/foo`) would otherwise let a caller read a file outside
     * `contentDir`, so any path that escapes the directory is rejected here.
     *
     * @param file - the file path relative to the content directory.
     * @returns the absolute path when it stays inside `contentDir`, else `undefined`.
     */
    resolveWithin(file: string): string | undefined {
        const abs = path.resolve(this.contentDir, file);
        if (abs !== this.contentDir && !abs.startsWith(this.contentDir + path.sep)) {
            return undefined;
        }
        return abs;
    }

    /**
     * Reads and front-matter-parses the file for one `(slug, lang)`, resolving the same candidates
     * the layout defines: the default locale tries `<slug>/<default><ext>` then the
     * `<slug>/post<ext>` fallback; any other locale tries `<slug>/<lang><ext>` only.
     *
     * Resolution is deliberately independent of {@link ContentStore.entries} rather than a lookup
     * into it. The two paths disagree on purpose: `entries` rejects a folder holding *both*
     * `post<ext>` and `<default><ext>`, while this method silently prefers `<default><ext>` - a
     * documented asymmetry (the duplicate fails the whole build via the listing methods, but a
     * direct fetch still resolves). Routing this through `entries` would make a single-page fetch
     * start throwing, so the candidate list stays local.
     *
     * @param slug - the slug (untrusted - it may come from a URL).
     * @param lang - the language code (untrusted).
     * @returns the normalised item, or `undefined` when no candidate exists or the path escapes
     *   `contentDir` (the caller decides which domain error that is).
     */
    read(slug: string, lang: string): T | undefined {
        const candidates =
            lang === this.defaultLocale
                ? [`${slug}/${lang}${this.extension}`, `${slug}/post${this.extension}`]
                : [`${slug}/${lang}${this.extension}`];
        for (const file of candidates) {
            const abs = this.resolveWithin(file);
            if (abs && fs.existsSync(abs)) {
                return this.readAbsolute(abs, slug, lang);
            }
        }
        return undefined;
    }

    /**
     * Reads and front-matter-parses the file for an entry produced by {@link ContentStore.entries}.
     * The entry's path came from the walk, so it needs no candidate resolution - but it is still
     * traversal-guarded, since a slug is a directory name and a caller could construct an entry.
     *
     * @param entry - the entry to read.
     * @returns the normalised item, or `undefined` when the path escapes `contentDir` or the file
     *   has disappeared since the walk.
     */
    readEntry(entry: ContentEntry): T | undefined {
        const abs = this.resolveWithin(entry.file);
        if (!abs || !fs.existsSync(abs)) {
            return undefined;
        }
        return this.readAbsolute(abs, entry.slug, entry.lang);
    }

    /**
     * Reads, parses, and normalises an absolute path, serving the memoized value when the file's
     * `(mtimeMs, size)` is unchanged since it was cached.
     *
     * Both halves of the key earn their place. `mtimeMs` catches the ordinary edit; `size` catches
     * the case where a filesystem's timestamp granularity is too coarse to notice a fast rewrite,
     * and is the only half that functions on Cloudflare Workers' virtual filesystem, where every
     * file reports the Unix epoch as its mtime forever. (A cache that never invalidates is
     * nonetheless correct there: the Workers VFS bundle is read-only for the lifetime of the
     * isolate.)
     *
     * ponytail: mtime+size can miss a same-timestamp, same-length rewrite on a coarse-granularity
     * filesystem - the tradeoff every build tool makes. Content hashing is the upgrade path if a
     * real case appears; it would cost a full read per check, defeating the point.
     *
     * The cache is written only after `parse` returns, so a failed read or parse caches nothing and
     * the next call retries rather than replaying a half-built state.
     *
     * @param abs - the absolute path, already traversal-guarded and known to exist.
     * @param slug - the item's slug, passed through to `parse`.
     * @param lang - the item's language code, passed through to `parse`.
     * @returns the normalised item.
     */
    private readAbsolute(abs: string, slug: string, lang: string): T {
        const stat = fs.statSync(abs);
        const hit = this.cache.get(abs);
        if (hit && hit.mtimeMs === stat.mtimeMs && hit.size === stat.size) {
            return hit.value;
        }
        const { content, data } = matter(fs.readFileSync(abs, "utf8"));
        const value = this.parse({ content, data: data as Record<string, unknown> }, slug, lang);
        this.cache.set(abs, { mtimeMs: stat.mtimeMs, size: stat.size, value });
        return value;
    }
}
