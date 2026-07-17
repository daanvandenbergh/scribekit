import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { ContentStore } from "../content-store.js";
import type { ContentStoreConfig, ParsedFile } from "../types.js";

/**
 * Unlike the `blog`/`docs` suites - which read static, committed fixtures - these tests must
 * *mutate* content between reads: a cache that is only ever asked about immutable files cannot be
 * shown to invalidate. So each test builds a throwaway corpus in a temp directory it then edits.
 * This is the one place in the repo where writing files in a test is the point rather than a smell.
 */

/** Temp directories created by {@link corpus}, removed after each test. */
const created: string[] = [];

/**
 * `gray-matter`'s cache reset. The function is part of its documented API but is missing from its
 * bundled type declarations, so the shape is asserted here rather than suppressed.
 */
const clearMatterCache = (matter as typeof matter & { clearCache: () => void }).clearCache;

afterEach(() => {
    vi.restoreAllMocks();
    // `gray-matter` memoizes parses in a module-global keyed on the raw string, which outlives any
    // one test: without this, a second test parsing identical content silently gets the first
    // test's result (notably, a malformed file throws only the *first* time it is ever parsed).
    // Not the store's cache and not its behaviour - just a global that has to be reset between
    // tests for them to be independent.
    clearMatterCache();
    while (created.length > 0) {
        const dir = created.pop();
        if (dir) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    }
});

/**
 * Creates a throwaway content directory from a `{ "<relative path>": "<contents>" }` map.
 *
 * @param files - the files to write, keyed by path relative to the content directory.
 * @returns the absolute path to the new directory.
 */
function corpus(files: Record<string, string>): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-store-"));
    created.push(dir);
    for (const [rel, body] of Object.entries(files)) {
        const abs = path.join(dir, rel);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, body);
    }
    return dir;
}

/**
 * Builds a store over `contentDir` with the defaults these tests use.
 *
 * @param contentDir - the content directory to read.
 * @param overrides - config overrides.
 * @returns the store.
 */
function makeStore(contentDir: string, overrides: Partial<ContentStoreConfig<ParsedFile>> = {}): ContentStore<ParsedFile> {
    return new ContentStore<ParsedFile>({
        contentDir,
        extension: ".mdx",
        defaultLocale: "en",
        localeCodes: [],
        parse: (parsed) => parsed,
        onDuplicate: (slug, lang, a, b) => new Error(`dup ${slug}/${lang}: ${a} + ${b}`),
        ...overrides,
    });
}

/** Front-matter helper: a minimal valid file with the given title and body. */
const file = (title: string, body = "Body."): string => `---\ntitle: ${title}\n---\n\n${body}\n`;

