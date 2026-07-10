/**
 * Pure, framework-free "similar posts" ranking. Given a post and the full set of posts, it
 * scores every other post by content similarity and returns the closest ones - the data
 * behind the `BlogPage` sidebar's "Similar pages" list. Kept fs-free so the frontend can use
 * it too, though the `Blog` instance method is the usual entry point.
 *
 * The signal today is the post metadata only (`keywords`, `title`, `description`); there is
 * no `tags` field yet. When one is added, fold it into {@link vectorFor} at the top weight.
 */

import type { PostMeta } from "./types.js";

/**
 * Common words dropped during tokenisation so they do not inflate similarity. Deliberately
 * small - just the highest-frequency English glue words that would otherwise match everything.
 */
const STOPWORDS: ReadonlySet<string> = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "are",
    "was",
    "were",
    "you",
    "your",
    "how",
    "why",
    "what",
    "when",
    "who",
    "our",
    "its",
    "their",
    "about",
]);

/**
 * Splits text into lower-cased significant terms: tokens under three characters and
 * stopwords are dropped, so only meaningful words feed the similarity vector.
 *
 * @param text - the source text.
 * @returns the significant terms (possibly empty).
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

/**
 * Builds a weighted term-frequency vector for a post. Keywords carry the most weight, then
 * the title, then the description, so posts that share topical keywords rank above posts that
 * merely share incidental description words.
 *
 * @param meta - the post's metadata.
 * @returns a map of term -> accumulated weight.
 */
function vectorFor(meta: PostMeta): Map<string, number> {
    const vector = new Map<string, number>();
    const add = (text: string | undefined, weight: number): void => {
        if (!text) {
            return;
        }
        for (const token of tokenize(text)) {
            vector.set(token, (vector.get(token) ?? 0) + weight);
        }
    };
    for (const keyword of meta.keywords ?? []) {
        add(keyword, 3);
    }
    add(meta.title, 2);
    add(meta.description, 1);
    return vector;
}

/**
 * Cosine similarity between two weighted term vectors, in `[0, 1]`. Normalising by the
 * vectors' magnitudes keeps long, term-heavy posts from dominating purely by size.
 *
 * @param a - the first vector.
 * @param b - the second vector.
 * @returns the cosine similarity, or `0` when either vector is empty or they share no terms.
 */
function cosine(a: Map<string, number>, b: Map<string, number>): number {
    let dot = 0;
    for (const [term, weight] of a) {
        const other = b.get(term);
        if (other !== undefined) {
            dot += weight * other;
        }
    }
    if (dot === 0) {
        return 0;
    }
    const magnitude = (vector: Map<string, number>): number =>
        Math.sqrt([...vector.values()].reduce((sum, weight) => sum + weight * weight, 0));
    const denominator = magnitude(a) * magnitude(b);
    return denominator === 0 ? 0 : dot / denominator;
}

/**
 * Ranks the posts most similar to `current` by weighted-term cosine similarity.
 *
 * The current post is excluded, posts sharing no significant terms (score `0`) are dropped,
 * results are ordered by score descending and then by `date` descending (newest first) as a
 * tie-break, and at most `limit` posts are returned.
 *
 * @param current - the post to find neighbours for.
 * @param all - the full set of posts to rank (typically `Blog.getAllPosts()`).
 * @param limit - the maximum number of similar posts to return. Defaults to `3`.
 * @returns the closest posts' metadata; empty when `current` has no significant terms or
 *   nothing else overlaps.
 */
export function similarPosts(current: PostMeta, all: PostMeta[], limit: number = 3): PostMeta[] {
    // ponytail: raw TF cosine; add idf across the corpus if ranking feels off
    const currentVector = vectorFor(current);
    if (currentVector.size === 0) {
        return [];
    }
    return all
        .filter((post) => post.slug !== current.slug)
        .map((post) => ({ post, score: cosine(currentVector, vectorFor(post)) }))
        .filter((scored) => scored.score > 0)
        .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.post.date < b.post.date ? 1 : -1))
        .slice(0, Math.max(0, limit))
        .map((scored) => scored.post);
}
