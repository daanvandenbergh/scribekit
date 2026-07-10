"use client";

import { useEffect, useRef, useState, type ElementType, type ReactElement } from "react";
import type { NavTree } from "../../docs/types.js";
import { docsLabels } from "../shared/i18n.js";
import { firstHrefOf, tabIdForPath } from "./internal/nav.js";

/**
 * Props for {@link DocsTabs}.
 */
export interface DocsTabsProps {
    /** The navigation tree for the current language (from `docs.getNavTree(lang)`). */
    nav: NavTree;
    /** The current page's URL path (e.g. from `usePathname()`), used to highlight the owning tab. */
    activePath?: string | undefined;
    /** The render language, used to localize the fallback tab label / aria label. */
    lang?: string | undefined;
    /** Element used for the tab links. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** Accessible label for the tab bar. Defaults to the `lang` translation of "Documentation". */
    label?: string | undefined;
}

/**
 * The docs top tab bar: the `getNavTree` tabs rendered as a full-width row of underline tabs with an
 * animated gradient indicator sliding under the active one, mirroring the design's secondary nav.
 * Each tab links to its section's first page, so clicking one navigates there; the active tab is the
 * one that owns the current page (from `activePath`). Renders nothing for a single-tab tree.
 *
 * A client component (it measures the active tab to place the sliding indicator). Place it at the
 * top of your docs shell, above the sidebar/content row.
 *
 * @param props - see {@link DocsTabsProps}.
 * @returns the tab bar, or `null` when there is only one tab.
 */
export function DocsTabs({ nav, activePath, lang, linkComponent: Link = "a", label }: DocsTabsProps): ReactElement | null {
    const tabLabel = label ?? docsLabels(lang ?? "en").title;
    const activeId = tabIdForPath(nav, activePath) ?? nav.tabs[0]?.id ?? "";
    const tabRefs = useRef<(HTMLElement | null)[]>([]);
    const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

    // Slide the indicator under the active tab; re-measure when the active tab or the layout changes.
    useEffect(() => {
        const place = (): void => {
            const index = nav.tabs.findIndex((tab) => tab.id === activeId);
            const el = tabRefs.current[index];
            if (el) {
                setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
            }
        };
        place();
        window.addEventListener("resize", place);
        return () => window.removeEventListener("resize", place);
    }, [activeId, nav]);

    if (!nav.multiTab) {
        return null;
    }

    return (
        <nav className="scribekit-docs-tabbar" aria-label={tabLabel}>
            <div className="scribekit-docs-tabbar-inner">
                {nav.tabs.map((tab, index) => {
                    const active = tab.id === activeId;
                    const href = firstHrefOf(tab);
                    return (
                        <Link
                            key={tab.id || `__tab-${index}`}
                            ref={(el: HTMLElement | null) => {
                                tabRefs.current[index] = el;
                            }}
                            href={href ?? "#"}
                            className={active ? "scribekit-docs-tab is-active" : "scribekit-docs-tab"}
                            aria-current={active ? "page" : undefined}
                        >
                            {tab.label || tabLabel}
                        </Link>
                    );
                })}
                <span
                    className="scribekit-docs-tab-indicator"
                    style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
                    aria-hidden="true"
                />
            </div>
        </nav>
    );
}
