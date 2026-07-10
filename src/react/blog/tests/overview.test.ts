import { describe, expect, it } from "vitest";
import { filterByCategory, searchPosts } from "../internal/overview.js";
import type { PostMeta } from "../../../blog/types.js";

/**
 * Builds a `PostMeta` for the search/filter tests.
 *
 * @param overrides - fields to set on top of empty defaults.
 * @returns a `PostMeta`.
 */
function post(overrides: Partial<PostMeta> & { slug: string }): PostMeta {
    return { lang: "en", title: "", date: "", description: "", ...overrides };
}

const POSTS: PostMeta[] = [
    post({ slug: "a", title: "Plumbing basics", description: "Fix a leaking tap", categories: ["Guides"] }),
    post({ slug: "b", title: "Answering services", description: "Never miss a call", keywords: ["receptionist"], categories: ["Operations"] }),
    post({ slug: "c", title: "Marketing", description: "Grow your trade", categories: ["Growth", "Guides"] }),
];

describe("searchPosts", () => {
    it("returns all posts unchanged for a blank query", () => {
        expect(searchPosts(POSTS, "")).toEqual(POSTS);
        expect(searchPosts(POSTS, "   ")).toEqual(POSTS);
    });

    it("matches on the title", () => {
        expect(searchPosts(POSTS, "plumbing").map((p) => p.slug)).toEqual(["a"]);
    });

    it("is fuzzy / typo-tolerant on the title", () => {
        // "plumming" (typo) still finds "Plumbing basics".
        expect(searchPosts(POSTS, "plumming").map((p) => p.slug)).toContain("a");
    });

    it("matches on the description", () => {
        expect(searchPosts(POSTS, "leaking tap").map((p) => p.slug)).toContain("a");
    });

    it("matches on keywords", () => {
        expect(searchPosts(POSTS, "receptionist").map((p) => p.slug)).toContain("b");
    });

    it("matches on categories", () => {
        expect(searchPosts(POSTS, "growth").map((p) => p.slug)).toContain("c");
    });

    it("returns an empty array when nothing matches", () => {
        expect(searchPosts(POSTS, "zzzxyqq")).toEqual([]);
    });
});

describe("filterByCategory", () => {
    it("returns all posts when the category is null", () => {
        expect(filterByCategory(POSTS, null)).toEqual(POSTS);
    });

    it("returns only posts in the given category", () => {
        expect(filterByCategory(POSTS, "Guides").map((p) => p.slug)).toEqual(["a", "c"]);
        expect(filterByCategory(POSTS, "Operations").map((p) => p.slug)).toEqual(["b"]);
    });

    it("returns an empty array for a category no post has", () => {
        expect(filterByCategory(POSTS, "Nope")).toEqual([]);
    });
});
