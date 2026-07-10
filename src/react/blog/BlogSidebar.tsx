"use client";

import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import type { TocEntry } from "../../blog/types.js";

/**
 * Props for {@link BlogSidebar}.
 */
export interface BlogSidebarProps {
    /** The post's heading minimap; when empty, no table of contents is rendered. */
    toc: TocEntry[];
    /** Heading shown above the minimap, doubling as the mobile collapse toggle. Defaults to `"On this page"`. */
    title?: string;
    /** Heading shown above the similar-post cards. Defaults to `"Similar pages"`. */
    similarTitle?: string;
    /**
     * The "similar posts" cards, pre-rendered by the (server) `BlogPage` so they can use its
     * `linkComponent`/`imgComponent`; omitted when there are no similar posts.
     */
    similar?: ReactNode;
}

/**
 * The `BlogPage` sidebar: a docs-style heading minimap with jump links and an active-section
 * highlight that tracks scrolling, plus a "Similar pages" slot.
 *
 * This is a client component (the scroll-spy and mobile collapse need browser APIs and state).
 * It receives already-computed, serialisable data from the server `BlogPage`; the similar-post
 * cards arrive as a pre-rendered `similar` node so they keep the page's link/image components.
 * On viewports at/under the layout breakpoint the minimap collapses behind the heading toggle;
 * on wider viewports the stylesheet keeps it open and sticky.
 *
 * @param props - see {@link BlogSidebarProps}.
 * @returns the sidebar `<aside>`.
 */
export function BlogSidebar({
    toc,
    title = "On this page",
    similarTitle = "Similar pages",
    similar,
}: BlogSidebarProps): ReactElement {
    const [open, setOpen] = useState(false);
    // Default to the first heading so the minimap always shows one active item - even before any
    // scroll and on pages too short to scroll. The observer below only ever moves the highlight,
    // it never clears it, so this stays the floor.
    const [activeId, setActiveId] = useState<string>(() => toc[0]?.id ?? "");

    useEffect(() => {
        if (toc.length === 0) {
            return;
        }
        // When the post (and its headings) change, keep a valid selection, falling back to the first.
        setActiveId((current) => (toc.some((entry) => entry.id === current) ? current : (toc[0]?.id ?? "")));
        const headings = toc
            .map((entry) => document.getElementById(entry.id))
            .filter((element): element is HTMLElement => element !== null);
        if (headings.length === 0) {
            return;
        }
        // ponytail: IntersectionObserver, not scroll-math. The bottom margin shrinks the
        // viewport to a band near the top so the "current" heading is whichever last crossed it.
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: "0px 0px -70% 0px", threshold: 0 },
        );
        for (const heading of headings) {
            observer.observe(heading);
        }
        return () => observer.disconnect();
    }, [toc]);

    return (
        <aside className="scribekit-sidebar">
            <div className="scribekit-sidebar-top">
                <button
                    type="button"
                    className="scribekit-sidebar-toggle"
                    aria-expanded={open}
                    aria-controls="scribekit-sidebar-body"
                    onClick={() => setOpen((value) => !value)}
                >
                    {title}
                </button>
            </div>
            <div id="scribekit-sidebar-body" className={open ? "scribekit-sidebar-body is-open" : "scribekit-sidebar-body"}>
                {toc.length > 0 ? (
                    <nav className="scribekit-toc" aria-label={title}>
                        <ul>
                            {toc.map((entry) => (
                                <li key={entry.id} className={entry.depth === 3 ? "scribekit-toc-sub" : undefined}>
                                    <a
                                        href={`#${entry.id}`}
                                        className={entry.id === activeId ? "scribekit-toc-link is-active" : "scribekit-toc-link"}
                                    >
                                        {entry.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ) : null}
                {similar ? (
                    <div className="scribekit-similar">
                        <p className="scribekit-sidebar-heading">{similarTitle}</p>
                        {similar}
                    </div>
                ) : null}
            </div>
        </aside>
    );
}
