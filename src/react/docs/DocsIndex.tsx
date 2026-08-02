import { type ElementType, type ReactElement, type ReactNode } from "react";
import type { Docs } from "../../docs/docs.js";
import type { NavItem } from "../../docs/types.js";
import { docsLabels } from "../shared/i18n.js";
import { JsonLd } from "../shared/JsonLd.js";
import { DocsHero, type DocsHeroAction } from "./DocsHero.js";
import { DocsRecentlyUpdated, type DocsRecentItem } from "./DocsRecentlyUpdated.js";
import { DocsTopicGrid, type DocsTopic } from "./DocsTopicGrid.js";
import { DocsIcon } from "./internal/icons.js";

/**
 * Props for {@link DocsIndex}.
 */
export interface DocsIndexProps {
    /** The configured `Docs` instance. The topics, the dates and the SEO are derived from it. */
    docs: Docs;
    /** Which language's docs to list. Defaults to the docs' default locale. */
    lang?: string;
    /** Element used for every link. Defaults to `"a"`; pass `next/link` for client-side nav. */
    linkComponent?: ElementType;
    /** Hero heading. Defaults to `"<brand> docs"` (or `"Documentation"` when no brand is set). */
    title?: string;
    /** Hero subtitle. Defaults to the site `description`. */
    description?: string;
    /** Hero call-to-action buttons. None by default - the index does not invent a destination. */
    actions?: DocsHeroAction[];
    /** Replaces the built-in hero entirely (e.g. your own heading + search box). */
    header?: ReactNode;
    /** Rendered between the hero and the topic grid - the slot for your own "start here" band. */
    children?: ReactNode;
    /** Set `false` to drop the hero's article/topic/updated fact row. */
    showStats?: boolean;
    /** Set `false` to drop the topic grid's filter box. */
    filter?: boolean;
    /** How many pages each topic card lists. Defaults to `3`. */
    pagesPerTopic?: number;
    /** How many rows the recently-updated list shows. Defaults to `5`; `0` drops the section. */
    recentCount?: number;
    /** Accent cycle for the topic cards. */
    accents?: string[];
    /**
     * Optional override for how a page's `icon` name is rendered on a topic card. Receives the
     * front-matter `icon` value (or `undefined`) and returns the icon node. Defaults to the
     * built-in icon set. Resolved to an ELEMENT here, before it reaches the client-side grid.
     */
    renderIcon?: (name: string | undefined) => ReactNode;
}

/**
 * Formats an ISO `YYYY-MM-DD` as a short "28 Jul" in the reader's language, in UTC.
 *
 * UTC deliberately: the value is a bare calendar date with no time in it, so letting the runtime's
 * zone interpret it would shift a page dated the 1st back to the 31st for every reader west of
 * Greenwich - a date that is wrong by a day, silently, and only for some people.
 *
 * @param iso - the date string, or undefined.
 * @param lang - the BCP 47 language to format in.
 * @returns the short date, or an empty string when the input is missing or unparseable.
 */
function shortDate(iso: string | undefined, lang: string): string {
    if (!iso) {
        return "";
    }
    const parsed = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }
    return new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", timeZone: "UTC" }).format(parsed);
}

/**
 * The packaged docs landing page: {@link DocsHero}, then anything you pass as `children`, then
 * {@link DocsTopicGrid} and {@link DocsRecentlyUpdated} - every section wired from one `Docs`
 * instance, in the arrangement the components were designed for.
 *
 * This is the CONVENIENCE path, not the only one. Each section is exported on its own and takes
 * plain data, so a consumer who wants their own order, their own extra bands, or only one of the
 * three composes them directly and never renders this. Use `children` for the common case of one
 * hand-built band (a "start here" row) between the hero and the topics.
 *
 * Topics come from the nav tree: one card per GROUP, or per TAB when its groups are unlabelled
 * (the shape a small corpus with no `group:` front-matter has). The card's icon is its first
 * page's, and its blurb is the tab/group config `description`.
 *
 * @param props - see {@link DocsIndexProps}.
 * @returns the docs index page.
 */
