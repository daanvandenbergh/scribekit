/**
 * Pure, framework-free navigation for the docs sidebar. Given the front-matter of every page in
 * one language, {@link buildNavTree} assembles the **tabs -> groups -> ordered pages** tree the
 * sidebar renders; {@link flattenNav} linearises it into reading order (for prev/next);
 * {@link adjacentFor} and {@link breadcrumbFor} derive a single page's prev/next and breadcrumb.
 *
 * This is the structural piece a blog does not need (a blog is a flat, date-sorted list). Kept
 * fs-free (no `node:fs`, no `next`/`react` import) so it is trivially unit-testable and can be
 * shared with the React components; the on-disk layout is walked by the `Docs` reader, which
 * feeds this the parsed metadata.
 */

import { localePath } from "../shared/locales.js";
import type { Adjacent, Breadcrumb, BreadcrumbSegment, DocMeta, NavConfigEntry, NavGroup, NavItem, NavTab, NavTree } from "./types.js";

/** URL/ordering inputs {@link buildNavTree} needs beyond the page metadata itself. */
export interface NavBuildOptions {
    /** The section base path (e.g. `/docs`), passed through to `localePath`. */
    basePath?: string | undefined;
    /** The default locale code (served unprefixed unless `prefixDefaultLocale`). */
    defaultLocale: string;
    /** When `true`, the default locale is URL-prefixed too. */
    prefixDefaultLocale?: boolean | undefined;
    /** Optional tab display order + labels. */
    tabs?: NavConfigEntry[] | undefined;
    /** Optional group display order + labels. */
    groups?: NavConfigEntry[] | undefined;
}

/** Sort value for an optional `order`: unset sorts last (after every explicitly-ordered page). */
function orderValue(order: number | undefined): number {
    return order ?? Number.POSITIVE_INFINITY;
}

/** The id of a config entry, whether it is a bare string or an `{ id, label }` pair. */
function entryId(entry: NavConfigEntry): string {
    return typeof entry === "string" ? entry : entry.id;
}

/**
 * The position of `id` in a `tabs`/`groups` config array, or `-1` when it is not listed (so
 * unconfigured tabs/groups sort after every configured one).
 *
 * @param entries - the config array, or `undefined` when none was provided.
 * @param id - the tab/group id to locate.
 * @returns the zero-based index, or `-1` when absent/unconfigured.
 */
function configIndex(entries: NavConfigEntry[] | undefined, id: string): number {
    if (!entries) {
        return -1;
    }
    return entries.findIndex((entry) => entryId(entry) === id);
}

/**
 * The display label a config array assigns to `id`, or `undefined` when the id is absent or the
 * entry is a bare string (in which case the caller falls back to the id itself).
 *
 * @param entries - the config array, or `undefined`.
 * @param id - the tab/group id.
 * @returns the configured label, or `undefined`.
 */
function configLabel(entries: NavConfigEntry[] | undefined, id: string): string | undefined {
    const entry = entries?.find((e) => entryId(e) === id);
    if (!entry || typeof entry === "string") {
        return undefined;
    }
    return entry.label;
}

/** A tab/group during assembly, tracking the tie-break keys stripped from the returned node. */
interface Ordered {
    /** Config position (`-1` -> sorts after configured entries). */
    configIndex: number;
    /** Minimum page `order` beneath this node (the fallback ordering when unconfigured). */
    minOrder: number;
    /** First-seen sequence, the final stable tie-break. */
    firstSeen: number;
}

/**
 * Comparator for two tabs or two groups: configured entries first (in config order), then by
 * minimum descendant `order`, then by first-seen. Deterministic for any input.
 *
 * @param a - the first node's ordering keys.
 * @param b - the second node's ordering keys.
 * @returns a negative/zero/positive sort result.
 */
function compareOrdered(a: Ordered, b: Ordered): number {
    const ai = a.configIndex < 0 ? Number.POSITIVE_INFINITY : a.configIndex;
    const bi = b.configIndex < 0 ? Number.POSITIVE_INFINITY : b.configIndex;
    if (ai !== bi) {
        return ai - bi;
    }
    if (a.minOrder !== b.minOrder) {
        return a.minOrder - b.minOrder;
    }
    return a.firstSeen - b.firstSeen;
}

/**
 * Builds a page's {@link NavItem} (title/label/icon/href), the leaf of the nav tree.
 *
 * @param meta - the page's front-matter.
 * @param opts - the URL-building options.
 * @returns the resolved nav item.
 */
function toNavItem(meta: DocMeta, opts: NavBuildOptions): NavItem {
    return {
        slug: meta.slug,
        title: meta.title,
        label: meta.label ?? meta.title,
        icon: meta.icon,
        href: localePath({
            basePath: opts.basePath,
            defaultLocale: opts.defaultLocale,
            prefixDefaultLocale: opts.prefixDefaultLocale,
            lang: meta.lang,
            slug: meta.slug,
        }),
        lang: meta.lang,
        tab: meta.tab,
        group: meta.group,
        order: meta.order,
    };
}

/** Compares two pages within a group: by `order` ascending, then alphabetically by title. */
function compareItems(a: NavItem, b: NavItem): number {
    const delta = orderValue(a.order) - orderValue(b.order);
    return delta !== 0 ? delta : a.title.localeCompare(b.title);
}

