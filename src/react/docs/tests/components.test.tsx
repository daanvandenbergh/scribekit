import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

// Replace the RSC MDX compiler with a synchronous stub so the (otherwise async) DocsPage tree can
// be rendered with renderToStaticMarkup; the stub echoes `source` so we can assert the MDX body
// was passed through.
import { vi } from "vitest";
vi.mock("next-mdx-remote/rsc", async () => {
    const { jsx } = await import("react/jsx-runtime");
    return {
        MDXRemote: (props: { source: string }) => jsx("pre", { "data-testid": "mdx", children: props.source }),
    };
});

import { DocsPage } from "../DocsPage.js";
import { DocsIndex } from "../DocsIndex.js";
import { DocsNavbar } from "../DocsNavbar.js";
import { DocsNavbarButton } from "../DocsNavbarButton.js";
import { DocsTabs } from "../DocsTabs.js";
import { DocsSidebar } from "../DocsSidebar.js";
import { DocsLanguagePicker } from "../DocsLanguagePicker.js";
import { DocsToc } from "../DocsToc.js";
import { DocsSearchProvider } from "../DocsSearchProvider.js";
import { DocsSearchButton } from "../DocsSearchButton.js";
import { DocsFeedback } from "../DocsFeedback.js";
import { formatDate } from "../../../shared/format.js";
import type { Docs } from "../../../docs/docs.js";
import type { Adjacent, Breadcrumb, Doc, NavTree, SiteConfig, TocEntry } from "../../../docs/types.js";

/** A parsed doc with an updated date, group, and icon. */
const DOC: Doc = {
    meta: {
        slug: "greeting-and-voice",
        lang: "en",
        title: "Greeting & voice",
        description: "Shape the first thing every caller hears.",
        tab: "Documentation",
        group: "Configuration",
        order: 2,
        icon: "voice",
        updated: "2026-07-03",
        readingTime: 4,
    },
    content: "MDX_DOC_BODY",
};

/** Breadcrumb for the doc: tab > group > page. */
const BREADCRUMB: Breadcrumb = {
    tab: "Documentation",
    group: "Configuration",
    title: "Greeting & voice",
    segments: [{ label: "Documentation" }, { label: "Configuration" }, { label: "Greeting & voice" }],
};

/** The doc's heading minimap. */
const TOC: TocEntry[] = [
    { depth: 2, text: "Overview", id: "overview" },
    { depth: 3, text: "Setting your greeting", id: "setting-your-greeting" },
];

/** Prev/next around the doc in reading order. */
const ADJACENT: Adjacent = {
    prev: { slug: "call-forwarding", title: "Call forwarding", label: "Call forwarding", href: "/docs/call-forwarding", lang: "en" },
    next: { slug: "availability", title: "Availability", label: "Availability", href: "/docs/availability", lang: "en" },
};

/** A two-tab nav tree spanning Documentation (2 groups) and Integrations (ungrouped). */
const NAV: NavTree = {
    multiTab: true,
    tabs: [
        {
            id: "Documentation",
            label: "Documentation",
            groups: [
                {
                    id: "Get started",
                    label: "Get started",
                    items: [
                        { slug: "introduction", title: "Introduction", label: "Introduction", icon: "book", href: "/docs/introduction", lang: "en", tab: "Documentation", group: "Get started" },
                        { slug: "quickstart", title: "Quickstart", label: "Quickstart", icon: "rocket", href: "/docs/quickstart", lang: "en", tab: "Documentation", group: "Get started" },
                    ],
                },
                {
                    id: "Configuration",
                    label: "Configuration",
                    items: [
                        { slug: "call-forwarding", title: "Call forwarding", label: "Call forwarding", icon: "phone", href: "/docs/call-forwarding", lang: "en", tab: "Documentation", group: "Configuration" },
                        { slug: "greeting-and-voice", title: "Greeting & voice", label: "Greeting & voice", icon: "voice", href: "/docs/greeting-and-voice", lang: "en", tab: "Documentation", group: "Configuration" },
                    ],
                },
            ],
        },
        {
            id: "Integrations",
            label: "Integrations",
            groups: [
                {
                    id: "",
                    label: "",
                    items: [
                        { slug: "google-calendar", title: "Google Calendar", label: "Google Calendar", icon: "calendar", href: "/docs/google-calendar", lang: "en", tab: "Integrations" },
                    ],
                },
            ],
        },
    ],
};

