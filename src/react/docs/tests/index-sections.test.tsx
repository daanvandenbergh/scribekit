/**
 * Unit tests for the three standalone docs-index sections - {@link DocsHero},
 * {@link DocsTopicGrid} and {@link DocsRecentlyUpdated} - plus the pure matching rule behind the
 * topic filter.
 *
 * They are tested apart from `DocsIndex` on purpose: the whole reason they are exported
 * individually is that a consumer assembles their own index page out of them, passing plain data
 * and never touching a `Docs` instance. These render them exactly that way.
 *
 * The filter's DECISION lives in `internal/topic-filter.ts` precisely so it can be tested here,
 * in the package's plain Node environment, without pulling in jsdom and Testing Library just to
 * type into a box. The component is asserted on the markup it renders before any typing.
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { DocsHero } from "../DocsHero.js";
import { DocsRecentlyUpdated } from "../DocsRecentlyUpdated.js";
import { DocsTopicGrid, type DocsTopic } from "../DocsTopicGrid.js";
import { fillTemplate, normalizeQuery, pageMatchesQuery } from "../internal/topic-filter.js";

/** Two topics whose pages differ enough for the filter to discriminate between them. */
const TOPICS: DocsTopic[] = [
    {
        id: "start",
        title: "Get started",
        href: "/docs/forwarding",
        description: "Forwarding and calendars.",
        pages: [
            { title: "Set up call forwarding", href: "/docs/forwarding", description: "One code on your handset." },
            { title: "Connect your calendar", href: "/docs/calendar", description: "Google or Outlook." },
            { title: "Place a test call", href: "/docs/test-call", description: "Ring your own number." },
            { title: "A fourth page", href: "/docs/fourth", description: "Beyond the default cap." },
        ],
    },
    {
        id: "billing",
        title: "Billing",
        href: "/docs/invoices",
        pages: [{ title: "Invoices and VAT", href: "/docs/invoices", description: "Per-country VAT handling." }],
    },
];

describe("DocsHero", () => {
    it("renders the title alone when nothing else is given", () => {
        const html = renderToStaticMarkup(<DocsHero title="SwiftGuard docs" />);
        expect(html).toContain("SwiftGuard docs");
        expect(html).not.toContain("scribekit-docs-hero-eyebrow");
        expect(html).not.toContain("scribekit-docs-hero-actions");
        expect(html).not.toContain("scribekit-docs-hero-stats");
    });

    it("is plain by default, with no card chrome in the tree at all", () => {
        const html = renderToStaticMarkup(<DocsHero title="Docs" />);
        expect(html).not.toContain("is-card");
        // The decorative layers are absolutely-positioned inside a bounded surface. Left in the
        // tree for a plain hero they paint a stray gradient bar across the top of the page, so
        // they must be ABSENT, not merely unstyled.
        expect(html).not.toContain("scribekit-docs-hero-glow");
        expect(html).not.toContain("scribekit-docs-hero-grid");
        expect(html).not.toContain("scribekit-docs-hero-rule");
    });

    it("adds the card chrome only when asked", () => {
        const html = renderToStaticMarkup(<DocsHero title="Docs" variant="card" />);
        expect(html).toContain("is-card");
        expect(html).toContain("scribekit-docs-hero-glow");
        expect(html).toContain("scribekit-docs-hero-grid");
        expect(html).toContain("scribekit-docs-hero-rule");
    });

    it("keeps a consumer className alongside the variant class", () => {
        const html = renderToStaticMarkup(<DocsHero title="Docs" variant="card" className="my-hero" />);
        expect(html).toContain("scribekit-docs-hero is-card my-hero");
    });

    it("makes the first action primary and the rest secondary, without being told", () => {
        const html = renderToStaticMarkup(
            <DocsHero
                title="Docs"
                actions={[
                    { label: "Quickstart", href: "/docs/quickstart" },
                    { label: "Watch a call", href: "/#showcase" },
                ]}
            />,
        );
        expect(html).toContain("scribekit-docs-hero-action is-primary");
        expect(html).toContain("scribekit-docs-hero-action is-secondary");
        expect(html.match(/is-primary/g)).toHaveLength(1);
    });

    it("honours an explicit variant on the first action", () => {
        const html = renderToStaticMarkup(
            <DocsHero title="Docs" actions={[{ label: "Browse", href: "/docs", variant: "secondary" }]} />,
        );
        expect(html).not.toContain("is-primary");
        expect(html).toContain("is-secondary");
    });

    it("separates stats but never puts a separator before the first", () => {
        const html = renderToStaticMarkup(
            <DocsHero
                title="Docs"
                stats={[{ label: "19 articles" }, { label: "7 topics" }, { label: "Updated 28 Jul", live: true }]}
            />,
        );
        // Three stats, two separators - a leading one would read as a dangling bullet.
        expect(html.match(/scribekit-docs-hero-stat-sep/g)).toHaveLength(2);
        expect(html.match(/scribekit-docs-hero-stat-dot/g)).toHaveLength(1);
    });

    it("renders children after the stat row", () => {
        const html = renderToStaticMarkup(
            <DocsHero title="Docs" stats={[{ label: "1 article" }]}>
                <span data-extra="">extra</span>
            </DocsHero>,
        );
        expect(html.indexOf("scribekit-docs-hero-stats")).toBeLessThan(html.indexOf("data-extra"));
    });
});

