import { describe, expect, it } from "vitest";
import { readingMinutes, slugify, tableOfContents } from "../content.js";

/**
 * Builds a string of `count` whitespace-separated words, for exercising the word-count paths.
 *
 * @param count - the number of words.
 * @returns the space-joined words.
 */
function words(count: number): string {
    return Array.from({ length: count }, () => "word").join(" ");
}

describe("slugify", () => {
    it("lower-cases and hyphenates whitespace", () => {
        expect(slugify("Hello World")).toBe("hello-world");
    });

    it("drops punctuation and symbols", () => {
        expect(slugify("Hello, World!")).toBe("hello-world");
        expect(slugify("C# and .NET")).toBe("c-and-net");
    });

    it("collapses runs of whitespace and hyphens, and trims edge hyphens", () => {
        expect(slugify("Multiple   Spaces")).toBe("multiple-spaces");
        expect(slugify("-Leading and trailing-")).toBe("leading-and-trailing");
        expect(slugify("  padded  ")).toBe("padded");
    });

    it("preserves unicode letters and numbers", () => {
        expect(slugify("Café Life")).toBe("café-life");
        expect(slugify("Chapter 2 Notes")).toBe("chapter-2-notes");
    });

    it("returns an empty string when there is nothing sluggable", () => {
        expect(slugify("")).toBe("");
        expect(slugify("!!!")).toBe("");
    });
});

describe("readingMinutes", () => {
    it("estimates minutes at the default 200 wpm, rounded", () => {
        expect(readingMinutes(words(200))).toBe(1);
        expect(readingMinutes(words(400))).toBe(2);
        expect(readingMinutes(words(350))).toBe(2);
        expect(readingMinutes(words(250))).toBe(1);
    });

    it("floors at 1 minute for empty or whitespace-only content", () => {
        expect(readingMinutes("")).toBe(1);
        expect(readingMinutes("   \n\t  ")).toBe(1);
        expect(readingMinutes("hi")).toBe(1);
    });

    it("honours a custom words-per-minute", () => {
        expect(readingMinutes(words(300), 300)).toBe(1);
        expect(readingMinutes(words(600), 300)).toBe(2);
    });
});

describe("tableOfContents", () => {
    it("collects ## and ### headings in order with matching slugs", () => {
        const toc = tableOfContents("## Intro\nbody\n### Details\n## More Stuff");
        expect(toc).toEqual([
            { depth: 2, text: "Intro", id: "intro" },
            { depth: 3, text: "Details", id: "details" },
            { depth: 2, text: "More Stuff", id: "more-stuff" },
        ]);
    });

    it("ignores headings inside fenced code blocks (``` and ~~~)", () => {
        expect(tableOfContents("## Real\n```\n## Fake\n```\n### After")).toEqual([
            { depth: 2, text: "Real", id: "real" },
            { depth: 3, text: "After", id: "after" },
        ]);
        expect(tableOfContents("~~~\n## Hidden\n~~~\n## Shown")).toEqual([{ depth: 2, text: "Shown", id: "shown" }]);
    });

    it("ignores # (h1) and #### (h4) and deeper", () => {
        expect(tableOfContents("# Title\n## Keep\n#### Deep")).toEqual([{ depth: 2, text: "Keep", id: "keep" }]);
    });

    it("strips closing hashes and surrounding whitespace", () => {
        expect(tableOfContents("##  Padded Heading  ##")).toEqual([
            { depth: 2, text: "Padded Heading", id: "padded-heading" },
        ]);
    });

    it("keeps inline markdown in the text but slugs it to a clean id", () => {
        expect(tableOfContents("## A **bold** heading")).toEqual([
            { depth: 2, text: "A **bold** heading", id: "a-bold-heading" },
        ]);
    });

    it("skips a heading marker with no text", () => {
        expect(tableOfContents("## \n##")).toEqual([]);
    });

    it("returns an empty array for content with no ## or ### headings", () => {
        expect(tableOfContents("just some prose\nwith no headings")).toEqual([]);
        expect(tableOfContents("")).toEqual([]);
    });
});