/** Site config so JSON-LD renders. */
const SITE: SiteConfig = { siteUrl: "https://example.com", brandName: "SwiftGuard", description: "The SwiftGuard documentation." };

/**
 * Builds a minimal fake `Docs` (no filesystem) exposing only what the components call.
 *
 * @param overrides - members to override on the fake.
 * @returns a `Docs`-typed stub.
 */
function fakeDocs(overrides: Partial<Docs> = {}): Docs {
    const locale = "en-GB";
    return {
        getDoc: (_slug: string, _lang?: string) => DOC,
        getBreadcrumb: (_slug: string, _lang?: string) => BREADCRUMB,
        tableOfContents: (_doc: Doc) => TOC,
        getAdjacent: (_slug: string, _lang?: string) => ADJACENT,
        getNavTree: (_lang?: string) => NAV,
        readingMinutes: (_doc: Doc) => 4,
        formatDate: (iso: string, _lang?: string) => formatDate(iso, locale),
        dateLocale: (_lang?: string) => locale,
        docJsonLd: (_doc: Doc) => ({ "@context": "https://schema.org", "@graph": [{ "@type": "TechArticle", headline: "Greeting & voice" }] }),
        indexJsonLd: (_lang?: string) => ({ "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage" }] }),
        defaultLocale: "en",
        locale,
        locales: [],
        prefixDefaultLocale: false,
        site: SITE,
        ...overrides,
    } as unknown as Docs;
}

describe("DocsPage", () => {
    it("renders breadcrumb, title, lead, meta, MDX body, feedback, prev/next, ToC and JSON-LD", () => {
        const html = renderToStaticMarkup(<DocsPage docs={fakeDocs()} slug="greeting-and-voice" />);
        // breadcrumb
        expect(html).toContain("Documentation");
        expect(html).toContain("Configuration");
        // title + lead
        expect(html).toContain("Greeting &amp; voice");
        expect(html).toContain("Shape the first thing every caller hears.");
        // meta row
        expect(html).toContain("4 min read");
        expect(html).toContain("Updated 3 July 2026");
        // body
        expect(html).toContain("MDX_DOC_BODY");
        // feedback
        expect(html).toContain("Was this page helpful?");
        // prev / next
        expect(html).toContain("Previous");
        expect(html).toContain("Next");
        expect(html).toContain('href="/docs/call-forwarding"');
        expect(html).toContain("Call forwarding");
        expect(html).toContain('href="/docs/availability"');
        expect(html).toContain("Availability");
        // ToC (reused BlogSidebar scroll-spy)
        expect(html).toContain("On this page");
        expect(html).toContain('href="#overview"');
        expect(html).toContain('href="#setting-your-greeting"');
        // breadcrumb current segment marked for AT
        expect(html).toContain('aria-current="page"');
        // JSON-LD
        expect(html).toContain("application/ld+json");
        expect(html).toContain("TechArticle");
    });

    it("omits the JSON-LD script when the docs have no site config", () => {
        const html = renderToStaticMarkup(<DocsPage docs={fakeDocs({ site: undefined })} slug="greeting-and-voice" />);
        expect(html).not.toContain("application/ld+json");
    });

    it("omits the ToC (renders article-only) when showToc is false", () => {
        const html = renderToStaticMarkup(<DocsPage docs={fakeDocs()} slug="greeting-and-voice" showToc={false} />);
        expect(html).not.toContain("scribekit-docs-page");
        expect(html).not.toContain("On this page");
        expect(html).toContain("Greeting &amp; voice");
    });

    it("omits the ToC when the doc has no headings", () => {
        const html = renderToStaticMarkup(<DocsPage docs={fakeDocs({ tableOfContents: () => [] })} slug="greeting-and-voice" />);
        expect(html).not.toContain("scribekit-docs-page");
        expect(html).not.toContain("On this page");
    });

    it("omits the breadcrumb when showBreadcrumb is false", () => {
        const html = renderToStaticMarkup(<DocsPage docs={fakeDocs()} slug="greeting-and-voice" showBreadcrumb={false} />);
        expect(html).not.toContain("scribekit-doc-breadcrumb");
    });

    it("omits the feedback widget when showFeedback is false", () => {
        const html = renderToStaticMarkup(<DocsPage docs={fakeDocs()} slug="greeting-and-voice" showFeedback={false} />);
        expect(html).not.toContain("Was this page helpful?");
    });

    it("renders a right-aligned spacer when there is no previous page", () => {
        const html = renderToStaticMarkup(
            <DocsPage docs={fakeDocs({ getAdjacent: () => ({ next: ADJACENT.next }) })} slug="introduction" />,
        );
        expect(html).toContain("scribekit-docs-prevnext-spacer");
        expect(html).toContain("Availability");
        expect(html).not.toContain("Call forwarding");
    });

    it("omits the prev/next row entirely when there is neither", () => {
        const html = renderToStaticMarkup(<DocsPage docs={fakeDocs({ getAdjacent: () => ({}) })} slug="only" />);
        expect(html).not.toContain("scribekit-docs-prevnext");
    });

    it("omits the updated meta when the doc has no updated date", () => {
        const noUpdated: Doc = { ...DOC, meta: { ...DOC.meta, updated: undefined } };
        const html = renderToStaticMarkup(<DocsPage docs={fakeDocs({ getDoc: () => noUpdated })} slug="greeting-and-voice" />);
        expect(html).not.toContain("Updated");
        expect(html).toContain("4 min read");
    });

    it("localizes the built-in UI copy to the lang prop (no English on /fr/docs)", () => {
        const html = renderToStaticMarkup(<DocsPage docs={fakeDocs()} slug="greeting-and-voice" lang="fr" />);
        expect(html).toContain("Cette page vous a-t-elle été utile ?"); // feedback
        expect(html).toContain("Précédent"); // prev
        expect(html).toContain("Suivant"); // next
        expect(html).toContain("Mis à jour le"); // updated
        expect(html).toContain("Sur cette page"); // ToC heading
        expect(html).toContain("min de lecture"); // reading time
        expect(html).not.toContain("Was this page helpful?");
        expect(html).not.toContain("On this page");
    });

    it("honours custom label overrides", () => {
        const html = renderToStaticMarkup(
            <DocsPage
                docs={fakeDocs()}
                slug="greeting-and-voice"
                tocTitle="Contents"
                previousLabel="Back"
                nextLabel="Forward"
                feedbackQuestion="Useful?"
                readingLabel={(m) => `${m} minuten`}
            />,
        );
        expect(html).toContain("Contents");
        expect(html).toContain("Back");
        expect(html).toContain("Forward");
        expect(html).toContain("Useful?");
        expect(html).toContain("4 minuten");
    });
});

