import type { ElementType, ReactElement, ReactNode } from "react";
import { overviewJsonLd } from "../../blog/seo.js";
import { collectCategories } from "../../blog/categories.js";
import type { Blog } from "../../blog/blog.js";
import type { PostMeta } from "../../blog/types.js";
import { JsonLd } from "../shared/JsonLd.js";
import { BlogOverviewGrid } from "./BlogOverviewGrid.js";

/**
 * Props for {@link BlogOverview}.
 */
export interface BlogOverviewProps {
    /** The configured `Blog` instance. Posts and site config are derived from it. */
    blog: Blog;
    /** Which language's posts to list. Defaults to the blog's default locale. */
    lang?: string;
    /** Optional override for the posts to list. Defaults to `blog.getAllPosts(lang)` (newest first). */
    posts?: PostMeta[];
    /** Route the blog is mounted at; used to build each card's link. Defaults to `blog.site.basePath` (or `/blog`). */
    basePath?: string;
    /** Optional content rendered above the grid (e.g. your own page heading/hero). */
    header?: ReactNode;
    /** Element used for card images. Defaults to `"img"`; pass e.g. `next/image` to opt into it. */
    imgComponent?: ElementType;
    /** Element used for card links. Defaults to `"a"`; pass `next/link` for client-side navigation. */
    linkComponent?: ElementType;
    /** Message shown when there are no posts / no search matches. Defaults to the `lang` translation. */
    emptyLabel?: string;
    /** Call-to-action label at the bottom of each card. Defaults to the `lang` translation. */
    readMoreLabel?: string;
    /** How many cards to reveal per infinite-scroll batch. Defaults to `9`. */
    pageSize?: number;
    /** Placeholder for the search box. Defaults to the `lang` translation (e.g. `"Search posts…"`). */
    searchPlaceholder?: string;
    /** Label for the "load more" button. Defaults to the `lang` translation (e.g. `"Load more"`). */
    loadMoreLabel?: string;
    /** Label for the filter button that clears the category filter. Defaults to the `lang` translation (e.g. `"All"`). */
    allCategoriesLabel?: string;
}

/**
 * Renders a searchable, paginated grid of blog post cards (hero image, date, reading time,
 * category badges, title, description, and a "read more" affordance). A server component: pass
 * your configured `Blog` instance and it derives the posts (`blog.getAllPosts()`), their
 * categories, and the SEO JSON-LD (`blog.site`) automatically; pass `posts` to override. The
 * interactive parts (fuzzy search, category filters, infinite scroll) live in a client child
 * so the `Blog` instance and JSON-LD stay on the server. Wrap it with your own navbar/footer/
 * hero. Requires the package stylesheet to be imported once.
 *
 * @param props - see {@link BlogOverviewProps}.
 * @returns the blog overview section.
 */
export function BlogOverview({
    blog,
    lang,
    posts,
    basePath,
    header,
    imgComponent = "img",
    linkComponent = "a",
    emptyLabel,
    readMoreLabel,
    pageSize = 9,
    searchPlaceholder,
    loadMoreLabel,
    allCategoriesLabel,
}: BlogOverviewProps): ReactElement {
    const resolvedLang = lang ?? blog.defaultLocale;
    const resolvedBasePath = basePath ?? blog.site?.basePath ?? "/blog";
    const resolvedPosts = posts ?? blog.getAllPosts(resolvedLang);
    const categories = collectCategories(resolvedPosts);
    const site = blog.site;
    return (
        <section className="scribekit-overview">
            {header}
            <BlogOverviewGrid
                posts={resolvedPosts}
                categories={categories}
                basePath={resolvedBasePath}
                defaultLocale={blog.defaultLocale}
                prefixDefaultLocale={blog.prefixDefaultLocale}
                locale={blog.dateLocale(resolvedLang)}
                lang={resolvedLang}
                pageSize={pageSize}
                imgComponent={imgComponent}
                linkComponent={linkComponent}
                emptyLabel={emptyLabel}
                readMoreLabel={readMoreLabel}
                searchPlaceholder={searchPlaceholder}
                loadMoreLabel={loadMoreLabel}
                allCategoriesLabel={allCategoriesLabel}
            />
            {site ? <JsonLd data={overviewJsonLd(resolvedPosts, site, resolvedLang)} /> : null}
        </section>
    );
}