/**
 * Assembles the sidebar navigation tree for one language from its pages' front-matter.
 *
 * Pages are bucketed by `tab` (a single implicit `""` tab when none is set - `multiTab` is then
 * `false` so the frontend hides the tab bar) and then by `group` (a `""` bucket for ungrouped
 * pages). Tabs and groups are ordered by the `tabs`/`groups` config first, then by their pages'
 * minimum `order`, then first-seen; pages within a group are ordered by `order` then title.
 * `hidden` pages are excluded.
 *
 * @param metas - every (non-hidden and hidden) page's front-matter for one language; `hidden`
 *   pages are filtered out here.
 * @param opts - URL options plus the optional tab/group ordering config.
 * @returns the ordered {@link NavTree}.
 */
export function buildNavTree(metas: DocMeta[], opts: NavBuildOptions): NavTree {
    let sequence = 0;
    /** Tab id -> its groups (group id -> items), preserving first-seen insertion order. */
    const tabs = new Map<string, { firstSeen: number; groups: Map<string, { firstSeen: number; items: NavItem[] }> }>();

    for (const meta of metas) {
        if (meta.hidden) {
            continue;
        }
        const tabId = meta.tab ?? "";
        const groupId = meta.group ?? "";
        let tab = tabs.get(tabId);
        if (!tab) {
            tab = { firstSeen: sequence++, groups: new Map() };
            tabs.set(tabId, tab);
        }
        let group = tab.groups.get(groupId);
        if (!group) {
            group = { firstSeen: sequence++, items: [] };
            tab.groups.set(groupId, group);
        }
        group.items.push(toNavItem(meta, opts));
    }

    const navTabs: NavTab[] = [...tabs.entries()]
        .map(([tabId, tab]) => {
            const navGroups: (NavGroup & Ordered)[] = [...tab.groups.entries()].map(([groupId, group]) => {
                const items = group.items.slice().sort(compareItems);
                return {
                    id: groupId,
                    label: configLabel(opts.groups, groupId) ?? groupId,
                    items,
                    configIndex: configIndex(opts.groups, groupId),
                    minOrder: Math.min(...items.map((i) => orderValue(i.order))),
                    firstSeen: group.firstSeen,
                };
            });
            navGroups.sort(compareOrdered);
            return {
                id: tabId,
                label: configLabel(opts.tabs, tabId) ?? tabId,
                groups: navGroups.map(({ id, label, items }) => ({ id, label, items })),
                configIndex: configIndex(opts.tabs, tabId),
                minOrder: Math.min(...navGroups.map((g) => g.minOrder)),
                firstSeen: tab.firstSeen,
            } satisfies NavTab & Ordered;
        })
        .sort(compareOrdered)
        .map(({ id, label, groups }) => ({ id, label, groups }));

    return { tabs: navTabs, multiTab: navTabs.length > 1 };
}

/**
 * Linearises a nav tree into its reading order: every page, tabs then groups then items, in the
 * order the sidebar shows them. The basis for prev/next.
 *
 * @param tree - the navigation tree.
 * @returns the flattened list of nav items.
 */
export function flattenNav(tree: NavTree): NavItem[] {
    const items: NavItem[] = [];
    for (const tab of tree.tabs) {
        for (const group of tab.groups) {
            for (const item of group.items) {
                items.push(item);
            }
        }
    }
    return items;
}

/**
 * Finds the pages immediately before and after `slug` in the flattened reading order. Prev/next
 * cross group and tab boundaries (matching common docs UIs); either side is `undefined` at the
 * ends, and an unknown slug yields an empty result.
 *
 * @param slug - the current page slug.
 * @param flat - the flattened nav items (from {@link flattenNav}).
 * @returns the previous and next pages, if any.
 */
export function adjacentFor(slug: string, flat: NavItem[]): Adjacent {
    const index = flat.findIndex((item) => item.slug === slug);
    if (index < 0) {
        return {};
    }
    return {
        prev: index > 0 ? flat[index - 1] : undefined,
        next: index < flat.length - 1 ? flat[index + 1] : undefined,
    };
}

/**
 * Builds a page's breadcrumb (`[tab?, group?, page]`) from the nav tree. Empty tab/group ids
 * (the implicit tab / ungrouped bucket) contribute no segment.
 *
 * @param slug - the page slug.
 * @param tree - the navigation tree the page lives in.
 * @returns the breadcrumb, or `undefined` when the slug is not in the tree (e.g. a hidden page).
 */
export function breadcrumbFor(slug: string, tree: NavTree): Breadcrumb | undefined {
    for (const tab of tree.tabs) {
        for (const group of tab.groups) {
            for (const item of group.items) {
                if (item.slug !== slug) {
                    continue;
                }
                const tabLabel = tab.label || undefined;
                const groupLabel = group.label || undefined;
                const segments: BreadcrumbSegment[] = [];
                if (tabLabel) {
                    segments.push({ label: tabLabel });
                }
                if (groupLabel) {
                    segments.push({ label: groupLabel });
                }
                segments.push({ label: item.title });
                return { tab: tabLabel, group: groupLabel, title: item.title, segments };
            }
        }
    }
    return undefined;
}
