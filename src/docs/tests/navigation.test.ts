import { describe, expect, it } from "vitest";
import { adjacentFor, breadcrumbFor, buildNavTree, flattenNav, type NavBuildOptions } from "../navigation.js";
import type { DocMeta, NavTree } from "../types.js";

/** Default URL options: unprefixed `/docs`, default locale `en`. */
const OPTS: NavBuildOptions = { basePath: "/docs", defaultLocale: "en", prefixDefaultLocale: false };

/**
 * Builds a {@link DocMeta} with sensible defaults, overriding only the fields a test cares about.
 *
 * @param slug - the page slug (also the default title).
 * @param over - front-matter fields to override.
 * @returns the doc metadata.
 */
function meta(slug: string, over: Partial<DocMeta> = {}): DocMeta {
    return { slug, lang: "en", title: over.title ?? slug, description: "", ...over };
}

/** Flattened slugs of a tree, for compact order assertions. */
function slugs(tree: NavTree): string[] {
    return flattenNav(tree).map((i) => i.slug);
}

describe("buildNavTree - grouping", () => {
    it("buckets pages by tab then group, preserving structure", () => {
        const tree = buildNavTree(
            [
                meta("a", { tab: "Docs", group: "Start", order: 1 }),
                meta("b", { tab: "Docs", group: "Start", order: 2 }),
                meta("c", { tab: "API", group: "Auth", order: 1 }),
            ],
            { ...OPTS, tabs: ["Docs", "API"] },
        );
        expect(tree.tabs.map((t) => t.id)).toEqual(["Docs", "API"]);
        expect(tree.multiTab).toBe(true);
        const docsTab = tree.tabs[0]!;
        expect(docsTab.groups.map((g) => g.id)).toEqual(["Start"]);
        expect(docsTab.groups[0]!.items.map((i) => i.slug)).toEqual(["a", "b"]);
        expect(tree.tabs[1]!.groups[0]!.items.map((i) => i.slug)).toEqual(["c"]);
    });

    it("uses a single implicit tab (multiTab false) when no page sets a tab", () => {
        const tree = buildNavTree([meta("a", { group: "Start" }), meta("b", { group: "Start" })], OPTS);
        expect(tree.tabs).toHaveLength(1);
        expect(tree.tabs[0]!.id).toBe("");
        expect(tree.multiTab).toBe(false);
    });

    it("places pages with no group in the ungrouped bucket (id \"\")", () => {
        const tree = buildNavTree([meta("a", { tab: "Docs" })], OPTS);
        expect(tree.tabs[0]!.groups[0]!.id).toBe("");
    });
});

