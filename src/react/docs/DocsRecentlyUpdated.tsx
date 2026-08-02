import { type ElementType, type ReactElement } from "react";

/**
 * One row in {@link DocsRecentlyUpdated}.
 */
export interface DocsRecentItem {
    /** The page title. */
    title: string;
    /** Where it goes. */
    href: string;
    /**
     * The already-formatted, already-localized date - "28 Jul", "28 juli". The component never
     * parses or formats: date formatting needs a locale AND a timezone the component cannot know,
     * and a wrong one is silent.
     */
    updatedLabel: string;
    /** The topic this page belongs to, shown as a small tag. Omitted when unset. */
    category?: string | undefined;
    /** Any CSS colour for the category tag. Falls back to the muted ink. */
    accent?: string | undefined;
}

/**
 * Props for {@link DocsRecentlyUpdated}.
 */
export interface DocsRecentlyUpdatedProps {
    /** The rows, already sorted newest-first and already truncated to the count you want. */
    items: DocsRecentItem[];
    /** The section heading. Falls back to the packaged translation via {@link DocsIndex}. */
    heading?: string | undefined;
    /** Element used for the links. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** Id put on the heading and pointed at by the section's `aria-labelledby`. */
    headingId?: string | undefined;
    /** Appended to the section's class list. */
    className?: string | undefined;
}

/**
 * "Recently updated": a compact, dated list of the pages that changed most recently - the section
 * that tells a returning reader what is worth re-reading.
 *
 * A pure presentational server component. It does NOT sort or slice: it renders exactly the rows
 * it is given, in the order given, because "recent" is a decision about the corpus (which dates
 * count, which pages are eligible) that belongs to the caller. {@link DocsIndex} does that
 * derivation for the packaged path.
 *
 * Renders nothing at all when `items` is empty, so a corpus with no dates simply has no section
 * rather than an empty heading.
 *
 * @param props - see {@link DocsRecentlyUpdatedProps}.
 * @returns the recently-updated section, or `null` when there is nothing to list.
 */
export function DocsRecentlyUpdated({
    items,
    heading,
    linkComponent: Link = "a",
    headingId = "scribekit-docs-recent",
    className,
}: DocsRecentlyUpdatedProps): ReactElement | null {
    if (items.length === 0) {
        return null;
    }
    return (
        <section aria-labelledby={headingId} className={`scribekit-docs-recent${className ? ` ${className}` : ""}`}>
            <h2 id={headingId} className="scribekit-docs-recent-heading">
                {heading ?? "Recently updated"}
            </h2>
            <div className="scribekit-docs-recent-list">
                {items.map((item) => (
                    <Link key={item.href} href={item.href} className="scribekit-docs-recent-row">
                        <span className="scribekit-docs-recent-date">{item.updatedLabel}</span>
                        <span className="scribekit-docs-recent-title">{item.title}</span>
                        {item.category ? (
                            <span className="scribekit-docs-recent-tag" style={item.accent ? { color: item.accent } : undefined}>
                                {item.category}
                            </span>
                        ) : null}
                    </Link>
                ))}
            </div>
        </section>
    );
}
