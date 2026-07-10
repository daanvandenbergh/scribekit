import { describe, expect, it } from "vitest";
import { similarPosts } from "../similar.js";
import type { PostMeta } from "../types.js";

/**
 * Builds a `PostMeta` fixture with sensible defaults for the fields the ranker ignores.
 *
 * @param meta - the fields to set (`slug` is required).
 * @returns the fixture.
 */
function post(meta: Partial<PostMeta> & { slug: string }): PostMeta {
    return { lang: "en", title: "", date: "", description: "", ...meta };
}

const CURRENT = post({ slug: "cur", title: "Testing", keywords: ["react", "hooks"] });

describe("similarPosts", () => {
    it("ranks by weighted-term cosine, keywords outweighing title-only overlap", () => {
        const byKeywords = post({ slug: "kw", title: "Other", keywords: ["react", "hooks"] });
        const byTitle = post({ slug: "title", title: "React guide" });
        const result = similarPosts(CURRENT, [byTitle, byKeywords]);
        expect(result.map((p) => p.slug)).toEqual(["kw", "title"]);
    });

    it("excludes the current post itself", () => {
        const other = post({ slug: "kw", keywords: ["react"] });
        const result = similarPosts(CURRENT, [CURRENT, other]);
        expect(result.map((p) => p.slug)).toEqual(["kw"]);
    });

    it("drops posts that share no significant terms (score 0)", () => {
        const unrelated = post({ slug: "vue", title: "Vue basics", keywords: ["vue"] });
        const related = post({ slug: "kw", keywords: ["react"] });
        const result = similarPosts(CURRENT, [unrelated, related]);
        expect(result.map((p) => p.slug)).toEqual(["kw"]);
    });

    it("breaks score ties by date, newest first", () => {
        const older = post({ slug: "old", title: "Same", date: "2026-01-01", keywords: ["react", "hooks"] });
        const newer = post({ slug: "new", title: "Same", date: "2026-06-01", keywords: ["react", "hooks"] });
        const result = similarPosts(CURRENT, [older, newer]);
        expect(result.map((p) => p.slug)).toEqual(["new", "old"]);
    });

    it("caps the result at `limit`", () => {
        const a = post({ slug: "a", keywords: ["react", "hooks"] });
        const b = post({ slug: "b", keywords: ["react"] });
        expect(similarPosts(CURRENT, [a, b], 1).map((p) => p.slug)).toEqual(["a"]);
        expect(similarPosts(CURRENT, [a, b], 0)).toEqual([]);
    });

    it("returns nothing when the current post has no significant terms", () => {
        const bare = post({ slug: "bare", title: "Go", keywords: [] });
        const other = post({ slug: "kw", keywords: ["go"] });
        expect(similarPosts(bare, [other])).toEqual([]);
    });

    it("returns an empty array when there are no other posts", () => {
        expect(similarPosts(CURRENT, [CURRENT])).toEqual([]);
        expect(similarPosts(CURRENT, [])).toEqual([]);
    });

    it("weights the description below the title and keywords", () => {
        // `descOnly` overlaps only via description; `titleOnly` via title -> title must rank higher.
        const current = post({ slug: "c", title: "Alpha", description: "Beta" });
        const titleOnly = post({ slug: "t", title: "Alpha", keywords: [] });
        const descOnly = post({ slug: "d", description: "Beta", keywords: [] });
        const result = similarPosts(current, [descOnly, titleOnly]);
        expect(result.map((p) => p.slug)).toEqual(["t", "d"]);
    });
});
