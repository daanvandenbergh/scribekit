/**
 * Pure, DOM-free helpers that back the `BlogOverview` grid's search and category filtering.
 * Kept out of the client component so the (untestable-via-static-markup) interaction logic
 * can be unit-tested directly. Fuse.js runs in Node too, so these are plain function calls.
 */

import Fuse from "fuse.js";
import type { PostMeta } from "../../../blog/types.js";

/** Fields the fuzzy search matches against, in rough order of relevance. */
const SEARCH_KEYS: (keyof PostMeta)[] = ["title", "description", "keywords", "categories"];

/**
 * Fuzzily filters posts by a free-text query over their title, description, keywords, and
 * categories. An empty or whitespace-only query returns the posts unchanged (newest-first
 * order preserved); otherwise matches are returned in Fuse's relevance order.
 *
 * @param posts - the posts to search.
 * @param query - the reader's search text.
 * @returns the matching posts (all posts when the query is blank).
 */
export function searchPosts(posts: PostMeta[], query: string): PostMeta[] {
    if (query.trim() === "") {
        return posts;
    }
    const fuse = new Fuse(posts, {
        keys: SEARCH_KEYS as string[],
        threshold: 0.4,
        ignoreLocation: true,
    });
    return fuse.search(query).map((result) => result.item);
}

/**
 * Filters posts to those tagged with the given category. A `null` category (the "all" state)
 * returns the posts unchanged.
 *
 * @param posts - the posts to filter.
 * @param category - the selected category, or `null` for all.
 * @returns the posts in the category (all posts when `category` is `null`).
 */
export function filterByCategory(posts: PostMeta[], category: string | null): PostMeta[] {
    if (category === null) {
        return posts;
    }
    return posts.filter((post) => (post.categories ?? []).includes(category));
}
