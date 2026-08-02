"use client";

import { useMemo, useState, type ElementType, type ReactElement, type ReactNode } from "react";
import { fillTemplate, normalizeQuery, pageMatchesQuery } from "./internal/topic-filter.js";

/**
 * One page listed inside a {@link DocsTopic}.
 */
export interface DocsTopicPage {
    /** The link text. */
    title: string;
    /** Where it goes. */
    href: string;
    /** One-sentence summary. Shown in filter results, and searched by the filter. */
    description?: string | undefined;
}

/**
 * One topic card: a heading, a blurb, an icon, and the pages filed under it.
 */
export interface DocsTopic {
    /** Stable key, and the value the grid dedupes on. */
    id: string;
    /** The card heading. */
    title: string;
    /** Where the heading and the footer count link go. */
    href: string;
    /** One line on what this topic covers. Omitted when unset. */
    description?: string | undefined;
    /** The card's glyph, already rendered. A node rather than a name, so the grid needs no icon map. */
    icon?: ReactNode;
    /**
     * Any CSS colour. Drives the icon tile, the corner wash, the bullets and the footer link via
     * the `--scribekit-topic-accent` custom property; the softer fills are derived from it with
     * `color-mix`, so ONE value themes the whole card. Defaults to this topic's entry in `accents`.
     */
    accent?: string | undefined;
    /**
     * Every page in the topic - not just the visible ones. The card shows the first
     * `pagesPerTopic`, but the filter searches all of them, so a page hidden by the cap is still
     * findable.
     */
    pages: DocsTopicPage[];
    /**
     * The footer link's text, e.g. `"6 pages"`. Already localized and already pluralized - the
     * count is known before render, so it is resolved by the caller (who has the language and the
     * plural rules) rather than templated here. Defaults to `"<n> pages"`.
     */
    countLabel?: string | undefined;
}

/**
 * Copy overrides for {@link DocsTopicGrid}. Every entry is optional; anything omitted falls back to
 * the packaged English default (or, via {@link DocsIndex}, to the packaged translation).
 *
 * EVERY ENTRY IS A PLAIN STRING, and that is a hard constraint rather than a style choice: this is
 * a client component, so a label built as a `(count) => string` callback cannot reach it from a
 * server page at all - React refuses to serialize a function across the boundary and the render
 * throws. The two labels that need runtime values therefore use `{count}` / `{query}` placeholders,
 * substituted here.
 */
export interface DocsTopicGridLabels {
    /** The section heading. */
    heading?: string | undefined;
    /** Placeholder and accessible name for the filter input. */
    filterPlaceholder?: string | undefined;
    /** Label for the button that empties the filter. */
    clearFilter?: string | undefined;
    /** Results heading; `{count}` and `{query}` are substituted. Used when the count is not 1. */
    resultCount?: string | undefined;
    /** Results heading for exactly one match. Falls back to {@link DocsTopicGridLabels.resultCount}. */
    resultCountOne?: string | undefined;
    /** Empty-results heading; `{query}` is substituted. */
    noMatches?: string | undefined;
    /**
     * A line under the empty-results heading suggesting what to try instead. Deliberately has NO
     * packaged default: a useful hint names terms from YOUR corpus, and a generic one is noise.
     */
    noMatchesHint?: string | undefined;
}

/**
 * Props for {@link DocsTopicGrid}.
 */
export interface DocsTopicGridProps {
    /** The topics to render, in display order. */
    topics: DocsTopic[];
    /** Copy overrides. Anything unset uses the packaged translation. */
    labels?: DocsTopicGridLabels | undefined;
    /** How many pages each card lists before its footer count. Defaults to `3`. */
    pagesPerTopic?: number | undefined;
    /** Set `false` to drop the filter box, leaving a plain grid. Defaults to `true`. */
    filter?: boolean | undefined;
    /** Accent cycle for topics that declare no `accent` of their own. */
    accents?: string[] | undefined;
    /** Element used for the links. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** Id put on the heading and pointed at by the section's `aria-labelledby`. */
    headingId?: string | undefined;
    /** Appended to the section's class list. */
    className?: string | undefined;
}

/**
 * The default accent cycle: a blue -> violet -> purple -> magenta -> coral run, so that adjacent
 * topic cards never share a colour and a corpus of any size stays visually ordered. Consumers
 * override it wholesale with `accents`, or per card with `DocsTopic.accent`.
 */
const DEFAULT_ACCENTS = ["#2563eb", "#5b57f2", "#7c4fe0", "#9a55d0", "#b0487e", "#c25b4a", "#c4699e"];

/** The trailing chevron shared by the page rows and the footer count link. */
function Arrow({ size = 14 }: { size?: number }): ReactElement {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" />
        </svg>
    );
}

/**
 * "Browse by topic": a grid of topic cards, each listing the first few pages filed under it, with
 * an optional filter box that replaces the grid with a flat, ranked result list while a query is
 * typed.
 *
 * A CLIENT component, because the filter is local state - which is also why every prop is plain
 * data and icons arrive as already-rendered nodes rather than a `renderIcon` callback: a function
 * cannot cross the server/client boundary, an element can. Pass `linkComponent` only from a client
 * module (re-export `next/link` behind `"use client"`); handing a server component's own function
 * across the boundary throws.
 *
 * The filter searches each page's title and description plus its topic's title, so "billing" finds
 * a page whose own words never say it. It searches EVERY page, including ones the `pagesPerTopic`
 * cap hides from the card - a page you cannot see is exactly the one you need the filter for.
 *
 * @param props - see {@link DocsTopicGridProps}.
 * @returns the topic section.
 */
