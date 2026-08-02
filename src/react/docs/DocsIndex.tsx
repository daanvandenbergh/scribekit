import { type ElementType, type ReactElement, type ReactNode } from "react";
import type { Docs } from "../../docs/docs.js";
import { docsLabels } from "../shared/i18n.js";
import { JsonLd } from "../shared/JsonLd.js";
import { DocsIcon } from "./internal/icons.js";

/**
 * Props for {@link DocsIndex}.
 */
export interface DocsIndexProps {
    /** The configured `Docs` instance. The nav tree, site config, and SEO are derived from it. */
    docs: Docs;
    /** Which language's docs to list. Defaults to the docs' default locale. */
    lang?: string;
    /** Element used for the card links. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** Hero heading. Defaults to `"<brand> docs"` (or `"Documentation"` when no brand is set). */
    title?: string;
    /** Hero subtitle. Defaults to the site `description`. */
    description?: string;
    /** Replaces the built-in hero entirely (e.g. your own heading + search box). */
    header?: ReactNode;
    /**
     * Optional override for how a page's `icon` name is rendered - used both for a section card's
     * own glyph and for the chip on each of its page rows. Receives the front-matter `icon` value
     * (or `undefined`) and returns the icon node. Defaults to the built-in icon set, which sizes
     * the card glyph at 18px and the row chips at 14px; an override renders at whatever size it
     * chooses, so size it from the CSS box (`.scribekit-docs-section-icon` / `-link-icon`).
     */
    renderIcon?: (name: string | undefined) => ReactNode;
}

/**
 * The docs landing page: a hero (an eyebrow, the title and the site description) followed by a grid
 * of section cards, one per navigation group - an icon and heading above a list of full-bleed rows,
 * one per page, each with its own icon chip - assembled from `docs.getNavTree(lang)`.
 * A server component: pass your configured `Docs` instance and it derives the sections and the SEO
 * JSON-LD (a `CollectionPage` + `BreadcrumbList` + `ItemList`) from `docs.site`. Wrap it with your
 * own navbar/footer; the left `DocsSidebar` from your route layout renders alongside it.
 *
 * @param props - see {@link DocsIndexProps}.
 * @returns the docs index section.
 */
export function DocsIndex({
    docs,
    lang,
    linkComponent: Link = "a",
    title,
    description,
    header,
    renderIcon,
}: DocsIndexProps): ReactElement {
    const resolvedLang = lang ?? docs.defaultLocale;
    const labels = docsLabels(resolvedLang);
    const site = docs.site;
    const nav = docs.getNavTree(resolvedLang);
    const sections = nav.tabs.flatMap((tab) => tab.groups.map((group) => ({ tab, group })));
    // Default to the localized "Documentation" word so a non-English index never shows an English
    // H1; pass `title` (e.g. "<Brand> docs") to override.
    const heroTitle = title ?? labels.title;
    const heroDesc = description ?? site?.description;
    // The eyebrow is the localized "Documentation" word, which is also what `heroTitle` falls back
    // to - so it renders only when the consumer overrode the title (e.g. "<Brand> docs"), never as
    // a label sitting directly above the identical H1.
    const eyebrow = heroTitle === labels.title ? undefined : labels.title;
    const icon = (name: string | undefined, size = 18): ReactNode => (renderIcon ? renderIcon(name) : <DocsIcon name={name} size={size} />);

    return (
        <section className="scribekit-docs-index">
            {header ?? (
                <header className="scribekit-docs-hero">
                    {eyebrow ? <span className="scribekit-docs-hero-eyebrow">{eyebrow}</span> : null}
                    <h1 className="scribekit-docs-hero-title">{heroTitle}</h1>
                    {heroDesc ? <p className="scribekit-docs-hero-desc">{heroDesc}</p> : null}
                </header>
            )}

            <div className="scribekit-docs-sections">
                {sections.map(({ tab, group }, index) => {
                    const heading = group.label || tab.label;
                    return (
                        <div key={`${tab.id}-${group.id}-${index}`} className="scribekit-docs-section-card">
                            <div className="scribekit-docs-section-head">
                                <span className="scribekit-docs-section-icon">{icon(group.items[0]?.icon)}</span>
                                {heading ? <h2 className="scribekit-docs-section-title">{heading}</h2> : null}
                            </div>
                            <ul className="scribekit-docs-section-list">
                                {group.items.map((item) => (
                                    <li key={item.slug}>
                                        <Link href={item.href} className="scribekit-docs-section-link">
                                            <span className="scribekit-docs-section-link-icon">{icon(item.icon, 14)}</span>
                                            <span className="scribekit-docs-section-link-label">{item.label}</span>
                                            <svg
                                                className="scribekit-docs-section-arrow"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={1.7}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                aria-hidden="true"
                                            >
                                                <path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" />
                                            </svg>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {site ? <JsonLd data={docs.indexJsonLd(resolvedLang)} /> : null}
        </section>
    );
}
