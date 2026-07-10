/**
 * Pure, framework-free category aggregation over post metadata. Kept fs-free (no `node:fs`,
 * no `next`/`react` import) so both the backend `Blog` class and the React overview can
 * derive the same category list - the `Blog` from all posts, the overview from the posts it
 * actually renders.
 */

import type { PostMeta } from "./types.js";

/**
 * Collects the distinct categories declared across the given posts, sorted alphabetically.
 *
 * @param posts - the posts to scan (each may declare zero or more `categories`).
 * @returns the distinct category labels, sorted; empty when none declare one.
 */
export function collectCategories(posts: PostMeta[]): string[] {
    return [...new Set(posts.flatMap((p) => p.categories ?? []))].sort();
}
