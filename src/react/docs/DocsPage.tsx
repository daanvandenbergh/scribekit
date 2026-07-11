import { type ElementType, type ReactElement } from "react";
import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc";
import type { Docs } from "../../docs/docs.js";
import { docsLabels } from "../shared/i18n.js";
import { withHeadingId } from "../shared/headings.js";
import { withGfm } from "../shared/mdx.js";
import { JsonLd } from "../shared/JsonLd.js";
import { DocsToc } from "./DocsToc.js";
import { DocsFeedback } from "./DocsFeedback.js";

/**
 * Props for {@link DocsPage}.
 */
export interface DocsPageProps {
    /** The configured `Docs` instance. The page and site config are derived from it. */
    docs: Docs;
    /** The slug to render; the page is loaded via `docs.getDoc(slug, lang)`. */
    slug: string;
    /** Which language to render the page in. Defaults to the docs' default locale. */
    lang?: string;
    /** Custom component map for MDX elements, forwarded to `MDXRemote` (e.g. code highlighting). */
    components?: MDXRemoteProps["components"];
    /**
     * EXTRA remark/rehype options forwarded to `MDXRemote` (e.g. `rehype-pretty-code`). GFM
     * (tables, strikethrough, task lists, autolinks) is already on by default - plugins passed
     * here are merged with it, never replace it. See `shared/mdx.ts`.
     */
    mdxOptions?: MDXRemoteProps["options"];
    /** Element used for prev/next links. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** Element used for the hero image. Defaults to `"img"`; pass `next/image` for optimisation. */
    imgComponent?: ElementType;
    /** Whether to render the breadcrumb above the title. Defaults to `true`. */
    showBreadcrumb?: boolean;
    /** Whether to render the right-hand "On this page" table-of-contents minimap. Defaults to `true`. */
    showToc?: boolean;
    /** Whether to render the "Was this page helpful?" widget below the body. Defaults to `true`. */
    showFeedback?: boolean;
    /** Heading for the ToC minimap. Defaults to the `lang` translation (e.g. `"On this page"`). */
    tocTitle?: string;
    /** Label for the "previous page" card. Defaults to the `lang` translation (e.g. `"Previous"`). */
    previousLabel?: string;
    /** Label for the "next page" card. Defaults to the `lang` translation (e.g. `"Next"`). */
    nextLabel?: string;
    /** The feedback prompt. Defaults to the `lang` translation (e.g. `"Was this page helpful?"`). */
    feedbackQuestion?: string;
    /** Affirmative feedback button label. Defaults to the `lang` translation (e.g. `"Yes"`). */
    feedbackYesLabel?: string;
    /** Negative feedback button label. Defaults to the `lang` translation (e.g. `"No"`). */
    feedbackNoLabel?: string;
    /** Feedback confirmation. Defaults to the `lang` translation (e.g. `"Thanks for the feedback!"`). */
    feedbackThanksLabel?: string;
    /** Called once with the reader's feedback vote; wire it to your analytics. Optional. */
    onFeedback?: (vote: "yes" | "no") => void;
    /** Builds the reading-time label from the estimated minutes. Defaults to the `lang` translation. */
    readingLabel?: (minutes: number) => string;
    /** Builds the "Updated <date>" meta line from the formatted date. Defaults to the `lang` translation. */
    updatedLabel?: (date: string) => string;
}

/** A small clock glyph for the reading-time pill. */
function ClockIcon(): ReactElement {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
            <circle cx="6" cy="6" r="5" />
            <path d="M6 3v3l2 1" />
        </svg>
    );
}

/** A small chevron pointing in `dir`, for the breadcrumb and prev/next cards. */
function Chevron({ dir }: { dir: "left" | "right" }): ReactElement {
    return (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {dir === "left" ? <path d="M9 3L5 7l4 4" /> : <path d="M5 3l4 4-4 4" />}
        </svg>
    );
}

/**
 * Renders a single documentation page: a breadcrumb, the title and lead, a meta row (reading time
 * and last-updated date), the hero image (when the page's front-matter sets `image`, rendered with
 * `imgComponent`), the MDX body (compiled with `next-mdx-remote/rsc`) inside a
 * `.scribekit-prose` container, a "Was this page helpful?" widget, prev/next cards from the sidebar
 * reading order, and a right-hand "On this page" minimap (the same scroll-spy `BlogSidebar` the
 * blog uses). SEO JSON-LD (a `TechArticle` + `BreadcrumbList`) is derived from `docs.site`.
 *
 * A server component: pass your configured `Docs` instance and the slug (and, for a translated
 * page, the `lang`), and it loads the page (`docs.getDoc(slug, lang)`), formats the date in that
 * language's locale, and computes the breadcrumb / minimap / prev-next. The left navigation is a
 * separate client component (`DocsSidebar`) you place in your route's layout; a language switcher
 * is the consumer's to build (from `docs.getTranslations(slug)` + `localePath`). `##`/`###`
 * headings in the MDX body get anchor ids injected (via the shared `slugify`) so the minimap can
 * jump to them - if you override `h2`/`h3` in `components`, add your own ids. Requires the package
 * stylesheet.
 *
 * With the recommended route setup (`generateStaticParams` + `dynamicParams = false`), unknown
 * slugs 404 at the router before this renders. If you opt into dynamic rendering, guard with your
 * own `getDoc` try/catch -> `notFound()` in the page component before rendering.
 *
 * @param props - see {@link DocsPageProps}.
 * @returns the documentation page, with the ToC minimap when enabled and there are headings.
 */