describe("DocsRecentlyUpdated", () => {
    it("renders nothing at all when there is nothing to list", () => {
        // An empty heading over an empty list is worse than no section.
        expect(renderToStaticMarkup(<DocsRecentlyUpdated items={[]} />)).toBe("");
    });

    it("renders the rows exactly as given, in the order given", () => {
        const html = renderToStaticMarkup(
            <DocsRecentlyUpdated
                heading="Recently updated"
                items={[
                    { title: "Second", href: "/b", updatedLabel: "1 Jan" },
                    { title: "First", href: "/a", updatedLabel: "28 Jul", category: "Billing", accent: "#c4699e" },
                ]}
            />,
        );
        // No sorting of its own: "recent" is the caller's decision about their corpus.
        expect(html.indexOf("Second")).toBeLessThan(html.indexOf("First"));
        expect(html).toContain("28 Jul");
        expect(html).toContain("Billing");
        expect(html).toContain("#c4699e");
    });

    it("omits the tag when a row has no category", () => {
        const html = renderToStaticMarkup(<DocsRecentlyUpdated items={[{ title: "A", href: "/a", updatedLabel: "1 Jan" }]} />);
        expect(html).not.toContain("scribekit-docs-recent-tag");
    });
});

describe("DocsTopicGrid", () => {
    it("caps the pages each card lists", () => {
        const html = renderToStaticMarkup(<DocsTopicGrid topics={TOPICS} />);
        expect(html).toContain("Set up call forwarding");
        // The fourth page is past the default cap of 3 - the filter is how a reader reaches it.
        expect(html).not.toContain("A fourth page");
    });

    it("counts EVERY page in the footer link, not just the visible ones", () => {
        const html = renderToStaticMarkup(<DocsTopicGrid topics={TOPICS} />);
        // 4, not the 3 shown: the count promises what is behind the link.
        expect(html).toContain("4 pages");
    });

    it("prefers a topic's own countLabel over the built-in fallback", () => {
        const html = renderToStaticMarkup(<DocsTopicGrid topics={[{ ...TOPICS[0]!, countLabel: "4 pagina’s" }]} />);
        expect(html).toContain("4 pagina’s");
        expect(html).not.toContain("4 pages");
    });

    it("keeps every label serializable, so a SERVER page can render this client component", () => {
        // The whole label surface must survive the server/client boundary: a `(count) => string`
        // here threw "Functions cannot be passed directly to Client Components" at render time,
        // which no type check and no static-markup test catches.
        const labels = {
            heading: "Browse",
            filterPlaceholder: "Filter",
            clearFilter: "Clear",
            resultCount: "{count} match “{query}”",
            resultCountOne: "1 matches “{query}”",
            noMatches: "Nothing matches “{query}”",
            noMatchesHint: "Try something else.",
        };
        for (const value of Object.values(labels)) {
            expect(typeof value).toBe("string");
        }
        expect(() => JSON.stringify(labels)).not.toThrow();
        expect(renderToStaticMarkup(<DocsTopicGrid topics={TOPICS} labels={labels} />)).toContain("Browse");
    });

    it("honours pagesPerTopic", () => {
        const html = renderToStaticMarkup(<DocsTopicGrid topics={TOPICS} pagesPerTopic={1} />);
        expect(html).toContain("Set up call forwarding");
        expect(html).not.toContain("Connect your calendar");
    });

    it("renders the filter by default and drops it when asked", () => {
        expect(renderToStaticMarkup(<DocsTopicGrid topics={TOPICS} />)).toContain("scribekit-docs-topics-filter");
        expect(renderToStaticMarkup(<DocsTopicGrid topics={TOPICS} filter={false} />)).not.toContain("scribekit-docs-topics-filter");
    });

    it("shows the topic grid, not a result list, before anything is typed", () => {
        const html = renderToStaticMarkup(<DocsTopicGrid topics={TOPICS} />);
        expect(html).toContain("scribekit-docs-topic-grid");
        expect(html).not.toContain("scribekit-docs-results");
    });

    it("cycles the accent palette and lets a topic override it", () => {
        const html = renderToStaticMarkup(
            <DocsTopicGrid topics={[TOPICS[0]!, { ...TOPICS[1]!, accent: "#00ff00" }]} accents={["#111111"]} />,
        );
        // A one-colour palette wraps rather than running off the end into `undefined`.
        expect(html).toContain("#111111");
        expect(html).toContain("#00ff00");
    });

    it("falls back to the built-in palette when handed an empty accent list", () => {
        // `accents[index % 0]` is NaN -> undefined; rendering that would drop every tint on the card.
        const html = renderToStaticMarkup(<DocsTopicGrid topics={TOPICS} accents={[]} />);
        expect(html).toContain("--scribekit-topic-accent");
        expect(html).not.toContain("--scribekit-topic-accent:undefined");
    });

    it("renders a topic with no pages without a page list", () => {
        const html = renderToStaticMarkup(<DocsTopicGrid topics={[{ id: "x", title: "Empty", href: "/x", pages: [] }]} />);
        expect(html).not.toContain("scribekit-docs-topic-pages");
        expect(html).toContain("Empty");
    });

    it("omits the blurb and the icon when a topic declares neither", () => {
        const html = renderToStaticMarkup(<DocsTopicGrid topics={[{ id: "x", title: "Bare", href: "/x", pages: [] }]} />);
        expect(html).not.toContain("scribekit-docs-topic-blurb");
        expect(html).not.toContain("scribekit-docs-topic-icon");
    });
});

