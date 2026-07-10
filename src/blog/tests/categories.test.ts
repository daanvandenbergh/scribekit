import { describe, expect, it } from "vitest";
import { collectCategories } from "../categories.js";
import type { PostMeta } from "../types.js";

/**
 * Builds a minimal `PostMeta` with the given categories.
 *
 * @param slug - the post slug (also the title).
 * @param categories - the post's categories, or omit for none.
 * @returns a `PostMeta` with just the fields `collectCategories` reads.
 */
function post(slug: string, categories?: string[]): PostMeta {
    return { slug, lang: "en", title: slug, date: "", description: "", categories };
}

describe("collectCategories", () => {
    it("returns distinct categories across posts, sorted alphabetically", () => {
        const posts = [post("a", ["Ops", "Guides"]), post("b", ["Guides", "News"])];
        expect(collectCategories(posts)).toEqual(["Guides", "News", "Ops"]);
    });

    it("ignores posts without categories", () => {
        const posts = [post("a", ["Guides"]), post("b"), post("c", [])];
        expect(collectCategories(posts)).toEqual(["Guides"]);
    });

    it("returns an empty array for no posts or no categories", () => {
        expect(collectCategories([])).toEqual([]);
        expect(collectCategories([post("a"), post("b")])).toEqual([]);
    });
});