export function DocsPage({
    docs,
    slug,
    lang,
    components,
    mdxOptions,
    linkComponent: Link = "a",
    imgComponent: Img = "img",
    showBreadcrumb = true,
    showToc = true,
    showFeedback = true,
    tocTitle,
    previousLabel,
    nextLabel,
    feedbackQuestion,
    feedbackYesLabel,
    feedbackNoLabel,
    feedbackThanksLabel,
    onFeedback,
    readingLabel,
    updatedLabel,
}: DocsPageProps): ReactElement {
    const resolvedLang = lang ?? docs.defaultLocale;
    const labels = docsLabels(resolvedLang);
    const doc = docs.getDoc(slug, resolvedLang);
    const { meta, content } = doc;
    const site = docs.site;
    const readingText = (readingLabel ?? labels.readingLabel)(docs.readingMinutes(doc));

    const crumb = showBreadcrumb ? docs.getBreadcrumb(slug, resolvedLang) : undefined;
    const toc = showToc ? docs.tableOfContents(doc) : [];
    const adjacent = docs.getAdjacent(slug, resolvedLang);
    const hasPrevNext = Boolean(adjacent.prev || adjacent.next);

    // Inject anchor ids into headings so the minimap links resolve; caller's components win.
    const mergedComponents = { h2: withHeadingId("h2"), h3: withHeadingId("h3"), ...components };

    const article = (
        <article className="scribekit-doc">
            {crumb && crumb.segments.length > 0 ? (
                <nav className="scribekit-doc-breadcrumb" aria-label="Breadcrumb">
                    {crumb.segments.map((segment, index) => (
                        <span key={`${segment.label}-${index}`} className="scribekit-doc-crumb">
                            {index > 0 ? (
                                <span className="scribekit-doc-crumb-sep" aria-hidden="true">
                                    <Chevron dir="right" />
                                </span>
                            ) : null}
                            <span
                                className={index === crumb.segments.length - 1 ? "scribekit-doc-crumb-current" : undefined}
                                aria-current={index === crumb.segments.length - 1 ? "page" : undefined}
                            >
                                {segment.label}
                            </span>
                        </span>
                    ))}
                </nav>
            ) : null}

            <h1 className="scribekit-doc-title">{meta.title}</h1>
            {meta.description ? <p className="scribekit-doc-lead">{meta.description}</p> : null}

            <div className="scribekit-doc-meta">
                <span className="scribekit-doc-readpill">
                    <ClockIcon />
                    {readingText}
                </span>
                {meta.updated ? (
                    <span className="scribekit-doc-updated">
                        {(updatedLabel ?? labels.updatedLabel)(docs.formatDate(meta.updated, resolvedLang))}
                    </span>
                ) : null}
            </div>

            <div className="scribekit-doc-divider" />

            {meta.image ? (
                <Img className="scribekit-doc-image" src={meta.image} alt={meta.title} width={1200} height={630} />
            ) : null}

            <div className="scribekit-prose">
                <MDXRemote source={content} components={mergedComponents} options={withGfm(mdxOptions)} />
            </div>

            {showFeedback ? (
                <DocsFeedback
                    question={feedbackQuestion ?? labels.feedbackQuestion}
                    yesLabel={feedbackYesLabel ?? labels.feedbackYes}
                    noLabel={feedbackNoLabel ?? labels.feedbackNo}
                    thanksLabel={feedbackThanksLabel ?? labels.feedbackThanks}
                    onVote={onFeedback}
                />
            ) : null}

            {hasPrevNext ? (
                <div className="scribekit-docs-prevnext">
                    {adjacent.prev ? (
                        <Link href={adjacent.prev.href} className="scribekit-docs-prevnext-card scribekit-docs-prevnext-prev">
                            <span className="scribekit-docs-prevnext-label">
                                <Chevron dir="left" />
                                {previousLabel ?? labels.previous}
                            </span>
                            <span className="scribekit-docs-prevnext-title">{adjacent.prev.title}</span>
                        </Link>
                    ) : (
                        <span className="scribekit-docs-prevnext-spacer" aria-hidden="true" />
                    )}
                    {adjacent.next ? (
                        <Link href={adjacent.next.href} className="scribekit-docs-prevnext-card scribekit-docs-prevnext-next">
                            <span className="scribekit-docs-prevnext-label">
                                {nextLabel ?? labels.next}
                                <Chevron dir="right" />
                            </span>
                            <span className="scribekit-docs-prevnext-title">{adjacent.next.title}</span>
                        </Link>
                    ) : null}
                </div>
            ) : null}

            {site ? <JsonLd data={docs.docJsonLd(doc)} /> : null}
        </article>
    );

    if (!showToc || toc.length === 0) {
        return article;
    }

    return (
        <div className="scribekit-docs-page">
            {article}
            <DocsToc toc={toc} title={tocTitle ?? labels.onThisPage} />
        </div>
    );
}