export function DocsTopicGrid({
    topics,
    labels,
    pagesPerTopic = 3,
    filter = true,
    accents = DEFAULT_ACCENTS,
    linkComponent: Link = "a",
    headingId = "scribekit-docs-topics",
    className,
}: DocsTopicGridProps): ReactElement {
    const [query, setQuery] = useState("");
    const [focused, setFocused] = useState(false);

    /** Each topic paired with the accent it will actually render in, resolved once. */
    const accented = useMemo(
        () =>
            topics.map((topic, index) => ({
                topic,
                // `accents` can be handed in empty; fall back rather than render `undefined`.
                accent: topic.accent ?? accents[index % accents.length] ?? DEFAULT_ACCENTS[0]!,
            })),
        [topics, accents],
    );

    const trimmed = query.trim();
    const needle = normalizeQuery(query);

    /** Every page across every topic that matches the query, tagged with its topic. */
    const matches = useMemo(
        () =>
            accented.flatMap(({ topic, accent }) =>
                topic.pages.filter((page) => pageMatchesQuery(page, topic.title, needle)).map((page) => ({ page, topic, accent })),
            ),
        [accented, needle],
    );

    const showResults = needle.length > 0;
    const heading = labels?.heading ?? "Browse by topic";
    const clearLabel = labels?.clearFilter ?? "Clear filter";

    return (
        <section aria-labelledby={headingId} className={`scribekit-docs-topics${className ? ` ${className}` : ""}`}>
            <div className="scribekit-docs-topics-head">
                <h2 id={headingId} className="scribekit-docs-topics-heading">
                    {heading}
                </h2>
                {filter ? (
                    <div className={`scribekit-docs-topics-filter${focused ? " is-focused" : ""}`}>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.75}
                            strokeLinecap="round"
                            aria-hidden="true"
                            className="scribekit-docs-topics-filter-icon"
                        >
                            <circle cx="9" cy="9" r="6.1" />
                            <path d="M13.5 13.5L17.2 17.2" />
                        </svg>
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder={labels?.filterPlaceholder ?? "Filter pages"}
                            aria-label={labels?.filterPlaceholder ?? "Filter pages"}
                            className="scribekit-docs-topics-filter-input"
                        />
                        {trimmed ? (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                aria-label={clearLabel}
                                className="scribekit-docs-topics-filter-clear"
                            >
                                <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                                    <path d="M4 4l10 10M14 4L4 14" />
                                </svg>
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>

            {showResults ? (
                <div className="scribekit-docs-results">
                    <div className="scribekit-docs-results-head">
                        {fillTemplate(
                            (matches.length === 1 ? labels?.resultCountOne : undefined) ??
                                labels?.resultCount ??
                                "{count} pages match “{query}”",
                            { count: matches.length, query: trimmed },
                        )}
                    </div>
                    {matches.map(({ page, topic, accent }) => (
                        <Link
                            key={`${topic.id}-${page.href}`}
                            href={page.href}
                            className="scribekit-docs-result"
                            style={{ "--scribekit-topic-accent": accent } as React.CSSProperties}
                        >
                            <span className="scribekit-docs-result-text">
                                <span className="scribekit-docs-result-title">{page.title}</span>
                                {page.description ? <span className="scribekit-docs-result-desc">{page.description}</span> : null}
                            </span>
                            <span className="scribekit-docs-result-tag">{topic.title}</span>
                        </Link>
                    ))}
                    {matches.length === 0 ? (
                        <div className="scribekit-docs-results-empty">
                            <div className="scribekit-docs-results-empty-title">
                                {fillTemplate(labels?.noMatches ?? "Nothing matches “{query}”", { query: trimmed })}
                            </div>
                            {labels?.noMatchesHint ? <p className="scribekit-docs-results-empty-hint">{labels.noMatchesHint}</p> : null}
                            <button type="button" onClick={() => setQuery("")} className="scribekit-docs-results-empty-btn">
                                {clearLabel}
                            </button>
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="scribekit-docs-topic-grid">
                    {accented.map(({ topic, accent }) => (
                        <div
                            key={topic.id}
                            className="scribekit-docs-topic-card"
                            style={{ "--scribekit-topic-accent": accent } as React.CSSProperties}
                        >
                            <span aria-hidden="true" className="scribekit-docs-topic-wash" />
                            {topic.icon ? <span className="scribekit-docs-topic-icon">{topic.icon}</span> : null}
                            <Link href={topic.href} className="scribekit-docs-topic-title">
                                {topic.title}
                            </Link>
                            {topic.description ? <span className="scribekit-docs-topic-blurb">{topic.description}</span> : null}
                            {topic.pages.length > 0 ? (
                                <div className="scribekit-docs-topic-pages">
                                    {topic.pages.slice(0, pagesPerTopic).map((page) => (
                                        <Link key={page.href} href={page.href} className="scribekit-docs-topic-page">
                                            <span aria-hidden="true" className="scribekit-docs-topic-bullet" />
                                            <span className="scribekit-docs-topic-page-label">{page.title}</span>
                                            <Arrow />
                                        </Link>
                                    ))}
                                </div>
                            ) : null}
                            <Link href={topic.href} className="scribekit-docs-topic-count">
                                {topic.countLabel ?? `${topic.pages.length} pages`}
                                <Arrow size={13} />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
