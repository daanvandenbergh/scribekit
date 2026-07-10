"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ElementType,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode,
} from "react";
import { flattenNav } from "../../docs/navigation.js";
import type { NavItem, NavTree } from "../../docs/types.js";
import { docsLabels } from "../shared/i18n.js";
import { DocsIcon } from "./internal/icons.js";
import { searchNav } from "./internal/search.js";

/** Id wiring the combobox input to its result listbox. */
const LISTBOX_ID = "scribekit-docs-palette-listbox";

/** What {@link useDocsSearch} exposes to descendants: a function that opens the command palette. */
interface DocsSearchContextValue {
    /** Opens the ⌘K command palette. A no-op outside a {@link DocsSearchProvider}. */
    open: () => void;
}

const DocsSearchContext = createContext<DocsSearchContextValue>({ open: () => {} });

/**
 * Reads the docs search context: the `open` callback that raises the shared ⌘K command palette.
 * Any descendant of {@link DocsSearchProvider} (a `DocsNavbar` search button, your own button) can
 * call it. Outside a provider it returns a no-op `open`, so a stray button never throws.
 *
 * @returns the `{ open }` context value.
 */
export function useDocsSearch(): DocsSearchContextValue {
    return useContext(DocsSearchContext);
}

/**
 * Props for {@link DocsSearchProvider}.
 */
export interface DocsSearchProviderProps {
    /** The navigation tree the palette fuzzy-searches (from `docs.getNavTree(lang)`). */
    nav: NavTree;
    /** The render language, used to localize the built-in labels. */
    lang?: string | undefined;
    /** Element used for the result links. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** Placeholder / accessible label for the palette input. Defaults to the `lang` translation. */
    searchPlaceholder?: string | undefined;
    /** Message shown when a query matches nothing. Defaults to the `lang` translation. */
    searchEmptyLabel?: string | undefined;
    /** Optional override for how a page's `icon` name is rendered in a result. Defaults to the built-in set. */
    renderIcon?: ((name: string | undefined) => ReactNode) | undefined;
    /** The docs app subtree. */
    children: ReactNode;
}

/**
 * Owns the docs ⌘K command palette and shares one `open()` with the whole docs app via
 * {@link useDocsSearch}. Wrap your docs shell in it (above the navbar, tabs, sidebar, and content):
 * the global ⌘K / Ctrl-K shortcut and any search button ({@link import("./DocsNavbar.js").DocsNavbar}'s,
 * or your own) all raise the same palette, which fuzzy-searches every page (title, label, group, tab)
 * and renders exactly once here.
 *
 * A client component: it holds the open/query state, the keyboard shortcut, and the modal (a proper
 * dialog - it traps Tab, closes on Escape / backdrop, and returns focus to whatever opened it). It
 * receives the already-computed, serialisable `NavTree` from a server component.
 *
 * @param props - see {@link DocsSearchProviderProps}.
 * @returns the provider wrapping `children`, plus the palette when open.
 */
