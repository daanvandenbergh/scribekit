import { type ElementType, type ReactElement } from "react";
import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc";
import { postJsonLd } from "../../blog/seo.js";
import { localePath } from "../../shared/locales.js";
import type { Blog } from "../../blog/blog.js";
import { blogLabels } from "../shared/i18n.js";
import { withHeadingId } from "../shared/headings.js";
import { JsonLd } from "../shared/JsonLd.js";
import { BlogSidebar } from "./BlogSidebar.js";

/**
 * Props for {@link BlogPage}.
 */
export interface BlogPageProps {
    /** The configured `Blog` instance. The post and site config are derived from it. */
    blog: Blog;
    /** The slug to render; the post is loaded via `blog.getPost(slug, lang)`. */
    slug: string;
    /** Which language to render the post in. Defaults to the blog's default locale. */
    lang?: string;
    /** Route the blog is mounted at; used for the back-link and similar-post links. Defaults to `blog.site.basePath` (or `/blog`). */
    basePath?: string;
    /** Custom component map for MDX elements, forwarded to `MDXRemote` (e.g. code highlighting). */
    components?: MDXRemoteProps["components"];
    /** remark/rehype options forwarded to `MDXRemote` (e.g. `remark-gfm`, `rehype-pretty-code`). */
    mdxOptions?: MDXRemoteProps["options"];
    /** Whether to render the "back to blog" link above the title. Defaults to `true`. */
    showBackLink?: boolean;
    /** Label for the back-link. Defaults to the `lang` translation (e.g. `"← Blog"`). */
    backLabel?: string;
    /** Element used for the hero image. Defaults to `"img"`; pass e.g. `next/image` to opt into it. */
    imgComponent?: ElementType;
    /** Element used for the back-link and similar-post links. Defaults to `"a"`; pass `next/link`. */
    linkComponent?: ElementType;
    /** Whether to render the right-side sidebar (heading minimap, reading time, similar posts). Defaults to `true`. */
    showSidebar?: boolean;
    /** Heading for the sidebar's minimap, doubling as its mobile toggle. Defaults to the `lang` translation (e.g. `"On this page"`). */
    tocTitle?: string;
    /** Heading for the sidebar's similar-post list. Defaults to the `lang` translation (e.g. `"Similar pages"`). */
    similarTitle?: string;
    /** Maximum number of similar posts to show in the sidebar. Defaults to `3`. */
    similarCount?: number;
    /** Formats the reading-time label from the estimated minutes. Defaults to the `lang` translation (e.g. ``(m) => `${m} min read` ``). */
    readingLabel?: (minutes: number) => string;
}

/**
 * Renders a single blog post: an optional back-link, the title, the formatted date, the hero
 * image, and the MDX body (compiled with `next-mdx-remote/rsc`) inside a `.scribekit-prose`
 * container, alongside a right-side sidebar with a heading minimap (table of contents), the
 * estimated reading time, and "Similar pages". When the post declares an `author`, their name
 * appears in the meta row (with a small round avatar when `author-image` is set) and a plain
 * "Written by" author bio - a divider, the avatar (when set), the name, and the category /
 * publish date - closes the article.
 *
 * A server component: pass your configured `Blog` instance and the slug (and, for a translated
 * post, the `lang`), and it loads the post (`blog.getPost(slug, lang)`), formats the date in that
 * language's locale, computes the minimap / reading time / same-language similar posts, and
 * derives the SEO JSON-LD from `blog.site`. A language switcher is deliberately not rendered - it
 * is the consumer's to build (from `blog.getTranslations(slug)` + `localePath`). The sidebar
 * itself is a client component (`BlogSidebar`) for its scroll-spy and mobile collapse; the
 * similar-post cards are rendered here (server-side) so they keep your `linkComponent` /
 * `imgComponent`, and passed into it. `##`/`###` headings in the MDX body get anchor ids
 * injected so the minimap can jump to them - if you override `h2`/`h3` in `components`, add
 * your own ids. Supply your own navbar/footer/CTA around it. Requires the package stylesheet.
 *
 * With the recommended route setup (`generateStaticParams` + `dynamicParams = false`), unknown
 * slugs 404 at the router before this renders, so `getPost` only ever sees valid slugs. If you
 * opt into dynamic rendering, guard with your own `getPost` try/catch -> `notFound()` in the
 * page component before rendering.
 *
 * @param props - see {@link BlogPageProps}.
 * @returns the blog post article, with the sidebar when enabled and there is content for it.
 */
