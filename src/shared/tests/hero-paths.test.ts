import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * The skills and docs name a hero's FILE and its URL with two different placeholders.
 *
 * They once shared one, `<assets>`: step 6 wrote `<assets>/blog/<slug>/hero.<code>.<ext>` and step 7
 * wired `image: "/<assets>/blog/..."`, with `<assets>` defined as "the public assets dir (e.g.
 * `public/`)". A file dir and a URL cannot share a placeholder - the URL drops the public dir - so an
 * agent following the text either wrote to `public/blog/...` and wired `/blog/...` (no asset path) or
 * wired `/public/assets/...` (a 404). Nothing broke loudly: the post rendered with a missing hero.
 *
 * The contract now: a hero FILE is `<public-dir>/<asset-path>/...`, a hero URL is `/<asset-path>/...`,
 * and both skills' Step 0 define the two placeholders.
 */

/** The package root - this file sits at `src/shared/tests/`. */
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

/** The text trees that tell an agent (or a reader) where heroes go. */
const ROOTS = ["skills", "docs/content"] as const;

/**
 * Collects every `.md`/`.mdx` file under `dir`, recursively.
 *
 * @param dir - the absolute directory to walk.
 * @returns absolute paths of every markdown file found.
 */
function markdownFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return markdownFiles(path);
        return /\.mdx?$/.test(name) ? [path] : [];
    });
}

/** Every scanned file, as `[package-relative path, text]`. */
const FILES: ReadonlyArray<readonly [string, string]> = ROOTS.flatMap((root) =>
    markdownFiles(join(ROOT, root)).map((path) => [relative(ROOT, path), readFileSync(path, "utf8")] as const),
);

/**
 * Collects every match of `pattern` across the scanned files.
 *
 * @param pattern - a global regex.
 * @returns `file: match` strings, one per hit.
 */
function hits(pattern: RegExp): string[] {
    return FILES.flatMap(([file, text]) => [...text.matchAll(pattern)].map((m) => `${file}: ${m[0]}`));
}

describe("hero path placeholders", () => {
    it("scans the skills and docs (vacuity guard)", () => {
        expect(FILES.length).toBeGreaterThanOrEqual(10);
    });

    it("never uses the ambiguous `<assets>` placeholder", () => {
        expect(hits(/<assets>/g)).toEqual([]);
    });

    it("writes every blog/docs hero file under `<public-dir>/<asset-path>/`", () => {
        const files = hits(/[^\s`"]*\/(?:blog|docs)\/<slug>\/hero\.<(?:code|lang)>\.[a-z<>]+/g);
        // 14 file-path mentions + 3 wired URLs, measured when this test was written.
        expect(files.length).toBeGreaterThanOrEqual(17);
        const bad = files.filter((hit) => !/: (?:<public-dir>\/<asset-path>|\/<asset-path>)\//.test(hit));
        expect(bad).toEqual([]);
    });

    it("wires every `image:` as `/<asset-path>/...`, never with the public dir", () => {
        const wired = hits(/image: "\/<[^"]*"/g);
        expect(wired.length).toBeGreaterThanOrEqual(3);
        expect(wired.filter((hit) => !hit.includes('image: "/<asset-path>/'))).toEqual([]);
    });

    it.each(["skills/scribekit-hero/SKILL.md", "skills/scribekit-blog/SKILL.md"])(
        "%s defines both placeholders",
        (file) => {
            const text = readFileSync(join(ROOT, file), "utf8");
            expect(text).toContain("`<public-dir>`");
            expect(text).toContain("`<asset-path>`");
        },
    );
});