describe("DocsTabs", () => {
    it("renders each tab as a link to its section's first page, highlighting the owning tab", () => {
        const html = renderToStaticMarkup(<DocsTabs nav={NAV} activePath="/docs/greeting-and-voice" />);
        // both tabs render, each linking to its first page
        expect(html).toContain("Documentation");
        expect(html).toContain("Integrations");
        expect(html).toContain('href="/docs/introduction"'); // Documentation's first page
        expect(html).toContain('href="/docs/google-calendar"'); // Integrations' first page
        // the tab owning the active page is current
        expect(html).toContain('aria-current="page"');
        expect(html).toContain("scribekit-docs-tab is-active");
    });

    it("renders nothing for a single-tab tree", () => {
        const single: NavTree = { multiTab: false, tabs: [NAV.tabs[0]] };
        expect(renderToStaticMarkup(<DocsTabs nav={single} activePath="/docs/quickstart" />)).toBe("");
    });

    it("localizes the fallback tab label / aria label to the lang prop", () => {
        // A tree whose tab has an empty label falls back to the localized "Documentation".
        const nav: NavTree = { multiTab: true, tabs: [{ id: "", label: "", groups: NAV.tabs[0].groups }, NAV.tabs[1]] };
        const html = renderToStaticMarkup(<DocsTabs nav={nav} lang="nl" />);
        expect(html).toContain("Documentatie");
    });
});

