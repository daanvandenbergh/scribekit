"use client";

import { type ReactElement } from "react";
import { docsLabels } from "../shared/i18n.js";
import { useDocsSearch } from "./DocsSearchProvider.js";

/**
 * Props for {@link DocsSearchButton}.
 */
export interface DocsSearchButtonProps {
    /** Placeholder / accessible label. Defaults to the `lang` translation (e.g. `"Search docs…"`). */
    placeholder?: string;
    /** The render language, used to localize the default placeholder. */
    lang?: string;
    /** Extra class appended to the button, e.g. to size it differently in a navbar vs a sidebar. */
    className?: string;
}

/**
 * A quiet, field-like button that opens the docs ⌘K command palette (via {@link useDocsSearch}),
 * with a search icon, the placeholder, and a ⌘K hint. Drop it wherever you want a search entry point -
 * `DocsNavbar` places it centered in the top bar. Must be rendered inside a
 * {@link import("./DocsSearchProvider.js").DocsSearchProvider}.
 *
 * @param props - see {@link DocsSearchButtonProps}.
 * @returns the search trigger button.
 */
export function DocsSearchButton({ placeholder, lang, className }: DocsSearchButtonProps): ReactElement {
    const text = placeholder ?? docsLabels(lang ?? "en").searchPlaceholder;
    const { open } = useDocsSearch();
    return (
        <button
            type="button"
            className={className ? `scribekit-docs-search-trigger ${className}` : "scribekit-docs-search-trigger"}
            onClick={open}
            aria-label={text}
            aria-haspopup="dialog"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="7" cy="7" r="5" />
                <path d="M14 14l-3.2-3.2" />
            </svg>
            <span className="scribekit-docs-search-trigger-text">{text}</span>
            <span className="scribekit-docs-kbd-group" aria-hidden="true">
                <kbd className="scribekit-docs-kbd">⌘</kbd>
                <kbd className="scribekit-docs-kbd">K</kbd>
            </span>
        </button>
    );
}
