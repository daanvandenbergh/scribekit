"use client";

import { Fragment, type CSSProperties, type ElementType, type ReactElement, type ReactNode } from "react";
import { docsLabels } from "../shared/i18n.js";
import { DocsSearchButton } from "./DocsSearchButton.js";
import { useDocsNavState } from "./internal/nav-state.js";

/**
 * Props for {@link DocsNavbar}.
 */
export interface DocsNavbarProps {
    /**
     * The brand logo (an `<svg>`, an `<img>`, or any node), shown at the far left. Sized to
     * {@link DocsNavbarProps.logoSize} by the wrapper - an `<svg>`/`<img>` scales to that height.
     * Omit for a text-only brand.
     */
    logo?: ReactNode;
    /** Logo height in pixels. Defaults to `22`. */
    logoSize?: number;
    /** Brand name shown beside the logo. Omit to show only the logo (and/or the docs pill). */
    brandName?: ReactNode;
    /** The little pill beside the brand (the design's "Docs" tag). Defaults to `"Docs"`; pass `null`/`""` to hide it. */
    docsText?: ReactNode;
    /** Where the logo/brand links. Defaults to `"/"`. */
    homeHref?: string;
    /** Element used for the brand link. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** The render language, used to localize the search placeholder. */
    lang?: string;
    /** Whether to render the centered ⌘K search button. Defaults to `true`. */
    showSearch?: boolean;
    /** Placeholder for the search button. Defaults to the `lang` translation. */
    searchPlaceholder?: string;
    /**
     * The right-hand actions - the part most sites customize (auth, a theme toggle, external links,
     * a "Dashboard" button, ...). A list of nodes, laid out in a row like the design's top-right
     * section. Use {@link import("./DocsNavbarButton.js").DocsNavbarButton} for buttons that match
     * the design (`link` / `primary` / `secondary` variants), or pass your own nodes.
     */
    actions?: ReactNode[];
    /**
     * The language switcher, shown before the actions. Pass
     * {@link import("./DocsLanguagePicker.js").DocsLanguagePicker} (it auto-hides for single-locale
     * docs) or your own component to override it entirely.
     */
    languagePicker?: ReactNode;
    /**
     * Whether to show the hamburger that opens the {@link import("./DocsSidebar.js").DocsSidebar}
     * drawer below the layout breakpoint. Defaults to `true`, and only ever renders inside a
     * {@link import("./DocsSearchProvider.js").DocsSearchProvider} (the drawer state lives there).
     *
     * Pass `false` for the rare docs site that renders this navbar with NO sidebar, where the button
     * would open nothing.
     */
    showNavToggle?: boolean | undefined;
}

/**
 * The docs top bar, mirroring the design's header: the brand (logo at `logoSize`, an optional name,
 * and the little "Docs" pill) at the left, a centered ⌘K search button, and a right-hand row of
 * `actions` you fill with your own buttons/links. The search button opens the shared command palette,
 * so `DocsNavbar` must sit inside a {@link import("./DocsSearchProvider.js").DocsSearchProvider}.
 *
 * A client component (the search button drives the palette). Entirely optional - render your own
 * navbar instead and, if you want the palette, add a {@link import("./DocsSearchButton.js").DocsSearchButton}
 * (or call `useDocsSearch().open()`) from it.
 *
 * @param props - see {@link DocsNavbarProps}.
 * @returns the top-bar `<header>`.
 */
export function DocsNavbar({
    logo,
    logoSize = 22,
    brandName,
    docsText = "Docs",
    homeHref = "/",
    linkComponent: Link = "a",
    lang,
    showSearch = true,
    searchPlaceholder,
    actions,
    languagePicker,
    showNavToggle = true,
}: DocsNavbarProps): ReactElement {
    const logoStyle: CSSProperties = { height: `${logoSize}px` };
    // The nav drawer's button lives HERE, not in the sidebar, so a phone spends one bar on chrome
    // instead of two. The drawer state comes from the provider, so no provider means no button. CSS
    // hides it above the layout breakpoint, where the sidebar is a permanent column.
    const navState = useDocsNavState();
    const withNavToggle = navState !== null && showNavToggle;
    const labels = docsLabels(lang ?? "en");
    return (
        <header className="scribekit-docs-navbar">
            <Link href={homeHref} className="scribekit-docs-navbar-brand">
                {logo ? (
                    <span className="scribekit-docs-navbar-logo" style={logoStyle}>
                        {logo}
                    </span>
                ) : null}
                {brandName ? <span className="scribekit-docs-navbar-name">{brandName}</span> : null}
                {docsText ? <span className="scribekit-docs-navbar-pill">{docsText}</span> : null}
            </Link>
            {showSearch ? (
                <div className="scribekit-docs-navbar-search">
                    <DocsSearchButton lang={lang} placeholder={searchPlaceholder} />
                </div>
            ) : (
                <div className="scribekit-docs-navbar-spacer" aria-hidden="true" />
            )}
            {languagePicker || (actions && actions.length > 0) ? (
                <div className="scribekit-docs-navbar-right">
                    {languagePicker}
                    {actions?.map((action, index) => (
                        <Fragment key={index}>{action}</Fragment>
                    ))}
                </div>
            ) : null}
            {/*
              * LAST in the row, so the phone bar reads brand -> search -> hamburger, with the menu
              * button under the thumb at the outside edge. It is `display: none` above the layout
              * breakpoint, so its position never affects the desktop bar.
              */}
            {withNavToggle ? (
                <button
                    type="button"
                    className="scribekit-docs-navbar-burger"
                    aria-label={navState.open ? labels.closeNav : labels.openNav}
                    aria-expanded={navState.open}
                    aria-controls="scribekit-docs-nav-body"
                    onClick={() => navState.setOpen(!navState.open)}
                >
                    <span className="scribekit-docs-burger" aria-hidden="true">
                        <span className="scribekit-docs-burger-bar" />
                        <span className="scribekit-docs-burger-bar" />
                        <span className="scribekit-docs-burger-bar" />
                    </span>
                </button>
            ) : null}
        </header>
    );
}