describe("DocsSidebar", () => {
    it("renders the active tab's groups and items; highlights the active page", () => {
        const html = renderToStaticMarkup(<DocsSidebar nav={NAV} activePath="/docs/greeting-and-voice" />);
        // the tab switcher lives in DocsTabs and search in the navbar/provider, not the sidebar
        expect(html).not.toContain('role="tablist"');
        expect(html).not.toContain("scribekit-docs-search-trigger");
        expect(html).not.toContain('role="dialog"');
        // the active page's tab (Documentation) groups + items
        expect(html).toContain("Get started");
        expect(html).toContain("Configuration");
        expect(html).toContain('href="/docs/introduction"');
        expect(html).toContain('href="/docs/greeting-and-voice"');
        // active item marked
        expect(html).toContain("scribekit-docs-navitem is-active");
        expect(html).toContain('aria-current="page"');
        // the other tab's page is not shown (Integrations tab is not active)
        expect(html).not.toContain('href="/docs/google-calendar"');
    });

    it("shows the groups of the tab that owns the active page", () => {
        const html = renderToStaticMarkup(<DocsSidebar nav={NAV} activePath="/docs/google-calendar" />);
        expect(html).toContain('href="/docs/google-calendar"');
        // the Documentation tab's pages are not shown while an Integrations page is active
        expect(html).not.toContain('href="/docs/introduction"');
    });

    it("falls back to the first tab's groups when there is no active page (e.g. the index)", () => {
        const html = renderToStaticMarkup(<DocsSidebar nav={NAV} />);
        expect(html).toContain('href="/docs/introduction"');
        expect(html).not.toContain('href="/docs/google-calendar"');
    });

    it("localizes the built-in nav label (mobile toggle / aria) to the lang prop", () => {
        const html = renderToStaticMarkup(<DocsSidebar nav={NAV} lang="nl" />);
        expect(html).toContain("Documentatie"); // the localized default nav label, not English "Documentation"
    });

    it("uses a custom link component", () => {
        const Link = (props: { href: string; children: unknown }) => (
            <a data-custom-link="" href={props.href}>
                {props.children as never}
            </a>
        );
        const html = renderToStaticMarkup(<DocsSidebar nav={NAV} activePath="/docs/quickstart" linkComponent={Link} />);
        expect(html).toContain("data-custom-link");
    });

    // Standalone: no provider, so no hamburger exists anywhere to open it. It MUST keep its own
    // inline toggle, or such a consumer has no way to reach the nav on a phone at all.
    it("keeps its self-contained inline toggle when rendered without a provider", () => {
        const html = renderToStaticMarkup(<DocsSidebar nav={NAV} />);
        expect(html).toContain("scribekit-docs-nav-toggle");
        expect(html).not.toContain("is-drawer");
        expect(html).not.toContain("scribekit-docs-nav-head");
        expect(html).not.toContain("scribekit-docs-nav-backdrop");
    });

    it("becomes a drawer under a provider: header + close button instead of the inline toggle", () => {
        const html = renderToStaticMarkup(
            <DocsSearchProvider nav={NAV}>
                <DocsSidebar nav={NAV} />
            </DocsSearchProvider>,
        );
        expect(html).toContain("is-drawer");
        expect(html).toContain("scribekit-docs-nav-head");
        expect(html).toContain('aria-label="Close navigation"');
        expect(html).not.toContain("scribekit-docs-nav-toggle");
        // Closed on first paint: no backdrop, and the panel is not marked open.
        expect(html).not.toContain("scribekit-docs-nav-backdrop");
        expect(html).not.toContain("scribekit-docs-nav is-drawer is-open");
    });

    it("localizes the drawer's close button", () => {
        const html = renderToStaticMarkup(
            <DocsSearchProvider nav={NAV} lang="nl">
                <DocsSidebar nav={NAV} lang="nl" />
            </DocsSearchProvider>,
        );
        expect(html).toContain('aria-label="Navigatie sluiten"');
    });

    it("puts the brand lockup and a search field at the top of the drawer", () => {
        const html = renderToStaticMarkup(
            <DocsSearchProvider nav={NAV}>
                <DocsSidebar nav={NAV} brand={<span data-brand="">Scribekit</span>} />
            </DocsSearchProvider>,
        );
        expect(html).toContain("data-brand");
        // The brand REPLACES the plain "Documentation" title when one is given.
        expect(html).not.toContain("scribekit-docs-nav-head-title");
        expect(html).toContain("scribekit-docs-nav-search");
        // Brand first, then search, then the nav groups.
        expect(html.indexOf("data-brand")).toBeLessThan(html.indexOf("scribekit-docs-nav-search"));
        expect(html.indexOf("scribekit-docs-nav-search")).toBeLessThan(html.indexOf("scribekit-docs-group-items"));
    });

    it("falls back to the nav label when no brand is given, and drops the search on showSearch={false}", () => {
        const html = renderToStaticMarkup(
            <DocsSearchProvider nav={NAV}>
                <DocsSidebar nav={NAV} showSearch={false} />
            </DocsSearchProvider>,
        );
        expect(html).toContain("scribekit-docs-nav-head-title");
        expect(html).toContain("Documentation");
        expect(html).not.toContain("scribekit-docs-nav-search");
    });

    it("adds no drawer brand or search to a standalone (non-drawer) sidebar", () => {
        const html = renderToStaticMarkup(<DocsSidebar nav={NAV} brand={<span data-brand="">Scribekit</span>} />);
        expect(html).not.toContain("data-brand");
        expect(html).not.toContain("scribekit-docs-nav-search");
    });

    it("renders the footer slot below the groups, and nothing when it is omitted", () => {
        const withFooter = renderToStaticMarkup(
            <DocsSidebar nav={NAV} footer={<span data-foot="">Language</span>} />,
        );
        expect(withFooter).toContain("scribekit-docs-nav-foot");
        expect(withFooter).toContain("data-foot");
        // The footer follows the groups - it is the drawer's foot, not a second header.
        expect(withFooter.indexOf("scribekit-docs-group-items")).toBeLessThan(
            withFooter.indexOf("scribekit-docs-nav-foot"),
        );
        expect(renderToStaticMarkup(<DocsSidebar nav={NAV} />)).not.toContain("scribekit-docs-nav-foot");
    });
});

