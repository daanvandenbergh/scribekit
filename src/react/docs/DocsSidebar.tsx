"use client";

import { useState, type ElementType, type ReactElement, type ReactNode } from "react";
import type { NavTree } from "../../docs/types.js";
import { docsLabels } from "../shared/i18n.js";
import { DocsIcon } from "./internal/icons.js";
import { tabIdForPath } from "./internal/nav.js";

/**
 * Props for {@link DocsSidebar}.
 */
export interface DocsSidebarProps {
    /** The navigation tree for the current language (from `docs.getNavTree(lang)`). */
    nav: NavTree;
    /**
     * The current page's URL path (e.g. from Next's `usePathname()`), matched against each item's
     * `href` to highlight the active page and pick which tab's groups to show. Omit on a page with no
     * active item (e.g. the index), where the first tab is shown.
     */
    activePath?: string | undefined;
    /** The render language, used to localize the built-in nav label. */
    lang?: string | undefined;
    /** Element used for nav links. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** Accessible label for the `<nav>` and the mobile toggle text. Defaults to the `lang` translation of "Documentation". */
    label?: string | undefined;
    /**
     * Optional override for how a page's `icon` name is rendered. Receives the front-matter `icon`
     * value (or `undefined`) and returns the icon node. Defaults to the built-in icon set.
     */
    renderIcon?: ((name: string | undefined) => ReactNode) | undefined;
}

/**
 * The docs left navigation: the ordered groups of pages for the active tab (the tab that owns the
 * current page, from `activePath`), with the active page highlighted. The top-level tab switcher is
 * {@link import("./DocsTabs.js").DocsTabs} and search is the ⌘K palette owned by
 * {@link import("./DocsSearchProvider.js").DocsSearchProvider}; navigating to a page in another tab
 * swaps these groups automatically.
 *
 * A client component (the mobile collapse needs state). It receives the already-computed, serialisable
 * `NavTree` from a server component; links use your `linkComponent` for client-side navigation. On
 * viewports at/under the layout breakpoint the groups collapse behind a toggle.
 *
 * @param props - see {@link DocsSidebarProps}.
 * @returns the sidebar `<aside>`.
 */
export function DocsSidebar({
    nav,
    activePath,
    lang,
    linkComponent: Link = "a",
    label,
    renderIcon,
}: DocsSidebarProps): ReactElement {
    const navLabel = label ?? docsLabels(lang ?? "en").title;
    const icon = (name: string | undefined): ReactNode => (renderIcon ? renderIcon(name) : <DocsIcon name={name} />);

    // Which tab's groups to show: the one that owns the current page (else the first tab). Derived,
    // not stateful - navigating to another tab's page changes activePath and re-derives this.
    const activeTabId = tabIdForPath(nav, activePath) ?? nav.tabs[0]?.id ?? "";
    const activeTab = nav.tabs.find((tab) => tab.id === activeTabId) ?? nav.tabs[0];

    const [navOpen, setNavOpen] = useState(false);

    return (
        <aside className="scribekit-docs-nav">
            <div className="scribekit-docs-nav-inner">
                <button
                    type="button"
                    className="scribekit-docs-nav-toggle"
                    aria-expanded={navOpen}
                    aria-controls="scribekit-docs-nav-body"
                    onClick={() => setNavOpen((open) => !open)}
                >
                    {navLabel}
                </button>
                <nav
                    id="scribekit-docs-nav-body"
                    aria-label={navLabel}
                    className={navOpen ? "scribekit-docs-groups is-open" : "scribekit-docs-groups"}
                >
                    {activeTab?.groups.map((group) => (
                        <div key={group.id || "__ungrouped"} className="scribekit-docs-group">
                            {group.label ? <div className="scribekit-docs-group-label">{group.label}</div> : null}
                            <ul className="scribekit-docs-group-items">
                                {group.items.map((item) => {
                                    const active = item.href === activePath;
                                    return (
                                        <li key={item.slug}>
                                            <Link
                                                href={item.href}
                                                className={active ? "scribekit-docs-navitem is-active" : "scribekit-docs-navitem"}
                                                aria-current={active ? "page" : undefined}
                                                onClick={() => setNavOpen(false)}
                                            >
                                                <span className="scribekit-docs-navitem-icon">{icon(item.icon)}</span>
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
