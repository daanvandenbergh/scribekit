"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import type { TocEntry } from "../../docs/types.js";

/**
 * Props for {@link DocsToc}.
 */
export interface DocsTocProps {
    /** The page's heading minimap (`docs.tableOfContents(doc)`); the component renders nothing when empty. */
    toc: TocEntry[];
    /** Heading shown above the minimap. Defaults to `"On this page"`. */
    title?: string;
}

/**
 * The docs page's right-hand "On this page" minimap: the `##`/`###` headings as jump links, with a
 * blue indicator that slides to the active section as the reader scrolls (a scroll-spy). Mirrors the
 * design's right rail - a sticky column, no collapse toggle. Renders nothing when the page has no
 * headings.
 *
 * A client component (the scroll-spy and the sliding indicator need browser APIs). It receives the
 * already-computed, serialisable `toc` from the server `DocsPage`. For its jump links to resolve,
 * `DocsPage` injects matching anchor ids into the body's headings.
 *
 * @param props - see {@link DocsTocProps}.
 * @returns the minimap `<aside>`, or `null` when there are no headings.
 */
export function DocsToc({ toc, title = "On this page" }: DocsTocProps): ReactElement | null {
    // Default to the first heading so the minimap always shows one active item, even before any
    // scroll. The observer below only ever moves the highlight, so this stays the floor.
    const [activeId, setActiveId] = useState<string>(() => toc[0]?.id ?? "");
    const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
    const [indicator, setIndicator] = useState<{ top: number; height: number; visible: boolean }>({ top: 0, height: 0, visible: false });

    // Scroll-spy: the active heading is whichever last crossed a band near the top of the viewport.
    useEffect(() => {
        if (toc.length === 0) {
            return;
        }
        setActiveId((current) => (toc.some((entry) => entry.id === current) ? current : (toc[0]?.id ?? "")));
        const headings = toc
            .map((entry) => document.getElementById(entry.id))
            .filter((element): element is HTMLElement => element !== null);
        if (headings.length === 0) {
            return;
        }
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

    // Slide the indicator to the active link.
    useEffect(() => {
        const el = linkRefs.current[activeId];
        if (el) {
            setIndicator({ top: el.offsetTop, height: el.offsetHeight, visible: true });
        }
    }, [activeId, toc]);

    if (toc.length === 0) {
        return null;
    }

    return (
        <aside className="scribekit-docs-toc">
            <div className="scribekit-docs-toc-inner">
                <div className="scribekit-docs-toc-title">{title}</div>
                <nav className="scribekit-docs-toc-list" aria-label={title}>
                    <span
                        className="scribekit-docs-toc-indicator"
                        style={{ transform: `translateY(${indicator.top}px)`, height: `${indicator.height}px`, opacity: indicator.visible ? 1 : 0 }}
                        aria-hidden="true"
                    />
                    {toc.map((entry) => (
                        <a
                            key={entry.id}
                            ref={(el) => {
                                linkRefs.current[entry.id] = el;
                            }}
                            href={`#${entry.id}`}
                            className={
                                entry.id === activeId
                                    ? `scribekit-docs-toc-link is-active${entry.depth === 3 ? " scribekit-docs-toc-sub" : ""}`
                                    : `scribekit-docs-toc-link${entry.depth === 3 ? " scribekit-docs-toc-sub" : ""}`
                            }
                            aria-current={entry.id === activeId ? "location" : undefined}
                        >
                            {entry.text}
                        </a>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
