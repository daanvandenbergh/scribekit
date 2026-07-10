/**
 * Pure, DOM-free helpers shared by the docs navigation components (`DocsTabs`, `DocsSidebar`,
 * `DocsLanguagePicker`): which tab a path belongs to, a tab's first page, and the same page's URL in
 * another locale. Kept out of the components so the derivation is unit-testable and identical
 * everywhere (the tab bar, the left rail, and the language switcher).
 */

import { localePath, normalizeBasePath } from "../../../shared/locales.js";
import type { NavTab, NavTree } from "../../../docs/types.js";

/**
 * The id of the tab whose pages include `path`, or `undefined` when no item matches (e.g. the docs
 * index, or a hidden page not in the tree). Matches against each item's resolved `href`.
 *
 * @param nav - the navigation tree.
 * @param path - the current page's URL path (typically `usePathname()`).
 * @returns the owning tab id, or `undefined`.
 */
export function tabIdForPath(nav: NavTree, path: string | undefined): string | undefined {
    if (!path) {
        return undefined;
    }
    for (const tab of nav.tabs) {
        for (const group of tab.groups) {
            for (const item of group.items) {
                if (item.href === path) {
                    return tab.id;
                }
            }
        }
    }
    return undefined;
}

/**
 * The `href` of a tab's first page in reading order (its first group's first item), used as the
 * tab's own link target so clicking a tab navigates into that section.
 *
 * @param tab - the tab, or `undefined`.
 * @returns the first page's href, or `undefined` when the tab has no pages.
 */
export function firstHrefOf(tab: NavTab | undefined): string | undefined {
    for (const group of tab?.groups ?? []) {
        for (const item of group.items) {
            return item.href;
        }
    }
    return undefined;
}

/**
 * The URL of the current page in another locale: extracts the page slug from `pathname` (the part
 * after the section base, e.g. `greeting` from `/fr/docs/greeting` or `/docs/greeting`) and rebuilds
 * the path for `targetLang` via the shared {@link localePath}, so the language picker's links match
 * the rendered routes exactly. Falls back to the locale's index when the path carries no slug.
 *
 * @param pathname - the current URL path (e.g. from `usePathname()`).
 * @param targetLang - the locale to switch to.
 * @param opts.basePath - the docs section base (e.g. `/docs`); defaults to `/blog` via `normalizeBasePath`.
 * @param opts.defaultLocale - the locale served without a URL prefix (unless prefixed below).
 * @param opts.prefixDefaultLocale - when `true`, the default locale is prefixed too.
 * @returns the root-relative URL of the same page in `targetLang`.
 */
export function switchLocaleHref(
    pathname: string,
    targetLang: string,
    opts: { basePath?: string | undefined; defaultLocale: string; prefixDefaultLocale?: boolean | undefined },
): string {
    const base = normalizeBasePath(opts.basePath);
    const marker = `${base}/`;
    const index = pathname.indexOf(marker);
    const slug = index >= 0 ? pathname.slice(index + marker.length).split("/")[0] || undefined : undefined;
    return localePath({
        basePath: base,
        defaultLocale: opts.defaultLocale,
        prefixDefaultLocale: opts.prefixDefaultLocale,
        lang: targetLang,
        slug,
    });
}