describe("DocsNavbar", () => {
    // The hamburger must be in the SERVED HTML, not added by an effect after hydration - otherwise
    // it pops into the bar on every docs page load, and is missing entirely if hydration fails.
    it("renders the nav-drawer hamburger inside a provider, on the server", () => {
        const html = renderToStaticMarkup(
            <DocsSearchProvider nav={NAV}>
                <DocsNavbar brandName="Scribekit" />
            </DocsSearchProvider>,
        );
        expect(html).toContain("scribekit-docs-navbar-burger");
        expect(html).toContain('aria-controls="scribekit-docs-nav-body"');
        expect(html).toContain('aria-label="Open navigation"');
        expect(html).toContain('aria-expanded="false"');
        // The bars are decoration; the button carries the accessible name.
        expect(html).toContain("scribekit-docs-burger-bar");
        // ORDER: brand, then search, then the hamburger LAST - the phone bar reads left to right and
        // the menu button belongs at the outside edge, under the thumb.
        expect(html.indexOf("scribekit-docs-navbar-brand")).toBeLessThan(html.indexOf("scribekit-docs-navbar-search"));
        expect(html.indexOf("scribekit-docs-navbar-search")).toBeLessThan(html.indexOf("scribekit-docs-navbar-burger"));
    });

    it("omits the hamburger without a provider (nothing owns the drawer state)", () => {
        const html = renderToStaticMarkup(<DocsNavbar brandName="Scribekit" />);
        expect(html).not.toContain("scribekit-docs-navbar-burger");
    });

    it("omits the hamburger when showNavToggle is false (navbar used without a sidebar)", () => {
        const html = renderToStaticMarkup(
            <DocsSearchProvider nav={NAV}>
                <DocsNavbar brandName="Scribekit" showNavToggle={false} />
            </DocsSearchProvider>,
        );
        expect(html).not.toContain("scribekit-docs-navbar-burger");
    });

    it("localizes the hamburger's accessible name", () => {
        const html = renderToStaticMarkup(
            <DocsSearchProvider nav={NAV} lang="nl">
                <DocsNavbar brandName="Scribekit" lang="nl" />
            </DocsSearchProvider>,
        );
        expect(html).toContain('aria-label="Navigatie openen"');
    });


    it("renders the logo (sized), brand name, Docs pill, centered search and the actions list", () => {
        const html = renderToStaticMarkup(
            <DocsNavbar
                logo={<svg data-logo="" />}
                logoSize={26}
                brandName="Scribekit"
                docsText="Docs"
                actions={[
                    <DocsNavbarButton key="s" href="/support">Support</DocsNavbarButton>,
                    <DocsNavbarButton key="d" href="/dashboard" variant="primary">Dashboard</DocsNavbarButton>,
                ]}
            />,
        );
        expect(html).toContain("scribekit-docs-navbar");
        expect(html).toContain("data-logo"); // the logo node
        expect(html).toContain("height:26px"); // logoSize applied to the wrapper
        expect(html).toContain("Scribekit"); // brand name
        expect(html).toContain("scribekit-docs-navbar-pill");
        expect(html).toContain(">Docs<"); // the pill text
        expect(html).toContain("scribekit-docs-search-trigger"); // centered search
        // the actions row, with each DocsNavbarButton variant
        expect(html).toContain("scribekit-docs-navbar-right");
        expect(html).toContain('href="/support"');
        expect(html).toContain("scribekit-docs-navbar-btn-link");
        expect(html).toContain('href="/dashboard"');
        expect(html).toContain("scribekit-docs-navbar-btn-primary");
    });

    it("omits the actions row when none are given", () => {
        const html = renderToStaticMarkup(<DocsNavbar brandName="Scribekit" />);
        expect(html).not.toContain("scribekit-docs-navbar-right");
    });

    it("hides the Docs pill when docsText is empty and the search when showSearch is false", () => {
        const html = renderToStaticMarkup(<DocsNavbar brandName="Scribekit" docsText="" showSearch={false} />);
        expect(html).not.toContain("scribekit-docs-navbar-pill");
        expect(html).not.toContain("scribekit-docs-search-trigger");
        expect(html).toContain("scribekit-docs-navbar-spacer"); // spacer replaces the search
    });

    it("localizes the search placeholder via lang", () => {
        const html = renderToStaticMarkup(<DocsNavbar brandName="Scribekit" lang="fr" />);
        expect(html).toContain("Rechercher dans la doc…");
    });

    /*
     * The auto-hide starts OFF, so the served HTML always carries the actions and the first paint on
     * a wide screen is already correct. Flipping the initial state to `true` would look harmless -
     * the effect corrects it a frame later - but it would blank the CTA out of every crawler's copy
     * of the page and flash it in on every desktop load. The effect itself needs layout to test, so
     * it is verified in a real browser; this pins the half that server-renders.
     */
    it("server-renders the actions unhidden - the cramped measurement is a client decision", () => {
        const html = renderToStaticMarkup(
            <DocsNavbar
                brandName="Scribekit"
                actions={[
                    <DocsNavbarButton key="d" href="/dashboard" variant="primary">
                        Dashboard
                    </DocsNavbarButton>,
                ]}
            />,
        );
        expect(html).not.toContain("data-cramped");
        expect(html).toContain("scribekit-docs-navbar-right");
        expect(html).toContain("Dashboard");
    });
});

