import { describe, expect, it } from "vitest";
import { searchNav } from "../internal/search.js";
import type { NavItem } from "../../../docs/types.js";

/**
 * Builds a `NavItem` for the search tests.
 *
 * @param overrides - fields to set on top of empty defaults.
 * @returns a `NavItem`.
 */
function item(overrides: Partial<NavItem> & { slug: string }): NavItem {
    return { title: "", label: "", href: `/docs/${overrides.slug}`, lang: "en", ...overrides };
}

const ITEMS: NavItem[] = [
    item({ slug: "quickstart", title: "Quickstart", label: "Quickstart", group: "Get started" }),
    item({ slug: "greeting-and-voice", title: "Greeting & voice", label: "Greeting & voice", group: "Configuration" }),
    item({ slug: "google-calendar", title: "Google Calendar", label: "Google Calendar", group: "Integrations", tab: "Integrations" }),
];

describe("searchNav", () => {
    it("returns all items unchanged for a blank query", () => {
        expect(searchNav(ITEMS, "")).toEqual(ITEMS);
        expect(searchNav(ITEMS, "   ")).toEqual(ITEMS);
    });

    it("matches on the title", () => {
        expect(searchNav(ITEMS, "quickstart").map((i) => i.slug)).toEqual(["quickstart"]);
    });

    it("is fuzzy / typo-tolerant on the title", () => {
        expect(searchNav(ITEMS, "quikstart").map((i) => i.slug)).toContain("quickstart");
    });

    it("matches on the group", () => {
        expect(searchNav(ITEMS, "configuration").map((i) => i.slug)).toContain("greeting-and-voice");
    });

    it("matches on the tab", () => {
        expect(searchNav(ITEMS, "integrations").map((i) => i.slug)).toContain("google-calendar");
    });

    it("returns an empty array when nothing matches", () => {
        expect(searchNav(ITEMS, "zzzxyqq")).toEqual([]);
    });
});
