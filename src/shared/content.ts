/**
 * Pure, framework-free helpers derived from a page's MDX body: heading anchors, an estimated
 * reading time, and a table-of-contents minimap. Kept fs-free (no `node:fs`, no `next`/`react`
 * import) so both the backend content classes (`Blog`, `Docs`) and the React components can
 * import it - `slugify` in particular is shared by the ToC extractor here and the frontend
 * heading-id injector, so the anchors they produce always match.
 */

import { isoDateString } from "./format.js";
import type { TocEntry } from "./types.js";

/**
 * Coerces a raw front-matter value to display text. Front-matter is parsed as YAML, whose
 * native scalar types turn an unquoted `title: 404` (or a `categories: [2024]` member) into a
 * JS `number`, and a date-shaped `title: 2026-06-28` into a `Date`, so a bare `typeof === "string"`
 * guard silently loses it - a numeric or date-shaped title would fall back to the slug and such a
 * tag would vanish. A string passes through unchanged; a finite number is stringified
 * (`404` -> `"404"`); a valid `Date` becomes its UTC `YYYY-MM-DD` (`2026-06-28` -> `"2026-06-28"`,
 * mirroring {@link isoDateString} so a date-shaped title is preserved rather than dropped to the
 * slug); any other value (boolean, `null`, a plain object, `NaN`/`Infinity`, an invalid `Date`)
 * yields `undefined` so the caller's fallback applies. Names and path fields (`author`, `image`,
 * `icon`) deliberately stay string-only at their call sites: a bare number there is not
 * meaningful text, and their own fallbacks handle it correctly.
 *
 * @param value - the raw front-matter value.
 * @returns the text, or `undefined` when the value is not text-like.
 */
export function coerceText(value: unknown): string | undefined {
    if (typeof value === "string") {
        return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
    }
    if (value instanceof Date) {
        return isoDateString(value);
    }
    return undefined;
}

/**
 * Slugifies heading text into a URL anchor id, GitHub-style: lower-cased, with every
 * character that is not a Unicode letter or number dropped and runs of whitespace collapsed
 * to single hyphens. Unicode letters are preserved so accented headings still get a stable id.
 *
 * @param text - the heading's visible text.
 * @returns the anchor id (may be empty when `text` has no alphanumeric characters).
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Estimates a page's reading time in whole minutes from its word count.
 *
 * Words are counted by splitting the body on whitespace; the result is rounded to the
 * nearest minute and floored at 1 so even a very short page never reads as "0 min".
 *
 * @param content - the MDX body.
 * @param wpm - words-per-minute reading speed. Defaults to `200`.
 * @returns the estimated reading time in minutes (always `>= 1`).
 */
export function readingMinutes(content: string, wpm: number = 200): number {
    // ponytail: counts MDX/markdown tokens too, ~ok for an estimate
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / wpm));
}

/**
 * Extracts a table-of-contents minimap from a page's MDX body: one entry per `##`/`###`
 * ATX heading, in document order. Headings inside fenced code blocks (``` ``` ``` `` or
 * `~~~`) are ignored, closing `#`s are stripped, and each entry's `id` is `slugify(text)`
 * so the ToC's `<a href="#id">` links line up with the rendered headings' ids.
 *
 * @param content - the MDX body.
 * @returns the headings as {@link TocEntry} objects; empty when the body has no `##`/`###`.
 */
export function tableOfContents(content: string): TocEntry[] {
    const entries: TocEntry[] = [];
    let inFence = false;
    for (const line of content.split(/\r?\n/)) {
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            continue;
        }
        if (inFence) {
            continue;
        }
        const match = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
        if (!match) {
            continue;
        }
        const text = match[2].trim();
        if (!text) {
            continue;
        }
        const depth = match[1].length as 2 | 3;
        // ponytail: duplicate heading text -> duplicate id; pages rarely repeat
        // headings, add github-slugger dedup if it bites
        entries.push({ depth, text, id: slugify(text) });
    }
    return entries;
}