describe("DocsNavbarButton", () => {
    it("renders a link when given href, with the variant class and an optional icon", () => {
        const html = renderToStaticMarkup(
            <DocsNavbarButton href="/dash" variant="primary" icon={<svg data-icon="" />}>
                Dashboard
            </DocsNavbarButton>,
        );
        expect(html).toContain("<a");
        expect(html).toContain('href="/dash"');
        expect(html).toContain("scribekit-docs-navbar-btn scribekit-docs-navbar-btn-primary");
        expect(html).toContain("data-icon");
        expect(html).toContain("Dashboard");
    });

    it("renders a button (default link variant) when there is no href", () => {
        const html = renderToStaticMarkup(<DocsNavbarButton ariaLabel="Toggle theme">Theme</DocsNavbarButton>);
        expect(html).toContain("<button");
        expect(html).toContain("scribekit-docs-navbar-btn-link");
        expect(html).toContain('aria-label="Toggle theme"');
    });

    it("uses a custom link component and passes target/rel for external links", () => {
        const Link = ({ children, ...rest }: { href: string; children: unknown }) => (
            <a data-custom="" {...rest}>
                {children as never}
            </a>
        );
        const html = renderToStaticMarkup(
            <DocsNavbarButton href="https://x.test" target="_blank" rel="noreferrer" linkComponent={Link}>
                External
            </DocsNavbarButton>,
        );
        expect(html).toContain("data-custom");
        expect(html).toContain('target="_blank"');
        expect(html).toContain('rel="noreferrer"');
    });
});

