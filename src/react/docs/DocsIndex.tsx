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
     * Optional override for how a page's `icon` name is rendered on a section card. Receives the
     * front-matter `icon` value (or `undefined`) and returns the icon node. Defaults to the built-in
     * icon set.
     */
    renderIcon?: (name: string | undefined) => ReactNode;
}

/**
 * The docs landing page: a hero followed by a grid of section cards, one per navigation group
 * (its heading, an icon, and its ordered pages as links), assembled from `docs.getNavTree(lang)`.
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
    const icon = (name: string | undefined): ReactNode => (renderIcon ? renderIcon(name) : <DocsIcon name={name} size={18} />);

    return (
        <section className="scribekit-docs-index">
            {header ?? (
                <header className="scribekit-docs-hero">
                    <h1 className="scribekit-docs-hero-title">{heroTitle}</h1>
                    {heroDesc ? <p className="scribekit-docs-hero-desc">{heroDesc}</p> : null}
                </header>
            )}

            <div className="scribekit-docs-sections">
                {sections.map(({ tab, group }, index) => {
                    const heading = group.label || tab.label;
                    return (
                        <div key={`${tab.id}-${group.id}-${index}`} className="scribekit-docs-section-card">
                            <div className="scribekit-docs-section-icon">{icon(group.items[0]?.icon)}</div>
                            {heading ? <h2 className="scribekit-docs-section-title">{heading}</h2> : null}
                            <ul className="scribekit-docs-section-list">
                                {group.items.map((item) => (
                                    <li key={item.slug}>
                                        <Link href={item.href} className="scribekit-docs-section-link">
                                            <span className="scribekit-docs-section-link-label">{item.label}</span>
                                            <span className="scribekit-docs-section-arrow" aria-hidden="true">
                                                →
                                            </span>
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