export function DocsSearchProvider({
    nav,
    lang,
    linkComponent: Link = "a",
    searchPlaceholder,
    searchEmptyLabel,
    renderIcon,
    children,
}: DocsSearchProviderProps): ReactElement {
    const labels = docsLabels(lang ?? "en");
    const searchText = searchPlaceholder ?? labels.searchPlaceholder;
    const emptyText = searchEmptyLabel ?? labels.searchEmpty;
    const icon = (name: string | undefined): ReactNode => (renderIcon ? renderIcon(name) : <DocsIcon name={name} />);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);

    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const dialogRef = useRef<HTMLDivElement | null>(null);
    // The element focus should return to on close; captured before the palette (and its autoFocus
    // input) mounts, so we cannot read it in the open effect.
    const openerRef = useRef<HTMLElement | null>(null);
    // Mirror of `open` readable inside the (deps-[]) global key handler.
    const openStateRef = useRef(false);

    /** Opens the palette, remembering the element to return focus to on close. */
    const openPalette = (): void => {
        openerRef.current = document.activeElement as HTMLElement | null;
        setOpen(true);
    };
    const value = useMemo<DocsSearchContextValue>(() => ({ open: openPalette }), []);

    // ⌘K / Ctrl-K toggles the palette; Escape closes it.
    useEffect(() => {
        openStateRef.current = open;
    }, [open]);
    useEffect(() => {
        const onKey = (event: globalThis.KeyboardEvent): void => {
            const key = (event.key || "").toLowerCase();
            if ((event.metaKey || event.ctrlKey) && key === "k") {
                event.preventDefault();
                if (openStateRef.current) {
                    setOpen(false);
                } else {
                    openPalette();
                }
            } else if (event.key === "Escape") {
                setOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // While open, lock body scroll; on close, reset the query/selection (invisible while unmounted,
    // so a reopen is already blank) and return focus to whatever opened it.
    useEffect(() => {
        if (!open) {
            setQuery("");
            setActiveIndex(0);
            return undefined;
        }
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
            openerRef.current?.focus?.();
        };
    }, [open]);

    const allItems = useMemo(() => flattenNav(nav), [nav]);
    const results = useMemo(() => searchNav(allItems, query), [allItems, query]);
    const activeOptionId = results.length > 0 ? `scribekit-docs-opt-${activeIndex}` : undefined;

    /** Follows the highlighted result (SPA click via its ref, else a full navigation). */
    const openResult = (item: NavItem, index: number): void => {
        const el = itemRefs.current[index];
        if (el) {
            el.click();
        } else {
            window.location.href = item.href;
        }
    };

    /** Arrow-key navigation + Enter-to-open inside the palette input. */
    const onPaletteKey = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter") {
            event.preventDefault();
            const item = results[activeIndex];
            if (item) {
                openResult(item, activeIndex);
            }
        }
    };

    /** Traps Tab within the open palette so focus can't reach the controls behind the backdrop. */
    const onDialogKey = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (event.key !== "Tab") {
            return;
        }
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) {
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return (
        <DocsSearchContext.Provider value={value}>
            {children}
            {open ? (
                <div className="scribekit-docs-palette-backdrop" onClick={() => setOpen(false)}>
                    <div
                        ref={dialogRef}
                        className="scribekit-docs-palette"
                        role="dialog"
                        aria-modal="true"
                        aria-label={searchText}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={onDialogKey}
                    >
                        <div className="scribekit-docs-palette-input-row">
                            <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                <circle cx="8" cy="8" r="6" />
                                <path d="M17 17l-4-4" />
                            </svg>
                            <input
                                className="scribekit-docs-palette-input"
                                type="search"
                                role="combobox"
                                autoFocus
                                aria-expanded="true"
                                aria-controls={LISTBOX_ID}
                                aria-autocomplete="list"
                                aria-activedescendant={activeOptionId}
                                value={query}
                                placeholder={searchText}
                                aria-label={searchText}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setActiveIndex(0);
                                }}
                                onKeyDown={onPaletteKey}
                            />
                            <kbd className="scribekit-docs-kbd">Esc</kbd>
                        </div>
                        <div className="scribekit-docs-palette-results" id={LISTBOX_ID} role="listbox" aria-label={searchText}>
                            {results.length === 0 ? (
                                <div className="scribekit-docs-palette-empty">{emptyText}</div>
                            ) : (
                                results.map((item, index) => (
                                    <Link
                                        key={item.slug}
                                        ref={(el: HTMLAnchorElement | null) => {
                                            itemRefs.current[index] = el;
                                        }}
                                        id={`scribekit-docs-opt-${index}`}
                                        role="option"
                                        aria-selected={index === activeIndex}
                                        href={item.href}
                                        className={index === activeIndex ? "scribekit-docs-palette-item is-active" : "scribekit-docs-palette-item"}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => setOpen(false)}
                                    >
                                        <span className="scribekit-docs-palette-item-icon">{icon(item.icon)}</span>
                                        <span className="scribekit-docs-palette-item-title">{item.title}</span>
                                        {item.group || item.tab ? (
                                            <span className="scribekit-docs-palette-item-crumb">{item.group || item.tab}</span>
                                        ) : null}
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </DocsSearchContext.Provider>
    );
}