describe("buildNavTree - ordering", () => {
    it("orders tabs by the tabs config first", () => {
        const tree = buildNavTree(
            [meta("a", { tab: "Second", order: 1 }), meta("b", { tab: "First", order: 1 })],
            { ...OPTS, tabs: ["First", "Second"] },
        );
        expect(tree.tabs.map((t) => t.id)).toEqual(["First", "Second"]);
    });

    it("orders unconfigured tabs by their minimum page order", () => {
        const tree = buildNavTree(
            [meta("a", { tab: "Alpha", order: 5 }), meta("b", { tab: "Beta", order: 1 })],
            OPTS,
        );
        expect(tree.tabs.map((t) => t.id)).toEqual(["Beta", "Alpha"]);
    });

    it("falls back to first-seen when tabs have no config and equal min order", () => {
        const tree = buildNavTree(
            [meta("a", { tab: "Alpha", order: 1 }), meta("b", { tab: "Beta", order: 1 })],
            OPTS,
        );
        expect(tree.tabs.map((t) => t.id)).toEqual(["Alpha", "Beta"]);
    });

    it("orders groups by the groups config first", () => {
        const tree = buildNavTree(
            [
                meta("a", { tab: "Docs", group: "Configuration", order: 1 }),
                meta("b", { tab: "Docs", group: "Get started", order: 1 }),
            ],
            { ...OPTS, groups: ["Get started", "Configuration"] },
        );
        expect(tree.tabs[0]!.groups.map((g) => g.id)).toEqual(["Get started", "Configuration"]);
    });

    it("orders unconfigured groups by their minimum page order", () => {
        const tree = buildNavTree(
            [
                meta("a", { tab: "Docs", group: "Late", order: 9 }),
                meta("b", { tab: "Docs", group: "Early", order: 2 }),
            ],
            OPTS,
        );
        expect(tree.tabs[0]!.groups.map((g) => g.id)).toEqual(["Early", "Late"]);
    });

    it("orders pages within a group by order ascending", () => {
        const tree = buildNavTree(
            [
                meta("c", { tab: "Docs", group: "G", order: 3 }),
                meta("a", { tab: "Docs", group: "G", order: 1 }),
                meta("b", { tab: "Docs", group: "G", order: 2 }),
            ],
            OPTS,
        );
        expect(slugs(tree)).toEqual(["a", "b", "c"]);
    });

    it("appends pages with no order after ordered ones", () => {
        const tree = buildNavTree(
            [
                meta("no-order", { tab: "Docs", group: "G" }),
                meta("ordered", { tab: "Docs", group: "G", order: 1 }),
            ],
            OPTS,
        );
        expect(slugs(tree)).toEqual(["ordered", "no-order"]);
    });

    it("breaks equal-order ties alphabetically by title", () => {
        const tree = buildNavTree(
            [
                meta("z", { tab: "Docs", group: "G", order: 1, title: "Zebra" }),
                meta("a", { tab: "Docs", group: "G", order: 1, title: "Aardvark" }),
            ],
            OPTS,
        );
        expect(slugs(tree)).toEqual(["a", "z"]);
    });
});

describe("buildNavTree - items", () => {
    it("excludes hidden pages", () => {
        const tree = buildNavTree(
            [
                meta("visible", { tab: "Docs", group: "G", order: 1 }),
                meta("secret", { tab: "Docs", group: "G", order: 2, hidden: true }),
            ],
            OPTS,
        );
        expect(slugs(tree)).toEqual(["visible"]);
    });

    it("returns an empty tree for no pages", () => {
        const tree = buildNavTree([], OPTS);
        expect(tree.tabs).toEqual([]);
        expect(tree.multiTab).toBe(false);
    });

    it("uses label when set, else the title, and passes the icon through", () => {
        const tree = buildNavTree(
            [meta("a", { tab: "Docs", group: "G", title: "Greeting & voice", label: "Greeting", icon: "waveform" })],
            OPTS,
        );
        const item = tree.tabs[0]!.groups[0]!.items[0]!;
        expect(item.title).toBe("Greeting & voice");
        expect(item.label).toBe("Greeting");
        expect(item.icon).toBe("waveform");
    });

    it("defaults the label to the title when unset", () => {
        const tree = buildNavTree([meta("a", { tab: "Docs", title: "Intro" })], OPTS);
        expect(tree.tabs[0]!.groups[0]!.items[0]!.label).toBe("Intro");
    });

    it("builds hrefs via localePath: default locale unprefixed, others prefixed", () => {
        const tree = buildNavTree(
            [meta("a", { tab: "Docs", lang: "en" }), meta("b", { tab: "Docs", lang: "fr" })],
            OPTS,
        );
        const items = tree.tabs[0]!.groups[0]!.items;
        expect(items.find((i) => i.slug === "a")!.href).toBe("/docs/a");
        expect(items.find((i) => i.slug === "b")!.href).toBe("/fr/docs/b");
    });

    it("prefixes the default locale when prefixDefaultLocale is set", () => {
        const tree = buildNavTree([meta("a", { tab: "Docs", lang: "en" })], { ...OPTS, prefixDefaultLocale: true });
        expect(tree.tabs[0]!.groups[0]!.items[0]!.href).toBe("/en/docs/a");
    });

    it("applies config labels to tabs and groups while keeping the ids", () => {
        const tree = buildNavTree(
            [meta("a", { tab: "doc", group: "cfg", order: 1 })],
            { ...OPTS, tabs: [{ id: "doc", label: "Documentation" }], groups: [{ id: "cfg", label: "Configuration" }] },
        );
        expect(tree.tabs[0]!.id).toBe("doc");
        expect(tree.tabs[0]!.label).toBe("Documentation");
        expect(tree.tabs[0]!.groups[0]!.id).toBe("cfg");
        expect(tree.tabs[0]!.groups[0]!.label).toBe("Configuration");
    });
});