export function BlogPage({
    blog,
    slug,
    lang,
    basePath,
    components,
    mdxOptions,
    showBackLink = true,
    backLabel,
    imgComponent: Img = "img",
    linkComponent: Link = "a",
    showSidebar = true,
    tocTitle,
    similarTitle,
    similarCount,
    readingLabel,
}: BlogPageProps): ReactElement {
    const resolvedLang = lang ?? blog.defaultLocale;
    const labels = blogLabels(resolvedLang);
    const resolvedBasePath = basePath ?? blog.site?.basePath ?? "/blog";
    const post = blog.getPost(slug, resolvedLang);
    const { meta, content } = post;
    const site = blog.site;
    const readingText = (readingLabel ?? labels.readingLabel)(blog.readingMinutes(post));

    const toc = showSidebar ? blog.tableOfContents(post) : [];
    const similar = showSidebar ? blog.similarPosts(post, similarCount) : [];
    const renderSidebar = showSidebar && (toc.length > 0 || similar.length > 0);

    // Inject anchor ids into headings so the minimap links resolve; caller's components win.
    const mergedComponents = { h2: withHeadingId("h2"), h3: withHeadingId("h3"), ...components };

    const article = (
        <article className="scribekit-post">
            {showBackLink ? (
                <Link href={localePath({ basePath: resolvedBasePath, defaultLocale: blog.defaultLocale, prefixDefaultLocale: blog.prefixDefaultLocale,lang: resolvedLang })} className="scribekit-back">
                    {backLabel ?? labels.back}
                </Link>
            ) : null}
            <h1 className="scribekit-post-title">{meta.title}</h1>
            <div className="scribekit-post-meta">
                {meta.categories?.[0] ? <span className="scribekit-post-cat">{meta.categories[0]}</span> : null}
                {meta.date ? (
                    <span className="scribekit-post-metaitem">{blog.formatDate(meta.date, resolvedLang)}</span>
                ) : null}
                {meta.author ? (
                    <span className="scribekit-post-metaitem scribekit-post-author">
                        {meta.authorImage ? (
                            <Img className="scribekit-post-author-avatar" src={meta.authorImage} alt={meta.author} width={24} height={24} />
                        ) : null}
                        {meta.author}
                    </span>
                ) : null}
                <span className="scribekit-post-metaitem">{readingText}</span>
            </div>
            {meta.image ? (
                <Img className="scribekit-post-image" src={meta.image} alt={meta.title} width={1200} height={630} />
            ) : null}
            <div className="scribekit-prose">
                <MDXRemote source={content} components={mergedComponents} options={mdxOptions} />
            </div>
            {meta.author ? (
                <div className="scribekit-author-bio">
                    {meta.authorImage ? (
                        <Img className="scribekit-author-bio-avatar" src={meta.authorImage} alt={meta.author} width={72} height={72} />
                    ) : null}
                    <div className="scribekit-author-bio-body">
                        <div className="scribekit-author-bio-label">{labels.writtenBy}</div>
                        <div className="scribekit-author-bio-name">{meta.author}</div>
                        <div className="scribekit-author-bio-meta">
                            {meta.categories?.[0] ? <span className="scribekit-author-bio-cat">{meta.categories[0]}</span> : null}
                            {meta.date ? (
                                <span className="scribekit-author-bio-date">
                                    {labels.publishedLabel(blog.formatDate(meta.date, resolvedLang))}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
            {site ? <JsonLd data={postJsonLd(meta, site, blog.getTranslations(slug))} /> : null}
        </article>
    );

    if (!renderSidebar) {
        return article;
    }

    const similarCards =
        similar.length > 0 ? (
            <div className="scribekit-similar-list">
                {similar.map((related) => (
                    <Link
                        key={related.slug}
                        href={localePath({ basePath: resolvedBasePath, defaultLocale: blog.defaultLocale, prefixDefaultLocale: blog.prefixDefaultLocale,lang: related.lang, slug: related.slug })}
                        className="scribekit-similar-card"
                    >
                        <span className="scribekit-similar-body">
                            <span className="scribekit-similar-title">{related.title}</span>
                            <span className="scribekit-similar-meta">
                                {related.categories?.[0] ? (
                                    <span className="scribekit-similar-cat">{related.categories[0]}</span>
                                ) : null}
                                {related.date ? (
                                    <span className="scribekit-similar-date">{blog.formatDate(related.date, resolvedLang)}</span>
                                ) : null}
                            </span>
                        </span>
                        <span className="scribekit-similar-arrow" aria-hidden="true">
                            →
                        </span>
                    </Link>
                ))}
            </div>
        ) : null;

    return (
        <div className="scribekit-post-layout">
            {article}
            <BlogSidebar
                toc={toc}
                title={tocTitle ?? labels.onThisPage}
                similarTitle={similarTitle ?? labels.similarPages}
                similar={similarCards}
            />
        </div>
    );
}