describe("DocsSearchButton / DocsSearchProvider", () => {
    it("renders a field-like trigger with the localized placeholder and ⌘K hint", () => {
        const html = renderToStaticMarkup(<DocsSearchButton lang="fr" />);
        expect(html).toContain("scribekit-docs-search-trigger");
        expect(html).toContain("Rechercher dans la doc…");
        expect(html).toContain(">K<"); // the ⌘K hint
        expect(html).toContain('aria-haspopup="dialog"');
    });

    it("uses a custom placeholder", () => {
        const html = renderToStaticMarkup(<DocsSearchButton placeholder="Find anything" />);
        expect(html).toContain("Find anything");
    });

    it("renders its children and no palette until opened", () => {
        const html = renderToStaticMarkup(
            <DocsSearchProvider nav={NAV}>
                <div data-child="">body</div>
            </DocsSearchProvider>,
        );
        expect(html).toContain("data-child");
        expect(html).not.toContain('role="dialog"'); // the palette is closed by default
    });
});

describe("DocsLanguagePicker", () => {
    const LOCALES = [
        { code: "en", label: "English" },
        { code: "fr", label: "Français" },
    ];

    it("renders a flag-and-caret trigger (menu closed) when there are 2+ locales", () => {
        const html = renderToStaticMarkup(
            <DocsLanguagePicker locales={LOCALES} currentLang="en" defaultLocale="en" basePath="/docs" activePath="/docs/greeting" />,
        );
        expect(html).toContain("scribekit-docs-lang-trigger");
        expect(html).toContain("scribekit-docs-lang-flag");
        expect(html).toContain('aria-expanded="false"'); // menu closed by default
        expect(html).toContain("Change language"); // trigger aria-label (localized to currentLang)
        expect(html).toContain("English");
        expect(html).not.toContain("scribekit-docs-lang-menu");
    });

    it("renders nothing when there is a single locale (auto-hide)", () => {
        expect(renderToStaticMarkup(<DocsLanguagePicker locales={[{ code: "en", label: "English" }]} currentLang="en" defaultLocale="en" />)).toBe("");
    });

    it("localizes the trigger label to the lang prop", () => {
        const html = renderToStaticMarkup(<DocsLanguagePicker locales={LOCALES} currentLang="fr" defaultLocale="en" lang="fr" />);
        expect(html).toContain("Changer de langue");
        expect(html).toContain("Français");
    });

    it("uses a custom renderFlag (e.g. text-only)", () => {
        const html = renderToStaticMarkup(
            <DocsLanguagePicker locales={LOCALES} currentLang="en" defaultLocale="en" renderFlag={() => <span data-flag="" />} />,
        );
        expect(html).toContain("data-flag");
    });
});

describe("DocsToc", () => {
    it("renders the title and a jump link per heading, marking sub-headings", () => {
        const html = renderToStaticMarkup(<DocsToc toc={TOC} />);
        expect(html).toContain("On this page");
        expect(html).toContain('href="#overview"');
        expect(html).toContain('href="#setting-your-greeting"');
        expect(html).toContain("scribekit-docs-toc-sub"); // the depth-3 entry is marked
    });

    it("uses a custom title and renders nothing when there are no headings", () => {
        expect(renderToStaticMarkup(<DocsToc toc={TOC} title="Contents" />)).toContain("Contents");
        expect(renderToStaticMarkup(<DocsToc toc={[]} />)).toBe("");
    });
});

describe("DocsFeedback", () => {
    it("renders the prompt and Yes/No buttons, with no thank-you before a vote", () => {
        const html = renderToStaticMarkup(<DocsFeedback question="Was this page helpful?" />);
        expect(html).toContain("Was this page helpful?");
        expect(html).toContain(">Yes");
        expect(html).toContain(">No");
        expect(html).not.toContain("Thanks for the feedback!");
    });

    it("uses custom labels", () => {
        const html = renderToStaticMarkup(
            <DocsFeedback question="Utile ?" yesLabel="Oui" noLabel="Non" thanksLabel="Merci" />,
        );
        expect(html).toContain("Utile ?");
        expect(html).toContain(">Oui");
        expect(html).toContain(">Non");
    });
});

