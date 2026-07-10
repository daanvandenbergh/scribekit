/**
 * Sidebar / section icons for the docs components. `DocMeta.icon` is a free-form name the backend
 * passes through untouched (it "never renders an icon itself"); this is the frontend map that turns
 * that name into an inline SVG. Unknown names (and pages with no `icon`) fall back to a neutral
 * document glyph, so the nav always renders something sensible.
 *
 * All glyphs are 24x24 stroked paths drawn with `currentColor`, so they inherit the nav item's
 * colour (muted by default, the accent when active). Consumers who want their own set can pass a
 * `renderIcon` prop to `DocsSidebar`/`DocsIndex` instead of relying on this map.
 *
 * Kept free of any `next`/`server-only`/`"use client"` import so both the server components
 * (`DocsIndex`) and the client one (`DocsSidebar`) can render it.
 */

import type { ReactElement, ReactNode } from "react";

/**
 * The built-in icon paths, keyed by front-matter `icon` name. Each entry is the inner markup of a
 * `0 0 24 24` viewBox (one or more `<path>`/`<circle>`/`<rect>` `d`-style children). Add or override
 * names here, or supply a `renderIcon` prop to bypass the map entirely.
 */
const ICON_PATHS: Record<string, ReactNode> = {
    book: <path d="M6 3h8a2 2 0 012 2v14a1 1 0 00-1-1H6a2 2 0 00-2 2V5a2 2 0 012-2zM8 8h6M8 11h4" />,
    rocket: <path d="M13 3L5 13h5l-1 8 8-11h-5l1-7z" />,
    workflow: (
        <>
            <circle cx="6" cy="18" r="2" />
            <circle cx="18" cy="6" r="2" />
            <path d="M8 18h6a4 4 0 004-4V8" />
        </>
    ),
    phone: <path d="M4 5.5h3l1.4 4.5-1.8 1.3a11 11 0 005.1 5.1l1.3-1.8 4.5 1.4v3a1.5 1.5 0 01-1.6 1.5A15 15 0 013 7.1 1.5 1.5 0 014.5 5.5z" />,
    voice: <path d="M4 9v6M8 5v14M12 8v8M16 6v12M20 10v4" />,
    calendar: (
        <>
            <rect x="4" y="5" width="16" height="16" rx="2.5" />
            <path d="M8 3v4M16 3v4M4 10h16" />
        </>
    ),
    globe: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
        </>
    ),
    plug: <path d="M9.5 14.5l-2.5 2.5a3.5 3.5 0 01-5-5L4.5 9.5M14.5 9.5L17 7a3.5 3.5 0 015 5l-2.5 2.5M8.5 15.5l7-7" />,
    link: <path d="M9.5 14.5l-2.5 2.5a3.5 3.5 0 01-5-5L4.5 9.5M14.5 9.5L17 7a3.5 3.5 0 015 5l-2.5 2.5M8.5 15.5l7-7" />,
    mail: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M4 7.5l8 5.5 8-5.5" />
        </>
    ),
    grid: (
        <>
            <rect x="4" y="4" width="7" height="7" rx="1.5" />
            <rect x="13" y="4" width="7" height="7" rx="1.5" />
            <rect x="4" y="13" width="7" height="7" rx="1.5" />
            <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </>
    ),
    list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
    check: (
        <>
            <rect x="4" y="5" width="16" height="16" rx="2.5" />
            <path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4" />
        </>
    ),
    gear: (
        <>
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2v2.2M12 19.8V22M22 12h-2.2M4.2 12H2M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6M18.9 18.9l-1.6-1.6M6.7 6.7L5.1 5.1" />
        </>
    ),
    code: <path d="M8 6l-5 6 5 6M16 6l5 6-5 6" />,
    sparkles: <path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7z" />,
    shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />,
    document: (
        <path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM13 3v5h5M9 13h6M9 16h4" />
    ),
};

/** The fallback glyph rendered for an unknown name or a page with no `icon` set. */
const DEFAULT_ICON = ICON_PATHS.document;

/**
 * Renders the built-in icon for a front-matter `icon` name as an inline SVG, falling back to a
 * neutral document glyph for an unknown or missing name.
 *
 * @param props.name - the front-matter `icon` value (or `undefined`).
 * @param props.size - the pixel width/height. Defaults to `16`.
 * @param props.className - optional class applied to the `<svg>`.
 * @returns the icon element.
 */
export function DocsIcon({ name, size = 16, className }: { name?: string | undefined; size?: number; className?: string }): ReactElement {
    // Own-property lookup only: a free-form `icon` like `toString`/`constructor` must not resolve
    // to an inherited `Object.prototype` member (a truthy function React would refuse to render).
    const inner = name && Object.prototype.hasOwnProperty.call(ICON_PATHS, name) ? ICON_PATHS[name] : DEFAULT_ICON;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
        >
            {inner}
        </svg>
    );
}
