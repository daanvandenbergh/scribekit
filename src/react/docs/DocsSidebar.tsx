"use client";

import { useEffect, useState, type ElementType, type ReactElement, type ReactNode } from "react";
import type { NavTree } from "../../docs/types.js";
import { docsLabels } from "../shared/i18n.js";
import { DocsIcon } from "./internal/icons.js";
import { tabIdForPath } from "./internal/nav.js";
import { useDocsNavState } from "./internal/nav-state.js";

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
    /**
     * Extra content pinned below the nav groups - the drawer's footer. Meant for the chrome that
     * does not fit the top bar on a phone: a language picker, a theme toggle, a secondary link.
     *
     * It renders at EVERY width, so pass something that belongs in the sidebar on a desktop too, or
     * hide it there with your own class. The navbar is the tighter surface of the two: on a 390px
     * screen it carries a hamburger, a brand, a search and one CTA and little else, so a picker
     * given to `DocsNavbar.languagePicker` is usually the thing that has to move here.
     */
    footer?: ReactNode;
}

/**
 * The docs left navigation: the ordered groups of pages for the active tab (the tab that owns the
 * current page, from `activePath`), with the active page highlighted. The top-level tab switcher is
 * {@link import("./DocsTabs.js").DocsTabs} and search is the ⌘K palette owned by
 * {@link import("./DocsSearchProvider.js").DocsSearchProvider}; navigating to a page in another tab
 * swaps these groups automatically.
 *
 * A client component (the drawer needs state). It receives the already-computed, serialisable
 * `NavTree` from a server component; links use your `linkComponent` for client-side navigation.
 *
 * BELOW THE LAYOUT BREAKPOINT it becomes an off-canvas DRAWER opened by the hamburger in
 * {@link import("./DocsNavbar.js").DocsNavbar} - which is why it must sit under the same
 * {@link import("./DocsSearchProvider.js").DocsSearchProvider} as the navbar (it already wraps the
 * whole docs app, so this needs no wiring). Rendered WITHOUT that provider it falls back to its
 * original self-contained inline toggle, so a standalone consumer still has a way to reach the nav.
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
    footer,
}: DocsSidebarProps): ReactElement {
    const navLabel = label ?? docsLabels(lang ?? "en").title;
    const icon = (name: string | undefined): ReactNode => (renderIcon ? renderIcon(name) : <DocsIcon name={name} />);

    // Which tab's groups to show: the one that owns the current page (else the first tab). Derived,
    // not stateful - navigating to another tab's page changes activePath and re-derives this.
    const activeTabId = tabIdForPath(nav, activePath) ?? nav.tabs[0]?.id ?? "";
    const activeTab = nav.tabs.find((tab) => tab.id === activeTabId) ?? nav.tabs[0];

    // DRAWER vs INLINE. With a provider above (i.e. inside a `DocsSearchProvider`) the open state is
    // shared, the hamburger lives in the navbar, and this becomes an overlay drawer - one bar of
    // chrome on a phone instead of two, and the article is never pushed down the page. Standing
    // alone there is no provider and no hamburger anywhere, so it keeps its original self-contained
    // toggle: removing that would leave such a consumer with no way to reach the nav on a phone.
    const shared = useDocsNavState();
    const drawer = shared !== null;
    const [localOpen, setLocalOpen] = useState(false);
    const navOpen = shared ? shared.open : localOpen;
    const setNavOpen = (open: boolean): void => (shared ? shared.setOpen(open) : setLocalOpen(open));

    // Escape closes the drawer, as it must for anything overlaying the page. Inline mode is not an
    // overlay and nothing is covered, so it is left alone.
    useEffect(() => {
        if (!drawer || !navOpen) return;
        const onKey = (event: KeyboardEvent): void => {
            if (event.key === "Escape") setNavOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    // The page behind an open drawer must not scroll under the reader's thumb.
    useEffect(() => {
        if (!drawer || !navOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [drawer, navOpen]);

    return (
        <>
            {/* Dims the page and gives a tap-anywhere-to-dismiss target. Drawer mode only. */}
            {drawer && navOpen ? (
                <div
                    className="scribekit-docs-nav-backdrop"
                    aria-hidden="true"
                    onClick={() => setNavOpen(false)}
                />
            ) : null}
            <aside
                className={[
                    "scribekit-docs-nav",
                    drawer ? "is-drawer" : "",
                    navOpen ? "is-open" : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className="scribekit-docs-nav-inner">
                    {drawer ? (
                        <div className="scribekit-docs-nav-head">
                            <span className="scribekit-docs-nav-head-title">{navLabel}</span>
                            <button
                                type="button"
                                className="scribekit-docs-nav-close"
                                aria-label={docsLabels(lang ?? "en").closeNav}
                                onClick={() => setNavOpen(false)}
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                    <path d="M4 4l8 8M12 4l-8 8" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="scribekit-docs-nav-toggle"
                            aria-expanded={navOpen}
                            aria-controls="scribekit-docs-nav-body"
                            onClick={() => setNavOpen(!navOpen)}
                        >
                            {navLabel}
                        </button>
                    )}
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
                    {footer ? <div className="scribekit-docs-nav-foot">{footer}</div> : null}
                </div>
            </aside>
        </>
    );
}