describe("the topic filter's matching rule", () => {
    const page = TOPICS[0]!.pages[1]!; // "Connect your calendar" / "Google or Outlook."

    it("normalises case and surrounding whitespace", () => {
        expect(normalizeQuery("  VAT  ")).toBe("vat");
        expect(normalizeQuery("Outlook")).toBe("outlook");
    });

    it("treats a whitespace-only query as no query at all", () => {
        // Not "a query that matches nothing": the reader has not asked for anything yet, so the
        // caller shows the grid rather than "0 pages match".
        expect(normalizeQuery("   ")).toBe("");
        expect(normalizeQuery("")).toBe("");
    });

    it("never matches on an empty needle", () => {
        expect(pageMatchesQuery(page, "Get started", "")).toBe(false);
    });

    it("matches the page's own title", () => {
        expect(pageMatchesQuery(page, "Get started", "calendar")).toBe(true);
    });

    it("matches the page's description", () => {
        // "Outlook" appears nowhere but the description.
        expect(pageMatchesQuery(page, "Get started", "outlook")).toBe(true);
    });

    it("matches the TOPIC's title, so a page is findable by a word it never says", () => {
        const invoices = TOPICS[1]!.pages[0]!;
        expect(invoices.title.toLowerCase()).not.toContain("billing");
        expect(pageMatchesQuery(invoices, "Billing", "billing")).toBe(true);
    });

    it("matches a substring from the middle of a title, not just a prefix", () => {
        expect(pageMatchesQuery(page, "Get started", "nect your")).toBe(true);
    });

    it("tolerates a page with no description", () => {
        // Concatenating `undefined` would make "undefined" itself a matching term.
        const bare = { title: "Plain", href: "/p" };
        expect(pageMatchesQuery(bare, "Topic", "plain")).toBe(true);
        expect(pageMatchesQuery(bare, "Topic", "undefined")).toBe(false);
    });

    it("does not match an unrelated query", () => {
        expect(pageMatchesQuery(page, "Get started", "xyzzy")).toBe(false);
    });
});

describe("the label templates", () => {
    it("substitutes every placeholder", () => {
        expect(fillTemplate("{count} pages match “{query}”", { count: 3, query: "vat" })).toBe("3 pages match “vat”");
    });

    it("substitutes the same placeholder more than once", () => {
        expect(fillTemplate("{q} and {q}", { q: "x" })).toBe("x and x");
    });

    it("leaves an unknown placeholder verbatim rather than blanking it", () => {
        // A typo should be visible on the page, not silently swallow the number.
        expect(fillTemplate("{cont} pages", { count: 3 })).toBe("{cont} pages");
    });

    it("leaves a template with no placeholders untouched", () => {
        expect(fillTemplate("Nothing matches", { query: "x" })).toBe("Nothing matches");
    });

    it("does not treat a value's own braces as a further placeholder", () => {
        // The query is reader-supplied; a `{count}` typed into the filter box must stay literal.
        expect(fillTemplate("Nothing matches “{query}”", { query: "{count}", count: 9 })).toBe("Nothing matches “{count}”");
    });

    it("renders a zero count rather than dropping it as falsy", () => {
        expect(fillTemplate("{count} pages match “{query}”", { count: 0, query: "x" })).toBe("0 pages match “x”");
    });
});