describe("DocsIndex", () => {
    it("renders the hero and a section card per group with page links and JSON-LD", () => {
        const html = renderToStaticMarkup(<DocsIndex docs={fakeDocs()} />);
        // hero (localized default title + site description)
        expect(html).toContain("Documentation");
        expect(html).toContain("The SwiftGuard documentation.");
        // ...and NO eyebrow, because it is the same localized word as the default H1 - rendering it
        // would stack "Documentation" above an identical "Documentation".
        expect(html).not.toContain("scribekit-docs-hero-eyebrow");
        // section headings
        expect(html).toContain("Get started");
        expect(html).toContain("Configuration");
        expect(html).toContain("Integrations");
        // page links
        expect(html).toContain('href="/docs/introduction"');
        expect(html).toContain('href="/docs/quickstart"');
        expect(html).toContain('href="/docs/greeting-and-voice"');
        expect(html).toContain('href="/docs/google-calendar"');
        // JSON-LD
        expect(html).toContain("application/ld+json");
        expect(html).toContain("CollectionPage");
    });

    it("uses custom title and description, and labels them with the localized eyebrow", () => {
        const html = renderToStaticMarkup(<DocsIndex docs={fakeDocs()} title="Handbook" description="Everything you need." />);
        expect(html).toContain("Handbook");
        expect(html).toContain("Everything you need.");
        // An overridden title no longer says what the page IS, so the eyebrow supplies the word.
        expect(html).toContain("scribekit-docs-hero-eyebrow");
        expect(html).toContain(">Documentation</span>");
    });

    it("composes all three sections", () => {
        const html = renderToStaticMarkup(<DocsIndex docs={fakeDocs()} />);
        expect(html).toContain("scribekit-docs-hero");
        expect(html).toContain("scribekit-docs-topic-card");
        expect(html).toContain("Browse by topic");
    });

    it("renders `children` between the hero and the topic grid", () => {
        const html = renderToStaticMarkup(
            <DocsIndex docs={fakeDocs()}>
                <div data-own-band="">Start here</div>
            </DocsIndex>,
        );
        // The whole point of the slot: a hand-built band sits AFTER the hero and BEFORE the topics,
        // which is the one arrangement a consumer cannot achieve by wrapping the component.
        expect(html.indexOf("scribekit-docs-hero")).toBeLessThan(html.indexOf("data-own-band"));
        expect(html.indexOf("data-own-band")).toBeLessThan(html.indexOf("scribekit-docs-topics"));
    });

    it("replaces the hero with a custom header", () => {
        const html = renderToStaticMarkup(<DocsIndex docs={fakeDocs()} header={<div data-custom-hero="">Hi</div>} />);
        expect(html).toContain("data-custom-hero");
        expect(html).not.toContain("scribekit-docs-hero-title");
    });

    it("omits the JSON-LD script when the docs have no site config", () => {
        const html = renderToStaticMarkup(<DocsIndex docs={fakeDocs({ site: undefined })} />);
        expect(html).not.toContain("application/ld+json");
        expect(html).toContain("Documentation"); // falls back to a generic hero title
    });

    it("derives the hero stats from the corpus, and drops them on request", () => {
        const html = renderToStaticMarkup(<DocsIndex docs={fakeDocs()} title="Handbook" />);
        expect(html).toContain("scribekit-docs-hero-stats");
        expect(html).toMatch(/\d+ articles/);
        expect(html).toMatch(/\d+ topics/);

        const bare = renderToStaticMarkup(<DocsIndex docs={fakeDocs()} title="Handbook" showStats={false} />);
        expect(bare).not.toContain("scribekit-docs-hero-stats");
    });

    it("claims no update date when no page declares one", () => {
        // The fixture's pages carry no `updated`, so an "Updated <date>" stat would be an invented
        // fact - and `shortDate` would render it as the empty string, i.e. a bare "Updated ".
        const html = renderToStaticMarkup(<DocsIndex docs={fakeDocs()} title="Handbook" />);
        expect(html).not.toContain("Updated ");
        expect(html).not.toContain("scribekit-docs-recent");
    });
});