describe("ContentStore.entries", () => {
    it("discovers one entry per slug folder from the default-locale file", () => {
        const dir = corpus({ "alpha/en.mdx": file("Alpha"), "beta/en.mdx": file("Beta") });
        expect(makeStore(dir).entries()).toEqual([
            { slug: "alpha", lang: "en", file: "alpha/en.mdx" },
            { slug: "beta", lang: "en", file: "beta/en.mdx" },
        ]);
    });

    it("accepts the language-neutral post<ext> as the default-locale file", () => {
        const dir = corpus({ "alpha/post.mdx": file("Alpha") });
        expect(makeStore(dir).entries()).toEqual([{ slug: "alpha", lang: "en", file: "alpha/post.mdx" }]);
    });

    it("returns [] for a missing content directory rather than throwing", () => {
        expect(makeStore(path.join(os.tmpdir(), "content-store-does-not-exist")).entries()).toEqual([]);
    });

    it("picks up pages created after the store was built (the dir may not exist yet)", () => {
        const dir = corpus({});
        const contentDir = path.join(dir, "later");
        const store = makeStore(contentDir);
        expect(store.entries()).toEqual([]);

        fs.mkdirSync(path.join(contentDir, "alpha"), { recursive: true });
        fs.writeFileSync(path.join(contentDir, "alpha", "en.mdx"), file("Alpha"));
        expect(store.entries()).toEqual([{ slug: "alpha", lang: "en", file: "alpha/en.mdx" }]);
    });

    it("skips non-directories and ignores unknown file stems", () => {
        const dir = corpus({
            "alpha/en.mdx": file("Alpha"),
            "alpha/hero.js": "export default 1;",
            "notes.txt": "stray",
        });
        expect(makeStore(dir).entries()).toEqual([{ slug: "alpha", lang: "en", file: "alpha/en.mdx" }]);
    });

    it("discovers configured non-default locales and ignores unconfigured ones", () => {
        const dir = corpus({ "alpha/en.mdx": file("Alpha"), "alpha/fr.mdx": file("Alpha FR"), "alpha/de.mdx": file("Alpha DE") });
        expect(makeStore(dir, { localeCodes: ["en", "fr"] }).entries()).toEqual([
            { slug: "alpha", lang: "en", file: "alpha/en.mdx" },
            { slug: "alpha", lang: "fr", file: "alpha/fr.mdx" },
        ]);
    });

    it("honours a custom extension", () => {
        const dir = corpus({ "alpha/en.md": file("Alpha"), "beta/en.mdx": file("Beta") });
        expect(makeStore(dir, { extension: ".md" }).entries()).toEqual([{ slug: "alpha", lang: "en", file: "alpha/en.md" }]);
    });

    it("preserves readdirSync discovery order, which is a documented sort tie-break", () => {
        const dir = corpus({ "b/en.mdx": file("B"), "a/en.mdx": file("A"), "c/en.mdx": file("C") });
        const onDisk = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
        expect(makeStore(dir).entries().map((e) => e.slug)).toEqual(onDisk);
    });

    it("throws the caller's error when post<ext> and <default><ext> collide", () => {
        const dir = corpus({ "alpha/post.mdx": file("A"), "alpha/en.mdx": file("B") });
        expect(() => makeStore(dir).entries()).toThrow('dup alpha/en: alpha/post.mdx + alpha/en.mdx');
    });

    it("throws on EVERY call, never memoizing the first throw away", () => {
        const dir = corpus({ "alpha/post.mdx": file("A"), "alpha/en.mdx": file("B") });
        const store = makeStore(dir);
        expect(() => store.entries()).toThrow(/^dup alpha\/en/);
        expect(() => store.entries()).toThrow(/^dup alpha\/en/);
    });

    it("finds a locale-named default file even when no locales are configured", () => {
        const dir = corpus({ "alpha/en.mdx": file("Alpha") });
        expect(makeStore(dir, { localeCodes: [] }).entries()).toHaveLength(1);
    });
});

describe("ContentStore.read", () => {
    it("parses front-matter and body", () => {
        const dir = corpus({ "alpha/en.mdx": "---\ntitle: Alpha\norder: 3\n---\n\nHello.\n" });
        const parsed = makeStore(dir).read("alpha", "en");
        expect(parsed?.data).toEqual({ title: "Alpha", order: 3 });
        expect(parsed?.content.trim()).toBe("Hello.");
    });

    it("falls back to post<ext> for the default locale", () => {
        const dir = corpus({ "alpha/post.mdx": file("Neutral") });
        expect(makeStore(dir).read("alpha", "en")?.data.title).toBe("Neutral");
    });

    it("prefers <default><ext> over the post<ext> fallback", () => {
        const dir = corpus({ "alpha/post.mdx": file("Neutral"), "alpha/en.mdx": file("Locale") });
        expect(makeStore(dir).read("alpha", "en")?.data.title).toBe("Locale");
    });

    it("does NOT throw on the duplicate that entries() rejects - a documented asymmetry", () => {
        const dir = corpus({ "alpha/post.mdx": file("Neutral"), "alpha/en.mdx": file("Locale") });
        const store = makeStore(dir);
        expect(() => store.entries()).toThrow();
        expect(store.read("alpha", "en")?.data.title).toBe("Locale");
    });

    it("returns undefined for an unknown slug", () => {
        expect(makeStore(corpus({ "alpha/en.mdx": file("A") })).read("nope", "en")).toBeUndefined();
    });

    it("returns undefined for a language the item is not translated into", () => {
        const dir = corpus({ "alpha/en.mdx": file("A") });
        expect(makeStore(dir, { localeCodes: ["en", "fr"] }).read("alpha", "fr")).toBeUndefined();
    });

    it("does not apply the post<ext> fallback to a non-default locale", () => {
        const dir = corpus({ "alpha/post.mdx": file("Neutral") });
        expect(makeStore(dir, { localeCodes: ["en", "fr"] }).read("alpha", "fr")).toBeUndefined();
    });

    describe("path traversal", () => {
        it("rejects an escaping slug", () => {
            const dir = corpus({ "alpha/en.mdx": file("A") });
            fs.writeFileSync(path.join(dir, "..", "content-store-outside.mdx"), file("Outside"));
            created.push(path.join(dir, "..", "content-store-outside.mdx"));
            expect(makeStore(dir).read("../content-store-outside", "en")).toBeUndefined();
        });

        it("rejects an escaping lang", () => {
            const dir = corpus({ "alpha/en.mdx": file("A") });
            expect(makeStore(dir).read("alpha", "../../etc/passwd")).toBeUndefined();
        });

        it("never caches a rejected path", () => {
            const store = makeStore(corpus({ "alpha/en.mdx": file("A") }));
            expect(store.read("../../etc/passwd", "en")).toBeUndefined();
            expect(store.read("../../etc/passwd", "en")).toBeUndefined();
        });
    });
});

