import { describe, expect, it } from "vitest";
import { firstHrefOf, switchLocaleHref, tabIdForPath } from "../internal/nav.js";
import type { NavTab, NavTree } from "../../../docs/types.js";

/** Builds a nav item with just the fields these helpers read. */
function item(slug: string, href: string): { slug: string; title: string; label: string; href: string; lang: string } {
    return { slug, title: slug, label: slug, href, lang: "en" };
}

const NAV: NavTree = {
    multiTab: true,
    tabs: [
        {
            id: "Documentation",
            label: "Documentation",
            groups: [
                { id: "Get started", label: "Get started", items: [item("introduction", "/docs/introduction"), item("quickstart", "/docs/quickstart")] },
            ],
        },
        {
            id: "Guides",
            label: "Guides",
            groups: [{ id: "Recipes", label: "Recipes", items: [item("writing-docs", "/docs/writing-docs")] }],
        },
    ],
};

describe("tabIdForPath", () => {
    it("returns the id of the tab that owns the path", () => {
        expect(tabIdForPath(NAV, "/docs/quickstart")).toBe("Documentation");
        expect(tabIdForPath(NAV, "/docs/writing-docs")).toBe("Guides");
    });

    it("returns undefined for an unknown path or no path", () => {
        expect(tabIdForPath(NAV, "/docs")).toBeUndefined();
        expect(tabIdForPath(NAV, undefined)).toBeUndefined();
        expect(tabIdForPath(NAV, "")).toBeUndefined();
    });
});

describe("firstHrefOf", () => {
    it("returns the first page's href of the tab, in reading order", () => {
        expect(firstHrefOf(NAV.tabs[0])).toBe("/docs/introduction");
        expect(firstHrefOf(NAV.tabs[1])).toBe("/docs/writing-docs");
    });

    it("returns undefined for an empty or missing tab", () => {
        expect(firstHrefOf(undefined)).toBeUndefined();
        expect(firstHrefOf({ id: "x", label: "x", groups: [] } satisfies NavTab)).toBeUndefined();
    });
});

describe("switchLocaleHref", () => {
    const opts = { basePath: "/docs", defaultLocale: "en", prefixDefaultLocale: false };

    it("rebuilds the current page's URL in another locale (default served unprefixed)", () => {
        expect(switchLocaleHref("/docs/greeting", "fr", opts)).toBe("/fr/docs/greeting");
        expect(switchLocaleHref("/fr/docs/greeting", "en", opts)).toBe("/docs/greeting");
        expect(switchLocaleHref("/fr/docs/greeting", "de", opts)).toBe("/de/docs/greeting");
    });

    it("handles the index (no slug in the path)", () => {
        expect(switchLocaleHref("/docs", "fr", opts)).toBe("/fr/docs");
        expect(switchLocaleHref("/fr/docs", "en", opts)).toBe("/docs");
    });

    it("prefixes the default locale when prefixDefaultLocale is set", () => {
        expect(switchLocaleHref("/en/docs/x", "en", { ...opts, prefixDefaultLocale: true })).toBe("/en/docs/x");
    });

    it("falls back to the locale index when the path carries no base", () => {
        expect(switchLocaleHref("", "fr", opts)).toBe("/fr/docs");
    });
});
