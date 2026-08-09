import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import remarkGfm from "remark-gfm";

import { Docs } from "../../../docs/docs.js";
import { MdxContent, withGfm } from "../mdx.js";

/**
 * `withGfm` is what makes pipe tables render at all: without `remark-gfm` a `| a | b |` table is
 * not an error, it silently becomes a paragraph of literal pipe characters. These tests pin both
 * halves of the contract - GFM is always present, and the caller's own options are never clobbered.
 */
describe("withGfm", () => {
    it("enables gfm when the caller passes no options at all (the default path)", () => {
        const options = withGfm();
        expect(options?.mdxOptions?.remarkPlugins).toEqual([remarkGfm]);
    });

    it("enables gfm when the caller passes options but no remark plugins", () => {
        const options = withGfm({ parseFrontmatter: false });
        expect(options?.mdxOptions?.remarkPlugins).toEqual([remarkGfm]);
    });

    it("preserves the caller's remark plugins and prepends gfm rather than replacing them", () => {
        const callerPlugin = (): undefined => undefined;
        const options = withGfm({ mdxOptions: { remarkPlugins: [callerPlugin] } });
        expect(options?.mdxOptions?.remarkPlugins).toEqual([remarkGfm, callerPlugin]);
    });

    it("carries every unrelated option through untouched", () => {
        const rehypePlugin = (): undefined => undefined;
        const options = withGfm({
            parseFrontmatter: true,
            mdxOptions: { rehypePlugins: [rehypePlugin], format: "mdx" },
        });
        expect(options?.parseFrontmatter).toBe(true);
        expect(options?.mdxOptions?.rehypePlugins).toEqual([rehypePlugin]);
        expect(options?.mdxOptions?.format).toBe("mdx");
        expect(options?.mdxOptions?.remarkPlugins).toEqual([remarkGfm]);
    });

    it("does not mutate the caller's options object", () => {
        const callerOptions = { mdxOptions: { remarkPlugins: [] as never[] } };
        withGfm(callerOptions);
        expect(callerOptions.mdxOptions.remarkPlugins).toEqual([]);
    });
});

/** Scratch content directories created by {@link makeDocsDir}, removed after each test. */
const created: string[] = [];

afterEach(() => {
    for (const dir of created.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

/**
 * Creates a throwaway docs content directory from a `relative path -> file content` map, so the
 * edit-invalidation test can rewrite a real file on disk. Removed automatically after the test.
 *
 * @param files - the files to create, keyed by path relative to the content directory.
 * @returns the absolute path of the created directory.
 */
function makeDocsDir(files: Record<string, string>): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scribekit-mdx-test-"));
    created.push(dir);
    for (const [rel, content] of Object.entries(files)) {
        const abs = path.join(dir, rel);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, content);
    }
    return dir;
}

/** How many times {@link counting} has been attached to a compile - i.e. how many real compiles ran. */
let compiles = 0;

/**
 * A no-op remark plugin that counts the compiles it takes part in. It is declared ONCE at module
 * level on purpose: the plugin's identity is part of the cache key, so a per-test arrow function
 * would key every render separately and every assertion below would trivially pass.
 *
 * @returns a transformer that does nothing to the tree.
 */
function counting(): (tree: unknown) => void {
    compiles += 1;
    return () => undefined;
}

/**
 * A second counting plugin, distinct from {@link counting} by identity only - used to prove two
 * different plugin sets never share a cache entry for the same source.
 *
 * @returns a transformer that does nothing to the tree.
 */
function countingToo(): (tree: unknown) => void {
    compiles += 1;
    return () => undefined;
}

/**
 * Renders `MdxContent` to static HTML. `MdxContent` is an async server component whose result is a
 * synchronous element tree, so awaiting it is enough to hand it to `renderToStaticMarkup`.
 *
 * @param props - the props to render with.
 * @returns the rendered HTML.
 */
async function render(props: Parameters<typeof MdxContent>[0]): Promise<string> {
    return renderToStaticMarkup(await MdxContent(props));
}

/**
 * The compiled-MDX cache. Compiling is ~50x more expensive than everything else a page component
 * does, so it is memoized per `(options, source)` - and the one thing that must never happen is an
 * edited file rendering its old text. These tests pin that first.
 */
describe("MdxContent caching", () => {
    it("renders the NEW text after the file is edited, never the cached body", async () => {
        const dir = makeDocsDir({ "greeting/en.mdx": "---\ntitle: Greeting\n---\n\nThe first draft.\n" });
        const docs = new Docs({ contentDir: dir, locales: [{ code: "en", label: "English" }], defaultLocale: "en" });
        const before = await render({ source: docs.getDoc("greeting", "en").content, options: withGfm() });
        expect(before).toContain("The first draft.");

        // A real edit: new bytes AND a moved mtime, exactly what `next dev` sees.
        const file = path.join(dir, "greeting/en.mdx");
        fs.writeFileSync(file, "---\ntitle: Greeting\n---\n\nThe second draft, rewritten.\n");
        const now = new Date();
        fs.utimesSync(file, now, now);

        const after = await render({ source: docs.getDoc("greeting", "en").content, options: withGfm() });
        expect(after).toContain("The second draft, rewritten.");
        expect(after).not.toContain("The first draft.");
    });

    it("compiles a repeated source only once", async () => {
        const options = withGfm({ mdxOptions: { remarkPlugins: [counting] } });
        const source = "# Repeated\n\nSame body, rendered twice.\n";
        compiles = 0;
        const first = await render({ source, options });
        const second = await render({ source, options });
        expect(compiles).toBe(1);
        expect(second).toBe(first);
        expect(first).toContain("Same body, rendered twice.");
    });

    it("keeps two locales of the same page apart", async () => {
        const options = withGfm({ mdxOptions: { remarkPlugins: [counting] } });
        compiles = 0;
        const english = await render({ source: "Book a plumber.\n", options });
        const dutch = await render({ source: "Boek een loodgieter.\n", options });
        expect(compiles).toBe(2);
        expect(english).toContain("Book a plumber.");
        expect(dutch).toContain("Boek een loodgieter.");
    });

    it("keeps the same source under different plugin sets apart", async () => {
        const source = "One body, two pipelines.\n";
        compiles = 0;
        await render({ source, options: withGfm({ mdxOptions: { remarkPlugins: [counting] } }) });
        await render({ source, options: withGfm({ mdxOptions: { remarkPlugins: [countingToo] } }) });
        expect(compiles).toBe(2);
    });

    it("applies the CURRENT components map on a cache hit, not the one that filled it", async () => {
        const options = withGfm({ mdxOptions: { remarkPlugins: [counting] } });
        const source = "A paragraph.\n";
        compiles = 0;
        const first = await render({ source, options, components: { p: () => null } });
        const second = await render({ source, options });
        expect(compiles).toBe(1);
        expect(first).not.toContain("A paragraph.");
        expect(second).toContain("<p>A paragraph.</p>");
    });

    it("applies the CURRENT scope on a cache hit, not the one that filled it", async () => {
        const source = "Owner: {name}\n";
        const mdxOptions = { remarkPlugins: [counting] };
        compiles = 0;
        // `blockJS: false` keeps the `{name}` expression, which is what reads from `scope`.
        const first = await render({ source, options: { mdxOptions, blockJS: false, scope: { name: "Ada" } } });
        const second = await render({ source, options: { mdxOptions, blockJS: false, scope: { name: "Grace" } } });
        expect(compiles).toBe(1);
        expect(first).toContain("Ada");
        expect(second).toContain("Grace");
    });
});
