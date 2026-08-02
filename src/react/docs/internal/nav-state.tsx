"use client";

import { createContext, useContext, useMemo, useState, type ReactElement, type ReactNode } from "react";

/**
 * The open/closed state of the docs nav DRAWER, shared between the two components that need it.
 *
 * It exists because the button and the panel live in different subtrees: the hamburger belongs in
 * `DocsNavbar` (so a phone spends ONE bar on chrome instead of two) while the panel it opens is
 * `DocsSidebar`, rendered as a sibling further down the page. Without a shared value the navbar
 * would have to reach across the tree, or the toggle would have to stay inside the sidebar - which
 * is what it used to do, and what put a second 72px bar above every docs page on a phone.
 *
 * Whether the hamburger appears is a PROP on `DocsNavbar` (`showNavToggle`), not something detected
 * from a mounted sidebar. Detection would have to happen in an effect, and an effect does not run
 * during server rendering - so the button would be absent from the served HTML and pop in after
 * hydration, on every docs page load. A default-on prop renders it right the first time.
 */
export interface DocsNavStateValue {
    /** Whether the nav drawer is currently open. */
    open: boolean;
    /** Opens or closes the drawer. */
    setOpen: (open: boolean) => void;
}

const DocsNavStateContext = createContext<DocsNavStateValue | null>(null);

/**
 * Reads the shared docs-nav state, or `null` when there is no {@link DocsNavStateProvider} above.
 *
 * The null case is load-bearing rather than defensive: it is how both components decide which
 * behaviour to use. With a provider the sidebar is a drawer opened from the navbar; without one it
 * keeps its original self-contained inline toggle, so a consumer rendering `DocsSidebar` on its own
 * is unaffected by any of this.
 *
 * @returns the shared state, or `null` outside a provider.
 */
export function useDocsNavState(): DocsNavStateValue | null {
    return useContext(DocsNavStateContext);
}

/**
 * Provides {@link DocsNavStateValue} to a docs subtree. Rendered for you by
 * {@link import("../DocsSearchProvider.js").DocsSearchProvider}, which already wraps the whole docs
 * app - so consumers get the drawer without adding anything.
 *
 * @param props.children - the docs subtree.
 * @returns the provider element.
 */
export function DocsNavStateProvider({ children }: { children: ReactNode }): ReactElement {
    const [open, setOpen] = useState(false);
    const value = useMemo(() => ({ open, setOpen }), [open]);

    return <DocsNavStateContext.Provider value={value}>{children}</DocsNavStateContext.Provider>;
}
