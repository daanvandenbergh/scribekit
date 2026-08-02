/**
 * The docs index topic filter's matching rule, kept apart from the component that renders it.
 *
 * It lives here because it is the only part of `DocsTopicGrid` with a decision in it - which pages
 * a query should surface - and a pure function is testable in the package's plain Node test
 * environment, with no DOM and no Testing Library. The component keeps the state and the markup.
 */

import type { DocsTopicPage } from "../DocsTopicGrid.js";

/**
 * Normalises a raw filter input into the needle the matcher compares against: trimmed, lowercased.
 *
 * Returns an empty string for a whitespace-only input, which callers treat as "no query" rather
 * than "a query matching nothing" - a reader who has typed two spaces has not asked for anything,
 * and showing them "0 pages match" reads as a broken corpus.
 *
 * @param raw - whatever is currently in the filter box.
 * @returns the comparison needle, or `""` when there is effectively no query.
 */
export function normalizeQuery(raw: string): string {
    return raw.trim().toLowerCase();
}

/**
 * Whether one page should be surfaced for a query.
 *
 * Matches on the page's own title and description AND on the title of the topic it is filed under,
 * so a search for "billing" finds an invoices page whose own words never say "billing". Substring,
 * not prefix: a reader filtering a docs corpus is usually recalling a word from the middle of a
 * title.
 *
 * @param page - the page to test.
 * @param topicTitle - the title of the topic the page belongs to.
 * @param needle - a needle from {@link normalizeQuery}; an empty needle never matches, because the
 *   caller is expected to show the topic grid rather than every page as a "result".
 * @returns `true` when the page should appear in the result list.
 */
export function pageMatchesQuery(page: DocsTopicPage, topicTitle: string, needle: string): boolean {
    if (!needle) {
        return false;
    }
    return `${page.title} ${page.description ?? ""} ${topicTitle}`.toLowerCase().includes(needle);
}