export function DocsIndex({
    docs,
    lang,
    linkComponent = "a",
    title,
    description,
    actions,
    header,
    children,
    showStats = true,
    filter = true,
    pagesPerTopic = 3,
    recentCount = 5,
    accents,
    renderIcon,
}: DocsIndexProps): ReactElement {
    const resolvedLang = lang ?? docs.defaultLocale;
    const labels = docsLabels(resolvedLang);
    const site = docs.site;
    const nav = docs.getNavTree(resolvedLang);
    const heroTitle = title ?? labels.title;
    const heroDesc = description ?? site?.description;
    // The eyebrow is the localized "Documentation" word, which `heroTitle` also falls back to - so
    // it renders only when the consumer overrode the title, never above an identical H1.
    const eyebrow = heroTitle === labels.title ? undefined : labels.title;
    const icon = (name: string | undefined): ReactNode => (renderIcon ? renderIcon(name) : <DocsIcon name={name} size={19} />);

    /**
     * One topic per group, falling back to the tab when its groups carry no label of their own -
     * without that fallback a corpus with no `group:` front-matter (every page in the unlabelled
     * bucket) would render a single nameless card.
     */
    const topics: DocsTopic[] = nav.tabs.flatMap((tab) =>
        tab.groups.map((group) => {
            const labelled = group.label !== "";
            const pages = group.items;
            return {
                id: `${tab.id}-${group.id}`,
                title: labelled ? group.label : tab.label,
                description: (labelled ? group.description : tab.description) ?? undefined,
                href: pages[0]?.href ?? "",
                icon: icon(pages[0]?.icon),
                pages: pages.map((item) => ({ title: item.label, href: item.href, description: item.description })),
            } satisfies DocsTopic;
        }),
    );

    const everyPage: NavItem[] = nav.tabs.flatMap((tab) => tab.groups.flatMap((group) => group.items));
    /** Topic title per page href, so a recent row can be tagged without a second pass over the tree. */
    const topicOf = new Map<string, string>();
    topics.forEach((topic) => topic.pages.forEach((page) => topicOf.set(page.href, topic.title)));

    const recent: DocsRecentItem[] = everyPage
        .filter((item) => item.updated)
        .sort((a, b) => (a.updated! < b.updated! ? 1 : -1))
        .slice(0, recentCount)
        .map((item) => ({
            title: item.label,
            href: item.href,
            updatedLabel: shortDate(item.updated, resolvedLang),
            category: topicOf.get(item.href),
        }));

    const newest = everyPage.filter((item) => item.updated).sort((a, b) => (a.updated! < b.updated! ? 1 : -1))[0];
    const stats = showStats
        ? [
              { label: labels.articleCountLabel(everyPage.length) },
              { label: labels.topicCountLabel(topics.length) },
              // Only claim an update date when a page actually declares one.
              ...(newest ? [{ label: labels.updatedLabel(shortDate(newest.updated, resolvedLang)), live: true }] : []),
          ]
        : undefined;

    return (
        <div className="scribekit-docs-index">
            {header ?? (
                <DocsHero
                    title={heroTitle}
                    description={heroDesc}
                    eyebrow={eyebrow}
                    actions={actions}
                    stats={stats}
                    linkComponent={linkComponent}
                />
            )}

            {children}

            <DocsTopicGrid
                topics={topics}
                labels={{
                    heading: labels.browseByTopic,
                    filterPlaceholder: labels.filterPages,
                    clearFilter: labels.clearFilter,
                    pageCount: labels.pageCountLabel,
                    resultCount: labels.resultCountLabel,
                    noMatches: labels.noMatchesLabel,
                }}
                pagesPerTopic={pagesPerTopic}
                filter={filter}
                accents={accents}
                linkComponent={linkComponent}
            />

            <DocsRecentlyUpdated items={recent} heading={labels.recentlyUpdated} linkComponent={linkComponent} />

            {site ? <JsonLd data={docs.indexJsonLd(resolvedLang)} /> : null}
        </div>
    );
}