describe("flattenNav", () => {
    it("linearises tabs then groups then items in order", () => {
        const tree = buildNavTree(
            [
                meta("a", { tab: "Docs", group: "G1", order: 1 }),
                meta("b", { tab: "Docs", group: "G2", order: 1 }),
                meta("c", { tab: "API", group: "G3", order: 1 }),
            ],
            { ...OPTS, tabs: ["Docs", "API"], groups: ["G1", "G2", "G3"] },
        );
        expect(flattenNav(tree).map((i) => i.slug)).toEqual(["a", "b", "c"]);
    });
});

describe("adjacentFor", () => {
    const flat = flattenNav(
        buildNavTree(
            [
                meta("a", { tab: "Docs", group: "G1", order: 1 }),
                meta("b", { tab: "Docs", group: "G1", order: 2 }),
                meta("c", { tab: "Docs", group: "G2", order: 1 }),
                meta("d", { tab: "API", group: "G3", order: 1 }),
            ],
            { ...OPTS, tabs: ["Docs", "API"], groups: ["G1", "G2", "G3"] },
        ),
    );

    it("returns prev and next for a middle page", () => {
        expect(adjacentFor("b", flat).prev?.slug).toBe("a");
        expect(adjacentFor("b", flat).next?.slug).toBe("c");
    });

    it("has no prev at the start and no next at the end", () => {
        expect(adjacentFor("a", flat).prev).toBeUndefined();
        expect(adjacentFor("a", flat).next?.slug).toBe("b");
        expect(adjacentFor("d", flat).next).toBeUndefined();
        expect(adjacentFor("d", flat).prev?.slug).toBe("c");
    });

    it("crosses group and tab boundaries", () => {
        // b -> c crosses a group boundary; c -> d crosses a tab boundary.
        expect(adjacentFor("c", flat).prev?.slug).toBe("b");
        expect(adjacentFor("c", flat).next?.slug).toBe("d");
    });

    it("returns an empty result for an unknown slug", () => {
        expect(adjacentFor("nope", flat)).toEqual({});
    });
});

describe("breadcrumbFor", () => {
    it("returns [tab, group, page] segments for a nested page", () => {
        const tree = buildNavTree([meta("a", { tab: "Documentation", group: "Configuration", title: "Greeting" })], OPTS);
        const crumb = breadcrumbFor("a", tree)!;
        expect(crumb.tab).toBe("Documentation");
        expect(crumb.group).toBe("Configuration");
        expect(crumb.title).toBe("Greeting");
        expect(crumb.segments.map((s) => s.label)).toEqual(["Documentation", "Configuration", "Greeting"]);
        // The current-page segment is not a link.
        expect(crumb.segments[2]!.href).toBeUndefined();
    });

    it("omits the tab segment for the implicit tab and the group segment when ungrouped", () => {
        const crumb = breadcrumbFor("a", buildNavTree([meta("a", { title: "Loose" })], OPTS))!;
        expect(crumb.tab).toBeUndefined();
        expect(crumb.group).toBeUndefined();
        expect(crumb.segments.map((s) => s.label)).toEqual(["Loose"]);
    });

    it("returns undefined for a slug not in the tree", () => {
        const tree = buildNavTree([meta("a", { tab: "Docs" })], OPTS);
        expect(breadcrumbFor("missing", tree)).toBeUndefined();
    });
});
