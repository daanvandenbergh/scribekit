"use client";

import { useEffect, useMemo, useRef, useState, type ElementType, type ReactElement } from "react";
import { formatDate } from "../../shared/format.js";
import { localePath } from "../../shared/locales.js";
import type { PostMeta } from "../../blog/types.js";
import { blogLabels } from "../shared/i18n.js";
import { filterByCategory, searchPosts } from "./internal/overview.js";

/**
 * Props for {@link BlogOverviewGrid}.
 */
export interface BlogOverviewGridProps {
    /** The posts to display (already newest-first), each carrying `readingTime`/`categories`. */
    posts: PostMeta[];
    /** The distinct categories across `posts`; filter buttons render only when there are 2+. */
    categories: string[];
    /** Route the blog is mounted at; used to build each card's link. */
    basePath: string;
    /** The blog's default locale code, so each card links to `localePath` (default vs prefixed). */
    defaultLocale: string;
    /** Whether the default locale is URL-prefixed too; forwarded to `localePath`. */
    prefixDefaultLocale: boolean;
    /** BCP 47 locale used to format each card's date. */
    locale: string;
    /** The render language, used to localize the built-in labels and the per-card reading time. */
    lang?: string;
    /** How many cards to reveal per page / per infinite-scroll batch. */
    pageSize: number;
    /** Element used for card images (e.g. `next/image`). */
    imgComponent: ElementType;
    /** Element used for card links (e.g. `next/link`). */
    linkComponent: ElementType;
    /** Message shown when no post matches the current search/filter. Defaults to the `lang` translation. */
    emptyLabel?: string;
    /** Call-to-action label at the bottom of each card. Defaults to the `lang` translation. */
    readMoreLabel?: string;
    /** Placeholder for the search box. Defaults to the `lang` translation. */
    searchPlaceholder?: string;
    /** Label for the "load more" button. Defaults to the `lang` translation. */
    loadMoreLabel?: string;
    /** Label for the filter button that clears the category filter. Defaults to the `lang` translation. */
    allCategoriesLabel?: string;
}

/**
 * The interactive body of {@link import("./BlogOverview.js").BlogOverview}: a fuzzy search box,
 * optional category filter buttons, and a card grid that reveals posts in `pageSize` batches -
 * auto-loading the next batch when the reader scrolls to the bottom, with a "load more" button
 * as an explicit fallback.
 *
 * A client component (search, filtering, and infinite scroll need browser state/APIs). It
 * receives a serialisable `PostMeta[]` from the server `BlogOverview`, which keeps the `Blog`
 * instance and SEO JSON-LD on the server.
 *
 * @param props - see {@link BlogOverviewGridProps}.
 * @returns the interactive overview grid.
 */
export function BlogOverviewGrid({
    posts,
    categories,
    basePath,
    defaultLocale,
    prefixDefaultLocale,
    locale,
    lang,
    pageSize,
    imgComponent: Img,
    linkComponent: Link,
    emptyLabel,
    readMoreLabel,
    searchPlaceholder,
    loadMoreLabel,
    allCategoriesLabel,
}: BlogOverviewGridProps): ReactElement {
    const labels = blogLabels(lang ?? defaultLocale);
    const emptyText = emptyLabel ?? labels.empty;
    const readMoreText = readMoreLabel ?? labels.readMore;
    const searchText = searchPlaceholder ?? labels.searchPlaceholder;
    const loadMoreText = loadMoreLabel ?? labels.loadMore;
    const allCategoriesText = allCategoriesLabel ?? labels.allCategories;
    const [query, setQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const filtered = useMemo(
        () => searchPosts(filterByCategory(posts, activeCategory), query),
        [posts, activeCategory, query],
    );
    const visible = filtered.slice(0, visibleCount);
    const hasMore = visible.length < filtered.length;

    // Infinite scroll: reveal the next batch when the sentinel enters view. Re-running on
    // `visibleCount` reconnects the observer after each batch, so a sentinel still in view keeps
    // filling until the viewport is covered or the list is exhausted (then it unmounts).
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) {
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                setVisibleCount((count) => count + pageSize);
            }
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, [pageSize, filtered, visibleCount]);

    /** Applies a category filter (or clears it) and rewinds pagination to the first batch. */
    const selectCategory = (category: string | null): void => {
        setActiveCategory(category);
        setVisibleCount(pageSize);
    };

    /** Updates the search query and rewinds pagination to the first batch. */
    const onSearch = (value: string): void => {
        setQuery(value);
        setVisibleCount(pageSize);
    };

    return (
        <>
            <div className="scribekit-toolbar">
                <input
                    type="search"
                    className="scribekit-search"
                    value={query}
                    onChange={(event) => onSearch(event.target.value)}
                    placeholder={searchText}
                    aria-label={searchText}
                />
                {categories.length > 1 ? (
                    <div className="scribekit-filters" role="group" aria-label={labels.filterByCategory}>
                        <button
                            type="button"
                            className={activeCategory === null ? "scribekit-filter scribekit-filter-active" : "scribekit-filter"}
                            aria-pressed={activeCategory === null}
                            onClick={() => selectCategory(null)}
                        >
                            {allCategoriesText}
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category}
                                type="button"
                                className={
                                    activeCategory === category ? "scribekit-filter scribekit-filter-active" : "scribekit-filter"
                                }
                                aria-pressed={activeCategory === category}
                                onClick={() => selectCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
            {visible.length === 0 ? (
                <p className="scribekit-empty">{emptyText}</p>
            ) : (
                <div className="scribekit-grid">
                    {visible.map((post) => (
                        <Link
                            key={post.slug}
                            href={localePath({ basePath, defaultLocale, prefixDefaultLocale, lang: post.lang, slug: post.slug })}
                            className="scribekit-card"
                        >
                            {post.image ? (
                                <Img
                                    className="scribekit-card-image"
                                    src={post.image}
                                    alt=""
                                    width={1200}
                                    height={630}
                                    loading="lazy"
                                />
                            ) : null}
                            {post.date || post.readingTime ? (
                                <div className="scribekit-card-meta">
                                    {post.date ? (
                                        <span className="scribekit-card-date">{formatDate(post.date, locale)}</span>
                                    ) : null}
                                    {post.readingTime ? (
                                        <span className="scribekit-card-readtime">{labels.readingLabel(post.readingTime)}</span>
                                    ) : null}
                                </div>
                            ) : null}
                            <h2 className="scribekit-card-title">{post.title}</h2>
                            <p className="scribekit-card-desc">{post.description}</p>
                            {post.categories && post.categories.length > 0 ? (
                                <div className="scribekit-card-cats">
                                    {post.categories.map((category) => (
                                        <span key={category} className="scribekit-cat">
                                            {category}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                            <span className="scribekit-card-more">{readMoreText}</span>
                        </Link>
                    ))}
                </div>
            )}
            {hasMore ? (
                <div className="scribekit-loadmore-row">
                    <button
                        type="button"
                        className="scribekit-loadmore"
                        onClick={() => setVisibleCount((count) => count + pageSize)}
                    >
                        {loadMoreText}
                    </button>
                    <div ref={sentinelRef} className="scribekit-sentinel" aria-hidden="true" />
                </div>
            ) : null}
        </>
    );
}
