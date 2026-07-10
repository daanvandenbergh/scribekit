/**
 * Pure, DOM-free helper backing the `DocsSidebar` command palette's fuzzy search. Kept out of the
 * client component so the (untestable-via-static-markup) search logic can be unit-tested directly.
 * Fuse.js runs in Node too, so this is a plain function call.
 */

import Fuse from "fuse.js";
import type { NavItem } from "../../../docs/types.js";

/** Fields the fuzzy search matches against, in rough order of relevance. */
const SEARCH_KEYS: (keyof NavItem)[] = ["title", "label", "group", "tab"];

/**
 * Fuzzily filters nav items by a free-text query over their title, sidebar label, group, and tab.
 * An empty or whitespace-only query returns the items unchanged (sidebar reading order preserved);
 * otherwise matches are returned in Fuse's relevance order.
 *
 * @param items - the flattened nav items to search (typically `flattenNav(navTree)`).
 * @param query - the reader's search text.
 * @returns the matching items (all items when the query is blank).
 */
export function searchNav(items: NavItem[], query: string): NavItem[] {
    if (query.trim() === "") {
        return items;
    }
    const fuse = new Fuse(items, {
        keys: SEARCH_KEYS as string[],
        threshold: 0.4,
        ignoreLocation: true,
    });
    return fuse.search(query).map((result) => result.item);
}