describe("ContentStore.readEntry", () => {
    it("reads an entry produced by the walk", () => {
        const store = makeStore(corpus({ "alpha/en.mdx": file("Alpha") }));
        const [entry] = store.entries();
        expect(entry && store.readEntry(entry)?.data.title).toBe("Alpha");
    });

    it("returns undefined when the file vanished after the walk", () => {
        const dir = corpus({ "alpha/en.mdx": file("Alpha") });
        const store = makeStore(dir);
        const [entry] = store.entries();
        fs.rmSync(path.join(dir, "alpha", "en.mdx"));
        expect(entry && store.readEntry(entry)).toBeUndefined();
    });

    it("returns undefined for a hand-built entry whose path escapes the content dir", () => {
        const store = makeStore(corpus({ "alpha/en.mdx": file("Alpha") }));
        expect(store.readEntry({ slug: "x", lang: "en", file: "../../etc/passwd" })).toBeUndefined();
    });
});

describe("ContentStore caching", () => {
    it("parses a given file only once when it has not changed", () => {
        const dir = corpus({ "alpha/en.mdx": file("Alpha") });
        const store = makeStore(dir);
        const spy = vi.spyOn(fs, "readFileSync");
        store.read("alpha", "en");
        store.read("alpha", "en");
        store.read("alpha", "en");
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("serves the identical object on a cache hit", () => {
        const store = makeStore(corpus({ "alpha/en.mdx": file("Alpha") }));
        expect(store.read("alpha", "en")).toBe(store.read("alpha", "en"));
    });

    it("picks up an edit immediately - the whole reason the cache validates", () => {
        const dir = corpus({ "alpha/en.mdx": file("First") });
        const store = makeStore(dir);
        expect(store.read("alpha", "en")?.data.title).toBe("First");

        fs.writeFileSync(path.join(dir, "alpha", "en.mdx"), file("Second and rather longer"));
        expect(store.read("alpha", "en")?.data.title).toBe("Second and rather longer");
    });

    it("picks up an edit that keeps the file's byte length identical", () => {
        const dir = corpus({ "alpha/en.mdx": file("First") });
        const store = makeStore(dir);
        expect(store.read("alpha", "en")?.data.title).toBe("First");

        const before = fs.statSync(path.join(dir, "alpha", "en.mdx")).size;
        fs.writeFileSync(path.join(dir, "alpha", "en.mdx"), file("Secnd"));
        expect(fs.statSync(path.join(dir, "alpha", "en.mdx")).size).toBe(before);
        expect(store.read("alpha", "en")?.data.title).toBe("Secnd");
    });

    it("picks up a body-only edit (front-matter unchanged)", () => {
        const dir = corpus({ "alpha/en.mdx": file("Alpha", "Before.") });
        const store = makeStore(dir);
        expect(store.read("alpha", "en")?.content.trim()).toBe("Before.");

        fs.writeFileSync(path.join(dir, "alpha", "en.mdx"), file("Alpha", "After the edit."));
        expect(store.read("alpha", "en")?.content.trim()).toBe("After the edit.");
    });

    it("caches per absolute path, so identical content in two files stays distinct", () => {
        const dir = corpus({ "alpha/en.mdx": file("Same"), "beta/en.mdx": file("Same") });
        const store = makeStore(dir);
        expect(store.read("alpha", "en")).not.toBe(store.read("beta", "en"));
    });

    it("shares one cache between read() and readEntry() for the same file", () => {
        const store = makeStore(corpus({ "alpha/en.mdx": file("Alpha") }));
        const [entry] = store.entries();
        const spy = vi.spyOn(fs, "readFileSync");
        store.read("alpha", "en");
        if (entry) {
            store.readEntry(entry);
        }
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("stores nothing when the parse throws, so the file is re-read next call", () => {
        // The store's cache is written only after `matter` returns. A throw must leave no entry
        // behind - a half-populated cache would replay a broken state instead of retrying.
        // (`gray-matter` keeps a module-global cache of its own that swallows the *second* throw
        // for identical input; that is its behaviour, not the store's, and predates this module -
        // so this asserts what the store controls: that it did not cache anything.)
        const dir = corpus({ "alpha/en.mdx": "---\ntitle: [unclosed\n---\n\nBody.\n" });
        const store = makeStore(dir);
        expect(() => store.read("alpha", "en")).toThrow();

        const spy = vi.spyOn(fs, "readFileSync");
        store.read("alpha", "en");
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("recovers once a malformed file is fixed on disk", () => {
        const dir = corpus({ "alpha/en.mdx": "---\ntitle: [unclosed\n---\n\nBody.\n" });
        const store = makeStore(dir);
        expect(() => store.read("alpha", "en")).toThrow();

        fs.writeFileSync(path.join(dir, "alpha", "en.mdx"), file("Fixed"));
        expect(store.read("alpha", "en")?.data.title).toBe("Fixed");
    });

    it("keeps two instances over one directory independent", () => {
        const dir = corpus({ "alpha/en.mdx": file("Alpha"), "alpha/fr.mdx": file("Alpha FR") });
        const bare = makeStore(dir);
        const i18n = makeStore(dir, { localeCodes: ["en", "fr"] });
        expect(bare.entries()).toHaveLength(1);
        expect(i18n.entries()).toHaveLength(2);
        expect(bare.entries()).toHaveLength(1);
    });
});

describe("the node:fs boundary", () => {
    it("is crossed by this module alone", () => {
        // No "use client" component may transitively reach node:fs, and nothing enforces that but
        // convention. Extracting the fs layer collapsed the surface from two files to one, so pin
        // it: a second fs-touching module must be a deliberate decision, not an accident. If this
        // fails, check the new importer is genuinely server-only before widening the list.
        const here = path.dirname(fileURLToPath(import.meta.url));
        const src = path.resolve(here, "../..");
        const found: string[] = [];
        const walk = (dir: string): void => {
            for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
                const abs = path.join(dir, dirent.name);
                if (dirent.isDirectory()) {
                    if (dirent.name !== "tests") {
                        walk(abs);
                    }
                } else if (/\.tsx?$/.test(dirent.name) && /^\s*import\s+.*from\s+"node:fs"/m.test(fs.readFileSync(abs, "utf8"))) {
                    found.push(path.relative(src, abs));
                }
            }
        };
        walk(src);
        expect(found).toEqual(["content-store/content-store.ts"]);
    });

    it("is behind server-only, so a client component importing it is a build error", () => {
        const here = path.dirname(fileURLToPath(import.meta.url));
        const source = fs.readFileSync(path.resolve(here, "../content-store.ts"), "utf8");
        expect(source.startsWith('import "server-only";')).toBe(true);
    });
});
